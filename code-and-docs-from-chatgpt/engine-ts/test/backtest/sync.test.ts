import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter, Readable, Writable } from 'node:stream';

// ---------------------------------------------------------------------------
// Mock child_process BEFORE importing the module under test.
// vi.mock is hoisted to the top of the file by vitest.
// vi.hoisted ensures spawnMock is initialised before the hoisted vi.mock runs.
// ---------------------------------------------------------------------------

const { spawnMock } = vi.hoisted(() => ({ spawnMock: vi.fn() }));

vi.mock('node:child_process', () => ({ spawn: spawnMock }));

// Now import — spawn inside sync.ts will resolve to spawnMock.
import { splitRemotePath, syncRecordings } from '../../src/backtest/sync.js';

// ---------------------------------------------------------------------------
// Fake process factory
// ---------------------------------------------------------------------------

interface FakeProc extends EventEmitter {
  stdout: Readable;
  stdin: Writable & { end: ReturnType<typeof vi.fn> };
  stderr: Readable;
}

function makeFlyProc(): FakeProc {
  const proc = new EventEmitter() as FakeProc;
  proc.stdout = new Readable({ read() {} });
  // stdin/stderr not used by fly proc, but keep shape consistent
  proc.stdin = Object.assign(new Writable({ write(_c, _e, cb) { cb(); } }), { end: vi.fn() });
  proc.stderr = new Readable({ read() {} });
  return proc;
}

function makeTarProc(): FakeProc {
  const proc = new EventEmitter() as FakeProc;
  proc.stdout = new Readable({ read() {} });
  proc.stdin = Object.assign(new Writable({ write(_c, _e, cb) { cb(); } }), { end: vi.fn() });
  proc.stderr = new Readable({ read() {} });
  return proc;
}

// ---------------------------------------------------------------------------
// splitRemotePath
// ---------------------------------------------------------------------------

describe('splitRemotePath', () => {
  it('splits standard path', () => {
    expect(splitRemotePath('/data/recordings')).toEqual({ parent: '/data', base: 'recordings' });
  });

  it('normalises trailing slash', () => {
    expect(splitRemotePath('/data/recordings/')).toEqual({ parent: '/data', base: 'recordings' });
  });

  it('normalises double trailing slash', () => {
    expect(splitRemotePath('/data/recordings//')).toEqual({ parent: '/data', base: 'recordings' });
  });

  it('single segment', () => {
    expect(splitRemotePath('/recordings')).toEqual({ parent: '/', base: 'recordings' });
  });
});

// ---------------------------------------------------------------------------
// syncRecordings
// ---------------------------------------------------------------------------

