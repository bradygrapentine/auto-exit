import { randomUUID } from 'node:crypto';
import type {
  Synthetic, WatcherConfig,
  KalshiClientLike, Side, SelfTradePrevention,
  OcoParams, BracketParams, OcoState, BracketState, Orderbook,
  ExitConfig,
} from './types.js';
import { evaluate, isComposite } from './synthetics/index.js';
import type { RegisterArgs } from './synthetics/types.js';
import type { WatcherJournal } from './watcherJournal.js';
import type { Recorder } from './backtest/types.js';

export interface FireDeps {
  runExit: (cfg: ExitConfig) => Promise<unknown>;
  postLimit: (args: {
    ticker: string;
    side: Side;
    action: 'buy' | 'sell';
    priceCents: number;
    count: number;
    selfTradePrevention?: SelfTradePrevention;
  }) => Promise<string>;
  buildExitConfig: (s: Synthetic) => ExitConfig;
}

export type FireHook = (s: Synthetic, reason: string) => Promise<void>;

export interface TickResult {
  nextDelayMs: number;
  armedCount: number;
  firedThisTick: string[];
}

export class Watcher {
  private synthetics = new Map<string, Synthetic>();
  private fireHook?: FireHook;
  private looping = false;

  constructor(
    private readonly client: KalshiClientLike,
    private readonly config: WatcherConfig,
    private readonly journal?: WatcherJournal,
    private readonly recorder?: Recorder,
  ) {}

  setFireHook(hook: FireHook): void {
    this.fireHook = hook;
  }

  /** Resurrect the in-memory map from the journal. Call once at startup. */
  replayFromJournal(): void {
    if (!this.journal) return;
    this.synthetics.clear();
    for (const s of this.journal.replay()) {
      this.synthetics.set(s.id, s);
    }
  }

  register(args: RegisterArgs): string {
    const id = `syn-${randomUUID()}`;
    const s: Synthetic = {
      id,
      kind: args.kind,
      ticker: args.ticker,
      side: args.side,
      positionSize: args.positionSize,
      params: args.params,
      state: {},
      status: 'armed',
      createdAt: new Date().toISOString(),
      selfTradePrevention: args.selfTradePrevention ?? 'taker_at_cross',
      autoCancelOnZeroPosition: args.autoCancelOnZeroPosition ?? true,
      parentId: args.parentId,
    };
    this.synthetics.set(id, s);

    if (isComposite(s.kind)) {
      const children = this.expandComposite(s);
      const childIds: string[] = [];
      for (const ch of children) {
        const cid = this.register({ ...ch, parentId: id });
        childIds.push(cid);
      }
      s.state = s.kind === 'oco'
        ? ({ childIds: [childIds[0], childIds[1]] } as OcoState)
        : ({ childIds: [childIds[0], childIds[1]] } as BracketState);
    }
    this.journal?.appendRegistered(s);
    return id;
  }

  private expandComposite(s: Synthetic): RegisterArgs[] {
    if (s.kind === 'oco') {
      const p = s.params as OcoParams;
      return p.legs.map(leg => ({
        kind: leg.kind,
        ticker: s.ticker,
        side: s.side,
        positionSize: s.positionSize,
        params: leg.params,
        selfTradePrevention: s.selfTradePrevention,
        autoCancelOnZeroPosition: s.autoCancelOnZeroPosition,
      }));
    }
    if (s.kind === 'bracket') {
      const p = s.params as BracketParams;
      return [
        {
          kind: 'take_profit',
          ticker: s.ticker, side: s.side, positionSize: s.positionSize,
          params: { triggerPriceCents: p.takeProfitCents } as any,
          selfTradePrevention: s.selfTradePrevention,
          autoCancelOnZeroPosition: s.autoCancelOnZeroPosition,
        },
        {
          kind: 'stop_loss',
          ticker: s.ticker, side: s.side, positionSize: s.positionSize,
          params: { triggerPriceCents: p.stopLossCents } as any,
          selfTradePrevention: s.selfTradePrevention,
          autoCancelOnZeroPosition: s.autoCancelOnZeroPosition,
        },
      ];
    }
    return [];
  }

