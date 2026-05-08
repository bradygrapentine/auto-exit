# SH-REAL-MULTIREGIME-RECORDING — Discovery Runbook

**Date:** 2026-05-08  
**Task:** SH-REAL-MULTIREGIME-RECORDING  
**Goal:** Scan all 89 recordings in `~/.kea/recordings/` for ones where mid genuinely transitions through regimes mid-recording. Found ones become candidates for v9's recording set.

---

## Method

Extended `scripts/recording-catalog.mjs` with a `detectRegimeFlips(file, windowSize, stride)` function that:

1. Reads all non-empty snapshots from the file into memory.
2. Slides a **200-tick window** with **100-tick stride** through the snapshots.
3. Classifies each window with `detectRegime(slice, proportionalThresholds(200))`.
   - `proportionalThresholds(200)` → `deadRangeCents=20, directionalDeltaCents=40`
   - These scale with window size so 200-tick windows don't collapse to `dead` on modest moves.
4. Filters to directional windows (rising/falling only) and checks for any opposing-direction transition.
5. Records `flipDetected: bool`, `flipCount: int`, and `regimeSequence` (collapsed label path) per recording.

**Parameter choice:** windowSize=200, stride=100. Rationale: a 200-tick window at ~3-second poll intervals is ~10 minutes of wall-clock time — long enough to classify a genuine trend. Stride=100 gives 50% overlap for smooth coverage. Both match the plan's suggested defaults.

---

## Result: 1 candidate found

Scanned **89 recordings**. **1 recording** exhibits a real mid-recording regime flip.

### Candidates for v9

| Recording | Snaps | First mid | Last mid | Range | Δ | Overall dir | Tradable | Flips | Regime sequence |
|---|---:|---:|---:|---:|---:|:--:|:--:|---:|:---|
| `KXNASDAQ100U-26MAY08H1600-T28199.99-20260508` | 3471 | 50¢ | 50¢ | 57¢ | −1¢ | sideways | ✓ | 1 | dead→falling→sideways→rising→dead |

**Regime interpretation:** The recording starts dead (no liquidity), transitions to falling, flattens through sideways, then reverses to rising before dying again at expiry. This is a genuine V-shape: the market sold off then recovered, all within a single 3471-snapshot session. The overall delta is near-zero (last−first = −1¢) because the two directional phases roughly cancel — exactly the kind of "seam-free" multi-regime recording that v8's synthetic approach was trying to approximate.

---

## v9 recommendation

Use `KXNASDAQ100U-26MAY08H1600-T28199.99-20260508` as the real multi-regime recording in v9's sweep. It provides a clean falling→sideways→rising arc within a single continuous session (no timestamp seams).

**Caveats:**
- Only 1 candidate found in the current 89-recording corpus. The v8 synthetic set (4 recordings) still provides more regime-direction coverage. v9 should include both.
- The outer direction classification is `sideways` (|delta| ≤ 5¢) even though the range is 57¢ — the internal regime flip is real but the recording ends near where it started.

---

## Negative result context (other 88 recordings)

The remaining 88 recordings fall into single-regime categories:
- **35 dead** — no meaningful liquidity or price movement throughout.
- **43 sideways** — range > 1¢ but no sustained directional segment (all windows classify dead or sideways).
- **7 rising** — monotone upward trend, no reversal.
- **4 falling** — monotone downward trend, no reversal.

None of the other recordings show a genuine rising→falling or falling→rising transition within a single session.

---

## If zero real candidates were found (contingency, for reference)

This section is preserved as a reference for future scans. If zero candidates had been found:

1. **v9 falls back to v8's synthetic seams** — the 4 concatenated recordings with rebased timestamps remain the best available multi-regime data.
2. **Future options:**
   - **Capture during event windows** — FOMC announcement days, major earnings releases, and macro data releases (CPI, NFP) tend to produce genuine intra-session reversals. Schedule a recording session during these windows.
   - **Extend recording duration** — current recordings average ~2900 snapshots (~2.5h at 3s polls). Doubling to 5h increases the probability of catching a reversal.
   - Both are infrastructure tasks; defer until the recording harness supports scheduled auto-capture.

---

## Files changed

- `scripts/recording-catalog.mjs` — added `detectRegimeFlips()`, `toSnapshotSlice()` adapter, and flip columns to catalog output.
- This runbook.
