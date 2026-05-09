/**
 * wsClient.ts — SH-SCANNER-WS Task 2
 *
 * Minimal Kalshi WebSocket client. Raw HTTP upgrade + RFC 6455 frame codec.
 * No external WS dependency — all server-pings are auto-handled with masked
 * pongs (per the 2026-05-09 spike findings; unmasked pongs cause "bad MASK"
 * disconnects).
 *
 * Surface:
 *   const conn = await connectKalshiWs({ apiKey, privateKey });
 *   await conn.subscribe(['orderbook_delta'], ['KXETH-...', 'KXNBA-...']);
 *   conn.onMessage((msg) => { ... });
 *   conn.onClose(() => { ... });
 *   await conn.close();
 *
 * The caller decides reconnect / backoff (see WsBookTracker / Task 5).
 */

import https from 'node:https';
import crypto from 'node:crypto';
import type { Socket } from 'node:net';

const KALSHI_WS_HOST = 'api.elections.kalshi.com';
const KALSHI_WS_PATH = '/trade-api/ws/v2';

export interface ConnectOpts {
  /** API key id (from KALSHI-ACCESS-KEY). */
  apiKey: string;
  /** PEM-encoded RSA private key text. */
  privateKey: string;
  /** Override host/path for tests. */
  host?: string;
  path?: string;
  /** Override transport for tests; given a request-options bag, returns a request object. */
  requestFn?: typeof https.request;
}

export interface WsMessage {
  type: string;
  sid?: number;
  seq?: number;
  id?: number;
  msg?: Record<string, unknown>;
}

export interface WsConnection {
  /** Send a subscribe command; resolves on the server's `subscribed` ack. */
  subscribe(channels: string[], tickers: string[]): Promise<{ sid: number }>;
  /** Register a message handler. Multiple handlers may be added. */
  onMessage(handler: (msg: WsMessage) => void): void;
  /** Register a close handler (fired once on disconnect). */
  onClose(handler: (reason?: string) => void): void;
  /** Send a close frame and end the socket. */
  close(): Promise<void>;
}

export function signWsHeaders(apiKey: string, privateKey: string, path: string): Record<string, string> {
  const ts = Date.now().toString();
  const message = ts + 'GET' + path;
  const sig = crypto
    .sign('RSA-SHA256', Buffer.from(message), {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
    })
    .toString('base64');
  return {
    'KALSHI-ACCESS-KEY': apiKey,
    'KALSHI-ACCESS-TIMESTAMP': ts,
    'KALSHI-ACCESS-SIGNATURE': sig,
  };
}

/** Encode a client→server frame with the mandatory mask bit set. */
export function encodeFrame(opcode: number, payload: Buffer): Buffer {
  const header: number[] = [0x80 | (opcode & 0x0f)];
  const mask = crypto.randomBytes(4);
  if (payload.length < 126) {
    header.push(0x80 | payload.length);
  } else if (payload.length < 65536) {
    header.push(0x80 | 126, (payload.length >> 8) & 0xff, payload.length & 0xff);
  } else {
    header.push(0x80 | 127);
    for (let i = 7; i >= 0; i--) {
      header.push(Number((BigInt(payload.length) >> BigInt(i * 8)) & 0xffn));
    }
  }
  const masked = Buffer.alloc(payload.length);
  for (let i = 0; i < payload.length; i++) masked[i] = payload[i]! ^ mask[i % 4]!;
  return Buffer.concat([Buffer.from(header), mask, masked]);
}

export interface ParsedFrame {
  opcode: number;
  payload: Buffer;
  /** Bytes consumed from the start of `buffer`. */
  consumed: number;
}

/** Parse one server→client frame from a buffer. Returns null if incomplete. */
export function parseFrame(buffer: Buffer): ParsedFrame | null {
  if (buffer.length < 2) return null;
  const b0 = buffer[0]!;
  const b1 = buffer[1]!;
  const opcode = b0 & 0x0f;
  const masked = (b1 & 0x80) === 0x80;
  let len = b1 & 0x7f;
  let cur = 2;
  if (len === 126) {
    if (buffer.length < cur + 2) return null;
    len = buffer.readUInt16BE(cur);
    cur += 2;
  } else if (len === 127) {
    if (buffer.length < cur + 8) return null;
    len = Number(buffer.readBigUInt64BE(cur));
    cur += 8;
  }
  if (masked) cur += 4;
  if (buffer.length < cur + len) return null;
  return { opcode, payload: buffer.slice(cur, cur + len), consumed: cur + len };
}