  cancel(id: string): boolean {
    const s = this.synthetics.get(id);
    if (!s || s.status !== 'armed') return false;
    s.status = 'canceled';
    s.canceledAt = new Date().toISOString();
    this.journal?.appendCanceled(id);
    if (isComposite(s.kind)) {
      const cids = (s.state as OcoState | BracketState).childIds ?? [];
      for (const cid of cids) this.cancel(cid);
    }
    return true;
  }

  list(): Synthetic[] {
    return Array.from(this.synthetics.values());
  }

  get(id: string): Synthetic | undefined {
    return this.synthetics.get(id);
  }

  async tick(): Promise<TickResult> {
    const armed = this.list().filter(s => s.status === 'armed');
    if (armed.length === 0) {
      return {
        nextDelayMs: this.config.idleIntervalMs ?? 10000,
        armedCount: 0,
        firedThisTick: [],
      };
    }

    const tickers = new Set(armed.map(s => s.ticker));
    const depth = this.config.orderbookDepth ?? 20;
    const books = new Map<string, Orderbook>();
    const positions = new Map<string, number>();

    await Promise.all(Array.from(tickers).map(async t => {
      books.set(t, await this.client.getOrderbook(t, depth));
      const needsPos = armed.some(s => s.ticker === t && s.autoCancelOnZeroPosition);
      if (needsPos) {
        const pos = await this.client.getPosition(t);
        positions.set(t, (pos as any)?.quantity ?? 0);
      }
    }));

    for (const [t, book] of books) { this.recorder?.appendSnapshot(book); }

    const firedThisTick = new Set<string>();
    const parentFiredThisTick = new Set<string>();
    let minDistance = Infinity;

    for (const s of armed) {
      if (s.parentId && parentFiredThisTick.has(s.parentId)) continue;

      if (s.autoCancelOnZeroPosition && positions.get(s.ticker) === 0) {
        this.cancel(s.id);
        continue;
      }

      const book = books.get(s.ticker)!;
      const result = evaluate(s, book);
      if (result.newState) {
        s.state = result.newState;
        this.journal?.appendStateUpdate(s.id, result.newState);
      }
      if (typeof result.distanceCentsToTrigger === 'number') {
        minDistance = Math.min(minDistance, Math.abs(result.distanceCentsToTrigger));
      }

      if (result.fire) {
        const reason = result.reason ?? 'evaluator_fired';
        this.journal?.appendFirePending(s.id, reason);
        try {
          if (this.fireHook) await this.fireHook(s, reason);
          s.status = 'fired';
          s.firedAt = new Date().toISOString();
          this.journal?.appendFired(s.id, reason);
          firedThisTick.add(s.id);

          // Successful fire: cascade parent + cancel siblings.
          if (s.parentId) {
            const parent = this.synthetics.get(s.parentId);
            if (parent && parent.status === 'armed') {
              parent.status = 'fired';
              parent.firedAt = s.firedAt;
              parentFiredThisTick.add(parent.id);
              this.journal?.appendFired(parent.id, `child_${s.id}_fired`);
              const cids = (parent.state as OcoState | BracketState).childIds ?? [];
              for (const cid of cids) {
                if (cid !== s.id) this.cancel(cid);
              }
            }
          }
        } catch (e) {
          s.status = 'fire_failed';
          s.fireFailedAt = new Date().toISOString();
          s.fireFailedReason = e instanceof Error ? e.message : String(e);
          this.journal?.appendFireFailed(s.id, s.fireFailedReason);
          // Do NOT cascade sibling cancel on failure — operator decides.
        }
      } else if (result.unregister) {
        this.cancel(s.id);
      }
    }

    const near = this.config.nearTriggerThresholdCents ?? 3;
    const fastMs = this.config.nearTriggerCadenceMs ?? 250;
    const slowMs = this.config.pollIntervalMs ?? 2000;
    const nextDelayMs = (minDistance <= near) ? fastMs : slowMs;

    return {
      nextDelayMs,
      armedCount: armed.length,
      firedThisTick: Array.from(firedThisTick),
    };
  }

  async start(): Promise<void> {
    this.looping = true;
    while (this.looping) {
      let nextDelayMs = this.config.pollIntervalMs ?? 2000;
      try {
        const r = await this.tick();
        nextDelayMs = r.nextDelayMs;
      } catch {
        /* logged via journal at higher layer */
      }
      await new Promise(r => setTimeout(r, nextDelayMs));
    }
  }

  stop(): void {
    this.looping = false;
  }
}
