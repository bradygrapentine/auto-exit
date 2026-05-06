/**
 * W3.1 POV (participation-of-volume) pacing helper.
 *
 * Loop strategies opt in by passing the most recent minute's submitted-share
 * count + recent market volume to computePaceDelayMs; the helper returns either
 * the configured base delay or an inflated delay if the loop is exceeding its
 * fair share of recent volume.
 *
 * Disabled when maxParticipationRate === 0. Capped at 10× the base delay to
 * prevent permanent stalls when volume drops to zero.
 */

export interface PovConfig {
  maxParticipationRate: number;
  recentMinuteVolume: number;
}

const MAX_DELAY_MULTIPLIER = 10;

export function computeAllowedSharesPerMinute(rate: number, recentVolumePerMinute: number): number {
  if (rate === 0) return Infinity;
  return Math.floor(rate * recentVolumePerMinute);
}

export function computePaceDelayMs(
  sharesSubmittedLastMinute: number,
  cfg: PovConfig,
  baseDelayMs: number,
): number {
  if (cfg.maxParticipationRate === 0) return baseDelayMs;
  const allowed = computeAllowedSharesPerMinute(cfg.maxParticipationRate, cfg.recentMinuteVolume);
  if (allowed === Infinity || sharesSubmittedLastMinute <= allowed) return baseDelayMs;
  const overshoot = sharesSubmittedLastMinute / Math.max(allowed, 1);
  return Math.min(Math.round(baseDelayMs * overshoot), baseDelayMs * MAX_DELAY_MULTIPLIER);
}
