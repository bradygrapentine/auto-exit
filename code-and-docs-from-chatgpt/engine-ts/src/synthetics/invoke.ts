import type { Synthetic, ExitConfig, StopLimitParams, Side, SelfTradePrevention } from '../types.js';
import { dispatch as alertsDispatch, type AlertContext } from '../alerts/index.js';
import type { Journal } from '../journal.js';

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

const REQUIRED_TEMPLATE_KEYS: Array<keyof ExitConfig> = [
  'baseUrl', 'localServerPort', 'orderbookDepth', 'minLevelSize',
  'tailSweepThreshold', 'minAdaptiveChunk', 'maxOrders', 'loopDelayMs',
  'dryRun', 'killSwitchPath', 'apiKeyEnv', 'privateKeyPathEnv',
];

export function buildExitConfig(s: Synthetic, template: Partial<ExitConfig>): ExitConfig {
  for (const k of REQUIRED_TEMPLATE_KEYS) {
    if (template[k] === undefined) {
      throw new Error(`buildExitConfig: template missing required key '${String(k)}'`);
    }
  }
  return {
    ...(template as ExitConfig),
    marketTicker: s.ticker,
    heldSide: s.side,
    positionSize: s.positionSize,
    chunkSize: s.positionSize,
    floorPriceCents: 1,
    orderTimeInForce: 'immediate_or_cancel',
    tailGtcOnFinish: true,
    preflight: true,
    safetySubmittedMultiple: 1.1,
  };
}

export interface NotifyDeps {
  alertCtx: AlertContext;
  journal: Journal;
}

export interface InvokeFireResult {
  kind: 'fired' | 'notified' | 'deduped' | 'no_channels';
}

export async function invokeFire(
  s: Synthetic,
  deps: FireDeps,
  notifyDeps?: NotifyDeps,
): Promise<InvokeFireResult> {
  // notify-only path: dispatch to alert channels, skip order placement
  if (s.action === 'notify') {
    if (!notifyDeps) throw new Error('invokeFire: notifyDeps required when action="notify"');
    const result = await alertsDispatch(s, notifyDeps.alertCtx, notifyDeps.journal);
    return { kind: result.kind };
  }

  switch (s.kind) {
    case 'stop_loss':
    case 'trailing_stop':
    case 'take_profit': {
      const cfg = deps.buildExitConfig(s);
      await deps.runExit(cfg);
      return { kind: 'fired' };
    }
    case 'stop_limit': {
      const p = s.params as StopLimitParams;
      await deps.postLimit({
        ticker: s.ticker,
        side: s.side,
        action: 'sell',
        priceCents: p.limitPriceCents,
        count: p.size,
        selfTradePrevention: s.selfTradePrevention,
      });
      return { kind: 'fired' };
    }
    case 'oco':
    case 'bracket':
      return { kind: 'fired' };
    default:
      return { kind: 'fired' };
  }
}
