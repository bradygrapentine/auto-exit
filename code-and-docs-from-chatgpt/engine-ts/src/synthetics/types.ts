import type {
  Synthetic, Orderbook, SyntheticEvalResult, SyntheticKind,
  SyntheticParams, SelfTradePrevention,
} from '../types.js';

export type Evaluator = (s: Synthetic, book: Orderbook, now?: Date) => SyntheticEvalResult;
export type EvaluatorMap = Record<SyntheticKind, Evaluator>;

export interface RegisterArgs {
  kind: SyntheticKind;
  ticker: string;
  side: 'yes' | 'no';
  positionSize: number;
  params: SyntheticParams;
  autoCancelOnZeroPosition?: boolean;
  selfTradePrevention?: SelfTradePrevention;
  parentId?: string;
}
