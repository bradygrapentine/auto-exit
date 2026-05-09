/**
 * wsClient.test.ts — SH-SCANNER-WS Task 2
 *
 * Tests the frame codec + the `wireConnection` event dispatch using a
 * fake duplex socket. The HTTPS upgrade itself is not exercised here
 * (it's the OS / Kalshi server contract; covered by the spike script).
 */

import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from 'events';
import {
  encodeFrame,
  parseFrame,
  signWsHeaders,
  wireConnection,
} from '../src/wsClient.js';

// ── Fake socket ──────────────────────────────────────────────────────────────

class FakeSocket extends EventEmitter {
  written: Buffer[] = [];
  ended = false;
  write(buf: Buffer): boolean { this.written.push(Buffer.from(buf)); return true; }
  end(): void { this.ended = true; this.emit('close'); }
  /** Server-side: parse the most recent client frame. */
  lastClientFrame(): { opcode: number; text: string } {
    const last = this.written[this.written.length - 1]!;
    const opcode = last[0]! & 0x0f;
    // Client masks; need to undo for assertions.
    let cur = 2;
    let len = last[1]! & 0x7f;
    if (len === 126) { len = last.readUInt16BE(2); cur = 4; }
    else if (len === 127) { len = Number(last.readBigUInt64BE(2)); cur = 10; }
    const mask = last.slice(cur, cur + 4);
    const masked = last.slice(cur + 4, cur + 4 + len);
    const unmasked = Buffer.alloc(len);
    for (let i = 0; i < len; i++) unmasked[i] = masked[i]! ^ mask[i % 4]!;
    return { opcode, text: unmasked.toString('utf8') };
  }
}

// ── Frame codec ──────────────────────────────────────────────────────────────

describe('encodeFrame', () => {
  it('sets MASK bit on every client frame (RFC 6455 requirement)', () => {
    const frame = encodeFrame(0x1, Buffer.from('hi'));
    expect((frame[1]! & 0x80) === 0x80).toBe(true);
  });

  it('round-trips text payload via parseFrame after unmask', () => {
    const frame = encodeFrame(0x1, Buffer.from('hello'));
    // parseFrame expects server→client (unmasked) frames; mimic by stripping mask
    const unmasked = Buffer.concat([Buffer.from([0x81, 5]), Buffer.from('hello')]);
    const parsed = parseFrame(unmasked)!;
    expect(parsed.opcode).toBe(0x1);
    expect(parsed.payload.toString('utf8')).toBe('hello');
    void frame;
  });
});

describe('parseFrame', () => {
  it('returns null when buffer is too short', () => {
    expect(parseFrame(Buffer.from([0x81]))).toBeNull();
  });

  it('parses a 7-bit length frame', () => {
    const buf = Buffer.concat([Buffer.from([0x81, 3]), Buffer.from('abc')]);
    const f = parseFrame(buf)!;
    expect(f.opcode).toBe(0x1);
    expect(f.payload.toString()).toBe('abc');
    expect(f.consumed).toBe(5);
  });

  it('parses a 16-bit length frame', () => {
    const payload = Buffer.alloc(200, 0x41);
    const header = Buffer.alloc(4);
    header[0] = 0x81; header[1] = 126; header.writeUInt16BE(200, 2);
    const buf = Buffer.concat([header, payload]);
    const f = parseFrame(buf)!;
    expect(f.payload.length).toBe(200);
  });
});

// ── signWsHeaders ────────────────────────────────────────────────────────────

describe('signWsHeaders', () => {
  it('produces three Kalshi headers', () => {
    // Generate a throwaway RSA key for the signature test.
    const { generateKeyPairSync } = require('node:crypto');
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
    const headers = signWsHeaders('test-key-id', pem, '/trade-api/ws/v2');
    expect(headers['KALSHI-ACCESS-KEY']).toBe('test-key-id');
    expect(headers['KALSHI-ACCESS-TIMESTAMP']).toMatch(/^\d+$/);
    expect(headers['KALSHI-ACCESS-SIGNATURE']).toMatch(/^[A-Za-z0-9+/=]+$/);
  });
});

// ── wireConnection ───────────────────────────────────────────────────────────

describe('wireConnection — subscribe round-trip', () => {
  it('sends subscribe frame and resolves on ack', async () => {
    const sock = new FakeSocket();
    const conn = wireConnection(sock as unknown as import('node:net').Socket);

    const subPromise = conn.subscribe(['orderbook_delta'], ['KX-A', 'KX-B']);

    // First frame written should be the subscribe text frame
    const frame = sock.lastClientFrame();
    expect(frame.opcode).toBe(0x1);
    const body = JSON.parse(frame.text);
    expect(body.cmd).toBe('subscribe');
    expect(body.params.channels).toEqual(['orderbook_delta']);
    expect(body.params.market_tickers).toEqual(['KX-A', 'KX-B']);

    // Server replies with ack
    const ack = JSON.stringify({ type: 'subscribed', id: body.id, msg: { sid: 42, channel: 'orderbook_delta' } });
    sock.emit('data', Buffer.concat([Buffer.from([0x81, ack.length]), Buffer.from(ack)]));

    const out = await subPromise;
    expect(out.sid).toBe(42);
  });
});

describe('wireConnection — ping → masked pong', () => {
  it('replies to a server ping with a masked pong frame (no "bad MASK")', () => {
    const sock = new FakeSocket();
    wireConnection(sock as unknown as import('node:net').Socket);
    // server sends ping (opcode 0x9, unmasked, 4-byte payload "abcd")
    const pingPayload = Buffer.from('abcd');
    sock.emit('data', Buffer.concat([Buffer.from([0x89, 4]), pingPayload]));

    const last = sock.written[sock.written.length - 1]!;
    expect(last[0]! & 0x0f).toBe(0xa); // pong opcode
    expect((last[1]! & 0x80) === 0x80).toBe(true); // mask bit set
  });
});

describe('wireConnection — close handling', () => {
  it('emits close handler when socket closes', () => {
    const sock = new FakeSocket();
    const conn = wireConnection(sock as unknown as import('node:net').Socket);
    const handler = vi.fn();
    conn.onClose(handler);
    sock.emit('close');
    expect(handler).toHaveBeenCalledOnce();
  });

  it('emits close handler on close-frame from server', () => {
    const sock = new FakeSocket();
    const conn = wireConnection(sock as unknown as import('node:net').Socket);
    const handler = vi.fn();
    conn.onClose(handler);
    const reason = Buffer.from('bye');
    sock.emit('data', Buffer.concat([Buffer.from([0x88, 3]), reason]));
    expect(handler).toHaveBeenCalledWith('bye');
  });
});

describe('wireConnection — message dispatch', () => {
  it('forwards orderbook_delta messages to handlers', () => {
    const sock = new FakeSocket();
    const conn = wireConnection(sock as unknown as import('node:net').Socket);
    const messages: import('../src/wsClient.js').WsMessage[] = [];
    conn.onMessage((m) => messages.push(m));
    const text = JSON.stringify({ type: 'orderbook_delta', sid: 1, seq: 5, msg: { market_ticker: 'KX-A', side: 'yes' } });
    sock.emit('data', Buffer.concat([Buffer.from([0x81, text.length]), Buffer.from(text)]));
    expect(messages).toHaveLength(1);
    expect(messages[0]!.type).toBe('orderbook_delta');
  });
});
