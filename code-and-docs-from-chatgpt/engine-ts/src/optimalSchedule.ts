/**
 * optimalSchedule.ts — Almgren-Chriss optimal execution schedule for Kalshi binary contracts.
 *
 * Pure math module. No I/O, no state, no side effects.
 *
 * Math reference:
 *   Almgren & Chriss (2001) closed form adapted for binaries with known terminal value.
 *   n_k ∝ sinh(κ × (T - t_k))  where  κ² = λ × σ² / η
 *
 *   λ = riskAversion (urgency parameter)
 *   σ² = remainingValueVariance (price variance proxy; default p(1-p) at p=0.5 → 0.25)
 *   η = bookImpactPerContract (temporary market impact coefficient)
 *
 *   riskAversion=0 → κ=0 → sinh weights all equal → uniform (TWAP-equivalent)
 *   High riskAversion → large κ → front-loaded schedule
 */

export interface OptimalScheduleOpts {
  /** Total number of contracts to execute. Must be > 0. */
  totalSize: number;
  /** Total duration over which to execute, in milliseconds. Must be > 0. */
  totalDurationMs: number;
  /** Number of equal-width time intervals. Must be ≥ 2. */
  numIntervals: number;
  /** Risk-aversion parameter λ ≥ 0. Controls urgency. 0 = TWAP. */
  riskAversion: number;
  /** Temporary market impact per contract η > 0. */
  bookImpactPerContract: number;
  /** Price-variance proxy σ². Defaults to p(1-p) at p=0.5 → 0.25. */
  remainingValueVariance?: number;
  /** Trade side. Informational; passed through to output. Default 'sell'. */
  side?: 'buy' | 'sell';
}

export interface ScheduleSlice {
  /** Zero-based interval index. */
  intervalIndex: number;
  /** Interval start time offset from t=0, in milliseconds. */
  tStartMs: number;
  /** Duration of this interval in milliseconds. */
  intervalMs: number;
  /** Number of contracts to execute in this interval. */
  sliceSize: number;
}

export interface OptimalScheduleResult {
  slices: ScheduleSlice[];
  rationale: string;
}

/**
 * Compute an Almgren-Chriss optimal execution schedule.
 *
 * @throws {Error} if any required input is invalid.
 */