describe('syncRecordings', () => {
  let flyProc: FakeProc;
  let tarProc: FakeProc;

  beforeEach(() => {
    vi.clearAllMocks();
    flyProc = makeFlyProc();
    tarProc = makeTarProc();

    spawnMock.mockImplementation((cmd: string) => {
      if (cmd === 'fly') return flyProc;
      if (cmd === 'tar') return tarProc;
      throw new Error(`unexpected spawn: ${cmd}`);
    });
  });

  it('happy path — both exit 0 with bytes piped → returns non-negative file count', async () => {
    const promise = syncRecordings({
      flyApp: 'auto-exit-scanner',
      remotePath: '/data/recordings',
      localDir: '/tmp/local',
    });

    // Push verbose tar lines; use setImmediate so stream data events fire
    // before the close events are emitted (streams are async in Node).
    await new Promise<void>((res) => setImmediate(res));
    flyProc.stdout.push(Buffer.from([0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00]));
    flyProc.stdout.push(null);
    tarProc.stderr.push('recordings/a.ndjson\n');
    tarProc.stderr.push('recordings/b.ndjson\n');
    tarProc.stderr.push(null);

    // Give stream data events a tick to flush before close fires
    await new Promise<void>((res) => setImmediate(res));
    flyProc.emit('close', 0);
    tarProc.emit('close', 0);

    const result = await promise;
    expect(result.filesTransferred).toBe(2);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('zero verbose lines but bytes piped → filesTransferred is 0 (legitimate empty-archive case)', async () => {
    const promise = syncRecordings({
      flyApp: 'auto-exit-scanner',
      remotePath: '/data/recordings',
      localDir: '/tmp/local',
    });

    // Even an empty tar archive emits a gzip header on stdout.
    flyProc.stdout.push(Buffer.from([0x1f, 0x8b]));
    flyProc.stdout.push(null);
    tarProc.stderr.push(null);
    await new Promise<void>((res) => setImmediate(res));
    flyProc.emit('close', 0);
    tarProc.emit('close', 0);

    const result = await promise;
    expect(result.filesTransferred).toBe(0);
  });

  it('fly exits non-zero → throws with code', async () => {
    const promise = syncRecordings({
      flyApp: 'auto-exit-scanner',
      remotePath: '/data/recordings',
      localDir: '/tmp/local',
    });

    flyProc.emit('close', 1);
    tarProc.emit('close', 0);

    await expect(promise).rejects.toThrow('fly ssh console exited with code 1');
  });

  it('tar exits non-zero → throws with code', async () => {
    const promise = syncRecordings({
      flyApp: 'auto-exit-scanner',
      remotePath: '/data/recordings',
      localDir: '/tmp/local',
    });

    // Push bytes so we get past the empty-stream check and reach the tar-code check.
    flyProc.stdout.push(Buffer.from([0x1f, 0x8b]));
    flyProc.stdout.push(null);
    await new Promise<void>((res) => setImmediate(res));
    flyProc.emit('close', 0);
    tarProc.emit('close', 2);

    await expect(promise).rejects.toThrow('local tar exited with code 2');
  });

  it('fly spawn error → throws with message', async () => {
    const promise = syncRecordings({
      flyApp: 'auto-exit-scanner',
      remotePath: '/data/recordings',
      localDir: '/tmp/local',
    });

    // error event fires before close in real Node; simulate same order
    flyProc.emit('error', new Error('ENOENT: fly not found'));
    flyProc.emit('close', -1);
    tarProc.emit('close', 0);

    await expect(promise).rejects.toThrow('fly ssh console failed to start: ENOENT: fly not found');
  });

  it('missing flyApp → throws immediately without spawning', async () => {
    await expect(
      syncRecordings({ flyApp: '', remotePath: '/data/recordings', localDir: '/tmp/local' })
    ).rejects.toThrow('flyApp is required');
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it('SH-SCANNER-SYNC-FIX-2: fly exits 0 but emits zero stdout bytes → throws (silent failure detection)', async () => {
    const promise = syncRecordings({
      flyApp: 'auto-exit-scanner',
      remotePath: '/data/recordings',
      localDir: '/tmp/local',
    });

    // Simulate the silent-failure mode: fly emits something on stderr (e.g.
    // "Connecting to fdaa:...") then exits 0 without writing a single byte
    // to stdout. tar then exits 0 too (empty input is benign).
    flyProc.stderr.push('Connecting to fdaa:73:ef1d:a7b:71d:7e83:c28c:2\n');
    flyProc.stderr.push(null);
    // No flyProc.stdout.push(...) — that's the bug.
    flyProc.stdout.push(null);
    await new Promise<void>((res) => setImmediate(res));
    flyProc.emit('close', 0);
    tarProc.emit('close', 0);

    await expect(promise).rejects.toThrow(/no data piped from remote tar|Connecting to fdaa/);
  });

  it('SH-SCANNER-SYNC-FIX-2: non-zero fly exit surfaces captured stderr in error', async () => {
    const promise = syncRecordings({
      flyApp: 'auto-exit-scanner',
      remotePath: '/data/recordings',
      localDir: '/tmp/local',
    });

    flyProc.stderr.push('Error: app auto-exit-scanner not found\n');
    flyProc.stderr.push(null);
    flyProc.stdout.push(null);
    await new Promise<void>((res) => setImmediate(res));
    flyProc.emit('close', 2);
    tarProc.emit('close', 0);

    await expect(promise).rejects.toThrow(/code 2.*app auto-exit-scanner not found|app auto-exit-scanner not found.*code 2/s);
  });

  it('SH-SCANNER-SYNC-FIX-2: happy path with bytes piped passes the empty-stream check', async () => {
    const promise = syncRecordings({
      flyApp: 'auto-exit-scanner',
      remotePath: '/data/recordings',
      localDir: '/tmp/local',
    });

    // Simulate at least one byte of tar gzip header on stdout
    flyProc.stdout.push(Buffer.from([0x1f, 0x8b, 0x08, 0x00]));
    flyProc.stdout.push(null);
    flyProc.stderr.push('Connecting to fdaa:...\n');
    flyProc.stderr.push(null);
    tarProc.stderr.push('recordings/x.ndjson\n');
    tarProc.stderr.push(null);

    await new Promise<void>((res) => setImmediate(res));
    flyProc.emit('close', 0);
    tarProc.emit('close', 0);

    const result = await promise;
    expect(result.filesTransferred).toBe(1);
    expect(result.bytesTransferred).toBe(4);
  });

  it('path parsing — trailing slash normalised in remote tar command', async () => {
    const promise = syncRecordings({
      flyApp: 'auto-exit-scanner',
      remotePath: '/data/recordings/',
      localDir: '/tmp/local',
    });

    flyProc.stdout.push(Buffer.from([0x1f, 0x8b]));
    flyProc.stdout.push(null);
    await new Promise<void>((res) => setImmediate(res));
    flyProc.emit('close', 0);
    tarProc.emit('close', 0);
    await promise;

    // The fly spawn call must include the correct -C <parent> <base> form
    const flyArgs: string[] = spawnMock.mock.calls.find(([cmd]: [string]) => cmd === 'fly')[1];
    const cmdIdx = flyArgs.indexOf('-C');
    expect(flyArgs[cmdIdx + 1]).toBe('tar czf - -C /data recordings');
  });
});

// ---------------------------------------------------------------------------
// Integration test (skipped unless FLY_APP_FOR_TEST is set)
// ---------------------------------------------------------------------------

describe.skipIf(!process.env['FLY_APP_FOR_TEST'])('syncRecordings integration', () => {
  it('actually syncs from fly app', async () => {
    const result = await syncRecordings({
      flyApp: process.env['FLY_APP_FOR_TEST']!,
      remotePath: process.env['FLY_REMOTE_PATH'] ?? '/data/recordings',
      localDir: process.env['FLY_LOCAL_DIR'] ?? '/tmp/kea-sync-test',
    });
    expect(result.filesTransferred).toBeGreaterThanOrEqual(0);
    expect(result.durationMs).toBeGreaterThan(0);
  });
});