export async function connectKalshiWs(opts: ConnectOpts): Promise<WsConnection> {
  const host = opts.host ?? KALSHI_WS_HOST;
  const wsPath = opts.path ?? KALSHI_WS_PATH;
  const headers = {
    ...signWsHeaders(opts.apiKey, opts.privateKey, wsPath),
    Connection: 'Upgrade',
    Upgrade: 'websocket',
    'Sec-WebSocket-Version': '13',
    'Sec-WebSocket-Key': crypto.randomBytes(16).toString('base64'),
  };

  const socket = await new Promise<Socket>((resolve, reject) => {
    const req = (opts.requestFn ?? https.request)({ host, path: wsPath, method: 'GET', headers });
    req.on('upgrade', (_res, sock) => resolve(sock));
    req.on('response', (res) => {
      let body = '';
      res.on('data', (c: Buffer) => { body += c.toString('utf8'); });
      res.on('end', () => reject(new Error(`Upgrade rejected: ${res.statusCode} ${body.slice(0, 500)}`)));
    });
    req.on('error', reject);
    req.end();
  });

  return wireConnection(socket);
}

/** Bind frame parsing + ping handling to a connected socket. Public for tests. */
export function wireConnection(socket: Socket): WsConnection {
  const messageHandlers: Array<(msg: WsMessage) => void> = [];
  const closeHandlers: Array<(reason?: string) => void> = [];
  const pendingSubscribes = new Map<number, (sid: number) => void>();
  let nextCmdId = 1;
  let buf = Buffer.alloc(0);
  let closed = false;

  function emitClose(reason?: string): void {
    if (closed) return;
    closed = true;
    for (const h of closeHandlers) h(reason);
  }

  socket.on('data', (chunk: Buffer) => {
    buf = Buffer.concat([buf, chunk]);
    while (true) {
      const frame = parseFrame(buf);
      if (!frame) break;
      buf = buf.slice(frame.consumed);
      if (frame.opcode === 0x1) {
        // text — JSON message
        const text = frame.payload.toString('utf8');
        let msg: WsMessage;
        try { msg = JSON.parse(text) as WsMessage; } catch { continue; }
        if (msg.type === 'subscribed' && typeof msg.id === 'number') {
          const resolver = pendingSubscribes.get(msg.id);
          if (resolver) {
            const sid = (msg.msg?.['sid'] as number | undefined) ?? 0;
            resolver(sid);
            pendingSubscribes.delete(msg.id);
          }
        }
        for (const h of messageHandlers) h(msg);
      } else if (frame.opcode === 0x9) {
        // ping → masked pong
        socket.write(encodeFrame(0xa, frame.payload));
      } else if (frame.opcode === 0x8) {
        // close
        emitClose(frame.payload.toString('utf8'));
        socket.end();
      }
    }
  });

  socket.on('close', () => emitClose());
  socket.on('error', (e: Error) => emitClose(e.message));

  return {
    async subscribe(channels: string[], tickers: string[]): Promise<{ sid: number }> {
      const id = nextCmdId++;
      const payload = JSON.stringify({
        id,
        cmd: 'subscribe',
        params: { channels, market_tickers: tickers },
      });
      const ackPromise = new Promise<number>((resolve) => pendingSubscribes.set(id, resolve));
      socket.write(encodeFrame(0x1, Buffer.from(payload, 'utf8')));
      const sid = await ackPromise;
      return { sid };
    },
    onMessage(handler) { messageHandlers.push(handler); },
    onClose(handler) { closeHandlers.push(handler); },
    async close(): Promise<void> {
      try {
        socket.write(encodeFrame(0x8, Buffer.alloc(0)));
      } catch {
        /* socket already gone */
      }
      socket.end();
    },
  };
}