export function computeOptimalSchedule(opts: OptimalScheduleOpts): OptimalScheduleResult {
  // ── validation ────────────────────────────────────────────────────────────
  if (!Number.isFinite(opts.totalSize) || opts.totalSize <= 0) {
    throw new Error('totalSize must be a positive number');
  }
  if (!Number.isFinite(opts.numIntervals) || opts.numIntervals < 2 || !Number.isInteger(opts.numIntervals)) {
    throw new Error('numIntervals must be an integer ≥ 2');
  }
  if (!Number.isFinite(opts.totalDurationMs) || opts.totalDurationMs <= 0) {
    throw new Error('totalDurationMs must be a positive number');
  }
  if (!Number.isFinite(opts.riskAversion) || opts.riskAversion < 0) {
    throw new Error('riskAversion must be ≥ 0');
  }
  if (!Number.isFinite(opts.bookImpactPerContract) || opts.bookImpactPerContract <= 0) {
    throw new Error('bookImpactPerContract must be a positive number');
  }

  const totalSize = opts.totalSize;
  const N = opts.numIntervals;
  const T = opts.totalDurationMs;
  const lambda = opts.riskAversion;
  const eta = opts.bookImpactPerContract;
  const sigma2 = opts.remainingValueVariance ?? 0.25; // p(1-p) at p=0.5
  const side = opts.side ?? 'sell';

  const intervalMs = T / N;

  // ── Almgren-Chriss weights ─────────────────────────────────────────────────
  // κ² = λ × σ² / η
  const kappaSq = lambda * sigma2 / eta;
  const kappa = Math.sqrt(kappaSq); // 0 when riskAversion=0

  // Weight for interval k (0-indexed): w_k = sinh(κ × (T - t_k))
  // where t_k = k × intervalMs (start of interval k)
  // When κ≈0, sinh(κx) ≈ κx → all weights equal → uniform.
  //
  // Overflow guard: for large κ, sinh(κ·x) ≈ 0.5·exp(κ·x). We compute
  // log-weights and normalize to avoid Infinity/NaN. Let maxArg be the
  // largest argument; divide each weight by exp(maxArg) before summing.
  const rawWeights: number[] = [];
  // Use dimensionless interval-index time: t_k = k, T = N.
  // This keeps κ·(T - t_k) in a numerically sensible range regardless of
  // whether totalDurationMs is seconds, ms, or hours.
  const args: number[] = [];
  for (let k = 0; k < N; k++) {
    const timeRemaining = N - k; // T - t_k in interval units
    args.push(kappa * timeRemaining);
  }

  if (kappa < 1e-12) {
    // TWAP: uniform weights
    for (let k = 0; k < N; k++) rawWeights.push(1);
  } else {
    // Compute sinh(arg) with overflow protection via log-sum-exp normalization.
    // sinh(x) = (e^x - e^{-x}) / 2; for large x, sinh(x) ≈ e^x / 2.
    // We only need proportional weights, so we can divide by exp(maxArg):
    //   sinh(arg_k) / exp(maxArg) = (exp(arg_k - maxArg) - exp(-arg_k - maxArg)) / 2
    const maxArg = args[0]!; // args are decreasing (timeRemaining shrinks), max is k=0
    for (const arg of args) {
      const w = (Math.exp(arg - maxArg) - Math.exp(-arg - maxArg)) / 2;
      rawWeights.push(Math.max(0, w));
    }
  }

  const weightSum = rawWeights.reduce((acc, w) => acc + w, 0);

  // ── integer slice sizes ───────────────────────────────────────────────────
  // Proportional allocation, rounded to integers; remainder in last slice.
  const totalSizeInt = Math.round(totalSize);
  const sliceSizes: number[] = [];
  let allocated = 0;
  for (let k = 0; k < N - 1; k++) {
    const raw = totalSizeInt * rawWeights[k]! / weightSum;
    const s = Math.round(raw);
    sliceSizes.push(s);
    allocated += s;
  }
  // Last slice absorbs rounding remainder
  sliceSizes.push(totalSizeInt - allocated);

  // ── build output slices ───────────────────────────────────────────────────
  const slices: ScheduleSlice[] = sliceSizes.map((sliceSize, k) => ({
    intervalIndex: k,
    tStartMs: k * intervalMs,
    intervalMs,
    sliceSize,
  }));

  // ── rationale ─────────────────────────────────────────────────────────────
  let rationale: string;
  if (kappa < 1e-12) {
    rationale =
      `Uniform (TWAP) schedule: riskAversion=0 → κ=0 → equal weights across ${N} intervals ` +
      `of ${intervalMs.toFixed(0)}ms each. Total: ${totalSizeInt} contracts over ${T}ms.`;
  } else {
    const frontHalf = sliceSizes.slice(0, Math.floor(N / 2)).reduce((a, b) => a + b, 0);
    const backHalf = totalSizeInt - frontHalf;
    const frontPct = ((frontHalf / totalSizeInt) * 100).toFixed(1);
    rationale =
      `Almgren-Chriss front-loaded schedule: λ=${lambda}, σ²=${sigma2}, η=${eta} → κ=${kappa.toFixed(4)}. ` +
      `${N} intervals of ${intervalMs.toFixed(0)}ms. ` +
      `Front half: ${frontPct}% of ${totalSizeInt} contracts (${frontHalf} vs ${backHalf}). ` +
      `Side: ${side}. Higher riskAversion urgency reduces market-timing risk at cost of greater impact.`;
  }

  return { slices, rationale };
}
