# Strategy Sweep v3.1 — Expanded Recording Set

**Generated:** 2026-05-12T03:12:15.801Z
**Catalog:** 2026-05-11-recording-catalog.md
**Recordings:** 117 tradable non-dead (snaps ≥ 100)
  - rising: 18
  - falling: 24
  - sideways: 75
**Total cells:** 3978  (runtime 407s)

## Cross-recording winners — overall (avg pnl¢, slippage > -50)

| Strategy | Best params | avg pnl¢ | recordings filled | avg slip¢ |
|---|---|---:|---:|---:|
| s-aggressive | (defaults) | 2911 | 117/117 | -7 |
| s-passive | chunkSize=100, walkStepCents=1 | 3230 | 117/117 | -6 |
| s-twap | numIntervals=10, intervalMinutes=1 | 3242 | 117/117 | -5 |
| s-trail | trailCents=1 | 2760 | 115/117 | -7 |
| trailing_stop | trailCents=1 | 2760 | 115/117 | -7 |
| stop_loss | stopPriceCents=50 | 2556 | 115/117 | -6 |
| take_profit | targetPriceCents=40 | 381 | 117/117 | 0 |
| bracket | targetPriceCents=50, stopPriceCents=20 | 2158 | 115/117 | -7 |

## Cross-recording winners — rising (18 recordings)

| Strategy | Best params | avg pnl¢ | recordings filled | avg slip¢ |
|---|---|---:|---:|---:|
| s-aggressive | (defaults) | 3709 | 18/18 | 1 |
| s-passive | chunkSize=100, walkStepCents=1 | 3985 | 18/18 | 3 |
| s-twap | numIntervals=5, intervalMinutes=1 | 4002 | 18/18 | 3 |
| s-trail | trailCents=5 | 3498 | 18/18 | 1 |
| trailing_stop | trailCents=5 | 3498 | 18/18 | 1 |
| stop_loss | stopPriceCents=30 | 3739 | 18/18 | 1 |
| take_profit | targetPriceCents=40 | 2027 | 18/18 | 1 |
| bracket | targetPriceCents=50, stopPriceCents=20 | 3739 | 18/18 | 1 |

## Cross-recording winners — falling (24 recordings)

| Strategy | Best params | avg pnl¢ | recordings filled | avg slip¢ |
|---|---|---:|---:|---:|
| s-aggressive | (defaults) | 3217 | 24/24 | -9 |
| s-passive | chunkSize=100, walkStepCents=1 | 3299 | 24/24 | -9 |
| s-twap | numIntervals=2, intervalMinutes=1 | 3298 | 24/24 | -9 |
| s-trail | trailCents=3 | 3269 | 24/24 | -6 |
| trailing_stop | trailCents=3 | 3269 | 24/24 | -6 |
| stop_loss | stopPriceCents=50 | 3260 | 24/24 | -6 |
| take_profit | targetPriceCents=40 | 0 | 24/24 | 0 |
| bracket | targetPriceCents=50, stopPriceCents=20 | 2413 | 24/24 | -7 |

## Cross-recording winners — sideways (75 recordings)

| Strategy | Best params | avg pnl¢ | recordings filled | avg slip¢ |
|---|---|---:|---:|---:|
| s-aggressive | (defaults) | 2621 | 75/75 | -8 |
| s-passive | chunkSize=100, walkStepCents=1 | 3027 | 75/75 | -7 |
| s-twap | numIntervals=10, intervalMinutes=1 | 3042 | 75/75 | -7 |
| s-trail | trailCents=1 | 2432 | 73/75 | -9 |
| trailing_stop | trailCents=1 | 2432 | 73/75 | -9 |
| stop_loss | stopPriceCents=50 | 2033 | 73/75 | -8 |
| take_profit | targetPriceCents=40 | 108 | 75/75 | -0 |
| bracket | targetPriceCents=50, stopPriceCents=20 | 1685 | 73/75 | -8 |

## Per-strategy distribution — best param, top/median/bottom pnl across recordings

| Strategy | Best param | top pnl¢ | median pnl¢ | bottom pnl¢ | recordings |
|---|---|---:|---:|---:|---:|
| s-aggressive | (defaults) | 9573 | 2269 | 0 | 117 |
| s-passive | chunkSize=100, walkStepCents=1 | 9573 | 2558 | 0 | 117 |
| s-twap | numIntervals=10, intervalMinutes=1 | 9570 | 2560 | 0 | 117 |
| s-trail | trailCents=1 | 9891 | 1983 | 0 | 115 |
| trailing_stop | trailCents=1 | 9891 | 1983 | 0 | 115 |
| stop_loss | stopPriceCents=50 | 9893 | 1982 | 0 | 115 |
| take_profit | targetPriceCents=40 | 9893 | 0 | 0 | 117 |
| bracket | targetPriceCents=50, stopPriceCents=20 | 9148 | 1791 | 0 | 115 |

## All cells (raw)

| Strategy | Params | Recording | dir | pnl¢ | fills | rate | slip¢ | error |
|---|---|---|---|---:|---:|---:|---:|---|
| s-aggressive | (defaults) | KXETH-26MAY0817-B2390-20260508 | rising | 8 | 1 | 3% | -40 |  |
| s-aggressive | (defaults) | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7062 | 1 | 100% | 22 |  |
| s-aggressive | (defaults) | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9148 | 1 | 100% | 8 |  |
| s-aggressive | (defaults) | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 3438 | 1 | 100% | 2 |  |
| s-aggressive | (defaults) | KXINX-26MAY08H1600-B7387-20260508 | rising | 11 | 1 | 1% | -7 |  |
| s-aggressive | (defaults) | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8726 | 1 | 100% | 39 |  |
| s-aggressive | (defaults) | KXFEDDECISION-28JAN-H0-20260509 | rising | 2563 | 1 | 100% | -23 |  |
| s-aggressive | (defaults) | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1315 | 1 | 100% | -3 |  |
| s-aggressive | (defaults) | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 3634 | 1 | 100% | 1 |  |
| s-aggressive | (defaults) | KXCABOUT-26APR20-TGAB-20260509 | rising | 3733 | 1 | 100% | 14 |  |
| s-aggressive | (defaults) | KXIPO-26-DISCORD-20260509 | rising | 4923 | 1 | 100% | 2 |  |
| s-aggressive | (defaults) | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 3438 | 1 | 100% | 3 |  |
| s-aggressive | (defaults) | KXLLM1-26MAY09-GOOG-20260508 | rising | 12.85 | 1 | 15% | -13 |  |
| s-aggressive | (defaults) | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4426 | 1 | 100% | 0 |  |
| s-aggressive | (defaults) | KXHIGHCHI-26MAY08-T70-20260508 | rising | 279 | 1 | 100% | -5 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27APR-H0-20260508 | rising | 6035 | 1 | 100% | 4 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 2078 | 1 | 100% | -2 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27APR-H0-20260507 | rising | 5933 | 1 | 100% | 9 |  |
| s-aggressive | (defaults) | KXBTC-26MAY0817-B79750-20260508 | sideways | 1410 | 1 | 100% | -20 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27SEP-H0-20260509 | sideways | 1789 | 1 | 100% | -30 |  |
| s-aggressive | (defaults) | KXIPO-26-DISCORD-20260507 | sideways | 4824 | 1 | 100% | 1 |  |
| s-aggressive | (defaults) | KXIPO-26-DISCORD-20260508 | sideways | 4923 | 1 | 100% | -3 |  |
| s-aggressive | (defaults) | KXLLM1-26MAY31-A-20260509 | sideways | 7783 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 93 | 1 | 100% | -6 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27OCT-H0-20260508 | sideways | 1791 | 1 | 100% | -32 |  |
| s-aggressive | (defaults) | KXOSCARPIC-27-DIS-20260508 | sideways | 186 | 1 | 100% | -20 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 3930 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 4525 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 4227 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27APR-H0-20260509 | sideways | 6647 | 1 | 100% | 3 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27DEC-H0-20260509 | sideways | 1695 | 1 | 100% | -29 |  |
| s-aggressive | (defaults) | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 654 | 1 | 100% | -9 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 4029 | 1 | 100% | -6 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27DEC-H0-20260508 | sideways | 1695 | 1 | 100% | -32 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27JUL-H0-20260509 | sideways | 1885 | 1 | 100% | -28 |  |
| s-aggressive | (defaults) | KXOSCARACTO-27-TOM-20260507 | sideways | 2269 | 1 | 100% | -8 |  |
| s-aggressive | (defaults) | KXOSCARACTO-27-TOM-20260508 | sideways | 2270 | 1 | 100% | -11 |  |
| s-aggressive | (defaults) | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 842 | 1 | 100% | -25 |  |
| s-aggressive | (defaults) | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1697 | 1 | 100% | 2 |  |
| s-aggressive | (defaults) | KXLLM1-26DEC31-XAI-20260508 | sideways | 562 | 1 | 100% | 0 |  |
| s-aggressive | (defaults) | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 562 | 1 | 100% | 0 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27SEP-H0-20260508 | sideways | 1789 | 1 | 100% | -32 |  |
| s-aggressive | (defaults) | KXLLM1-26MAY31-A-20260507 | sideways | 7783 | 1 | 100% | -2 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 2368 | 1 | 100% | 0 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 1887 | 1 | 100% | -6 |  |
| s-aggressive | (defaults) | KXOSCARACTO-27-TOM-20260509 | sideways | 2465 | 1 | 100% | -6 |  |
| s-aggressive | (defaults) | KXINX-26MAY08H1600-B7387-20260507 | sideways | 11 | 1 | 1% | -9 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 1887 | 1 | 100% | -8 |  |
| s-aggressive | (defaults) | KXTOPARTIST-26B-DRA-20260508 | sideways | 2465 | 1 | 100% | -8 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1983 | 1 | 100% | -15 |  |
| s-aggressive | (defaults) | KXIPOSPACEX-26JUN01-20260508 | sideways | 936 | 1 | 100% | -2 |  |
| s-aggressive | (defaults) | KXIPOSPACEX-26JUN01-20260509 | sideways | 842 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXLLM1-26MAY31-A-20260508 | sideways | 7679 | 1 | 100% | 0 |  |
| s-aggressive | (defaults) | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1889 | 1 | 100% | 1 |  |
| s-aggressive | (defaults) | KXSPACEXCOUNT-26B-170-20260510 | sideways | 1359 | 1 | 72% | -1 |  |
| s-aggressive | (defaults) | KXLLM1-26DEC31-XAI-20260509 | sideways | 653 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 8939 | 1 | 100% | 0 |  |
| s-aggressive | (defaults) | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 9040 | 1 | 100% | 0 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27JUL-H0-20260508 | sideways | 1982 | 1 | 100% | -28 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27MAR-C25-20260508 | sideways | 2077 | 1 | 100% | -16 |  |
| s-aggressive | (defaults) | KXFEDDECISION-28JAN-H0-20260508 | sideways | 2665 | 1 | 100% | -23 |  |
| s-aggressive | (defaults) | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 3242 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXLLM1-26MAY09-GOOG-20260507 | sideways | 12.83 | 1 | 15% | -12 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 2272 | 1 | 100% | -2 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 6340 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 2562 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 8934 | 1 | 100% | 0 |  |
| s-aggressive | (defaults) | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 557 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXETH-26MAY0817-B2390-20260507 | sideways | 279 | 1 | 100% | -39 |  |
| s-aggressive | (defaults) | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 8831 | 1 | 100% | 7 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27JUL-H0-20260507 | sideways | 1982 | 1 | 100% | -29 |  |
| s-aggressive | (defaults) | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 279 | 1 | 100% | -5 |  |
| s-aggressive | (defaults) | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 2272 | 1 | 100% | -2 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 6238 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 2368 | 1 | 100% | -3 |  |
| s-aggressive | (defaults) | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3437 | 1 | 100% | 4 |  |
| s-aggressive | (defaults) | KXTIME-26-ZOH-20260508 | sideways | 1694 | 1 | 100% | -11 |  |
| s-aggressive | (defaults) | KXLLM1-26DEC31-XAI-20260507 | sideways | 559 | 1 | 100% | 0 |  |
| s-aggressive | (defaults) | KXBTC-26MAY0817-B79750-20260507 | sideways | 1411 | 1 | 100% | -20 |  |
| s-aggressive | (defaults) | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27OCT-H0-20260512 | sideways | 28 | 1 | 1% | -2 |  |
| s-aggressive | (defaults) | KXIPO-26-DISCORD-20260510 | sideways | 2237.31 | 1 | 38% | -1 |  |
| s-aggressive | (defaults) | KXLLM1-26MAY31-A-20260510 | sideways | 738 | 1 | 9% | -2 |  |
| s-aggressive | (defaults) | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 433 | 1 | 42% | -39 |  |
| s-aggressive | (defaults) | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6035 | 1 | 100% | 12 |  |
| s-aggressive | (defaults) | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 93 | 1 | 100% | -15 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 5024 | 1 | 100% | -4 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 4227 | 1 | 100% | -4 |  |
| s-aggressive | (defaults) | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 936 | 1 | 100% | -27 |  |
| s-aggressive | (defaults) | KXTIME-26-ZOH-20260510 | sideways | 203 | 1 | 12% | -1 |  |
| s-aggressive | (defaults) | KXTOPARTIST-26B-DRA-20260507 | sideways | 2367 | 1 | 100% | -9 |  |
| s-aggressive | (defaults) | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 783 | 1 | 52% | -34 |  |
| s-aggressive | (defaults) | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 8620 | 1 | 100% | -5 |  |
| s-aggressive | (defaults) | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 9573 | 1 | 100% | 11 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3930 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5326 | 1 | 100% | 0 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 3635 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 936 | 1 | 100% | -27 |  |
| s-aggressive | (defaults) | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5226 | 1 | 100% | 1 |  |
| s-aggressive | (defaults) | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1983 | 1 | 100% | -13 |  |
| s-aggressive | (defaults) | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3536 | 1 | 100% | -9 |  |
| s-aggressive | (defaults) | KXOSCARPIC-27-DIS-20260509 | falling | 186 | 1 | 100% | -16 |  |
| s-aggressive | (defaults) | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 93 | 1 | 100% | -15 |  |
| s-aggressive | (defaults) | KXINXY-26DEC31H1600-B8300-20260509 | falling | 654 | 1 | 100% | -12 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27MAR-C25-20260509 | falling | 2562 | 1 | 100% | -12 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 2272 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXTIME-26-ZOH-20260509 | falling | 1694 | 1 | 100% | -12 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27JUN-C25-20260509 | falling | 7 | 1 | 1% | -37 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 4824 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 5124 | 1 | 100% | -3 |  |
| s-aggressive | (defaults) | KXTOPARTIST-26B-DRA-20260509 | falling | 2950 | 1 | 100% | -5 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 4029 | 1 | 100% | -4 |  |
| s-aggressive | (defaults) | KXCABOUT-26APR20-TGAB-20260507 | falling | 3733 | 1 | 100% | 2 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27OCT-H0-20260509 | falling | 1791 | 1 | 100% | -28 |  |
| s-aggressive | (defaults) | KXCABOUT-26APR20-TGAB-20260508 | falling | 3733 | 1 | 100% | 8 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXETH-26MAY0817-B2390-20260508 | rising | 180 | 4 | 100% | -41 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7576 | 4 | 100% | 27 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9148 | 4 | 100% | 10 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 3436 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXINX-26MAY08H1600-B7387-20260508 | rising | 836 | 76 | 76% | -6 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8724 | 4 | 100% | 39 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-28JAN-H0-20260509 | rising | 4122 | 22 | 76% | 6 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1312 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 3732 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3732 | 4 | 100% | 14 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXIPO-26-DISCORD-20260509 | rising | 5020 | 4 | 100% | 3 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 3060 | 10 | 82% | 6 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXLLM1-26MAY09-GOOG-20260508 | rising | 22 | 2 | 25% | -13 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4424 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 276 | 4 | 100% | -5 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27APR-H0-20260508 | rising | 6032 | 4 | 100% | 4 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 2176 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27APR-H0-20260507 | rising | 5932 | 4 | 100% | 9 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1408 | 4 | 100% | -20 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 2280 | 76 | 76% | -17 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXIPO-26-DISCORD-20260507 | sideways | 4924 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXIPO-26-DISCORD-20260508 | sideways | 5020 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXLLM1-26MAY31-A-20260509 | sideways | 7780 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 23 | 1 | 25% | -6 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 1708 | 40 | 76% | -27 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXOSCARPIC-27-DIS-20260508 | sideways | 184 | 4 | 100% | -20 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 3928 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 4524 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 4224 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27APR-H0-20260509 | sideways | 6644 | 4 | 100% | 3 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 1672 | 76 | 76% | -23 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 652 | 4 | 100% | -9 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 4224 | 4 | 100% | -4 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 1672 | 76 | 76% | -26 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 2584 | 76 | 76% | -12 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXOSCARACTO-27-TOM-20260507 | sideways | 2368 | 4 | 100% | -7 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXOSCARACTO-27-TOM-20260508 | sideways | 2368 | 4 | 100% | -10 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 840 | 4 | 100% | -25 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1692 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXLLM1-26DEC31-XAI-20260508 | sideways | 556 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 560 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 2280 | 76 | 76% | -19 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXLLM1-26MAY31-A-20260507 | sideways | 7780 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 2368 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 1884 | 4 | 100% | -6 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXOSCARACTO-27-TOM-20260509 | sideways | 2464 | 4 | 100% | -6 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 836 | 76 | 76% | -9 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 1884 | 4 | 100% | -8 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXTOPARTIST-26B-DRA-20260508 | sideways | 2254 | 7 | 85% | -7 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1980 | 4 | 100% | -15 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXIPOSPACEX-26JUN01-20260508 | sideways | 936 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXIPOSPACEX-26JUN01-20260509 | sideways | 840 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXLLM1-26MAY31-A-20260508 | sideways | 7676 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1884 | 4 | 100% | 1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 1884 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXLLM1-26DEC31-XAI-20260509 | sideways | 648 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 8936 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 9040 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 2584 | 76 | 76% | -13 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 2272 | 4 | 100% | -14 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 4336 | 16 | 80% | 5 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 3240 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 22 | 2 | 25% | -12 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 2272 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 6340 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 2560 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 8932 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 552 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXETH-26MAY0817-B2390-20260507 | sideways | 276 | 4 | 100% | -39 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 7719.7 | 7 | 86% | 6 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 2584 | 76 | 76% | -14 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 276 | 4 | 100% | -5 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 652 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 2272 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 6236 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 2368 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 2880 | 9 | 83% | 5 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXTIME-26-ZOH-20260508 | sideways | 1549.04 | 7 | 78% | -8 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXLLM1-26DEC31-XAI-20260507 | sideways | 556 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1408 | 4 | 100% | -19 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 2128 | 76 | 76% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXIPO-26-DISCORD-20260510 | sideways | 5932 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXLLM1-26MAY31-A-20260510 | sideways | 8096 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 1028 | 4 | 100% | -39 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6340 | 4 | 100% | 15 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 23 | 1 | 25% | -15 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 5124 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 4224 | 4 | 100% | -4 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 936 | 4 | 100% | -27 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXTIME-26-ZOH-20260510 | sideways | 1596 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXTOPARTIST-26B-DRA-20260507 | sideways | 2153 | 7 | 83% | -6 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1504 | 4 | 100% | -34 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 2155 | 1 | 25% | -5 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 9572 | 4 | 100% | 11 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3928 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5255 | 13 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 3632 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 936 | 4 | 100% | -27 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5224 | 4 | 100% | 1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1980 | 4 | 100% | -13 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3536 | 4 | 100% | -9 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXOSCARPIC-27-DIS-20260509 | falling | 184 | 4 | 100% | -16 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 23 | 1 | 25% | -15 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 652 | 4 | 100% | -12 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27MAR-C25-20260509 | falling | 2560 | 4 | 100% | -12 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 2272 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXTIME-26-ZOH-20260509 | falling | 1888 | 4 | 100% | -10 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27JUN-C25-20260509 | falling | 532 | 76 | 76% | -37 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 4824 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 5124 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXTOPARTIST-26B-DRA-20260509 | falling | 2948 | 4 | 100% | -5 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 4028 | 4 | 100% | -4 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXCABOUT-26APR20-TGAB-20260507 | falling | 3732 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27OCT-H0-20260509 | falling | 1708 | 40 | 76% | -23 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3732 | 4 | 100% | 8 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXETH-26MAY0817-B2390-20260508 | rising | 45 | 1 | 25% | -41 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7576 | 4 | 100% | 27 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9148 | 4 | 100% | 10 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 3436 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXINX-26MAY08H1600-B7387-20260508 | rising | 764 | 40 | 76% | -7 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8724 | 4 | 100% | 39 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-28JAN-H0-20260509 | rising | 4122 | 22 | 76% | 6 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1312 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 3732 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3732 | 4 | 100% | 14 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXIPO-26-DISCORD-20260509 | rising | 5020 | 4 | 100% | 3 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 3060 | 10 | 82% | 6 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXLLM1-26MAY09-GOOG-20260508 | rising | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4424 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 276 | 4 | 100% | -5 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27APR-H0-20260508 | rising | 6032 | 4 | 100% | 4 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 2176 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27APR-H0-20260507 | rising | 5932 | 4 | 100% | 9 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1408 | 4 | 100% | -20 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 2280 | 76 | 76% | -17 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXIPO-26-DISCORD-20260507 | sideways | 4924 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXIPO-26-DISCORD-20260508 | sideways | 5020 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXLLM1-26MAY31-A-20260509 | sideways | 7780 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 1708 | 40 | 76% | -27 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXOSCARPIC-27-DIS-20260508 | sideways | 46 | 1 | 25% | -20 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 3928 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 4524 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 4224 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27APR-H0-20260509 | sideways | 6644 | 4 | 100% | 3 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 1672 | 76 | 76% | -23 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 652 | 4 | 100% | -9 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 4224 | 4 | 100% | -4 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 1672 | 76 | 76% | -26 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 2584 | 76 | 76% | -12 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXOSCARACTO-27-TOM-20260507 | sideways | 2368 | 4 | 100% | -7 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXOSCARACTO-27-TOM-20260508 | sideways | 2368 | 4 | 100% | -10 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 840 | 4 | 100% | -25 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1692 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXLLM1-26DEC31-XAI-20260508 | sideways | 556 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 140 | 1 | 25% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 2280 | 76 | 76% | -19 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXLLM1-26MAY31-A-20260507 | sideways | 7780 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 2368 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 1884 | 4 | 100% | -6 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXOSCARACTO-27-TOM-20260509 | sideways | 2464 | 4 | 100% | -6 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 764 | 40 | 76% | -10 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 1884 | 4 | 100% | -8 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXTOPARTIST-26B-DRA-20260508 | sideways | 2556 | 4 | 100% | -7 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1980 | 4 | 100% | -15 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXIPOSPACEX-26JUN01-20260508 | sideways | 936 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXIPOSPACEX-26JUN01-20260509 | sideways | 840 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXLLM1-26MAY31-A-20260508 | sideways | 7676 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1884 | 4 | 100% | 1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 1884 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXLLM1-26DEC31-XAI-20260509 | sideways | 162 | 1 | 25% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 8936 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 2260 | 1 | 25% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 2584 | 76 | 76% | -13 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 2272 | 4 | 100% | -14 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 4336 | 16 | 80% | 5 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 3240 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 2272 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 6340 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 2560 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 2233 | 1 | 25% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 138 | 1 | 25% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXETH-26MAY0817-B2390-20260507 | sideways | 69 | 1 | 25% | -39 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 8932 | 4 | 100% | 7 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 2584 | 76 | 76% | -14 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 276 | 4 | 100% | -5 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 652 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 2272 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 6236 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 2368 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3434 | 4 | 100% | 4 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXTIME-26-ZOH-20260508 | sideways | 1549.04 | 7 | 78% | -8 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXLLM1-26DEC31-XAI-20260507 | sideways | 556 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1408 | 4 | 100% | -19 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 2128 | 76 | 76% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXIPO-26-DISCORD-20260510 | sideways | 5932 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXLLM1-26MAY31-A-20260510 | sideways | 8096 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 1028 | 4 | 100% | -39 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6340 | 4 | 100% | 15 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 5124 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 4224 | 4 | 100% | -4 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 936 | 4 | 100% | -27 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXTIME-26-ZOH-20260510 | sideways | 1596 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXTOPARTIST-26B-DRA-20260507 | sideways | 2153 | 7 | 83% | -6 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1504 | 4 | 100% | -34 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 2155 | 1 | 25% | -5 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 9572 | 4 | 100% | 11 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3928 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5255 | 13 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 3632 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 936 | 4 | 100% | -27 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5224 | 4 | 100% | 1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1980 | 4 | 100% | -13 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3536 | 4 | 100% | -9 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXOSCARPIC-27-DIS-20260509 | falling | 46 | 1 | 25% | -16 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 652 | 4 | 100% | -12 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27MAR-C25-20260509 | falling | 2560 | 4 | 100% | -12 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 2272 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXTIME-26-ZOH-20260509 | falling | 1888 | 4 | 100% | -10 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27JUN-C25-20260509 | falling | 532 | 76 | 76% | -37 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 4824 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 5124 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXTOPARTIST-26B-DRA-20260509 | falling | 2948 | 4 | 100% | -5 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 4028 | 4 | 100% | -4 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXCABOUT-26APR20-TGAB-20260507 | falling | 3732 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27OCT-H0-20260509 | falling | 1708 | 40 | 76% | -23 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3732 | 4 | 100% | 8 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXETH-26MAY0817-B2390-20260508 | rising | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7576 | 4 | 100% | 27 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9148 | 4 | 100% | 10 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 3436 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXINX-26MAY08H1600-B7387-20260508 | rising | 647 | 7 | 76% | -8 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8724 | 4 | 100% | 39 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-28JAN-H0-20260509 | rising | 4122 | 22 | 76% | 6 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1312 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 3732 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3732 | 4 | 100% | 14 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXIPO-26-DISCORD-20260509 | rising | 5020 | 4 | 100% | 3 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 3536 | 4 | 100% | 4 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXLLM1-26MAY09-GOOG-20260508 | rising | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4424 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27APR-H0-20260508 | rising | 6032 | 4 | 100% | 4 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 2176 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27APR-H0-20260507 | rising | 5932 | 4 | 100% | 9 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1408 | 4 | 100% | -20 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 2280 | 76 | 76% | -17 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXIPO-26-DISCORD-20260507 | sideways | 4924 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXIPO-26-DISCORD-20260508 | sideways | 5020 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXLLM1-26MAY31-A-20260509 | sideways | 7780 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 1788 | 4 | 100% | -32 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXOSCARPIC-27-DIS-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 3928 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 4524 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 4224 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27APR-H0-20260509 | sideways | 6644 | 4 | 100% | 3 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 1672 | 76 | 76% | -23 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 652 | 4 | 100% | -9 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 4224 | 4 | 100% | -4 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 1672 | 76 | 76% | -26 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 2584 | 76 | 76% | -12 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXOSCARACTO-27-TOM-20260507 | sideways | 2368 | 4 | 100% | -7 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXOSCARACTO-27-TOM-20260508 | sideways | 2368 | 4 | 100% | -10 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 840 | 4 | 100% | -25 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1692 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXLLM1-26DEC31-XAI-20260508 | sideways | 139 | 1 | 25% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 140 | 1 | 25% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 2280 | 76 | 76% | -19 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXLLM1-26MAY31-A-20260507 | sideways | 7780 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 2368 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 1884 | 4 | 100% | -6 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXOSCARACTO-27-TOM-20260509 | sideways | 2464 | 4 | 100% | -6 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 692 | 22 | 76% | -11 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 1884 | 4 | 100% | -8 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXTOPARTIST-26B-DRA-20260508 | sideways | 2556 | 4 | 100% | -7 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1980 | 4 | 100% | -15 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXIPOSPACEX-26JUN01-20260508 | sideways | 936 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXIPOSPACEX-26JUN01-20260509 | sideways | 840 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXLLM1-26MAY31-A-20260508 | sideways | 7676 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1884 | 4 | 100% | 1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 1884 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXLLM1-26DEC31-XAI-20260509 | sideways | 162 | 1 | 25% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 2234 | 1 | 25% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 2260 | 1 | 25% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 2584 | 76 | 76% | -13 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 2272 | 4 | 100% | -14 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 4336 | 16 | 80% | 5 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 3240 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 2272 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 6340 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 2560 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 2233 | 1 | 25% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 138 | 1 | 25% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXETH-26MAY0817-B2390-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 8932 | 4 | 100% | 7 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 2584 | 76 | 76% | -14 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 652 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 2272 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 6236 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 2368 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3434 | 4 | 100% | 4 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXTIME-26-ZOH-20260508 | sideways | 1980 | 4 | 100% | -8 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXLLM1-26DEC31-XAI-20260507 | sideways | 139 | 1 | 25% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1408 | 4 | 100% | -19 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 2128 | 76 | 76% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXIPO-26-DISCORD-20260510 | sideways | 5932 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXLLM1-26MAY31-A-20260510 | sideways | 8096 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 1028 | 4 | 100% | -39 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6340 | 4 | 100% | 15 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 5124 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 4224 | 4 | 100% | -4 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 936 | 4 | 100% | -27 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXTIME-26-ZOH-20260510 | sideways | 1596 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXTOPARTIST-26B-DRA-20260507 | sideways | 2560 | 4 | 100% | -7 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1504 | 4 | 100% | -34 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 2155 | 1 | 25% | -5 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 9572 | 4 | 100% | 11 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3928 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5021 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 3632 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 936 | 4 | 100% | -27 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5224 | 4 | 100% | 1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1980 | 4 | 100% | -13 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3536 | 4 | 100% | -9 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXOSCARPIC-27-DIS-20260509 | falling | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 652 | 4 | 100% | -12 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27MAR-C25-20260509 | falling | 2560 | 4 | 100% | -12 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 2272 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXTIME-26-ZOH-20260509 | falling | 1888 | 4 | 100% | -10 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27JUN-C25-20260509 | falling | 368 | 4 | 100% | -41 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 4824 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 5124 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXTOPARTIST-26B-DRA-20260509 | falling | 2948 | 4 | 100% | -5 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 4028 | 4 | 100% | -4 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXCABOUT-26APR20-TGAB-20260507 | falling | 3732 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27OCT-H0-20260509 | falling | 1788 | 4 | 100% | -28 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3732 | 4 | 100% | 8 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXETH-26MAY0817-B2390-20260508 | rising | 184 | 2 | 100% | -41 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7576 | 2 | 100% | 27 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9148 | 2 | 100% | 9 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 3438 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXINX-26MAY08H1600-B7387-20260508 | rising | 561 | 51 | 51% | -6 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8726 | 2 | 100% | 39 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-28JAN-H0-20260509 | rising | 2820 | 14 | 52% | 6 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1314 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 3732 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3732 | 2 | 100% | 14 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXIPO-26-DISCORD-20260509 | rising | 3198.26 | 3 | 64% | 3 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 2052 | 7 | 55% | 6 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXLLM1-26MAY09-GOOG-20260508 | rising | 25.7 | 2 | 30% | -13 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4426 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 278 | 2 | 100% | -5 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27APR-H0-20260508 | rising | 6034 | 2 | 100% | 4 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 2176 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27APR-H0-20260507 | rising | 5932 | 2 | 100% | 9 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1410 | 2 | 100% | -20 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 1530 | 51 | 51% | -17 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXIPO-26-DISCORD-20260507 | sideways | 4924 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXIPO-26-DISCORD-20260508 | sideways | 2534.84 | 3 | 50% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXLLM1-26MAY31-A-20260509 | sideways | 7782 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 46 | 1 | 50% | -6 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 1170 | 26 | 52% | -27 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXOSCARPIC-27-DIS-20260508 | sideways | 186 | 2 | 100% | -20 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 3930 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 4524 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 4226 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27APR-H0-20260509 | sideways | 6646 | 2 | 100% | 3 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 1122 | 51 | 51% | -23 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 654 | 2 | 100% | -9 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 2282 | 3 | 54% | -4 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 1122 | 51 | 51% | -26 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 1734 | 51 | 51% | -12 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXOSCARACTO-27-TOM-20260507 | sideways | 2366 | 2 | 100% | -7 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXOSCARACTO-27-TOM-20260508 | sideways | 2366 | 2 | 100% | -10 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 842 | 2 | 100% | -25 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1694 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXLLM1-26DEC31-XAI-20260508 | sideways | 560 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 562 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 1530 | 51 | 51% | -19 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXLLM1-26MAY31-A-20260507 | sideways | 7782 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 2368 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 1886 | 2 | 100% | -6 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXOSCARACTO-27-TOM-20260509 | sideways | 2464 | 2 | 100% | -6 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 561 | 51 | 51% | -9 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 1886 | 2 | 100% | -8 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXTOPARTIST-26B-DRA-20260508 | sideways | 1458 | 5 | 55% | -7 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1982 | 2 | 100% | -15 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXIPOSPACEX-26JUN01-20260508 | sideways | 936 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXIPOSPACEX-26JUN01-20260509 | sideways | 842 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXLLM1-26MAY31-A-20260508 | sideways | 7678 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1886 | 2 | 100% | 1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 1886 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXLLM1-26DEC31-XAI-20260509 | sideways | 652 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 8938 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 9040 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 1734 | 51 | 51% | -13 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 1589 | 3 | 70% | -14 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 2981 | 11 | 55% | 5 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 3242 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 25.66 | 2 | 30% | -12 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 2272 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 6340 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 2562 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 8934 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 556 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXETH-26MAY0817-B2390-20260507 | sideways | 278 | 2 | 100% | -39 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 5295.1 | 5 | 59% | 6 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 1734 | 51 | 51% | -14 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 278 | 2 | 100% | -5 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 654 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 2272 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 6238 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 2368 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3445 | 4 | 100% | 5 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXTIME-26-ZOH-20260508 | sideways | 1118.08 | 4 | 56% | -8 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXLLM1-26DEC31-XAI-20260507 | sideways | 558 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1410 | 2 | 100% | -19 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 1428 | 51 | 51% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXIPO-26-DISCORD-20260510 | sideways | 5932 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXLLM1-26MAY31-A-20260510 | sideways | 8096 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 1030 | 2 | 100% | -39 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6340 | 2 | 100% | 15 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 46 | 1 | 50% | -15 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 5122 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 4226 | 2 | 100% | -4 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 936 | 2 | 100% | -27 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXTIME-26-ZOH-20260510 | sideways | 1598 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXTOPARTIST-26B-DRA-20260507 | sideways | 1688 | 4 | 66% | -7 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1504 | 2 | 100% | -34 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 4310 | 1 | 50% | -5 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 9572 | 2 | 100% | 11 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3930 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5282 | 11 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 3634 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 936 | 2 | 100% | -27 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5226 | 2 | 100% | 1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1982 | 2 | 100% | -13 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3536 | 2 | 100% | -9 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXOSCARPIC-27-DIS-20260509 | falling | 186 | 2 | 100% | -16 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 46 | 1 | 50% | -15 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 654 | 2 | 100% | -12 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27MAR-C25-20260509 | falling | 2562 | 2 | 100% | -12 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 2272 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXTIME-26-ZOH-20260509 | falling | 1350 | 3 | 73% | -10 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27JUN-C25-20260509 | falling | 357 | 51 | 51% | -37 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 4824 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 5124 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXTOPARTIST-26B-DRA-20260509 | falling | 2950 | 2 | 100% | -5 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 4028 | 2 | 100% | -4 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXCABOUT-26APR20-TGAB-20260507 | falling | 3732 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27OCT-H0-20260509 | falling | 1170 | 26 | 52% | -23 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3732 | 2 | 100% | 8 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXETH-26MAY0817-B2390-20260508 | rising | 92 | 1 | 50% | -41 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7576 | 2 | 100% | 27 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9148 | 2 | 100% | 9 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 3438 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXINX-26MAY08H1600-B7387-20260508 | rising | 520 | 26 | 52% | -7 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8726 | 2 | 100% | 39 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-28JAN-H0-20260509 | rising | 2820 | 14 | 52% | 6 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1314 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 3732 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3732 | 2 | 100% | 14 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXIPO-26-DISCORD-20260509 | rising | 4920 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 2052 | 7 | 55% | 6 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXLLM1-26MAY09-GOOG-20260508 | rising | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4426 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 278 | 2 | 100% | -5 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27APR-H0-20260508 | rising | 6034 | 2 | 100% | 4 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 2176 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27APR-H0-20260507 | rising | 5932 | 2 | 100% | 9 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1410 | 2 | 100% | -20 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 1530 | 51 | 51% | -17 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXIPO-26-DISCORD-20260507 | sideways | 4924 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXIPO-26-DISCORD-20260508 | sideways | 5022 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXLLM1-26MAY31-A-20260509 | sideways | 7782 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 1170 | 26 | 52% | -27 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXOSCARPIC-27-DIS-20260508 | sideways | 93 | 1 | 50% | -20 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 3930 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 4524 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 4226 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27APR-H0-20260509 | sideways | 6646 | 2 | 100% | 3 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 1122 | 51 | 51% | -23 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 654 | 2 | 100% | -9 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 2282 | 3 | 54% | -4 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 1122 | 51 | 51% | -26 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 1734 | 51 | 51% | -12 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXOSCARACTO-27-TOM-20260507 | sideways | 2366 | 2 | 100% | -7 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXOSCARACTO-27-TOM-20260508 | sideways | 2366 | 2 | 100% | -10 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 842 | 2 | 100% | -25 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1694 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXLLM1-26DEC31-XAI-20260508 | sideways | 560 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 281 | 1 | 50% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 1530 | 51 | 51% | -19 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXLLM1-26MAY31-A-20260507 | sideways | 7782 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 2368 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 1886 | 2 | 100% | -6 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXOSCARACTO-27-TOM-20260509 | sideways | 2464 | 2 | 100% | -6 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 520 | 26 | 52% | -10 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 1886 | 2 | 100% | -8 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXTOPARTIST-26B-DRA-20260508 | sideways | 1692 | 3 | 65% | -6 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1982 | 2 | 100% | -15 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXIPOSPACEX-26JUN01-20260508 | sideways | 936 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXIPOSPACEX-26JUN01-20260509 | sideways | 842 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXLLM1-26MAY31-A-20260508 | sideways | 7678 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1886 | 2 | 100% | 1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 1886 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXLLM1-26DEC31-XAI-20260509 | sideways | 326 | 1 | 50% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 8938 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 4520 | 1 | 50% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 1734 | 51 | 51% | -13 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 2172 | 2 | 100% | -15 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 2981 | 11 | 55% | 5 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 3242 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 2272 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 6340 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 2562 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 4467 | 1 | 50% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 278 | 1 | 50% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXETH-26MAY0817-B2390-20260507 | sideways | 139 | 1 | 50% | -39 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 8832 | 2 | 100% | 6 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 1734 | 51 | 51% | -14 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 278 | 2 | 100% | -5 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 654 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 2272 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 6238 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 2368 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3437 | 2 | 100% | 4 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXTIME-26-ZOH-20260508 | sideways | 1118.08 | 4 | 56% | -8 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXLLM1-26DEC31-XAI-20260507 | sideways | 558 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1410 | 2 | 100% | -19 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 1428 | 51 | 51% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXIPO-26-DISCORD-20260510 | sideways | 5932 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXLLM1-26MAY31-A-20260510 | sideways | 8096 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 1030 | 2 | 100% | -39 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6340 | 2 | 100% | 15 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 5122 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 4226 | 2 | 100% | -4 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 936 | 2 | 100% | -27 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXTIME-26-ZOH-20260510 | sideways | 1598 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXTOPARTIST-26B-DRA-20260507 | sideways | 1688 | 4 | 66% | -7 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1504 | 2 | 100% | -34 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 4310 | 1 | 50% | -5 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 9572 | 2 | 100% | 11 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3930 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5282 | 11 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 3634 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 936 | 2 | 100% | -27 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5226 | 2 | 100% | 1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1982 | 2 | 100% | -13 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3536 | 2 | 100% | -9 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXOSCARPIC-27-DIS-20260509 | falling | 93 | 1 | 50% | -16 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 654 | 2 | 100% | -12 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27MAR-C25-20260509 | falling | 2562 | 2 | 100% | -12 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 2272 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXTIME-26-ZOH-20260509 | falling | 1790 | 2 | 100% | -11 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27JUN-C25-20260509 | falling | 357 | 51 | 51% | -37 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 4824 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 5124 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXTOPARTIST-26B-DRA-20260509 | falling | 2950 | 2 | 100% | -5 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 4028 | 2 | 100% | -4 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXCABOUT-26APR20-TGAB-20260507 | falling | 3732 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27OCT-H0-20260509 | falling | 1170 | 26 | 52% | -23 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3732 | 2 | 100% | 8 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXETH-26MAY0817-B2390-20260508 | rising | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7576 | 2 | 100% | 27 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9148 | 2 | 100% | 9 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 3438 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXINX-26MAY08H1600-B7387-20260508 | rising | 442 | 4 | 52% | -8 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8726 | 2 | 100% | 39 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-28JAN-H0-20260509 | rising | 2820 | 14 | 52% | 6 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1314 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 3732 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3732 | 2 | 100% | 14 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXIPO-26-DISCORD-20260509 | rising | 4920 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 3536 | 2 | 100% | 4 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXLLM1-26MAY09-GOOG-20260508 | rising | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4426 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27APR-H0-20260508 | rising | 6034 | 2 | 100% | 4 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 2176 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27APR-H0-20260507 | rising | 5932 | 2 | 100% | 9 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1410 | 2 | 100% | -20 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 1530 | 51 | 51% | -17 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXIPO-26-DISCORD-20260507 | sideways | 4924 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXIPO-26-DISCORD-20260508 | sideways | 5022 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXLLM1-26MAY31-A-20260509 | sideways | 7782 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 1790 | 2 | 100% | -32 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXOSCARPIC-27-DIS-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 3930 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 4524 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 4226 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27APR-H0-20260509 | sideways | 6646 | 2 | 100% | 3 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 1122 | 51 | 51% | -23 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 654 | 2 | 100% | -9 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 4226 | 2 | 100% | -4 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 1122 | 51 | 51% | -26 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 1734 | 51 | 51% | -12 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXOSCARACTO-27-TOM-20260507 | sideways | 2366 | 2 | 100% | -7 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXOSCARACTO-27-TOM-20260508 | sideways | 2366 | 2 | 100% | -10 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 842 | 2 | 100% | -25 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1694 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXLLM1-26DEC31-XAI-20260508 | sideways | 280 | 1 | 50% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 281 | 1 | 50% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 1530 | 51 | 51% | -19 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXLLM1-26MAY31-A-20260507 | sideways | 7782 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 2368 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 1886 | 2 | 100% | -6 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXOSCARACTO-27-TOM-20260509 | sideways | 2464 | 2 | 100% | -6 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 472 | 14 | 52% | -11 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 1886 | 2 | 100% | -8 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXTOPARTIST-26B-DRA-20260508 | sideways | 2462 | 2 | 100% | -8 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1982 | 2 | 100% | -15 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXIPOSPACEX-26JUN01-20260508 | sideways | 936 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXIPOSPACEX-26JUN01-20260509 | sideways | 842 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXLLM1-26MAY31-A-20260508 | sideways | 7678 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1886 | 2 | 100% | 1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 1886 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXLLM1-26DEC31-XAI-20260509 | sideways | 326 | 1 | 50% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 4469 | 1 | 50% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 4520 | 1 | 50% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 1734 | 51 | 51% | -13 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 2172 | 2 | 100% | -15 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 2981 | 11 | 55% | 5 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 3242 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 2272 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 6340 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 2562 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 4467 | 1 | 50% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 278 | 1 | 50% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXETH-26MAY0817-B2390-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 8832 | 2 | 100% | 6 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 1734 | 51 | 51% | -14 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 654 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 2272 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 6238 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 2368 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3437 | 2 | 100% | 4 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXTIME-26-ZOH-20260508 | sideways | 1788 | 2 | 100% | -10 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXLLM1-26DEC31-XAI-20260507 | sideways | 279 | 1 | 50% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1410 | 2 | 100% | -19 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 1428 | 51 | 51% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXIPO-26-DISCORD-20260510 | sideways | 5932 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXLLM1-26MAY31-A-20260510 | sideways | 8096 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 1030 | 2 | 100% | -39 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6340 | 2 | 100% | 15 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 5122 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 4226 | 2 | 100% | -4 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 936 | 2 | 100% | -27 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXTIME-26-ZOH-20260510 | sideways | 1598 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXTOPARTIST-26B-DRA-20260507 | sideways | 2464 | 2 | 100% | -8 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1504 | 2 | 100% | -34 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 4310 | 1 | 50% | -5 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 9572 | 2 | 100% | 11 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3930 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5125 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 3634 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 936 | 2 | 100% | -27 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5226 | 2 | 100% | 1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1982 | 2 | 100% | -13 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3536 | 2 | 100% | -9 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXOSCARPIC-27-DIS-20260509 | falling | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 654 | 2 | 100% | -12 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27MAR-C25-20260509 | falling | 2562 | 2 | 100% | -12 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 2272 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXTIME-26-ZOH-20260509 | falling | 1790 | 2 | 100% | -11 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27JUN-C25-20260509 | falling | 370 | 2 | 100% | -41 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 4824 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 5124 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXTOPARTIST-26B-DRA-20260509 | falling | 2950 | 2 | 100% | -5 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 4028 | 2 | 100% | -4 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXCABOUT-26APR20-TGAB-20260507 | falling | 3732 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27OCT-H0-20260509 | falling | 1790 | 2 | 100% | -28 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3732 | 2 | 100% | 8 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXETH-26MAY0817-B2390-20260508 | rising | 185 | 1 | 100% | -41 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7574 | 2 | 100% | 27 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9148 | 1 | 100% | 8 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 3438 | 1 | 100% | 2 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXINX-26MAY08H1600-B7387-20260508 | rising | 1100 | 100 | 100% | -6 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8726 | 1 | 100% | 39 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-28JAN-H0-20260509 | rising | 5425 | 25 | 100% | 6 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1315 | 1 | 100% | -3 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 3634 | 1 | 100% | 1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3733 | 1 | 100% | 14 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXIPO-26-DISCORD-20260509 | rising | 4948.84 | 3 | 100% | 2 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 3733 | 12 | 100% | 7 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXLLM1-26MAY09-GOOG-20260508 | rising | 25.7 | 2 | 30% | -13 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4426 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 279 | 1 | 100% | -5 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27APR-H0-20260508 | rising | 6035 | 1 | 100% | 4 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 2078 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27APR-H0-20260507 | rising | 5933 | 1 | 100% | 9 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1410 | 1 | 100% | -20 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 3000 | 100 | 100% | -17 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXIPO-26-DISCORD-20260507 | sideways | 4824 | 1 | 100% | 1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXIPO-26-DISCORD-20260508 | sideways | 5022.92 | 3 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXLLM1-26MAY31-A-20260509 | sideways | 7783 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 93 | 1 | 100% | -6 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 2250 | 50 | 100% | -27 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXOSCARPIC-27-DIS-20260508 | sideways | 186 | 1 | 100% | -20 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 3930 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 4525 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 4227 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27APR-H0-20260509 | sideways | 6647 | 1 | 100% | 3 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 2200 | 100 | 100% | -23 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 654 | 1 | 100% | -9 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 4226 | 3 | 100% | -4 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 2200 | 100 | 100% | -26 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 3400 | 100 | 100% | -12 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXOSCARACTO-27-TOM-20260507 | sideways | 2269 | 1 | 100% | -8 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXOSCARACTO-27-TOM-20260508 | sideways | 2270 | 1 | 100% | -11 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 842 | 1 | 100% | -25 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1694 | 2 | 100% | 2 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXLLM1-26DEC31-XAI-20260508 | sideways | 562 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 562 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 3000 | 100 | 100% | -19 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXLLM1-26MAY31-A-20260507 | sideways | 7783 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 2368 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 1887 | 1 | 100% | -6 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXOSCARACTO-27-TOM-20260509 | sideways | 2465 | 1 | 100% | -6 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 1100 | 100 | 100% | -9 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 1887 | 1 | 100% | -8 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXTOPARTIST-26B-DRA-20260508 | sideways | 2653 | 7 | 100% | -7 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1983 | 1 | 100% | -15 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXIPOSPACEX-26JUN01-20260508 | sideways | 936 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXIPOSPACEX-26JUN01-20260509 | sideways | 842 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXLLM1-26MAY31-A-20260508 | sideways | 7679 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1889 | 1 | 100% | 1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 1887 | 2 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXLLM1-26DEC31-XAI-20260509 | sideways | 653 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 8939 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 9040 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 3400 | 100 | 100% | -13 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 2270 | 4 | 100% | -14 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 5420 | 20 | 100% | 5 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 3242 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 25.66 | 2 | 30% | -12 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 2272 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 6340 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 2562 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 8934 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 557 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXETH-26MAY0817-B2390-20260507 | sideways | 279 | 1 | 100% | -39 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 8933.000000000002 | 8 | 100% | 6 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 3400 | 100 | 100% | -14 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 279 | 1 | 100% | -5 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 654 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 2272 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 6238 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 2368 | 1 | 100% | -3 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3273 | 3 | 95% | 5 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXTIME-26-ZOH-20260508 | sideways | 1979.9999999999998 | 5 | 100% | -8 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXLLM1-26DEC31-XAI-20260507 | sideways | 559 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1411 | 1 | 100% | -20 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 2800 | 100 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXIPO-26-DISCORD-20260510 | sideways | 5849.869999999999 | 2 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXLLM1-26MAY31-A-20260510 | sideways | 8096 | 1 | 100% | -3 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 1031 | 2 | 100% | -39 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6339 | 2 | 100% | 15 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 93 | 1 | 100% | -15 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 5024 | 1 | 100% | -4 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 4227 | 1 | 100% | -4 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 936 | 1 | 100% | -27 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXTIME-26-ZOH-20260510 | sideways | 1598 | 2 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXTOPARTIST-26B-DRA-20260507 | sideways | 2558 | 6 | 100% | -7 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1505 | 2 | 100% | -34 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 8620 | 1 | 100% | -5 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 9573 | 1 | 100% | 11 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3930 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5326 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 3635 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 936 | 1 | 100% | -27 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5226 | 1 | 100% | 1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1983 | 1 | 100% | -13 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3536 | 1 | 100% | -9 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXOSCARPIC-27-DIS-20260509 | falling | 186 | 1 | 100% | -16 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 93 | 1 | 100% | -15 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 654 | 1 | 100% | -12 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27MAR-C25-20260509 | falling | 2562 | 1 | 100% | -12 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 2272 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXTIME-26-ZOH-20260509 | falling | 1804 | 4 | 100% | -11 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27JUN-C25-20260509 | falling | 700 | 100 | 100% | -37 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 4824 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 5124 | 1 | 100% | -3 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXTOPARTIST-26B-DRA-20260509 | falling | 2950 | 1 | 100% | -5 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 4029 | 1 | 100% | -4 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXCABOUT-26APR20-TGAB-20260507 | falling | 3733 | 1 | 100% | 2 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27OCT-H0-20260509 | falling | 2250 | 50 | 100% | -23 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3733 | 1 | 100% | 8 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXETH-26MAY0817-B2390-20260508 | rising | 185 | 1 | 100% | -41 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7574 | 2 | 100% | 27 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9148 | 1 | 100% | 8 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 3438 | 1 | 100% | 2 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXINX-26MAY08H1600-B7387-20260508 | rising | 1000 | 50 | 100% | -7 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8726 | 1 | 100% | 39 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-28JAN-H0-20260509 | rising | 5425 | 25 | 100% | 6 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1315 | 1 | 100% | -3 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 3634 | 1 | 100% | 1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3733 | 1 | 100% | 14 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXIPO-26-DISCORD-20260509 | rising | 4923 | 1 | 100% | 2 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 3733 | 12 | 100% | 7 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXLLM1-26MAY09-GOOG-20260508 | rising | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4426 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 279 | 1 | 100% | -5 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27APR-H0-20260508 | rising | 6035 | 1 | 100% | 4 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 2078 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27APR-H0-20260507 | rising | 5933 | 1 | 100% | 9 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1410 | 1 | 100% | -20 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 3000 | 100 | 100% | -17 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXIPO-26-DISCORD-20260507 | sideways | 4824 | 1 | 100% | 1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXIPO-26-DISCORD-20260508 | sideways | 5023 | 2 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXLLM1-26MAY31-A-20260509 | sideways | 7783 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 2250 | 50 | 100% | -27 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXOSCARPIC-27-DIS-20260508 | sideways | 186 | 1 | 100% | -20 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 3930 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 4525 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 4227 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27APR-H0-20260509 | sideways | 6647 | 1 | 100% | 3 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 2200 | 100 | 100% | -23 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 654 | 1 | 100% | -9 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 4226 | 3 | 100% | -4 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 2200 | 100 | 100% | -26 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 3400 | 100 | 100% | -12 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXOSCARACTO-27-TOM-20260507 | sideways | 2269 | 1 | 100% | -8 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXOSCARACTO-27-TOM-20260508 | sideways | 2270 | 1 | 100% | -11 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 842 | 1 | 100% | -25 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1697 | 1 | 100% | 2 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXLLM1-26DEC31-XAI-20260508 | sideways | 562 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 562 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 3000 | 100 | 100% | -19 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXLLM1-26MAY31-A-20260507 | sideways | 7783 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 2368 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 1887 | 1 | 100% | -6 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXOSCARACTO-27-TOM-20260509 | sideways | 2465 | 1 | 100% | -6 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 1000 | 50 | 100% | -10 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 1887 | 1 | 100% | -8 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXTOPARTIST-26B-DRA-20260508 | sideways | 2559 | 3 | 100% | -7 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1983 | 1 | 100% | -15 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXIPOSPACEX-26JUN01-20260508 | sideways | 936 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXIPOSPACEX-26JUN01-20260509 | sideways | 842 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXLLM1-26MAY31-A-20260508 | sideways | 7679 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1889 | 1 | 100% | 1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 1887 | 2 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXLLM1-26DEC31-XAI-20260509 | sideways | 653 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 8939 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 9040 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 3400 | 100 | 100% | -13 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 2211 | 2 | 100% | -14 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 5420 | 20 | 100% | 5 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 3242 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 2272 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 6340 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 2562 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 8934 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 557 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXETH-26MAY0817-B2390-20260507 | sideways | 279 | 1 | 100% | -39 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 8831 | 1 | 100% | 7 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 3400 | 100 | 100% | -14 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 279 | 1 | 100% | -5 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 654 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 2272 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 6238 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 2368 | 1 | 100% | -3 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3437 | 1 | 100% | 4 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXTIME-26-ZOH-20260508 | sideways | 1979.9999999999998 | 5 | 100% | -8 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXLLM1-26DEC31-XAI-20260507 | sideways | 559 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1411 | 1 | 100% | -20 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 2800 | 100 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXIPO-26-DISCORD-20260510 | sideways | 5831 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXLLM1-26MAY31-A-20260510 | sideways | 8096 | 1 | 100% | -3 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 1031 | 2 | 100% | -39 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6339 | 2 | 100% | 15 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 5024 | 1 | 100% | -4 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 4227 | 1 | 100% | -4 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 936 | 1 | 100% | -27 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXTIME-26-ZOH-20260510 | sideways | 1598 | 2 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXTOPARTIST-26B-DRA-20260507 | sideways | 2558 | 6 | 100% | -7 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1505 | 2 | 100% | -34 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 8620 | 1 | 100% | -5 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 9573 | 1 | 100% | 11 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3930 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5326 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 3635 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 936 | 1 | 100% | -27 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5226 | 1 | 100% | 1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1983 | 1 | 100% | -13 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3536 | 1 | 100% | -9 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXOSCARPIC-27-DIS-20260509 | falling | 186 | 1 | 100% | -16 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 654 | 1 | 100% | -12 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27MAR-C25-20260509 | falling | 2562 | 1 | 100% | -12 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 2272 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXTIME-26-ZOH-20260509 | falling | 1789 | 2 | 100% | -11 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27JUN-C25-20260509 | falling | 700 | 100 | 100% | -37 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 4824 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 5124 | 1 | 100% | -3 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXTOPARTIST-26B-DRA-20260509 | falling | 2950 | 1 | 100% | -5 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 4029 | 1 | 100% | -4 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXCABOUT-26APR20-TGAB-20260507 | falling | 3733 | 1 | 100% | 2 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27OCT-H0-20260509 | falling | 2250 | 50 | 100% | -23 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3733 | 1 | 100% | 8 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXETH-26MAY0817-B2390-20260508 | rising | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7574 | 2 | 100% | 27 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9148 | 1 | 100% | 8 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 3438 | 1 | 100% | 2 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXINX-26MAY08H1600-B7387-20260508 | rising | 840 | 5 | 100% | -9 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8726 | 1 | 100% | 39 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-28JAN-H0-20260509 | rising | 5425 | 25 | 100% | 6 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1315 | 1 | 100% | -3 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 3634 | 1 | 100% | 1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3733 | 1 | 100% | 14 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXIPO-26-DISCORD-20260509 | rising | 4923 | 1 | 100% | 2 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 3438 | 1 | 100% | 3 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXLLM1-26MAY09-GOOG-20260508 | rising | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4426 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27APR-H0-20260508 | rising | 6035 | 1 | 100% | 4 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 2078 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27APR-H0-20260507 | rising | 5933 | 1 | 100% | 9 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1410 | 1 | 100% | -20 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 3000 | 100 | 100% | -17 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXIPO-26-DISCORD-20260507 | sideways | 4824 | 1 | 100% | 1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXIPO-26-DISCORD-20260508 | sideways | 4923 | 1 | 100% | -3 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXLLM1-26MAY31-A-20260509 | sideways | 7783 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 1791 | 1 | 100% | -32 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXOSCARPIC-27-DIS-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 3930 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 4525 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 4227 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27APR-H0-20260509 | sideways | 6647 | 1 | 100% | 3 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 2200 | 100 | 100% | -23 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 654 | 1 | 100% | -9 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 4029 | 1 | 100% | -6 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 2200 | 100 | 100% | -26 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 3400 | 100 | 100% | -12 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXOSCARACTO-27-TOM-20260507 | sideways | 2269 | 1 | 100% | -8 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXOSCARACTO-27-TOM-20260508 | sideways | 2270 | 1 | 100% | -11 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 842 | 1 | 100% | -25 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1697 | 1 | 100% | 2 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXLLM1-26DEC31-XAI-20260508 | sideways | 562 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 562 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 3000 | 100 | 100% | -19 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXLLM1-26MAY31-A-20260507 | sideways | 7783 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 2368 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 1887 | 1 | 100% | -6 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXOSCARACTO-27-TOM-20260509 | sideways | 2465 | 1 | 100% | -6 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 900 | 25 | 100% | -11 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 1887 | 1 | 100% | -8 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXTOPARTIST-26B-DRA-20260508 | sideways | 2465 | 1 | 100% | -8 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1983 | 1 | 100% | -15 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXIPOSPACEX-26JUN01-20260508 | sideways | 936 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXIPOSPACEX-26JUN01-20260509 | sideways | 842 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXLLM1-26MAY31-A-20260508 | sideways | 7679 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1889 | 1 | 100% | 1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 1791 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXLLM1-26DEC31-XAI-20260509 | sideways | 653 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 8939 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 9040 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 3400 | 100 | 100% | -13 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 2077 | 1 | 100% | -16 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 5420 | 20 | 100% | 5 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 3242 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 2272 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 6340 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 2562 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 8934 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 557 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXETH-26MAY0817-B2390-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 8831 | 1 | 100% | 7 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 3400 | 100 | 100% | -14 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 654 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 2272 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 6238 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 2368 | 1 | 100% | -3 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3437 | 1 | 100% | 4 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXTIME-26-ZOH-20260508 | sideways | 1694 | 1 | 100% | -11 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXLLM1-26DEC31-XAI-20260507 | sideways | 559 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1411 | 1 | 100% | -20 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 2800 | 100 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXIPO-26-DISCORD-20260510 | sideways | 5831 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXLLM1-26MAY31-A-20260510 | sideways | 8096 | 1 | 100% | -3 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 1031 | 2 | 100% | -39 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6339 | 2 | 100% | 15 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 5024 | 1 | 100% | -4 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 4227 | 1 | 100% | -4 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 936 | 1 | 100% | -27 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXTIME-26-ZOH-20260510 | sideways | 1503 | 1 | 100% | -3 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXTOPARTIST-26B-DRA-20260507 | sideways | 2367 | 1 | 100% | -9 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1505 | 2 | 100% | -34 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 8620 | 1 | 100% | -5 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 9573 | 1 | 100% | 11 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3930 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5326 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 3635 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 936 | 1 | 100% | -27 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5226 | 1 | 100% | 1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1983 | 1 | 100% | -13 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3536 | 1 | 100% | -9 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXOSCARPIC-27-DIS-20260509 | falling | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 0 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 654 | 1 | 100% | -12 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27MAR-C25-20260509 | falling | 2562 | 1 | 100% | -12 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 2272 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXTIME-26-ZOH-20260509 | falling | 1694 | 1 | 100% | -12 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27JUN-C25-20260509 | falling | 372 | 1 | 100% | -41 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 4824 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 5124 | 1 | 100% | -3 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXTOPARTIST-26B-DRA-20260509 | falling | 2950 | 1 | 100% | -5 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 4029 | 1 | 100% | -4 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXCABOUT-26APR20-TGAB-20260507 | falling | 3733 | 1 | 100% | 2 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27OCT-H0-20260509 | falling | 1791 | 1 | 100% | -28 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3733 | 1 | 100% | 8 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXETH-26MAY0817-B2390-20260508 | rising | 184 | 2 | 100% | -41 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7576 | 2 | 100% | 27 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9148 | 2 | 100% | 9 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 3438 | 2 | 100% | 2 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXINX-26MAY08H1600-B7387-20260508 | rising | 1100 | 100 | 100% | -6 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8726 | 2 | 100% | 39 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-28JAN-H0-20260509 | rising | 5424 | 26 | 100% | 6 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1314 | 2 | 100% | -3 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 3732 | 2 | 100% | 2 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3732 | 2 | 100% | 14 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXIPO-26-DISCORD-20260509 | rising | 4948.84 | 4 | 100% | 3 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 3732 | 12 | 100% | 6 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXLLM1-26MAY09-GOOG-20260508 | rising | 86 | 8 | 100% | -13 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4426 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 278 | 2 | 100% | -5 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27APR-H0-20260508 | rising | 6034 | 2 | 100% | 4 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 2176 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27APR-H0-20260507 | rising | 5932 | 2 | 100% | 9 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1410 | 2 | 100% | -20 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 3000 | 100 | 100% | -17 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXIPO-26-DISCORD-20260507 | sideways | 4924 | 2 | 100% | 2 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXIPO-26-DISCORD-20260508 | sideways | 5022.92 | 4 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXLLM1-26MAY31-A-20260509 | sideways | 7782 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 92 | 2 | 100% | -6 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 2250 | 50 | 100% | -27 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXOSCARPIC-27-DIS-20260508 | sideways | 186 | 2 | 100% | -20 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 3930 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 4524 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 4226 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27APR-H0-20260509 | sideways | 6646 | 2 | 100% | 3 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 2200 | 100 | 100% | -23 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 654 | 2 | 100% | -9 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 4226 | 4 | 100% | -4 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 2200 | 100 | 100% | -26 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 3400 | 100 | 100% | -12 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXOSCARACTO-27-TOM-20260507 | sideways | 2366 | 2 | 100% | -7 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXOSCARACTO-27-TOM-20260508 | sideways | 2366 | 2 | 100% | -10 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 842 | 2 | 100% | -25 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1694 | 2 | 100% | 2 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXLLM1-26DEC31-XAI-20260508 | sideways | 560 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 562 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 3000 | 100 | 100% | -19 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXLLM1-26MAY31-A-20260507 | sideways | 7782 | 2 | 100% | -2 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 2368 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 1886 | 2 | 100% | -6 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXOSCARACTO-27-TOM-20260509 | sideways | 2464 | 2 | 100% | -6 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 1100 | 100 | 100% | -9 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 1886 | 2 | 100% | -8 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXTOPARTIST-26B-DRA-20260508 | sideways | 2652 | 8 | 100% | -7 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1982 | 2 | 100% | -15 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXIPOSPACEX-26JUN01-20260508 | sideways | 936 | 2 | 100% | -2 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXIPOSPACEX-26JUN01-20260509 | sideways | 842 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXLLM1-26MAY31-A-20260508 | sideways | 7678 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1886 | 2 | 100% | 1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 1886 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXLLM1-26DEC31-XAI-20260509 | sideways | 652 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 8938 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 9040 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 3400 | 100 | 100% | -13 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 2270 | 4 | 100% | -14 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 5420 | 20 | 100% | 5 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 3242 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 86.00000000000001 | 8 | 100% | -12 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 2272 | 2 | 100% | -2 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 6340 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 2562 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 8934 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 556 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXETH-26MAY0817-B2390-20260507 | sideways | 278 | 2 | 100% | -39 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 8932 | 8 | 100% | 6 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 3400 | 100 | 100% | -14 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 278 | 2 | 100% | -5 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 654 | 2 | 100% | -2 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 2272 | 2 | 100% | -2 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 6238 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 2368 | 2 | 100% | -3 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3483 | 12 | 100% | 5 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXTIME-26-ZOH-20260508 | sideways | 1980 | 6 | 100% | -8 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXLLM1-26DEC31-XAI-20260507 | sideways | 558 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1410 | 2 | 100% | -19 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 2800 | 100 | 100% | -2 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXIPO-26-DISCORD-20260510 | sideways | 5932 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXLLM1-26MAY31-A-20260510 | sideways | 8096 | 2 | 100% | -3 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 1030 | 2 | 100% | -39 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6340 | 2 | 100% | 15 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 92 | 2 | 100% | -15 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 5122 | 2 | 100% | -3 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 4226 | 2 | 100% | -4 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 936 | 2 | 100% | -27 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXTIME-26-ZOH-20260510 | sideways | 1598 | 2 | 100% | -2 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXTOPARTIST-26B-DRA-20260507 | sideways | 2558 | 6 | 100% | -7 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1504 | 2 | 100% | -34 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 8620 | 2 | 100% | -5 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 9572 | 2 | 100% | 11 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3930 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5282 | 11 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 3634 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 936 | 2 | 100% | -27 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5226 | 2 | 100% | 1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1982 | 2 | 100% | -13 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3536 | 2 | 100% | -9 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXOSCARPIC-27-DIS-20260509 | falling | 186 | 2 | 100% | -16 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 92 | 2 | 100% | -15 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 654 | 2 | 100% | -12 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27MAR-C25-20260509 | falling | 2562 | 2 | 100% | -12 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 2272 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXTIME-26-ZOH-20260509 | falling | 1832 | 4 | 100% | -10 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27JUN-C25-20260509 | falling | 700 | 100 | 100% | -37 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 4824 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 5124 | 2 | 100% | -3 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXTOPARTIST-26B-DRA-20260509 | falling | 2950 | 2 | 100% | -5 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 4028 | 2 | 100% | -4 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXCABOUT-26APR20-TGAB-20260507 | falling | 3732 | 2 | 100% | 2 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27OCT-H0-20260509 | falling | 2250 | 50 | 100% | -23 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3732 | 2 | 100% | 8 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXETH-26MAY0817-B2390-20260508 | rising | 184 | 2 | 100% | -41 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7576 | 2 | 100% | 27 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9148 | 2 | 100% | 9 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 3438 | 2 | 100% | 2 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXINX-26MAY08H1600-B7387-20260508 | rising | 1100 | 100 | 100% | -6 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8726 | 2 | 100% | 39 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-28JAN-H0-20260509 | rising | 5424 | 26 | 100% | 6 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1314 | 2 | 100% | -3 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 3732 | 2 | 100% | 2 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3732 | 2 | 100% | 14 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXIPO-26-DISCORD-20260509 | rising | 4948.84 | 4 | 100% | 3 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 3732 | 12 | 100% | 6 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXLLM1-26MAY09-GOOG-20260508 | rising | 86 | 8 | 100% | -13 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4426 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 278 | 2 | 100% | -5 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27APR-H0-20260508 | rising | 6034 | 2 | 100% | 4 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 2176 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27APR-H0-20260507 | rising | 5932 | 2 | 100% | 9 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1410 | 2 | 100% | -20 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 3000 | 100 | 100% | -17 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXIPO-26-DISCORD-20260507 | sideways | 4924 | 2 | 100% | 2 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXIPO-26-DISCORD-20260508 | sideways | 5022.92 | 4 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXLLM1-26MAY31-A-20260509 | sideways | 7782 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 92 | 2 | 100% | -6 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 2250 | 50 | 100% | -27 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXOSCARPIC-27-DIS-20260508 | sideways | 186 | 2 | 100% | -20 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 3930 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 4524 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 4226 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27APR-H0-20260509 | sideways | 6646 | 2 | 100% | 3 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 2200 | 100 | 100% | -23 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 654 | 2 | 100% | -9 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 4226 | 4 | 100% | -4 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 2200 | 100 | 100% | -26 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 3400 | 100 | 100% | -12 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXOSCARACTO-27-TOM-20260507 | sideways | 2366 | 2 | 100% | -7 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXOSCARACTO-27-TOM-20260508 | sideways | 2366 | 2 | 100% | -10 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 842 | 2 | 100% | -25 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1694 | 2 | 100% | 2 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXLLM1-26DEC31-XAI-20260508 | sideways | 560 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 562 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 3000 | 100 | 100% | -19 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXLLM1-26MAY31-A-20260507 | sideways | 7782 | 2 | 100% | -2 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 2368 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 1886 | 2 | 100% | -6 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXOSCARACTO-27-TOM-20260509 | sideways | 2464 | 2 | 100% | -6 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 1100 | 100 | 100% | -9 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 1886 | 2 | 100% | -8 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXTOPARTIST-26B-DRA-20260508 | sideways | 2652 | 8 | 100% | -7 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1982 | 2 | 100% | -15 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXIPOSPACEX-26JUN01-20260508 | sideways | 936 | 2 | 100% | -2 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXIPOSPACEX-26JUN01-20260509 | sideways | 842 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXLLM1-26MAY31-A-20260508 | sideways | 7678 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1886 | 2 | 100% | 1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 1886 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXLLM1-26DEC31-XAI-20260509 | sideways | 652 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 8938 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 9040 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 3400 | 100 | 100% | -13 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 2270 | 4 | 100% | -14 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 5420 | 20 | 100% | 5 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 3242 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 86.00000000000001 | 8 | 100% | -12 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 2272 | 2 | 100% | -2 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 6340 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 2562 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 8934 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 556 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXETH-26MAY0817-B2390-20260507 | sideways | 278 | 2 | 100% | -39 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 8932 | 8 | 100% | 6 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 3400 | 100 | 100% | -14 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 278 | 2 | 100% | -5 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 654 | 2 | 100% | -2 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 2272 | 2 | 100% | -2 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 6238 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 2368 | 2 | 100% | -3 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3483 | 12 | 100% | 5 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXTIME-26-ZOH-20260508 | sideways | 1980 | 6 | 100% | -8 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXLLM1-26DEC31-XAI-20260507 | sideways | 558 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1410 | 2 | 100% | -19 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 2800 | 100 | 100% | -2 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXIPO-26-DISCORD-20260510 | sideways | 5932 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXLLM1-26MAY31-A-20260510 | sideways | 8096 | 2 | 100% | -3 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 1030 | 2 | 100% | -39 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6340 | 2 | 100% | 15 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 92 | 2 | 100% | -15 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 5122 | 2 | 100% | -3 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 4226 | 2 | 100% | -4 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 936 | 2 | 100% | -27 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXTIME-26-ZOH-20260510 | sideways | 1598 | 2 | 100% | -2 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXTOPARTIST-26B-DRA-20260507 | sideways | 2558 | 6 | 100% | -7 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1504 | 2 | 100% | -34 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 8620 | 2 | 100% | -5 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 9572 | 2 | 100% | 11 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3930 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5282 | 11 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 3634 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 936 | 2 | 100% | -27 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5226 | 2 | 100% | 1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1982 | 2 | 100% | -13 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3536 | 2 | 100% | -9 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXOSCARPIC-27-DIS-20260509 | falling | 186 | 2 | 100% | -16 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 92 | 2 | 100% | -15 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 654 | 2 | 100% | -12 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27MAR-C25-20260509 | falling | 2562 | 2 | 100% | -12 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 2272 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXTIME-26-ZOH-20260509 | falling | 1832 | 4 | 100% | -10 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27JUN-C25-20260509 | falling | 700 | 100 | 100% | -37 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 4824 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 5124 | 2 | 100% | -3 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXTOPARTIST-26B-DRA-20260509 | falling | 2950 | 2 | 100% | -5 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 4028 | 2 | 100% | -4 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXCABOUT-26APR20-TGAB-20260507 | falling | 3732 | 2 | 100% | 2 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27OCT-H0-20260509 | falling | 2250 | 50 | 100% | -23 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3732 | 2 | 100% | 8 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXETH-26MAY0817-B2390-20260508 | rising | 180 | 5 | 100% | -41 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7575 | 5 | 100% | 27 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9145 | 5 | 100% | 10 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 3435 | 5 | 100% | 2 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXINX-26MAY08H1600-B7387-20260508 | rising | 1100 | 100 | 100% | -6 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8725 | 5 | 100% | 39 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-28JAN-H0-20260509 | rising | 5425 | 25 | 100% | 6 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1315 | 5 | 100% | -3 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 3730 | 5 | 100% | 2 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3730 | 5 | 100% | 14 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXIPO-26-DISCORD-20260509 | rising | 5020 | 5 | 100% | 3 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 3730 | 15 | 100% | 6 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXLLM1-26MAY09-GOOG-20260508 | rising | 85 | 10 | 100% | -13 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4425 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 275 | 5 | 100% | -5 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27APR-H0-20260508 | rising | 6035 | 5 | 100% | 4 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 2175 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27APR-H0-20260507 | rising | 5930 | 5 | 100% | 9 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1410 | 5 | 100% | -20 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 3000 | 100 | 100% | -17 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXIPO-26-DISCORD-20260507 | sideways | 4944 | 5 | 100% | 1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXIPO-26-DISCORD-20260508 | sideways | 5020 | 5 | 100% | -2 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXLLM1-26MAY31-A-20260509 | sideways | 7780 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 90 | 5 | 100% | -6 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 2250 | 50 | 100% | -27 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXOSCARPIC-27-DIS-20260508 | sideways | 185 | 5 | 100% | -20 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 3930 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 4525 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 4224 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27APR-H0-20260509 | sideways | 6645 | 5 | 100% | 3 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 2200 | 100 | 100% | -23 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 650 | 5 | 100% | -9 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 4225 | 5 | 100% | -4 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 2200 | 100 | 100% | -26 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 3400 | 100 | 100% | -12 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXOSCARACTO-27-TOM-20260507 | sideways | 2365 | 5 | 100% | -7 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXOSCARACTO-27-TOM-20260508 | sideways | 2365 | 5 | 100% | -10 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 840 | 5 | 100% | -25 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1790 | 5 | 100% | 3 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXLLM1-26DEC31-XAI-20260508 | sideways | 555 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 560 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 3000 | 100 | 100% | -19 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXLLM1-26MAY31-A-20260507 | sideways | 7780 | 5 | 100% | -2 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 2365 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 1885 | 5 | 100% | -6 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXOSCARACTO-27-TOM-20260509 | sideways | 2465 | 5 | 100% | -6 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 1100 | 100 | 100% | -9 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 1885 | 5 | 100% | -8 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXTOPARTIST-26B-DRA-20260508 | sideways | 2650 | 10 | 100% | -7 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1980 | 5 | 100% | -15 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXIPOSPACEX-26JUN01-20260508 | sideways | 935 | 5 | 100% | -2 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXIPOSPACEX-26JUN01-20260509 | sideways | 840 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXLLM1-26MAY31-A-20260508 | sideways | 7675 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1885 | 5 | 100% | 1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 1885 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXLLM1-26DEC31-XAI-20260509 | sideways | 650 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 8935 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 9040 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 3400 | 100 | 100% | -13 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 2270 | 5 | 100% | -14 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 5420 | 20 | 100% | 5 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 3240 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 85 | 10 | 100% | -12 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 2270 | 5 | 100% | -2 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 6340 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 2560 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 8930 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 550 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXETH-26MAY0817-B2390-20260507 | sideways | 275 | 5 | 100% | -39 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 8930 | 10 | 100% | 6 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 3400 | 100 | 100% | -14 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 275 | 5 | 100% | -5 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 650 | 5 | 100% | -2 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 2270 | 5 | 100% | -2 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 6235 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 2365 | 5 | 100% | -3 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3490 | 15 | 100% | 5 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXTIME-26-ZOH-20260508 | sideways | 1980 | 5 | 100% | -8 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXLLM1-26DEC31-XAI-20260507 | sideways | 555 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1410 | 5 | 100% | -19 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 2800 | 100 | 100% | -2 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXIPO-26-DISCORD-20260510 | sideways | 5930 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXLLM1-26MAY31-A-20260510 | sideways | 8095 | 5 | 100% | -3 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 1030 | 5 | 100% | -39 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6340 | 5 | 100% | 15 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 90 | 5 | 100% | -15 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 5125 | 5 | 100% | -3 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 4225 | 5 | 100% | -4 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 935 | 5 | 100% | -27 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXTIME-26-ZOH-20260510 | sideways | 1695 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXTOPARTIST-26B-DRA-20260507 | sideways | 2570 | 10 | 100% | -6 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1505 | 5 | 100% | -34 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 8620 | 5 | 100% | -5 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 9570 | 5 | 100% | 11 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3910 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5265 | 35 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 3635 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 935 | 5 | 100% | -27 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5225 | 5 | 100% | 1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1980 | 5 | 100% | -13 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3535 | 5 | 100% | -9 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXOSCARPIC-27-DIS-20260509 | falling | 185 | 5 | 100% | -16 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 90 | 5 | 100% | -15 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 650 | 5 | 100% | -12 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27MAR-C25-20260509 | falling | 2560 | 5 | 100% | -12 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 2270 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXTIME-26-ZOH-20260509 | falling | 1885 | 5 | 100% | -10 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27JUN-C25-20260509 | falling | 700 | 100 | 100% | -37 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 4825 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 5125 | 5 | 100% | -3 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXTOPARTIST-26B-DRA-20260509 | falling | 2950 | 5 | 100% | -5 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 4025 | 5 | 100% | -4 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXCABOUT-26APR20-TGAB-20260507 | falling | 3730 | 5 | 100% | 2 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27OCT-H0-20260509 | falling | 2250 | 50 | 100% | -23 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3730 | 5 | 100% | 8 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXETH-26MAY0817-B2390-20260508 | rising | 180 | 5 | 100% | -41 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7575 | 5 | 100% | 27 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9145 | 5 | 100% | 10 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 3435 | 5 | 100% | 2 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXINX-26MAY08H1600-B7387-20260508 | rising | 1100 | 100 | 100% | -6 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8725 | 5 | 100% | 39 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-28JAN-H0-20260509 | rising | 5425 | 25 | 100% | 6 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1315 | 5 | 100% | -3 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 3730 | 5 | 100% | 2 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3730 | 5 | 100% | 14 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXIPO-26-DISCORD-20260509 | rising | 5020 | 5 | 100% | 3 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 3730 | 15 | 100% | 6 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXLLM1-26MAY09-GOOG-20260508 | rising | 85 | 10 | 100% | -13 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4425 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 275 | 5 | 100% | -5 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27APR-H0-20260508 | rising | 6035 | 5 | 100% | 4 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 2175 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27APR-H0-20260507 | rising | 5930 | 5 | 100% | 9 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1410 | 5 | 100% | -20 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 3000 | 100 | 100% | -17 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXIPO-26-DISCORD-20260507 | sideways | 4944 | 5 | 100% | 1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXIPO-26-DISCORD-20260508 | sideways | 5020 | 5 | 100% | -2 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXLLM1-26MAY31-A-20260509 | sideways | 7780 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 90 | 5 | 100% | -6 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 2250 | 50 | 100% | -27 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXOSCARPIC-27-DIS-20260508 | sideways | 185 | 5 | 100% | -20 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 3930 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 4525 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 4224 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27APR-H0-20260509 | sideways | 6645 | 5 | 100% | 3 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 2200 | 100 | 100% | -23 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 650 | 5 | 100% | -9 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 4225 | 5 | 100% | -4 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 2200 | 100 | 100% | -26 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 3400 | 100 | 100% | -12 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXOSCARACTO-27-TOM-20260507 | sideways | 2365 | 5 | 100% | -7 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXOSCARACTO-27-TOM-20260508 | sideways | 2365 | 5 | 100% | -10 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 840 | 5 | 100% | -25 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1790 | 5 | 100% | 3 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXLLM1-26DEC31-XAI-20260508 | sideways | 555 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 560 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 3000 | 100 | 100% | -19 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXLLM1-26MAY31-A-20260507 | sideways | 7780 | 5 | 100% | -2 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 2365 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 1885 | 5 | 100% | -6 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXOSCARACTO-27-TOM-20260509 | sideways | 2465 | 5 | 100% | -6 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 1100 | 100 | 100% | -9 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 1885 | 5 | 100% | -8 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXTOPARTIST-26B-DRA-20260508 | sideways | 2650 | 10 | 100% | -7 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1980 | 5 | 100% | -15 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXIPOSPACEX-26JUN01-20260508 | sideways | 935 | 5 | 100% | -2 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXIPOSPACEX-26JUN01-20260509 | sideways | 840 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXLLM1-26MAY31-A-20260508 | sideways | 7675 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1885 | 5 | 100% | 1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 1885 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXLLM1-26DEC31-XAI-20260509 | sideways | 650 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 8935 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 9040 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 3400 | 100 | 100% | -13 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 2270 | 5 | 100% | -14 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 5420 | 20 | 100% | 5 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 3240 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 85 | 10 | 100% | -12 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 2270 | 5 | 100% | -2 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 6340 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 2560 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 8930 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 550 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXETH-26MAY0817-B2390-20260507 | sideways | 275 | 5 | 100% | -39 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 8930 | 10 | 100% | 6 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 3400 | 100 | 100% | -14 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 275 | 5 | 100% | -5 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 650 | 5 | 100% | -2 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 2270 | 5 | 100% | -2 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 6235 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 2365 | 5 | 100% | -3 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3490 | 15 | 100% | 5 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXTIME-26-ZOH-20260508 | sideways | 1980 | 5 | 100% | -8 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXLLM1-26DEC31-XAI-20260507 | sideways | 555 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1410 | 5 | 100% | -19 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 2800 | 100 | 100% | -2 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXIPO-26-DISCORD-20260510 | sideways | 5930 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXLLM1-26MAY31-A-20260510 | sideways | 8095 | 5 | 100% | -3 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 1030 | 5 | 100% | -39 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6340 | 5 | 100% | 15 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 90 | 5 | 100% | -15 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 5125 | 5 | 100% | -3 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 4225 | 5 | 100% | -4 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 935 | 5 | 100% | -27 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXTIME-26-ZOH-20260510 | sideways | 1695 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXTOPARTIST-26B-DRA-20260507 | sideways | 2570 | 10 | 100% | -6 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1505 | 5 | 100% | -34 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 8620 | 5 | 100% | -5 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 9570 | 5 | 100% | 11 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3910 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5265 | 35 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 3635 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 935 | 5 | 100% | -27 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5225 | 5 | 100% | 1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1980 | 5 | 100% | -13 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3535 | 5 | 100% | -9 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXOSCARPIC-27-DIS-20260509 | falling | 185 | 5 | 100% | -16 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 90 | 5 | 100% | -15 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 650 | 5 | 100% | -12 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27MAR-C25-20260509 | falling | 2560 | 5 | 100% | -12 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 2270 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXTIME-26-ZOH-20260509 | falling | 1885 | 5 | 100% | -10 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27JUN-C25-20260509 | falling | 700 | 100 | 100% | -37 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 4825 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 5125 | 5 | 100% | -3 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXTOPARTIST-26B-DRA-20260509 | falling | 2950 | 5 | 100% | -5 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 4025 | 5 | 100% | -4 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXCABOUT-26APR20-TGAB-20260507 | falling | 3730 | 5 | 100% | 2 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27OCT-H0-20260509 | falling | 2250 | 50 | 100% | -23 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3730 | 5 | 100% | 8 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXETH-26MAY0817-B2390-20260508 | rising | 180 | 10 | 100% | -41 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7570 | 10 | 100% | 27 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9140 | 10 | 100% | 12 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 3430 | 10 | 100% | 1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXINX-26MAY08H1600-B7387-20260508 | rising | 1100 | 100 | 100% | -6 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8720 | 10 | 100% | 39 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-28JAN-H0-20260509 | rising | 5420 | 30 | 100% | 6 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1340 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 3730 | 10 | 100% | 2 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3730 | 10 | 100% | 13 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXIPO-26-DISCORD-20260509 | rising | 5020 | 10 | 100% | 3 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 3730 | 20 | 100% | 7 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXLLM1-26MAY09-GOOG-20260508 | rising | 90 | 10 | 100% | -13 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4420 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 270 | 10 | 100% | -6 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27APR-H0-20260508 | rising | 6030 | 10 | 100% | 4 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 2170 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27APR-H0-20260507 | rising | 5930 | 10 | 100% | 9 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1410 | 10 | 100% | -20 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 3000 | 100 | 100% | -17 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXIPO-26-DISCORD-20260507 | sideways | 5034 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXIPO-26-DISCORD-20260508 | sideways | 5110 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXLLM1-26MAY31-A-20260509 | sideways | 7780 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 90 | 10 | 100% | -6 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 2250 | 50 | 100% | -27 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXOSCARPIC-27-DIS-20260508 | sideways | 180 | 10 | 100% | -20 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 3930 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 4540 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 4276 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27APR-H0-20260509 | sideways | 6640 | 10 | 100% | 3 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 2200 | 100 | 100% | -23 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 650 | 10 | 100% | -9 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 4220 | 10 | 100% | -4 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 2200 | 100 | 100% | -26 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 3400 | 100 | 100% | -12 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXOSCARACTO-27-TOM-20260507 | sideways | 2360 | 10 | 100% | -7 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXOSCARACTO-27-TOM-20260508 | sideways | 2360 | 10 | 100% | -10 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 840 | 10 | 100% | -25 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1790 | 10 | 100% | 3 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXLLM1-26DEC31-XAI-20260508 | sideways | 550 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 560 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 3000 | 100 | 100% | -19 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXLLM1-26MAY31-A-20260507 | sideways | 7780 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 2360 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 1880 | 10 | 100% | -6 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXOSCARACTO-27-TOM-20260509 | sideways | 2460 | 10 | 100% | -6 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 1100 | 100 | 100% | -9 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 1880 | 10 | 100% | -8 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXTOPARTIST-26B-DRA-20260508 | sideways | 2650 | 10 | 100% | -7 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1980 | 10 | 100% | -15 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXIPOSPACEX-26JUN01-20260508 | sideways | 930 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXIPOSPACEX-26JUN01-20260509 | sideways | 840 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXLLM1-26MAY31-A-20260508 | sideways | 7670 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1880 | 10 | 100% | 1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 1880 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXLLM1-26DEC31-XAI-20260509 | sideways | 640 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 8930 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 9040 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 3400 | 100 | 100% | -13 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 2270 | 10 | 100% | -14 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 5420 | 20 | 100% | 5 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 3240 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 90 | 10 | 100% | -12 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 2270 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 6340 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 2560 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 8930 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 540 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXETH-26MAY0817-B2390-20260507 | sideways | 270 | 10 | 100% | -39 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 8960 | 13 | 100% | 7 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 3400 | 100 | 100% | -14 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 270 | 10 | 100% | -5 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 650 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 2270 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 6230 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 2360 | 10 | 100% | -3 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3502 | 19 | 100% | 5 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXTIME-26-ZOH-20260508 | sideways | 1980 | 10 | 100% | -8 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXLLM1-26DEC31-XAI-20260507 | sideways | 550 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1410 | 10 | 100% | -19 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 2800 | 100 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXIPO-26-DISCORD-20260510 | sideways | 5930 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXLLM1-26MAY31-A-20260510 | sideways | 8190 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 1030 | 10 | 100% | -39 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6340 | 10 | 100% | 15 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 90 | 10 | 100% | -15 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 5120 | 10 | 100% | -3 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 4220 | 10 | 100% | -4 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 930 | 10 | 100% | -27 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXTIME-26-ZOH-20260510 | sideways | 1690 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXTOPARTIST-26B-DRA-20260507 | sideways | 2650 | 10 | 100% | -6 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1500 | 10 | 100% | -34 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 8620 | 10 | 100% | -5 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 9570 | 10 | 100% | 11 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3870 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5266 | 55 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 3630 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 930 | 10 | 100% | -27 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5220 | 10 | 100% | 2 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1980 | 10 | 100% | -15 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3530 | 10 | 100% | -9 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXOSCARPIC-27-DIS-20260509 | falling | 180 | 10 | 100% | -16 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 90 | 10 | 100% | -15 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 650 | 10 | 100% | -12 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27MAR-C25-20260509 | falling | 2560 | 10 | 100% | -12 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 2270 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXTIME-26-ZOH-20260509 | falling | 1880 | 10 | 100% | -10 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27JUN-C25-20260509 | falling | 700 | 100 | 100% | -37 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 4820 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 5120 | 10 | 100% | -3 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXTOPARTIST-26B-DRA-20260509 | falling | 2950 | 10 | 100% | -5 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 4020 | 10 | 100% | -4 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXCABOUT-26APR20-TGAB-20260507 | falling | 3730 | 10 | 100% | 2 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27OCT-H0-20260509 | falling | 2250 | 50 | 100% | -23 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3730 | 10 | 100% | 8 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXETH-26MAY0817-B2390-20260508 | rising | 180 | 10 | 100% | -41 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7570 | 10 | 100% | 27 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9140 | 10 | 100% | 12 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 3430 | 10 | 100% | 1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXINX-26MAY08H1600-B7387-20260508 | rising | 1100 | 100 | 100% | -6 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8720 | 10 | 100% | 39 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-28JAN-H0-20260509 | rising | 5420 | 30 | 100% | 6 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1340 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 3730 | 10 | 100% | 2 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3730 | 10 | 100% | 13 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXIPO-26-DISCORD-20260509 | rising | 5020 | 10 | 100% | 3 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 3730 | 20 | 100% | 7 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXLLM1-26MAY09-GOOG-20260508 | rising | 90 | 10 | 100% | -13 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4420 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 270 | 10 | 100% | -6 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27APR-H0-20260508 | rising | 6030 | 10 | 100% | 4 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 2170 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27APR-H0-20260507 | rising | 5930 | 10 | 100% | 9 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1410 | 10 | 100% | -20 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 3000 | 100 | 100% | -17 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXIPO-26-DISCORD-20260507 | sideways | 5034 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXIPO-26-DISCORD-20260508 | sideways | 5110 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXLLM1-26MAY31-A-20260509 | sideways | 7780 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 90 | 10 | 100% | -6 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 2250 | 50 | 100% | -27 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXOSCARPIC-27-DIS-20260508 | sideways | 180 | 10 | 100% | -20 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 3930 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 4540 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 4276 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27APR-H0-20260509 | sideways | 6640 | 10 | 100% | 3 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 2200 | 100 | 100% | -23 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 650 | 10 | 100% | -9 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 4220 | 10 | 100% | -4 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 2200 | 100 | 100% | -26 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 3400 | 100 | 100% | -12 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXOSCARACTO-27-TOM-20260507 | sideways | 2360 | 10 | 100% | -7 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXOSCARACTO-27-TOM-20260508 | sideways | 2360 | 10 | 100% | -10 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 840 | 10 | 100% | -25 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1790 | 10 | 100% | 3 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXLLM1-26DEC31-XAI-20260508 | sideways | 550 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 560 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 3000 | 100 | 100% | -19 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXLLM1-26MAY31-A-20260507 | sideways | 7780 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 2360 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 1880 | 10 | 100% | -6 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXOSCARACTO-27-TOM-20260509 | sideways | 2460 | 10 | 100% | -6 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 1100 | 100 | 100% | -9 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 1880 | 10 | 100% | -8 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXTOPARTIST-26B-DRA-20260508 | sideways | 2650 | 10 | 100% | -7 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1980 | 10 | 100% | -15 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXIPOSPACEX-26JUN01-20260508 | sideways | 930 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXIPOSPACEX-26JUN01-20260509 | sideways | 840 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXLLM1-26MAY31-A-20260508 | sideways | 7670 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1880 | 10 | 100% | 1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 1880 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXLLM1-26DEC31-XAI-20260509 | sideways | 640 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 8930 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 9040 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 3400 | 100 | 100% | -13 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 2270 | 10 | 100% | -14 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 5420 | 20 | 100% | 5 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 3240 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 90 | 10 | 100% | -12 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 2270 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 6340 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 2560 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 8930 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 540 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXETH-26MAY0817-B2390-20260507 | sideways | 270 | 10 | 100% | -39 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 8960 | 13 | 100% | 7 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 3400 | 100 | 100% | -14 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 270 | 10 | 100% | -5 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 650 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 2270 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 6230 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 2360 | 10 | 100% | -3 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3502 | 19 | 100% | 5 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXTIME-26-ZOH-20260508 | sideways | 1980 | 10 | 100% | -8 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXLLM1-26DEC31-XAI-20260507 | sideways | 550 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1410 | 10 | 100% | -19 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 2800 | 100 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXIPO-26-DISCORD-20260510 | sideways | 5930 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXLLM1-26MAY31-A-20260510 | sideways | 8190 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 1030 | 10 | 100% | -39 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6340 | 10 | 100% | 15 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 90 | 10 | 100% | -15 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 5120 | 10 | 100% | -3 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 4220 | 10 | 100% | -4 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 930 | 10 | 100% | -27 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXTIME-26-ZOH-20260510 | sideways | 1690 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXTOPARTIST-26B-DRA-20260507 | sideways | 2650 | 10 | 100% | -6 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1500 | 10 | 100% | -34 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 8620 | 10 | 100% | -5 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 9570 | 10 | 100% | 11 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3870 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5266 | 55 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 3630 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 930 | 10 | 100% | -27 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5220 | 10 | 100% | 2 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1980 | 10 | 100% | -15 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3530 | 10 | 100% | -9 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXOSCARPIC-27-DIS-20260509 | falling | 180 | 10 | 100% | -16 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 90 | 10 | 100% | -15 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 650 | 10 | 100% | -12 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27MAR-C25-20260509 | falling | 2560 | 10 | 100% | -12 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 2270 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXTIME-26-ZOH-20260509 | falling | 1880 | 10 | 100% | -10 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27JUN-C25-20260509 | falling | 700 | 100 | 100% | -37 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 4820 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 5120 | 10 | 100% | -3 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXTOPARTIST-26B-DRA-20260509 | falling | 2950 | 10 | 100% | -5 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 4020 | 10 | 100% | -4 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXCABOUT-26APR20-TGAB-20260507 | falling | 3730 | 10 | 100% | 2 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27OCT-H0-20260509 | falling | 2250 | 50 | 100% | -23 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3730 | 10 | 100% | 8 |  |
| s-trail | trailCents=1 | KXETH-26MAY0817-B2390-20260508 | rising | 92 | 1 | 100% | -42 |  |
| s-trail | trailCents=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7062 | 1 | 100% | 22 |  |
| s-trail | trailCents=1 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9148 | 1 | 100% | 10 |  |
| s-trail | trailCents=1 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 3438 | 1 | 100% | 2 |  |
| s-trail | trailCents=1 | KXINX-26MAY08H1600-B7387-20260508 | rising | 368 | 1 | 100% | -15 |  |
| s-trail | trailCents=1 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8726 | 1 | 100% | 39 |  |
| s-trail | trailCents=1 | KXFEDDECISION-28JAN-H0-20260509 | rising | 2563 | 1 | 100% | -22 |  |
| s-trail | trailCents=1 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1315 | 1 | 100% | -2 |  |
| s-trail | trailCents=1 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 3634 | 1 | 100% | -1 |  |
| s-trail | trailCents=1 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3733 | 1 | 100% | 14 |  |
| s-trail | trailCents=1 | KXIPO-26-DISCORD-20260509 | rising | 4823 | 1 | 100% | 0 |  |
| s-trail | trailCents=1 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 3438 | 1 | 100% | 4 |  |
| s-trail | trailCents=1 | KXLLM1-26MAY09-GOOG-20260508 | rising | 12.85 | 1 | 15% | -13 |  |
| s-trail | trailCents=1 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4426 | 1 | 100% | 0 |  |
| s-trail | trailCents=1 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 279 | 1 | 100% | -5 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27APR-H0-20260508 | rising | 6647 | 1 | 100% | 9 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 2078 | 1 | 100% | -2 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27APR-H0-20260507 | rising | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=1 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1410 | 1 | 100% | -20 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=1 | KXIPO-26-DISCORD-20260507 | sideways | 4824 | 1 | 100% | 1 |  |
| s-trail | trailCents=1 | KXIPO-26-DISCORD-20260508 | sideways | 5124 | 1 | 100% | 6 |  |
| s-trail | trailCents=1 | KXLLM1-26MAY31-A-20260509 | sideways | 7679 | 1 | 100% | 0 |  |
| s-trail | trailCents=1 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 93 | 1 | 100% | -6 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 1791 | 1 | 100% | -32 |  |
| s-trail | trailCents=1 | KXOSCARPIC-27-DIS-20260508 | sideways | 186 | 1 | 100% | -20 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 3930 | 1 | 100% | -1 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 4525 | 1 | 100% | -2 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 4227 | 1 | 100% | 0 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27APR-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 1695 | 1 | 100% | -29 |  |
| s-trail | trailCents=1 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 654 | 1 | 100% | -9 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 4029 | 1 | 100% | -6 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 1695 | 1 | 100% | -32 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 1885 | 1 | 100% | -28 |  |
| s-trail | trailCents=1 | KXOSCARACTO-27-TOM-20260507 | sideways | 2269 | 1 | 100% | -8 |  |
| s-trail | trailCents=1 | KXOSCARACTO-27-TOM-20260508 | sideways | 2270 | 1 | 100% | -11 |  |
| s-trail | trailCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 936 | 1 | 100% | -30 |  |
| s-trail | trailCents=1 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1697 | 1 | 100% | 2 |  |
| s-trail | trailCents=1 | KXLLM1-26DEC31-XAI-20260508 | sideways | 562 | 1 | 100% | 0 |  |
| s-trail | trailCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 1413 | 1 | 100% | -24 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 1789 | 1 | 100% | -31 |  |
| s-trail | trailCents=1 | KXLLM1-26MAY31-A-20260507 | sideways | 7783 | 1 | 100% | -1 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 2368 | 1 | 100% | -2 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 1887 | 1 | 100% | -5 |  |
| s-trail | trailCents=1 | KXOSCARACTO-27-TOM-20260509 | sideways | 2465 | 1 | 100% | -6 |  |
| s-trail | trailCents=1 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 278 | 1 | 100% | -18 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 93 | 1 | 100% | -99 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 1887 | 1 | 100% | -5 |  |
| s-trail | trailCents=1 | KXTOPARTIST-26B-DRA-20260508 | sideways | 2368 | 1 | 100% | -16 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1983 | 1 | 100% | -15 |  |
| s-trail | trailCents=1 | KXIPOSPACEX-26JUN01-20260508 | sideways | 936 | 1 | 100% | -2 |  |
| s-trail | trailCents=1 | KXIPOSPACEX-26JUN01-20260509 | sideways | 842 | 1 | 100% | -1 |  |
| s-trail | trailCents=1 | KXLLM1-26MAY31-A-20260508 | sideways | 7679 | 1 | 100% | -1 |  |
| s-trail | trailCents=1 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1789 | 1 | 100% | 1 |  |
| s-trail | trailCents=1 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 1600 | 1 | 100% | -4 |  |
| s-trail | trailCents=1 | KXLLM1-26DEC31-XAI-20260509 | sideways | 653 | 1 | 100% | -1 |  |
| s-trail | trailCents=1 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=1 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 9041 | 1 | 100% | 1 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 1885 | 1 | 100% | -30 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 1982 | 1 | 100% | -16 |  |
| s-trail | trailCents=1 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 2181 | 1 | 100% | -27 |  |
| s-trail | trailCents=1 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 3242 | 1 | 100% | 0 |  |
| s-trail | trailCents=1 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 12.83 | 1 | 15% | -12 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 2176 | 1 | 100% | -2 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 6340 | 1 | 100% | 0 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 2562 | 1 | 100% | -1 |  |
| s-trail | trailCents=1 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 562 | 1 | 100% | 0 |  |
| s-trail | trailCents=1 | KXETH-26MAY0817-B2390-20260507 | sideways | 279 | 1 | 100% | -40 |  |
| s-trail | trailCents=1 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 8832 | 1 | 100% | 6 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 1885 | 1 | 100% | -30 |  |
| s-trail | trailCents=1 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 279 | 1 | 100% | -5 |  |
| s-trail | trailCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 556 | 1 | 100% | -4 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 6238 | 1 | 100% | -1 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 2368 | 1 | 100% | -2 |  |
| s-trail | trailCents=1 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3438 | 1 | 100% | 4 |  |
| s-trail | trailCents=1 | KXTIME-26-ZOH-20260508 | sideways | 1697 | 1 | 100% | -11 |  |
| s-trail | trailCents=1 | KXLLM1-26DEC31-XAI-20260507 | sideways | 559 | 1 | 100% | -1 |  |
| s-trail | trailCents=1 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1411 | 1 | 100% | -20 |  |
| s-trail | trailCents=1 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 1694 | 1 | 100% | -82 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 1791 | 1 | 100% | -14 |  |
| s-trail | trailCents=1 | KXIPO-26-DISCORD-20260510 | sideways | 5325 | 1 | 100% | -7 |  |
| s-trail | trailCents=1 | KXLLM1-26MAY31-A-20260510 | sideways | 8096 | 1 | 100% | -2 |  |
| s-trail | trailCents=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 652 | 1 | 100% | -43 |  |
| s-trail | trailCents=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6035 | 1 | 100% | 12 |  |
| s-trail | trailCents=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 93 | 1 | 100% | -15 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 4127 | 1 | 100% | -6 |  |
| s-trail | trailCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 936 | 1 | 100% | -27 |  |
| s-trail | trailCents=1 | KXTIME-26-ZOH-20260510 | sideways | 1409 | 1 | 100% | -4 |  |
| s-trail | trailCents=1 | KXTOPARTIST-26B-DRA-20260507 | sideways | 2367 | 1 | 100% | -9 |  |
| s-trail | trailCents=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1034 | 1 | 100% | -39 |  |
| s-trail | trailCents=1 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 8726 | 1 | 100% | 39 |  |
| s-trail | trailCents=1 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 9891 | 1 | 100% | 36 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3831 | 1 | 100% | -1 |  |
| s-trail | trailCents=1 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5427 | 1 | 100% | 1 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 3635 | 1 | 100% | -1 |  |
| s-trail | trailCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 936 | 1 | 100% | -27 |  |
| s-trail | trailCents=1 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5226 | 1 | 100% | 1 |  |
| s-trail | trailCents=1 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1983 | 1 | 100% | -15 |  |
| s-trail | trailCents=1 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3536 | 1 | 100% | -8 |  |
| s-trail | trailCents=1 | KXOSCARPIC-27-DIS-20260509 | falling | 186 | 1 | 100% | -16 |  |
| s-trail | trailCents=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 93 | 1 | 100% | -15 |  |
| s-trail | trailCents=1 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 654 | 1 | 100% | -12 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27MAR-C25-20260509 | falling | 1984 | 1 | 100% | -17 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 2176 | 1 | 100% | -1 |  |
| s-trail | trailCents=1 | KXTIME-26-ZOH-20260509 | falling | 1791 | 1 | 100% | -10 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27JUN-C25-20260509 | falling | 372 | 1 | 100% | -41 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 4824 | 1 | 100% | -1 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 5125 | 1 | 100% | -4 |  |
| s-trail | trailCents=1 | KXTOPARTIST-26B-DRA-20260509 | falling | 2852 | 1 | 100% | -1 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 4029 | 1 | 100% | 0 |  |
| s-trail | trailCents=1 | KXCABOUT-26APR20-TGAB-20260507 | falling | 3733 | 1 | 100% | 9 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27OCT-H0-20260509 | falling | 2273 | 1 | 100% | -26 |  |
| s-trail | trailCents=1 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3733 | 1 | 100% | 9 |  |
| s-trail | trailCents=3 | KXETH-26MAY0817-B2390-20260508 | rising | 92 | 1 | 100% | -42 |  |
| s-trail | trailCents=3 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7062 | 1 | 100% | 22 |  |
| s-trail | trailCents=3 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9148 | 1 | 100% | 10 |  |
| s-trail | trailCents=3 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 3438 | 1 | 100% | 2 |  |
| s-trail | trailCents=3 | KXINX-26MAY08H1600-B7387-20260508 | rising | 368 | 1 | 100% | -15 |  |
| s-trail | trailCents=3 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8726 | 1 | 100% | 39 |  |
| s-trail | trailCents=3 | KXFEDDECISION-28JAN-H0-20260509 | rising | 2563 | 1 | 100% | -22 |  |
| s-trail | trailCents=3 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1410 | 1 | 100% | 0 |  |
| s-trail | trailCents=3 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 3634 | 1 | 100% | 0 |  |
| s-trail | trailCents=3 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3733 | 1 | 100% | 14 |  |
| s-trail | trailCents=3 | KXIPO-26-DISCORD-20260509 | rising | 4824 | 1 | 100% | 5 |  |
| s-trail | trailCents=3 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 3438 | 1 | 100% | 4 |  |
| s-trail | trailCents=3 | KXLLM1-26MAY09-GOOG-20260508 | rising | 12.85 | 1 | 15% | -13 |  |
| s-trail | trailCents=3 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4426 | 1 | 100% | 0 |  |
| s-trail | trailCents=3 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 279 | 1 | 100% | -5 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27APR-H0-20260508 | rising | 6647 | 1 | 100% | 9 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 2176 | 1 | 100% | -1 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27APR-H0-20260507 | rising | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1410 | 1 | 100% | -20 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXIPO-26-DISCORD-20260507 | sideways | 4824 | 1 | 100% | 1 |  |
| s-trail | trailCents=3 | KXIPO-26-DISCORD-20260508 | sideways | 5124 | 1 | 100% | 6 |  |
| s-trail | trailCents=3 | KXLLM1-26MAY31-A-20260509 | sideways | 7679 | 1 | 100% | 1 |  |
| s-trail | trailCents=3 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 93 | 1 | 100% | -6 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 1791 | 1 | 100% | -27 |  |
| s-trail | trailCents=3 | KXOSCARPIC-27-DIS-20260508 | sideways | 186 | 1 | 100% | -20 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 5226 | 1 | 100% | -4 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 4326 | 1 | 100% | 1 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27APR-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 1695 | 1 | 100% | -29 |  |
| s-trail | trailCents=3 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 654 | 1 | 100% | -9 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 4227 | 1 | 100% | -5 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 1695 | 1 | 100% | -32 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 1885 | 1 | 100% | -27 |  |
| s-trail | trailCents=3 | KXOSCARACTO-27-TOM-20260507 | sideways | 2269 | 1 | 100% | -8 |  |
| s-trail | trailCents=3 | KXOSCARACTO-27-TOM-20260508 | sideways | 2270 | 1 | 100% | -11 |  |
| s-trail | trailCents=3 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 936 | 1 | 100% | -30 |  |
| s-trail | trailCents=3 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1697 | 1 | 100% | 2 |  |
| s-trail | trailCents=3 | KXLLM1-26DEC31-XAI-20260508 | sideways | 560 | 1 | 100% | 0 |  |
| s-trail | trailCents=3 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 2079 | 1 | 100% | -17 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 1789 | 1 | 100% | -28 |  |
| s-trail | trailCents=3 | KXLLM1-26MAY31-A-20260507 | sideways | 7783 | 1 | 100% | -2 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 2368 | 1 | 100% | 0 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 1887 | 1 | 100% | -5 |  |
| s-trail | trailCents=3 | KXOSCARACTO-27-TOM-20260509 | sideways | 2465 | 1 | 100% | -6 |  |
| s-trail | trailCents=3 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 278 | 1 | 100% | -18 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 93 | 1 | 100% | -99 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXTOPARTIST-26B-DRA-20260508 | sideways | 2755 | 1 | 100% | -7 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1983 | 1 | 100% | -15 |  |
| s-trail | trailCents=3 | KXIPOSPACEX-26JUN01-20260508 | sideways | 936 | 1 | 100% | -2 |  |
| s-trail | trailCents=3 | KXIPOSPACEX-26JUN01-20260509 | sideways | 842 | 1 | 100% | -1 |  |
| s-trail | trailCents=3 | KXLLM1-26MAY31-A-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1789 | 1 | 100% | 2 |  |
| s-trail | trailCents=3 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 1600 | 1 | 100% | -4 |  |
| s-trail | trailCents=3 | KXLLM1-26DEC31-XAI-20260509 | sideways | 557 | 1 | 100% | -2 |  |
| s-trail | trailCents=3 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 8936 | 1 | 100% | 0 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 1885 | 1 | 100% | -28 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 1982 | 1 | 100% | -16 |  |
| s-trail | trailCents=3 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 1890 | 1 | 100% | -30 |  |
| s-trail | trailCents=3 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 3242 | 1 | 100% | -1 |  |
| s-trail | trailCents=3 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 12.83 | 1 | 15% | -12 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 2079 | 1 | 100% | -1 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 6340 | 1 | 100% | -1 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 2465 | 1 | 100% | -1 |  |
| s-trail | trailCents=3 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 466 | 1 | 100% | 0 |  |
| s-trail | trailCents=3 | KXETH-26MAY0817-B2390-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 8936 | 1 | 100% | 9 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 279 | 1 | 100% | -5 |  |
| s-trail | trailCents=3 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 6238 | 1 | 100% | 1 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 2368 | 1 | 100% | -1 |  |
| s-trail | trailCents=3 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3438 | 1 | 100% | 4 |  |
| s-trail | trailCents=3 | KXTIME-26-ZOH-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXLLM1-26DEC31-XAI-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1411 | 1 | 100% | -20 |  |
| s-trail | trailCents=3 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 1694 | 1 | 100% | -82 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 1791 | 1 | 100% | -14 |  |
| s-trail | trailCents=3 | KXIPO-26-DISCORD-20260510 | sideways | 5225 | 1 | 100% | -5 |  |
| s-trail | trailCents=3 | KXLLM1-26MAY31-A-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 652 | 1 | 100% | -43 |  |
| s-trail | trailCents=3 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6035 | 1 | 100% | 12 |  |
| s-trail | trailCents=3 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 93 | 1 | 100% | -15 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 4226 | 1 | 100% | -3 |  |
| s-trail | trailCents=3 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 936 | 1 | 100% | -27 |  |
| s-trail | trailCents=3 | KXTIME-26-ZOH-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXTOPARTIST-26B-DRA-20260507 | sideways | 2367 | 1 | 100% | -5 |  |
| s-trail | trailCents=3 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1034 | 1 | 100% | -39 |  |
| s-trail | trailCents=3 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 8726 | 1 | 100% | 39 |  |
| s-trail | trailCents=3 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 9891 | 1 | 100% | 36 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3930 | 1 | 100% | -1 |  |
| s-trail | trailCents=3 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5427 | 1 | 100% | 1 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 3733 | 1 | 100% | -1 |  |
| s-trail | trailCents=3 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 936 | 1 | 100% | -27 |  |
| s-trail | trailCents=3 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5226 | 1 | 100% | 6 |  |
| s-trail | trailCents=3 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1983 | 1 | 100% | -15 |  |
| s-trail | trailCents=3 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3536 | 1 | 100% | -11 |  |
| s-trail | trailCents=3 | KXOSCARPIC-27-DIS-20260509 | falling | 186 | 1 | 100% | -16 |  |
| s-trail | trailCents=3 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 93 | 1 | 100% | -15 |  |
| s-trail | trailCents=3 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 654 | 1 | 100% | -12 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27MAR-C25-20260509 | falling | 1984 | 1 | 100% | -17 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 2176 | 1 | 100% | -1 |  |
| s-trail | trailCents=3 | KXTIME-26-ZOH-20260509 | falling | 1600 | 1 | 100% | -11 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27JUN-C25-20260509 | falling | 372 | 1 | 100% | -41 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 5528 | 1 | 100% | -1 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 5124 | 1 | 100% | -3 |  |
| s-trail | trailCents=3 | KXTOPARTIST-26B-DRA-20260509 | falling | 2852 | 1 | 100% | -1 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 3733 | 1 | 100% | -1 |  |
| s-trail | trailCents=3 | KXCABOUT-26APR20-TGAB-20260507 | falling | 3733 | 1 | 100% | 9 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27OCT-H0-20260509 | falling | 2273 | 1 | 100% | -27 |  |
| s-trail | trailCents=3 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3733 | 1 | 100% | 3 |  |
| s-trail | trailCents=5 | KXETH-26MAY0817-B2390-20260508 | rising | 92 | 1 | 100% | -42 |  |
| s-trail | trailCents=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7062 | 1 | 100% | 22 |  |
| s-trail | trailCents=5 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9148 | 1 | 100% | 32 |  |
| s-trail | trailCents=5 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 4326 | 1 | 100% | -2 |  |
| s-trail | trailCents=5 | KXINX-26MAY08H1600-B7387-20260508 | rising | 368 | 1 | 100% | -15 |  |
| s-trail | trailCents=5 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8726 | 1 | 100% | 39 |  |
| s-trail | trailCents=5 | KXFEDDECISION-28JAN-H0-20260509 | rising | 2563 | 1 | 100% | -22 |  |
| s-trail | trailCents=5 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1410 | 1 | 100% | 0 |  |
| s-trail | trailCents=5 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 3634 | 1 | 100% | 1 |  |
| s-trail | trailCents=5 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3733 | 1 | 100% | 14 |  |
| s-trail | trailCents=5 | KXIPO-26-DISCORD-20260509 | rising | 4824 | 1 | 100% | 5 |  |
| s-trail | trailCents=5 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 3438 | 1 | 100% | 4 |  |
| s-trail | trailCents=5 | KXLLM1-26MAY09-GOOG-20260508 | rising | 12.85 | 1 | 15% | -13 |  |
| s-trail | trailCents=5 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4426 | 1 | 100% | 0 |  |
| s-trail | trailCents=5 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 279 | 1 | 100% | -5 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27APR-H0-20260508 | rising | 6647 | 1 | 100% | 9 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 2271 | 1 | 100% | -1 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27APR-H0-20260507 | rising | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1410 | 1 | 100% | -20 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXIPO-26-DISCORD-20260507 | sideways | 4824 | 1 | 100% | 1 |  |
| s-trail | trailCents=5 | KXIPO-26-DISCORD-20260508 | sideways | 5124 | 1 | 100% | 6 |  |
| s-trail | trailCents=5 | KXLLM1-26MAY31-A-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 93 | 1 | 100% | -6 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXOSCARPIC-27-DIS-20260508 | sideways | 186 | 1 | 100% | -20 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 5326 | 1 | 100% | -5 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 4227 | 1 | 100% | 1 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27APR-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 1695 | 1 | 100% | -29 |  |
| s-trail | trailCents=5 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 654 | 1 | 100% | -9 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 3930 | 1 | 100% | -4 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 1695 | 1 | 100% | -32 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 1885 | 1 | 100% | -27 |  |
| s-trail | trailCents=5 | KXOSCARACTO-27-TOM-20260507 | sideways | 2269 | 1 | 100% | -8 |  |
| s-trail | trailCents=5 | KXOSCARACTO-27-TOM-20260508 | sideways | 2270 | 1 | 100% | -11 |  |
| s-trail | trailCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 936 | 1 | 100% | -30 |  |
| s-trail | trailCents=5 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1697 | 1 | 100% | 2 |  |
| s-trail | trailCents=5 | KXLLM1-26DEC31-XAI-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 2079 | 1 | 100% | -17 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXLLM1-26MAY31-A-20260507 | sideways | 7783 | 1 | 100% | -1 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 2368 | 1 | 100% | 1 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 1887 | 1 | 100% | -5 |  |
| s-trail | trailCents=5 | KXOSCARACTO-27-TOM-20260509 | sideways | 2465 | 1 | 100% | -6 |  |
| s-trail | trailCents=5 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 278 | 1 | 100% | -18 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 93 | 1 | 100% | -99 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXTOPARTIST-26B-DRA-20260508 | sideways | 2755 | 1 | 100% | -7 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1983 | 1 | 100% | -15 |  |
| s-trail | trailCents=5 | KXIPOSPACEX-26JUN01-20260508 | sideways | 936 | 1 | 100% | -2 |  |
| s-trail | trailCents=5 | KXIPOSPACEX-26JUN01-20260509 | sideways | 842 | 1 | 100% | -1 |  |
| s-trail | trailCents=5 | KXLLM1-26MAY31-A-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1789 | 1 | 100% | 2 |  |
| s-trail | trailCents=5 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXLLM1-26DEC31-XAI-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 1885 | 1 | 100% | -28 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 5325 | 1 | 100% | 4 |  |
| s-trail | trailCents=5 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 3536 | 1 | 100% | 2 |  |
| s-trail | trailCents=5 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 12.83 | 1 | 15% | -12 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 6442 | 1 | 100% | -1 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXETH-26MAY0817-B2390-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 8936 | 1 | 100% | 9 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 279 | 1 | 100% | -5 |  |
| s-trail | trailCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 6238 | 1 | 100% | 1 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3438 | 1 | 100% | 4 |  |
| s-trail | trailCents=5 | KXTIME-26-ZOH-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXLLM1-26DEC31-XAI-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1411 | 1 | 100% | -20 |  |
| s-trail | trailCents=5 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 1694 | 1 | 100% | -82 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 1791 | 1 | 100% | -14 |  |
| s-trail | trailCents=5 | KXIPO-26-DISCORD-20260510 | sideways | 5225 | 1 | 100% | -5 |  |
| s-trail | trailCents=5 | KXLLM1-26MAY31-A-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 652 | 1 | 100% | -43 |  |
| s-trail | trailCents=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6035 | 1 | 100% | 12 |  |
| s-trail | trailCents=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 93 | 1 | 100% | -15 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 4029 | 1 | 100% | -6 |  |
| s-trail | trailCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 936 | 1 | 100% | -27 |  |
| s-trail | trailCents=5 | KXTIME-26-ZOH-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXTOPARTIST-26B-DRA-20260507 | sideways | 2367 | 1 | 100% | -5 |  |
| s-trail | trailCents=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1034 | 1 | 100% | -39 |  |
| s-trail | trailCents=5 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 8726 | 1 | 100% | 39 |  |
| s-trail | trailCents=5 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 9891 | 1 | 100% | 36 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3733 | 1 | 100% | -2 |  |
| s-trail | trailCents=5 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5427 | 1 | 100% | 1 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 4326 | 1 | 100% | -1 |  |
| s-trail | trailCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 936 | 1 | 100% | -27 |  |
| s-trail | trailCents=5 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5226 | 1 | 100% | 6 |  |
| s-trail | trailCents=5 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1983 | 1 | 100% | -13 |  |
| s-trail | trailCents=5 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3536 | 1 | 100% | -11 |  |
| s-trail | trailCents=5 | KXOSCARPIC-27-DIS-20260509 | falling | 186 | 1 | 100% | -16 |  |
| s-trail | trailCents=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 93 | 1 | 100% | -15 |  |
| s-trail | trailCents=5 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 654 | 1 | 100% | -12 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27MAR-C25-20260509 | falling | 2562 | 1 | 100% | -10 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 1983 | 1 | 100% | -1 |  |
| s-trail | trailCents=5 | KXTIME-26-ZOH-20260509 | falling | 1410 | 1 | 100% | -12 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27JUN-C25-20260509 | falling | 372 | 1 | 100% | -41 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 6035 | 1 | 100% | -1 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 5124 | 1 | 100% | 1 |  |
| s-trail | trailCents=5 | KXTOPARTIST-26B-DRA-20260509 | falling | 2852 | 1 | 100% | -1 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXCABOUT-26APR20-TGAB-20260507 | falling | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27OCT-H0-20260509 | falling | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3733 | 1 | 100% | 11 |  |
| s-trail | trailCents=10 | KXETH-26MAY0817-B2390-20260508 | rising | 92 | 1 | 100% | -42 |  |
| s-trail | trailCents=10 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7062 | 1 | 100% | 22 |  |
| s-trail | trailCents=10 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9148 | 1 | 100% | 32 |  |
| s-trail | trailCents=10 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 3732 | 1 | 100% | -3 |  |
| s-trail | trailCents=10 | KXINX-26MAY08H1600-B7387-20260508 | rising | 368 | 1 | 100% | -15 |  |
| s-trail | trailCents=10 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8726 | 1 | 100% | 39 |  |
| s-trail | trailCents=10 | KXFEDDECISION-28JAN-H0-20260509 | rising | 2563 | 1 | 100% | -22 |  |
| s-trail | trailCents=10 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1410 | 1 | 100% | 0 |  |
| s-trail | trailCents=10 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 4625 | 1 | 100% | 1 |  |
| s-trail | trailCents=10 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3733 | 1 | 100% | 14 |  |
| s-trail | trailCents=10 | KXIPO-26-DISCORD-20260509 | rising | 4824 | 1 | 100% | 5 |  |
| s-trail | trailCents=10 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 3438 | 1 | 100% | 4 |  |
| s-trail | trailCents=10 | KXLLM1-26MAY09-GOOG-20260508 | rising | 12.85 | 1 | 15% | -13 |  |
| s-trail | trailCents=10 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4426 | 1 | 100% | 0 |  |
| s-trail | trailCents=10 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 279 | 1 | 100% | -5 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27APR-H0-20260508 | rising | 6035 | 1 | 100% | -3 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27APR-H0-20260507 | rising | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1410 | 1 | 100% | -20 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXIPO-26-DISCORD-20260507 | sideways | 4824 | 1 | 100% | 1 |  |
| s-trail | trailCents=10 | KXIPO-26-DISCORD-20260508 | sideways | 5124 | 1 | 100% | 6 |  |
| s-trail | trailCents=10 | KXLLM1-26MAY31-A-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 93 | 1 | 100% | -6 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXOSCARPIC-27-DIS-20260508 | sideways | 186 | 1 | 100% | -20 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 4525 | 1 | 100% | -9 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 3634 | 1 | 100% | -4 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27APR-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 1695 | 1 | 100% | -29 |  |
| s-trail | trailCents=10 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 654 | 1 | 100% | -9 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 3733 | 1 | 100% | -3 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 1695 | 1 | 100% | -32 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXOSCARACTO-27-TOM-20260507 | sideways | 2269 | 1 | 100% | -8 |  |
| s-trail | trailCents=10 | KXOSCARACTO-27-TOM-20260508 | sideways | 2270 | 1 | 100% | -11 |  |
| s-trail | trailCents=10 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 936 | 1 | 100% | -30 |  |
| s-trail | trailCents=10 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1697 | 1 | 100% | 2 |  |
| s-trail | trailCents=10 | KXLLM1-26DEC31-XAI-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXLLM1-26MAY31-A-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXOSCARACTO-27-TOM-20260509 | sideways | 2465 | 1 | 100% | -6 |  |
| s-trail | trailCents=10 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 278 | 1 | 100% | -18 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 93 | 1 | 100% | -99 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXTOPARTIST-26B-DRA-20260508 | sideways | 2755 | 1 | 100% | -7 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1983 | 1 | 100% | -15 |  |
| s-trail | trailCents=10 | KXIPOSPACEX-26JUN01-20260508 | sideways | 936 | 1 | 100% | -2 |  |
| s-trail | trailCents=10 | KXIPOSPACEX-26JUN01-20260509 | sideways | 842 | 1 | 100% | -1 |  |
| s-trail | trailCents=10 | KXLLM1-26MAY31-A-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1890 | 1 | 100% | 4 |  |
| s-trail | trailCents=10 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXLLM1-26DEC31-XAI-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 2563 | 1 | 100% | -23 |  |
| s-trail | trailCents=10 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 12.83 | 1 | 15% | -12 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 6545 | 1 | 100% | 6 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXETH-26MAY0817-B2390-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 8937 | 1 | 100% | 33 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 279 | 1 | 100% | -5 |  |
| s-trail | trailCents=10 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 6238 | 1 | 100% | 4 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3438 | 1 | 100% | 4 |  |
| s-trail | trailCents=10 | KXTIME-26-ZOH-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXLLM1-26DEC31-XAI-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1411 | 1 | 100% | -20 |  |
| s-trail | trailCents=10 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 1694 | 1 | 100% | -82 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXIPO-26-DISCORD-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXLLM1-26MAY31-A-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 652 | 1 | 100% | -43 |  |
| s-trail | trailCents=10 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6035 | 1 | 100% | 12 |  |
| s-trail | trailCents=10 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 93 | 1 | 100% | -15 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 936 | 1 | 100% | -27 |  |
| s-trail | trailCents=10 | KXTIME-26-ZOH-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXTOPARTIST-26B-DRA-20260507 | sideways | 2367 | 1 | 100% | -5 |  |
| s-trail | trailCents=10 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1034 | 1 | 100% | -39 |  |
| s-trail | trailCents=10 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 8726 | 1 | 100% | 39 |  |
| s-trail | trailCents=10 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 9571 | 1 | 100% | 18 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3242 | 1 | 100% | -1 |  |
| s-trail | trailCents=10 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5427 | 1 | 100% | 1 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 3733 | 1 | 100% | -1 |  |
| s-trail | trailCents=10 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 936 | 1 | 100% | -27 |  |
| s-trail | trailCents=10 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5226 | 1 | 100% | 6 |  |
| s-trail | trailCents=10 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1410 | 1 | 100% | -2 |  |
| s-trail | trailCents=10 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3535 | 1 | 100% | -6 |  |
| s-trail | trailCents=10 | KXOSCARPIC-27-DIS-20260509 | falling | 186 | 1 | 100% | -16 |  |
| s-trail | trailCents=10 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 93 | 1 | 100% | -15 |  |
| s-trail | trailCents=10 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 654 | 1 | 100% | -12 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27MAR-C25-20260509 | falling | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 1601 | 1 | 100% | -1 |  |
| s-trail | trailCents=10 | KXTIME-26-ZOH-20260509 | falling | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27JUN-C25-20260509 | falling | 372 | 1 | 100% | -41 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 6136 | 1 | 100% | -1 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 5125 | 1 | 100% | -5 |  |
| s-trail | trailCents=10 | KXTOPARTIST-26B-DRA-20260509 | falling | 2852 | 1 | 100% | -1 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXCABOUT-26APR20-TGAB-20260507 | falling | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27OCT-H0-20260509 | falling | 0 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3733 | 1 | 100% | 13 |  |
| trailing_stop | trailCents=1 | KXETH-26MAY0817-B2390-20260508 | rising | 92 | 1 | 100% | -42 |  |
| trailing_stop | trailCents=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7062 | 1 | 100% | 22 |  |
| trailing_stop | trailCents=1 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9148 | 1 | 100% | 10 |  |
| trailing_stop | trailCents=1 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 3438 | 1 | 100% | 2 |  |
| trailing_stop | trailCents=1 | KXINX-26MAY08H1600-B7387-20260508 | rising | 368 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=1 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8726 | 1 | 100% | 39 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-28JAN-H0-20260509 | rising | 2563 | 1 | 100% | -22 |  |
| trailing_stop | trailCents=1 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1315 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=1 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 3634 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=1 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3733 | 1 | 100% | 14 |  |
| trailing_stop | trailCents=1 | KXIPO-26-DISCORD-20260509 | rising | 4823 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=1 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 3438 | 1 | 100% | 4 |  |
| trailing_stop | trailCents=1 | KXLLM1-26MAY09-GOOG-20260508 | rising | 12.85 | 1 | 15% | -13 |  |
| trailing_stop | trailCents=1 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4426 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=1 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 279 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27APR-H0-20260508 | rising | 6647 | 1 | 100% | 9 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 2078 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27APR-H0-20260507 | rising | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=1 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1410 | 1 | 100% | -20 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=1 | KXIPO-26-DISCORD-20260507 | sideways | 4824 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=1 | KXIPO-26-DISCORD-20260508 | sideways | 5124 | 1 | 100% | 6 |  |
| trailing_stop | trailCents=1 | KXLLM1-26MAY31-A-20260509 | sideways | 7679 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=1 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 93 | 1 | 100% | -6 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 1791 | 1 | 100% | -32 |  |
| trailing_stop | trailCents=1 | KXOSCARPIC-27-DIS-20260508 | sideways | 186 | 1 | 100% | -20 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 3930 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 4525 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 4227 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27APR-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 1695 | 1 | 100% | -29 |  |
| trailing_stop | trailCents=1 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 654 | 1 | 100% | -9 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 4029 | 1 | 100% | -6 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 1695 | 1 | 100% | -32 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 1885 | 1 | 100% | -28 |  |
| trailing_stop | trailCents=1 | KXOSCARACTO-27-TOM-20260507 | sideways | 2269 | 1 | 100% | -8 |  |
| trailing_stop | trailCents=1 | KXOSCARACTO-27-TOM-20260508 | sideways | 2270 | 1 | 100% | -11 |  |
| trailing_stop | trailCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 936 | 1 | 100% | -30 |  |
| trailing_stop | trailCents=1 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1697 | 1 | 100% | 2 |  |
| trailing_stop | trailCents=1 | KXLLM1-26DEC31-XAI-20260508 | sideways | 562 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 1413 | 1 | 100% | -24 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 1789 | 1 | 100% | -31 |  |
| trailing_stop | trailCents=1 | KXLLM1-26MAY31-A-20260507 | sideways | 7783 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 2368 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 1887 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=1 | KXOSCARACTO-27-TOM-20260509 | sideways | 2465 | 1 | 100% | -6 |  |
| trailing_stop | trailCents=1 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 278 | 1 | 100% | -18 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 93 | 1 | 100% | -99 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 1887 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=1 | KXTOPARTIST-26B-DRA-20260508 | sideways | 2368 | 1 | 100% | -16 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1983 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=1 | KXIPOSPACEX-26JUN01-20260508 | sideways | 936 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=1 | KXIPOSPACEX-26JUN01-20260509 | sideways | 842 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=1 | KXLLM1-26MAY31-A-20260508 | sideways | 7679 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=1 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1789 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=1 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 1600 | 1 | 100% | -4 |  |
| trailing_stop | trailCents=1 | KXLLM1-26DEC31-XAI-20260509 | sideways | 653 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=1 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=1 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 9041 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 1885 | 1 | 100% | -30 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 1982 | 1 | 100% | -16 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 2181 | 1 | 100% | -27 |  |
| trailing_stop | trailCents=1 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 3242 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=1 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 12.83 | 1 | 15% | -12 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 2176 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 6340 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 2562 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=1 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 562 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=1 | KXETH-26MAY0817-B2390-20260507 | sideways | 279 | 1 | 100% | -40 |  |
| trailing_stop | trailCents=1 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 8832 | 1 | 100% | 6 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 1885 | 1 | 100% | -30 |  |
| trailing_stop | trailCents=1 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 279 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 556 | 1 | 100% | -4 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 6238 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 2368 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=1 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3438 | 1 | 100% | 4 |  |
| trailing_stop | trailCents=1 | KXTIME-26-ZOH-20260508 | sideways | 1697 | 1 | 100% | -11 |  |
| trailing_stop | trailCents=1 | KXLLM1-26DEC31-XAI-20260507 | sideways | 559 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=1 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1411 | 1 | 100% | -20 |  |
| trailing_stop | trailCents=1 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 1694 | 1 | 100% | -82 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 1791 | 1 | 100% | -14 |  |
| trailing_stop | trailCents=1 | KXIPO-26-DISCORD-20260510 | sideways | 5325 | 1 | 100% | -7 |  |
| trailing_stop | trailCents=1 | KXLLM1-26MAY31-A-20260510 | sideways | 8096 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 652 | 1 | 100% | -43 |  |
| trailing_stop | trailCents=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6035 | 1 | 100% | 12 |  |
| trailing_stop | trailCents=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 93 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 4127 | 1 | 100% | -6 |  |
| trailing_stop | trailCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 936 | 1 | 100% | -27 |  |
| trailing_stop | trailCents=1 | KXTIME-26-ZOH-20260510 | sideways | 1409 | 1 | 100% | -4 |  |
| trailing_stop | trailCents=1 | KXTOPARTIST-26B-DRA-20260507 | sideways | 2367 | 1 | 100% | -9 |  |
| trailing_stop | trailCents=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1034 | 1 | 100% | -39 |  |
| trailing_stop | trailCents=1 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 8726 | 1 | 100% | 39 |  |
| trailing_stop | trailCents=1 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 9891 | 1 | 100% | 36 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3831 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=1 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5427 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 3635 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 936 | 1 | 100% | -27 |  |
| trailing_stop | trailCents=1 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5226 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=1 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1983 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=1 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3536 | 1 | 100% | -8 |  |
| trailing_stop | trailCents=1 | KXOSCARPIC-27-DIS-20260509 | falling | 186 | 1 | 100% | -16 |  |
| trailing_stop | trailCents=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 93 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=1 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 654 | 1 | 100% | -12 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27MAR-C25-20260509 | falling | 1984 | 1 | 100% | -17 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 2176 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=1 | KXTIME-26-ZOH-20260509 | falling | 1791 | 1 | 100% | -10 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27JUN-C25-20260509 | falling | 372 | 1 | 100% | -41 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 4824 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 5125 | 1 | 100% | -4 |  |
| trailing_stop | trailCents=1 | KXTOPARTIST-26B-DRA-20260509 | falling | 2852 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 4029 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=1 | KXCABOUT-26APR20-TGAB-20260507 | falling | 3733 | 1 | 100% | 9 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27OCT-H0-20260509 | falling | 2273 | 1 | 100% | -26 |  |
| trailing_stop | trailCents=1 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3733 | 1 | 100% | 9 |  |
| trailing_stop | trailCents=3 | KXETH-26MAY0817-B2390-20260508 | rising | 92 | 1 | 100% | -42 |  |
| trailing_stop | trailCents=3 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7062 | 1 | 100% | 22 |  |
| trailing_stop | trailCents=3 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9148 | 1 | 100% | 10 |  |
| trailing_stop | trailCents=3 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 3438 | 1 | 100% | 2 |  |
| trailing_stop | trailCents=3 | KXINX-26MAY08H1600-B7387-20260508 | rising | 368 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=3 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8726 | 1 | 100% | 39 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-28JAN-H0-20260509 | rising | 2563 | 1 | 100% | -22 |  |
| trailing_stop | trailCents=3 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1410 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=3 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 3634 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=3 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3733 | 1 | 100% | 14 |  |
| trailing_stop | trailCents=3 | KXIPO-26-DISCORD-20260509 | rising | 4824 | 1 | 100% | 5 |  |
| trailing_stop | trailCents=3 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 3438 | 1 | 100% | 4 |  |
| trailing_stop | trailCents=3 | KXLLM1-26MAY09-GOOG-20260508 | rising | 12.85 | 1 | 15% | -13 |  |
| trailing_stop | trailCents=3 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4426 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=3 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 279 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27APR-H0-20260508 | rising | 6647 | 1 | 100% | 9 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 2176 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27APR-H0-20260507 | rising | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1410 | 1 | 100% | -20 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXIPO-26-DISCORD-20260507 | sideways | 4824 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=3 | KXIPO-26-DISCORD-20260508 | sideways | 5124 | 1 | 100% | 6 |  |
| trailing_stop | trailCents=3 | KXLLM1-26MAY31-A-20260509 | sideways | 7679 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=3 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 93 | 1 | 100% | -6 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 1791 | 1 | 100% | -27 |  |
| trailing_stop | trailCents=3 | KXOSCARPIC-27-DIS-20260508 | sideways | 186 | 1 | 100% | -20 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 5226 | 1 | 100% | -4 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 4326 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27APR-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 1695 | 1 | 100% | -29 |  |
| trailing_stop | trailCents=3 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 654 | 1 | 100% | -9 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 4227 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 1695 | 1 | 100% | -32 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 1885 | 1 | 100% | -27 |  |
| trailing_stop | trailCents=3 | KXOSCARACTO-27-TOM-20260507 | sideways | 2269 | 1 | 100% | -8 |  |
| trailing_stop | trailCents=3 | KXOSCARACTO-27-TOM-20260508 | sideways | 2270 | 1 | 100% | -11 |  |
| trailing_stop | trailCents=3 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 936 | 1 | 100% | -30 |  |
| trailing_stop | trailCents=3 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1697 | 1 | 100% | 2 |  |
| trailing_stop | trailCents=3 | KXLLM1-26DEC31-XAI-20260508 | sideways | 560 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=3 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 2079 | 1 | 100% | -17 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 1789 | 1 | 100% | -28 |  |
| trailing_stop | trailCents=3 | KXLLM1-26MAY31-A-20260507 | sideways | 7783 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 2368 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 1887 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=3 | KXOSCARACTO-27-TOM-20260509 | sideways | 2465 | 1 | 100% | -6 |  |
| trailing_stop | trailCents=3 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 278 | 1 | 100% | -18 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 93 | 1 | 100% | -99 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXTOPARTIST-26B-DRA-20260508 | sideways | 2755 | 1 | 100% | -7 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1983 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=3 | KXIPOSPACEX-26JUN01-20260508 | sideways | 936 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=3 | KXIPOSPACEX-26JUN01-20260509 | sideways | 842 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=3 | KXLLM1-26MAY31-A-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1789 | 1 | 100% | 2 |  |
| trailing_stop | trailCents=3 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 1600 | 1 | 100% | -4 |  |
| trailing_stop | trailCents=3 | KXLLM1-26DEC31-XAI-20260509 | sideways | 557 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=3 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 8936 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 1885 | 1 | 100% | -28 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 1982 | 1 | 100% | -16 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 1890 | 1 | 100% | -30 |  |
| trailing_stop | trailCents=3 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 3242 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=3 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 12.83 | 1 | 15% | -12 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 2079 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 6340 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 2465 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=3 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 466 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=3 | KXETH-26MAY0817-B2390-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 8936 | 1 | 100% | 9 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 279 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=3 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 6238 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 2368 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=3 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3438 | 1 | 100% | 4 |  |
| trailing_stop | trailCents=3 | KXTIME-26-ZOH-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXLLM1-26DEC31-XAI-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1411 | 1 | 100% | -20 |  |
| trailing_stop | trailCents=3 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 1694 | 1 | 100% | -82 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 1791 | 1 | 100% | -14 |  |
| trailing_stop | trailCents=3 | KXIPO-26-DISCORD-20260510 | sideways | 5225 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=3 | KXLLM1-26MAY31-A-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 652 | 1 | 100% | -43 |  |
| trailing_stop | trailCents=3 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6035 | 1 | 100% | 12 |  |
| trailing_stop | trailCents=3 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 93 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 4226 | 1 | 100% | -3 |  |
| trailing_stop | trailCents=3 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 936 | 1 | 100% | -27 |  |
| trailing_stop | trailCents=3 | KXTIME-26-ZOH-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXTOPARTIST-26B-DRA-20260507 | sideways | 2367 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=3 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1034 | 1 | 100% | -39 |  |
| trailing_stop | trailCents=3 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 8726 | 1 | 100% | 39 |  |
| trailing_stop | trailCents=3 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 9891 | 1 | 100% | 36 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3930 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=3 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5427 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 3733 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=3 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 936 | 1 | 100% | -27 |  |
| trailing_stop | trailCents=3 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5226 | 1 | 100% | 6 |  |
| trailing_stop | trailCents=3 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1983 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=3 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3536 | 1 | 100% | -11 |  |
| trailing_stop | trailCents=3 | KXOSCARPIC-27-DIS-20260509 | falling | 186 | 1 | 100% | -16 |  |
| trailing_stop | trailCents=3 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 93 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=3 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 654 | 1 | 100% | -12 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27MAR-C25-20260509 | falling | 1984 | 1 | 100% | -17 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 2176 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=3 | KXTIME-26-ZOH-20260509 | falling | 1600 | 1 | 100% | -11 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27JUN-C25-20260509 | falling | 372 | 1 | 100% | -41 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 5528 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 5124 | 1 | 100% | -3 |  |
| trailing_stop | trailCents=3 | KXTOPARTIST-26B-DRA-20260509 | falling | 2852 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 3733 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=3 | KXCABOUT-26APR20-TGAB-20260507 | falling | 3733 | 1 | 100% | 9 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27OCT-H0-20260509 | falling | 2273 | 1 | 100% | -27 |  |
| trailing_stop | trailCents=3 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3733 | 1 | 100% | 3 |  |
| trailing_stop | trailCents=5 | KXETH-26MAY0817-B2390-20260508 | rising | 92 | 1 | 100% | -42 |  |
| trailing_stop | trailCents=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7062 | 1 | 100% | 22 |  |
| trailing_stop | trailCents=5 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9148 | 1 | 100% | 32 |  |
| trailing_stop | trailCents=5 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 4326 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=5 | KXINX-26MAY08H1600-B7387-20260508 | rising | 368 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=5 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8726 | 1 | 100% | 39 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-28JAN-H0-20260509 | rising | 2563 | 1 | 100% | -22 |  |
| trailing_stop | trailCents=5 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1410 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=5 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 3634 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=5 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3733 | 1 | 100% | 14 |  |
| trailing_stop | trailCents=5 | KXIPO-26-DISCORD-20260509 | rising | 4824 | 1 | 100% | 5 |  |
| trailing_stop | trailCents=5 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 3438 | 1 | 100% | 4 |  |
| trailing_stop | trailCents=5 | KXLLM1-26MAY09-GOOG-20260508 | rising | 12.85 | 1 | 15% | -13 |  |
| trailing_stop | trailCents=5 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4426 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=5 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 279 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27APR-H0-20260508 | rising | 6647 | 1 | 100% | 9 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 2271 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27APR-H0-20260507 | rising | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1410 | 1 | 100% | -20 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXIPO-26-DISCORD-20260507 | sideways | 4824 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=5 | KXIPO-26-DISCORD-20260508 | sideways | 5124 | 1 | 100% | 6 |  |
| trailing_stop | trailCents=5 | KXLLM1-26MAY31-A-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 93 | 1 | 100% | -6 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXOSCARPIC-27-DIS-20260508 | sideways | 186 | 1 | 100% | -20 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 5326 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 4227 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27APR-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 1695 | 1 | 100% | -29 |  |
| trailing_stop | trailCents=5 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 654 | 1 | 100% | -9 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 3930 | 1 | 100% | -4 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 1695 | 1 | 100% | -32 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 1885 | 1 | 100% | -27 |  |
| trailing_stop | trailCents=5 | KXOSCARACTO-27-TOM-20260507 | sideways | 2269 | 1 | 100% | -8 |  |
| trailing_stop | trailCents=5 | KXOSCARACTO-27-TOM-20260508 | sideways | 2270 | 1 | 100% | -11 |  |
| trailing_stop | trailCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 936 | 1 | 100% | -30 |  |
| trailing_stop | trailCents=5 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1697 | 1 | 100% | 2 |  |
| trailing_stop | trailCents=5 | KXLLM1-26DEC31-XAI-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 2079 | 1 | 100% | -17 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXLLM1-26MAY31-A-20260507 | sideways | 7783 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 2368 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 1887 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=5 | KXOSCARACTO-27-TOM-20260509 | sideways | 2465 | 1 | 100% | -6 |  |
| trailing_stop | trailCents=5 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 278 | 1 | 100% | -18 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 93 | 1 | 100% | -99 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXTOPARTIST-26B-DRA-20260508 | sideways | 2755 | 1 | 100% | -7 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1983 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=5 | KXIPOSPACEX-26JUN01-20260508 | sideways | 936 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=5 | KXIPOSPACEX-26JUN01-20260509 | sideways | 842 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=5 | KXLLM1-26MAY31-A-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1789 | 1 | 100% | 2 |  |
| trailing_stop | trailCents=5 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXLLM1-26DEC31-XAI-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 1885 | 1 | 100% | -28 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 5325 | 1 | 100% | 4 |  |
| trailing_stop | trailCents=5 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 3536 | 1 | 100% | 2 |  |
| trailing_stop | trailCents=5 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 12.83 | 1 | 15% | -12 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 6442 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXETH-26MAY0817-B2390-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 8936 | 1 | 100% | 9 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 279 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 6238 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3438 | 1 | 100% | 4 |  |
| trailing_stop | trailCents=5 | KXTIME-26-ZOH-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXLLM1-26DEC31-XAI-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1411 | 1 | 100% | -20 |  |
| trailing_stop | trailCents=5 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 1694 | 1 | 100% | -82 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 1791 | 1 | 100% | -14 |  |
| trailing_stop | trailCents=5 | KXIPO-26-DISCORD-20260510 | sideways | 5225 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=5 | KXLLM1-26MAY31-A-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 652 | 1 | 100% | -43 |  |
| trailing_stop | trailCents=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6035 | 1 | 100% | 12 |  |
| trailing_stop | trailCents=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 93 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 4029 | 1 | 100% | -6 |  |
| trailing_stop | trailCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 936 | 1 | 100% | -27 |  |
| trailing_stop | trailCents=5 | KXTIME-26-ZOH-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXTOPARTIST-26B-DRA-20260507 | sideways | 2367 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1034 | 1 | 100% | -39 |  |
| trailing_stop | trailCents=5 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 8726 | 1 | 100% | 39 |  |
| trailing_stop | trailCents=5 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 9891 | 1 | 100% | 36 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3733 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=5 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5427 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 4326 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 936 | 1 | 100% | -27 |  |
| trailing_stop | trailCents=5 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5226 | 1 | 100% | 6 |  |
| trailing_stop | trailCents=5 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1983 | 1 | 100% | -13 |  |
| trailing_stop | trailCents=5 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3536 | 1 | 100% | -11 |  |
| trailing_stop | trailCents=5 | KXOSCARPIC-27-DIS-20260509 | falling | 186 | 1 | 100% | -16 |  |
| trailing_stop | trailCents=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 93 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=5 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 654 | 1 | 100% | -12 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27MAR-C25-20260509 | falling | 2562 | 1 | 100% | -10 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 1983 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=5 | KXTIME-26-ZOH-20260509 | falling | 1410 | 1 | 100% | -12 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27JUN-C25-20260509 | falling | 372 | 1 | 100% | -41 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 6035 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 5124 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=5 | KXTOPARTIST-26B-DRA-20260509 | falling | 2852 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXCABOUT-26APR20-TGAB-20260507 | falling | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27OCT-H0-20260509 | falling | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3733 | 1 | 100% | 11 |  |
| trailing_stop | trailCents=10 | KXETH-26MAY0817-B2390-20260508 | rising | 92 | 1 | 100% | -42 |  |
| trailing_stop | trailCents=10 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7062 | 1 | 100% | 22 |  |
| trailing_stop | trailCents=10 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9148 | 1 | 100% | 32 |  |
| trailing_stop | trailCents=10 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 3732 | 1 | 100% | -3 |  |
| trailing_stop | trailCents=10 | KXINX-26MAY08H1600-B7387-20260508 | rising | 368 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=10 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8726 | 1 | 100% | 39 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-28JAN-H0-20260509 | rising | 2563 | 1 | 100% | -22 |  |
| trailing_stop | trailCents=10 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1410 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=10 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 4625 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=10 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3733 | 1 | 100% | 14 |  |
| trailing_stop | trailCents=10 | KXIPO-26-DISCORD-20260509 | rising | 4824 | 1 | 100% | 5 |  |
| trailing_stop | trailCents=10 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 3438 | 1 | 100% | 4 |  |
| trailing_stop | trailCents=10 | KXLLM1-26MAY09-GOOG-20260508 | rising | 12.85 | 1 | 15% | -13 |  |
| trailing_stop | trailCents=10 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4426 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=10 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 279 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27APR-H0-20260508 | rising | 6035 | 1 | 100% | -3 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27APR-H0-20260507 | rising | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1410 | 1 | 100% | -20 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXIPO-26-DISCORD-20260507 | sideways | 4824 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=10 | KXIPO-26-DISCORD-20260508 | sideways | 5124 | 1 | 100% | 6 |  |
| trailing_stop | trailCents=10 | KXLLM1-26MAY31-A-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 93 | 1 | 100% | -6 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXOSCARPIC-27-DIS-20260508 | sideways | 186 | 1 | 100% | -20 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 4525 | 1 | 100% | -9 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 3634 | 1 | 100% | -4 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27APR-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 1695 | 1 | 100% | -29 |  |
| trailing_stop | trailCents=10 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 654 | 1 | 100% | -9 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 3733 | 1 | 100% | -3 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 1695 | 1 | 100% | -32 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXOSCARACTO-27-TOM-20260507 | sideways | 2269 | 1 | 100% | -8 |  |
| trailing_stop | trailCents=10 | KXOSCARACTO-27-TOM-20260508 | sideways | 2270 | 1 | 100% | -11 |  |
| trailing_stop | trailCents=10 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 936 | 1 | 100% | -30 |  |
| trailing_stop | trailCents=10 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1697 | 1 | 100% | 2 |  |
| trailing_stop | trailCents=10 | KXLLM1-26DEC31-XAI-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXLLM1-26MAY31-A-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXOSCARACTO-27-TOM-20260509 | sideways | 2465 | 1 | 100% | -6 |  |
| trailing_stop | trailCents=10 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 278 | 1 | 100% | -18 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 93 | 1 | 100% | -99 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXTOPARTIST-26B-DRA-20260508 | sideways | 2755 | 1 | 100% | -7 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1983 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=10 | KXIPOSPACEX-26JUN01-20260508 | sideways | 936 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=10 | KXIPOSPACEX-26JUN01-20260509 | sideways | 842 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=10 | KXLLM1-26MAY31-A-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1890 | 1 | 100% | 4 |  |
| trailing_stop | trailCents=10 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXLLM1-26DEC31-XAI-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 2563 | 1 | 100% | -23 |  |
| trailing_stop | trailCents=10 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 12.83 | 1 | 15% | -12 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 6545 | 1 | 100% | 6 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXETH-26MAY0817-B2390-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 8937 | 1 | 100% | 33 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 279 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=10 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 6238 | 1 | 100% | 4 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3438 | 1 | 100% | 4 |  |
| trailing_stop | trailCents=10 | KXTIME-26-ZOH-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXLLM1-26DEC31-XAI-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1411 | 1 | 100% | -20 |  |
| trailing_stop | trailCents=10 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 1694 | 1 | 100% | -82 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXIPO-26-DISCORD-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXLLM1-26MAY31-A-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 652 | 1 | 100% | -43 |  |
| trailing_stop | trailCents=10 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6035 | 1 | 100% | 12 |  |
| trailing_stop | trailCents=10 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 93 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 936 | 1 | 100% | -27 |  |
| trailing_stop | trailCents=10 | KXTIME-26-ZOH-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXTOPARTIST-26B-DRA-20260507 | sideways | 2367 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=10 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1034 | 1 | 100% | -39 |  |
| trailing_stop | trailCents=10 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 8726 | 1 | 100% | 39 |  |
| trailing_stop | trailCents=10 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 9571 | 1 | 100% | 18 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3242 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=10 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5427 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 3733 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=10 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 936 | 1 | 100% | -27 |  |
| trailing_stop | trailCents=10 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5226 | 1 | 100% | 6 |  |
| trailing_stop | trailCents=10 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1410 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=10 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3535 | 1 | 100% | -6 |  |
| trailing_stop | trailCents=10 | KXOSCARPIC-27-DIS-20260509 | falling | 186 | 1 | 100% | -16 |  |
| trailing_stop | trailCents=10 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 93 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=10 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 654 | 1 | 100% | -12 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27MAR-C25-20260509 | falling | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 1601 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=10 | KXTIME-26-ZOH-20260509 | falling | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27JUN-C25-20260509 | falling | 372 | 1 | 100% | -41 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 6136 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 5125 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=10 | KXTOPARTIST-26B-DRA-20260509 | falling | 2852 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXCABOUT-26APR20-TGAB-20260507 | falling | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27OCT-H0-20260509 | falling | 0 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3733 | 1 | 100% | 13 |  |
| stop_loss | stopPriceCents=10 | KXETH-26MAY0817-B2390-20260508 | rising | 185 | 1 | 100% | -41 |  |
| stop_loss | stopPriceCents=10 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7062 | 1 | 100% | 22 |  |
| stop_loss | stopPriceCents=10 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9786 | 1 | 100% | 97 |  |
| stop_loss | stopPriceCents=10 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 2176 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=10 | KXINX-26MAY08H1600-B7387-20260508 | rising | 368 | 1 | 100% | -15 |  |
| stop_loss | stopPriceCents=10 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8726 | 1 | 100% | 39 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-28JAN-H0-20260509 | rising | 2563 | 1 | 100% | -23 |  |
| stop_loss | stopPriceCents=10 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1315 | 1 | 100% | -3 |  |
| stop_loss | stopPriceCents=10 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3733 | 1 | 100% | 14 |  |
| stop_loss | stopPriceCents=10 | KXIPO-26-DISCORD-20260509 | rising | 4923 | 1 | 100% | 2 |  |
| stop_loss | stopPriceCents=10 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 3438 | 1 | 100% | 3 |  |
| stop_loss | stopPriceCents=10 | KXLLM1-26MAY09-GOOG-20260508 | rising | 12.85 | 1 | 15% | -13 |  |
| stop_loss | stopPriceCents=10 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4426 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=10 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 279 | 1 | 100% | -5 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27APR-H0-20260508 | rising | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 2176 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27APR-H0-20260507 | rising | 5933 | 1 | 100% | 9 |  |
| stop_loss | stopPriceCents=10 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1410 | 1 | 100% | -20 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 1789 | 1 | 100% | -30 |  |
| stop_loss | stopPriceCents=10 | KXIPO-26-DISCORD-20260507 | sideways | 4824 | 1 | 100% | 1 |  |
| stop_loss | stopPriceCents=10 | KXIPO-26-DISCORD-20260508 | sideways | 5124 | 1 | 100% | 6 |  |
| stop_loss | stopPriceCents=10 | KXLLM1-26MAY31-A-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 93 | 1 | 100% | -6 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 1791 | 1 | 100% | -32 |  |
| stop_loss | stopPriceCents=10 | KXOSCARPIC-27-DIS-20260508 | sideways | 186 | 1 | 100% | -20 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27APR-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 1695 | 1 | 100% | -29 |  |
| stop_loss | stopPriceCents=10 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 654 | 1 | 100% | -9 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 1695 | 1 | 100% | -32 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 1885 | 1 | 100% | -28 |  |
| stop_loss | stopPriceCents=10 | KXOSCARACTO-27-TOM-20260507 | sideways | 2269 | 1 | 100% | -8 |  |
| stop_loss | stopPriceCents=10 | KXOSCARACTO-27-TOM-20260508 | sideways | 2270 | 1 | 100% | -11 |  |
| stop_loss | stopPriceCents=10 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 842 | 1 | 100% | -25 |  |
| stop_loss | stopPriceCents=10 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1697 | 1 | 100% | 2 |  |
| stop_loss | stopPriceCents=10 | KXLLM1-26DEC31-XAI-20260508 | sideways | 562 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=10 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 562 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 1789 | 1 | 100% | -32 |  |
| stop_loss | stopPriceCents=10 | KXLLM1-26MAY31-A-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 1887 | 1 | 100% | -6 |  |
| stop_loss | stopPriceCents=10 | KXOSCARACTO-27-TOM-20260509 | sideways | 2465 | 1 | 100% | -6 |  |
| stop_loss | stopPriceCents=10 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 278 | 1 | 100% | -18 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 93 | 1 | 100% | -99 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 1887 | 1 | 100% | -8 |  |
| stop_loss | stopPriceCents=10 | KXTOPARTIST-26B-DRA-20260508 | sideways | 2465 | 1 | 100% | -8 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1983 | 1 | 100% | -15 |  |
| stop_loss | stopPriceCents=10 | KXIPOSPACEX-26JUN01-20260508 | sideways | 936 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=10 | KXIPOSPACEX-26JUN01-20260509 | sideways | 842 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=10 | KXLLM1-26MAY31-A-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1889 | 1 | 100% | 1 |  |
| stop_loss | stopPriceCents=10 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXLLM1-26DEC31-XAI-20260509 | sideways | 653 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=10 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 1982 | 1 | 100% | -28 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 2077 | 1 | 100% | -16 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 2665 | 1 | 100% | -23 |  |
| stop_loss | stopPriceCents=10 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 12.83 | 1 | 15% | -12 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 557 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=10 | KXETH-26MAY0817-B2390-20260507 | sideways | 279 | 1 | 100% | -39 |  |
| stop_loss | stopPriceCents=10 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 1982 | 1 | 100% | -29 |  |
| stop_loss | stopPriceCents=10 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 279 | 1 | 100% | -5 |  |
| stop_loss | stopPriceCents=10 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 654 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3437 | 1 | 100% | 4 |  |
| stop_loss | stopPriceCents=10 | KXTIME-26-ZOH-20260508 | sideways | 1694 | 1 | 100% | -11 |  |
| stop_loss | stopPriceCents=10 | KXLLM1-26DEC31-XAI-20260507 | sideways | 559 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=10 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1411 | 1 | 100% | -20 |  |
| stop_loss | stopPriceCents=10 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 1694 | 1 | 100% | -82 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXIPO-26-DISCORD-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXLLM1-26MAY31-A-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 652 | 1 | 100% | -43 |  |
| stop_loss | stopPriceCents=10 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6035 | 1 | 100% | 12 |  |
| stop_loss | stopPriceCents=10 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 93 | 1 | 100% | -15 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 936 | 1 | 100% | -27 |  |
| stop_loss | stopPriceCents=10 | KXTIME-26-ZOH-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXTOPARTIST-26B-DRA-20260507 | sideways | 2367 | 1 | 100% | -9 |  |
| stop_loss | stopPriceCents=10 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1034 | 1 | 100% | -39 |  |
| stop_loss | stopPriceCents=10 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 8726 | 1 | 100% | 39 |  |
| stop_loss | stopPriceCents=10 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 1601 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=10 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5427 | 1 | 100% | 3 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 1792 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=10 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 936 | 1 | 100% | -27 |  |
| stop_loss | stopPriceCents=10 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 4824 | 1 | 100% | 14 |  |
| stop_loss | stopPriceCents=10 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1983 | 1 | 100% | -13 |  |
| stop_loss | stopPriceCents=10 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 2560 | 1 | 100% | -12 |  |
| stop_loss | stopPriceCents=10 | KXOSCARPIC-27-DIS-20260509 | falling | 186 | 1 | 100% | -16 |  |
| stop_loss | stopPriceCents=10 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 93 | 1 | 100% | -15 |  |
| stop_loss | stopPriceCents=10 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 654 | 1 | 100% | -12 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27MAR-C25-20260509 | falling | 2562 | 1 | 100% | -12 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXTIME-26-ZOH-20260509 | falling | 1791 | 1 | 100% | -10 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27JUN-C25-20260509 | falling | 372 | 1 | 100% | -41 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXTOPARTIST-26B-DRA-20260509 | falling | 2852 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXCABOUT-26APR20-TGAB-20260507 | falling | 3733 | 1 | 100% | 2 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27OCT-H0-20260509 | falling | 1791 | 1 | 100% | -28 |  |
| stop_loss | stopPriceCents=10 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3733 | 1 | 100% | 3 |  |
| stop_loss | stopPriceCents=30 | KXETH-26MAY0817-B2390-20260508 | rising | 185 | 1 | 100% | -41 |  |
| stop_loss | stopPriceCents=30 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7062 | 1 | 100% | 22 |  |
| stop_loss | stopPriceCents=30 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9148 | 1 | 100% | 32 |  |
| stop_loss | stopPriceCents=30 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 3438 | 1 | 100% | 2 |  |
| stop_loss | stopPriceCents=30 | KXINX-26MAY08H1600-B7387-20260508 | rising | 368 | 1 | 100% | -15 |  |
| stop_loss | stopPriceCents=30 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8726 | 1 | 100% | 39 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-28JAN-H0-20260509 | rising | 2563 | 1 | 100% | -23 |  |
| stop_loss | stopPriceCents=30 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1315 | 1 | 100% | -3 |  |
| stop_loss | stopPriceCents=30 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 3634 | 1 | 100% | 1 |  |
| stop_loss | stopPriceCents=30 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3733 | 1 | 100% | 14 |  |
| stop_loss | stopPriceCents=30 | KXIPO-26-DISCORD-20260509 | rising | 4923 | 1 | 100% | 2 |  |
| stop_loss | stopPriceCents=30 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 3438 | 1 | 100% | 3 |  |
| stop_loss | stopPriceCents=30 | KXLLM1-26MAY09-GOOG-20260508 | rising | 12.85 | 1 | 15% | -13 |  |
| stop_loss | stopPriceCents=30 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4426 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=30 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 279 | 1 | 100% | -5 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27APR-H0-20260508 | rising | 6035 | 1 | 100% | 4 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 2078 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27APR-H0-20260507 | rising | 5933 | 1 | 100% | 9 |  |
| stop_loss | stopPriceCents=30 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1410 | 1 | 100% | -20 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 1789 | 1 | 100% | -30 |  |
| stop_loss | stopPriceCents=30 | KXIPO-26-DISCORD-20260507 | sideways | 4824 | 1 | 100% | 1 |  |
| stop_loss | stopPriceCents=30 | KXIPO-26-DISCORD-20260508 | sideways | 4923 | 1 | 100% | -3 |  |
| stop_loss | stopPriceCents=30 | KXLLM1-26MAY31-A-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 93 | 1 | 100% | -6 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 1791 | 1 | 100% | -32 |  |
| stop_loss | stopPriceCents=30 | KXOSCARPIC-27-DIS-20260508 | sideways | 186 | 1 | 100% | -20 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 4227 | 1 | 100% | 1 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27APR-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 1695 | 1 | 100% | -29 |  |
| stop_loss | stopPriceCents=30 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 654 | 1 | 100% | -9 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 3634 | 1 | 100% | -7 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 1695 | 1 | 100% | -32 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 1885 | 1 | 100% | -28 |  |
| stop_loss | stopPriceCents=30 | KXOSCARACTO-27-TOM-20260507 | sideways | 2269 | 1 | 100% | -8 |  |
| stop_loss | stopPriceCents=30 | KXOSCARACTO-27-TOM-20260508 | sideways | 2270 | 1 | 100% | -11 |  |
| stop_loss | stopPriceCents=30 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 842 | 1 | 100% | -25 |  |
| stop_loss | stopPriceCents=30 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1697 | 1 | 100% | 2 |  |
| stop_loss | stopPriceCents=30 | KXLLM1-26DEC31-XAI-20260508 | sideways | 562 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=30 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 562 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 1789 | 1 | 100% | -32 |  |
| stop_loss | stopPriceCents=30 | KXLLM1-26MAY31-A-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 2368 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 1887 | 1 | 100% | -6 |  |
| stop_loss | stopPriceCents=30 | KXOSCARACTO-27-TOM-20260509 | sideways | 2465 | 1 | 100% | -6 |  |
| stop_loss | stopPriceCents=30 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 278 | 1 | 100% | -18 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 93 | 1 | 100% | -99 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 1887 | 1 | 100% | -8 |  |
| stop_loss | stopPriceCents=30 | KXTOPARTIST-26B-DRA-20260508 | sideways | 2465 | 1 | 100% | -8 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1983 | 1 | 100% | -15 |  |
| stop_loss | stopPriceCents=30 | KXIPOSPACEX-26JUN01-20260508 | sideways | 936 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=30 | KXIPOSPACEX-26JUN01-20260509 | sideways | 842 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=30 | KXLLM1-26MAY31-A-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1889 | 1 | 100% | 1 |  |
| stop_loss | stopPriceCents=30 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 1791 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=30 | KXLLM1-26DEC31-XAI-20260509 | sideways | 653 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=30 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 1982 | 1 | 100% | -28 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 2077 | 1 | 100% | -16 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 2665 | 1 | 100% | -23 |  |
| stop_loss | stopPriceCents=30 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 3242 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=30 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 12.83 | 1 | 15% | -12 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 2272 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 2562 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=30 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 557 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=30 | KXETH-26MAY0817-B2390-20260507 | sideways | 279 | 1 | 100% | -39 |  |
| stop_loss | stopPriceCents=30 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 8937 | 1 | 100% | 33 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 1982 | 1 | 100% | -29 |  |
| stop_loss | stopPriceCents=30 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 279 | 1 | 100% | -5 |  |
| stop_loss | stopPriceCents=30 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 654 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 2272 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 2368 | 1 | 100% | -3 |  |
| stop_loss | stopPriceCents=30 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3437 | 1 | 100% | 4 |  |
| stop_loss | stopPriceCents=30 | KXTIME-26-ZOH-20260508 | sideways | 1694 | 1 | 100% | -11 |  |
| stop_loss | stopPriceCents=30 | KXLLM1-26DEC31-XAI-20260507 | sideways | 559 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=30 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1411 | 1 | 100% | -20 |  |
| stop_loss | stopPriceCents=30 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 1694 | 1 | 100% | -82 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 1790 | 1 | 100% | -13 |  |
| stop_loss | stopPriceCents=30 | KXIPO-26-DISCORD-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXLLM1-26MAY31-A-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 652 | 1 | 100% | -43 |  |
| stop_loss | stopPriceCents=30 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6035 | 1 | 100% | 12 |  |
| stop_loss | stopPriceCents=30 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 93 | 1 | 100% | -15 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 4029 | 1 | 100% | -6 |  |
| stop_loss | stopPriceCents=30 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 936 | 1 | 100% | -27 |  |
| stop_loss | stopPriceCents=30 | KXTIME-26-ZOH-20260510 | sideways | 1503 | 1 | 100% | -3 |  |
| stop_loss | stopPriceCents=30 | KXTOPARTIST-26B-DRA-20260507 | sideways | 2367 | 1 | 100% | -9 |  |
| stop_loss | stopPriceCents=30 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1034 | 1 | 100% | -39 |  |
| stop_loss | stopPriceCents=30 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 8726 | 1 | 100% | 39 |  |
| stop_loss | stopPriceCents=30 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3733 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=30 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5326 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 3635 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=30 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 936 | 1 | 100% | -27 |  |
| stop_loss | stopPriceCents=30 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5226 | 1 | 100% | 6 |  |
| stop_loss | stopPriceCents=30 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1983 | 1 | 100% | -13 |  |
| stop_loss | stopPriceCents=30 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3536 | 1 | 100% | -9 |  |
| stop_loss | stopPriceCents=30 | KXOSCARPIC-27-DIS-20260509 | falling | 186 | 1 | 100% | -16 |  |
| stop_loss | stopPriceCents=30 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 93 | 1 | 100% | -15 |  |
| stop_loss | stopPriceCents=30 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 654 | 1 | 100% | -12 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27MAR-C25-20260509 | falling | 2562 | 1 | 100% | -12 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 2272 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=30 | KXTIME-26-ZOH-20260509 | falling | 1694 | 1 | 100% | -12 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27JUN-C25-20260509 | falling | 372 | 1 | 100% | -41 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXTOPARTIST-26B-DRA-20260509 | falling | 2950 | 1 | 100% | -5 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 3733 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=30 | KXCABOUT-26APR20-TGAB-20260507 | falling | 3733 | 1 | 100% | 2 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27OCT-H0-20260509 | falling | 1791 | 1 | 100% | -28 |  |
| stop_loss | stopPriceCents=30 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3733 | 1 | 100% | 8 |  |
| stop_loss | stopPriceCents=50 | KXETH-26MAY0817-B2390-20260508 | rising | 185 | 1 | 100% | -41 |  |
| stop_loss | stopPriceCents=50 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7062 | 1 | 100% | 22 |  |
| stop_loss | stopPriceCents=50 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9148 | 1 | 100% | 32 |  |
| stop_loss | stopPriceCents=50 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 3438 | 1 | 100% | 2 |  |
| stop_loss | stopPriceCents=50 | KXINX-26MAY08H1600-B7387-20260508 | rising | 368 | 1 | 100% | -15 |  |
| stop_loss | stopPriceCents=50 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8726 | 1 | 100% | 39 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-28JAN-H0-20260509 | rising | 2563 | 1 | 100% | -23 |  |
| stop_loss | stopPriceCents=50 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1315 | 1 | 100% | -3 |  |
| stop_loss | stopPriceCents=50 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 3634 | 1 | 100% | 1 |  |
| stop_loss | stopPriceCents=50 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3733 | 1 | 100% | 14 |  |
| stop_loss | stopPriceCents=50 | KXIPO-26-DISCORD-20260509 | rising | 4923 | 1 | 100% | 2 |  |
| stop_loss | stopPriceCents=50 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 3438 | 1 | 100% | 3 |  |
| stop_loss | stopPriceCents=50 | KXLLM1-26MAY09-GOOG-20260508 | rising | 12.85 | 1 | 15% | -13 |  |
| stop_loss | stopPriceCents=50 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4426 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=50 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 279 | 1 | 100% | -5 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27APR-H0-20260508 | rising | 6035 | 1 | 100% | 4 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 2078 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27APR-H0-20260507 | rising | 5933 | 1 | 100% | 9 |  |
| stop_loss | stopPriceCents=50 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1410 | 1 | 100% | -20 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 1789 | 1 | 100% | -30 |  |
| stop_loss | stopPriceCents=50 | KXIPO-26-DISCORD-20260507 | sideways | 4824 | 1 | 100% | 1 |  |
| stop_loss | stopPriceCents=50 | KXIPO-26-DISCORD-20260508 | sideways | 4923 | 1 | 100% | -3 |  |
| stop_loss | stopPriceCents=50 | KXLLM1-26MAY31-A-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=50 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 93 | 1 | 100% | -6 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 1791 | 1 | 100% | -32 |  |
| stop_loss | stopPriceCents=50 | KXOSCARPIC-27-DIS-20260508 | sideways | 186 | 1 | 100% | -20 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 3930 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 4525 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 4227 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27APR-H0-20260509 | sideways | 6647 | 1 | 100% | 3 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 1695 | 1 | 100% | -29 |  |
| stop_loss | stopPriceCents=50 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 654 | 1 | 100% | -9 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 4029 | 1 | 100% | -6 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 1695 | 1 | 100% | -32 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 1885 | 1 | 100% | -28 |  |
| stop_loss | stopPriceCents=50 | KXOSCARACTO-27-TOM-20260507 | sideways | 2269 | 1 | 100% | -8 |  |
| stop_loss | stopPriceCents=50 | KXOSCARACTO-27-TOM-20260508 | sideways | 2270 | 1 | 100% | -11 |  |
| stop_loss | stopPriceCents=50 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 842 | 1 | 100% | -25 |  |
| stop_loss | stopPriceCents=50 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1697 | 1 | 100% | 2 |  |
| stop_loss | stopPriceCents=50 | KXLLM1-26DEC31-XAI-20260508 | sideways | 562 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=50 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 562 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 1789 | 1 | 100% | -32 |  |
| stop_loss | stopPriceCents=50 | KXLLM1-26MAY31-A-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 2368 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 1887 | 1 | 100% | -6 |  |
| stop_loss | stopPriceCents=50 | KXOSCARACTO-27-TOM-20260509 | sideways | 2465 | 1 | 100% | -6 |  |
| stop_loss | stopPriceCents=50 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 278 | 1 | 100% | -18 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 93 | 1 | 100% | -99 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 1887 | 1 | 100% | -8 |  |
| stop_loss | stopPriceCents=50 | KXTOPARTIST-26B-DRA-20260508 | sideways | 2465 | 1 | 100% | -8 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1983 | 1 | 100% | -15 |  |
| stop_loss | stopPriceCents=50 | KXIPOSPACEX-26JUN01-20260508 | sideways | 936 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=50 | KXIPOSPACEX-26JUN01-20260509 | sideways | 842 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=50 | KXLLM1-26MAY31-A-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=50 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1889 | 1 | 100% | 1 |  |
| stop_loss | stopPriceCents=50 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 1791 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=50 | KXLLM1-26DEC31-XAI-20260509 | sideways | 653 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=50 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=50 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 1982 | 1 | 100% | -28 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 2077 | 1 | 100% | -16 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 2665 | 1 | 100% | -23 |  |
| stop_loss | stopPriceCents=50 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 3242 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=50 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 12.83 | 1 | 15% | -12 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 2272 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 6545 | 1 | 100% | 6 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 2562 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=50 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=50 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 557 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=50 | KXETH-26MAY0817-B2390-20260507 | sideways | 279 | 1 | 100% | -39 |  |
| stop_loss | stopPriceCents=50 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 8937 | 1 | 100% | 33 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 1982 | 1 | 100% | -29 |  |
| stop_loss | stopPriceCents=50 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 279 | 1 | 100% | -5 |  |
| stop_loss | stopPriceCents=50 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 654 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 2272 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 6238 | 1 | 100% | 1 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 2368 | 1 | 100% | -3 |  |
| stop_loss | stopPriceCents=50 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3437 | 1 | 100% | 4 |  |
| stop_loss | stopPriceCents=50 | KXTIME-26-ZOH-20260508 | sideways | 1694 | 1 | 100% | -11 |  |
| stop_loss | stopPriceCents=50 | KXLLM1-26DEC31-XAI-20260507 | sideways | 559 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=50 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1411 | 1 | 100% | -20 |  |
| stop_loss | stopPriceCents=50 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 1694 | 1 | 100% | -82 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 1790 | 1 | 100% | -13 |  |
| stop_loss | stopPriceCents=50 | KXIPO-26-DISCORD-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=50 | KXLLM1-26MAY31-A-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=50 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 652 | 1 | 100% | -43 |  |
| stop_loss | stopPriceCents=50 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6035 | 1 | 100% | 12 |  |
| stop_loss | stopPriceCents=50 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 93 | 1 | 100% | -15 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 5024 | 1 | 100% | -4 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 4227 | 1 | 100% | -4 |  |
| stop_loss | stopPriceCents=50 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 936 | 1 | 100% | -27 |  |
| stop_loss | stopPriceCents=50 | KXTIME-26-ZOH-20260510 | sideways | 1503 | 1 | 100% | -3 |  |
| stop_loss | stopPriceCents=50 | KXTOPARTIST-26B-DRA-20260507 | sideways | 2367 | 1 | 100% | -9 |  |
| stop_loss | stopPriceCents=50 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1034 | 1 | 100% | -39 |  |
| stop_loss | stopPriceCents=50 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 8726 | 1 | 100% | 39 |  |
| stop_loss | stopPriceCents=50 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 9893 | 1 | 100% | 53 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3930 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=50 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5326 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 3635 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=50 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 936 | 1 | 100% | -27 |  |
| stop_loss | stopPriceCents=50 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5226 | 1 | 100% | 1 |  |
| stop_loss | stopPriceCents=50 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1983 | 1 | 100% | -13 |  |
| stop_loss | stopPriceCents=50 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3536 | 1 | 100% | -9 |  |
| stop_loss | stopPriceCents=50 | KXOSCARPIC-27-DIS-20260509 | falling | 186 | 1 | 100% | -16 |  |
| stop_loss | stopPriceCents=50 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 93 | 1 | 100% | -15 |  |
| stop_loss | stopPriceCents=50 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 654 | 1 | 100% | -12 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27MAR-C25-20260509 | falling | 2562 | 1 | 100% | -12 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 2272 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=50 | KXTIME-26-ZOH-20260509 | falling | 1694 | 1 | 100% | -12 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27JUN-C25-20260509 | falling | 372 | 1 | 100% | -41 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 4824 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 5124 | 1 | 100% | -3 |  |
| stop_loss | stopPriceCents=50 | KXTOPARTIST-26B-DRA-20260509 | falling | 2950 | 1 | 100% | -5 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 4029 | 1 | 100% | -4 |  |
| stop_loss | stopPriceCents=50 | KXCABOUT-26APR20-TGAB-20260507 | falling | 3733 | 1 | 100% | 2 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27OCT-H0-20260509 | falling | 1791 | 1 | 100% | -28 |  |
| stop_loss | stopPriceCents=50 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3733 | 1 | 100% | 8 |  |
| take_profit | targetPriceCents=40 | KXETH-26MAY0817-B2390-20260508 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 9893 | 1 | 100% | 20 |  |
| take_profit | targetPriceCents=40 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 8726 | 1 | 100% | 0 |  |
| take_profit | targetPriceCents=40 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 8514 | 1 | 100% | -1 |  |
| take_profit | targetPriceCents=40 | KXINX-26MAY08H1600-B7387-20260508 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 9360 | 1 | 100% | 4 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-28JAN-H0-20260509 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXCABOUT-26APR20-TGAB-20260509 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXIPO-26-DISCORD-20260509 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXLLM1-26MAY09-GOOG-20260508 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27APR-H0-20260508 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27APR-H0-20260507 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXBTC-26MAY0817-B79750-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXIPO-26-DISCORD-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXIPO-26-DISCORD-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXLLM1-26MAY31-A-20260509 | sideways | 8094 | 1 | 100% | -3 |  |
| take_profit | targetPriceCents=40 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXOSCARPIC-27-DIS-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27APR-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXOSCARACTO-27-TOM-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXOSCARACTO-27-TOM-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXLLM1-26DEC31-XAI-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXLLM1-26MAY31-A-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXOSCARACTO-27-TOM-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXTOPARTIST-26B-DRA-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXIPOSPACEX-26JUN01-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXIPOSPACEX-26JUN01-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXLLM1-26MAY31-A-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXLLM1-26DEC31-XAI-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXETH-26MAY0817-B2390-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXTIME-26-ZOH-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXLLM1-26DEC31-XAI-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXBTC-26MAY0817-B79750-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXIPO-26-DISCORD-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXLLM1-26MAY31-A-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXTIME-26-ZOH-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXTOPARTIST-26B-DRA-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXOSCARPIC-27-DIS-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27MAR-C25-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXTIME-26-ZOH-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27JUN-C25-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXTOPARTIST-26B-DRA-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXCABOUT-26APR20-TGAB-20260507 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27OCT-H0-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXCABOUT-26APR20-TGAB-20260508 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXETH-26MAY0817-B2390-20260508 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 9893 | 1 | 100% | 20 |  |
| take_profit | targetPriceCents=50 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 8726 | 1 | 100% | 0 |  |
| take_profit | targetPriceCents=50 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 8514 | 1 | 100% | -1 |  |
| take_profit | targetPriceCents=50 | KXINX-26MAY08H1600-B7387-20260508 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 9360 | 1 | 100% | 4 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-28JAN-H0-20260509 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXCABOUT-26APR20-TGAB-20260509 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXIPO-26-DISCORD-20260509 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXLLM1-26MAY09-GOOG-20260508 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27APR-H0-20260508 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27APR-H0-20260507 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXBTC-26MAY0817-B79750-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXIPO-26-DISCORD-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXIPO-26-DISCORD-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXLLM1-26MAY31-A-20260509 | sideways | 8094 | 1 | 100% | -3 |  |
| take_profit | targetPriceCents=50 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXOSCARPIC-27-DIS-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27APR-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXOSCARACTO-27-TOM-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXOSCARACTO-27-TOM-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXLLM1-26DEC31-XAI-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXLLM1-26MAY31-A-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXOSCARACTO-27-TOM-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXTOPARTIST-26B-DRA-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXIPOSPACEX-26JUN01-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXIPOSPACEX-26JUN01-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXLLM1-26MAY31-A-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXLLM1-26DEC31-XAI-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXETH-26MAY0817-B2390-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXTIME-26-ZOH-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXLLM1-26DEC31-XAI-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXBTC-26MAY0817-B79750-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXIPO-26-DISCORD-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXLLM1-26MAY31-A-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXTIME-26-ZOH-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXTOPARTIST-26B-DRA-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXOSCARPIC-27-DIS-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27MAR-C25-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXTIME-26-ZOH-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27JUN-C25-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXTOPARTIST-26B-DRA-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXCABOUT-26APR20-TGAB-20260507 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27OCT-H0-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXCABOUT-26APR20-TGAB-20260508 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXETH-26MAY0817-B2390-20260508 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 9893 | 1 | 100% | 20 |  |
| take_profit | targetPriceCents=60 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 8726 | 1 | 100% | 0 |  |
| take_profit | targetPriceCents=60 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 8514 | 1 | 100% | -1 |  |
| take_profit | targetPriceCents=60 | KXINX-26MAY08H1600-B7387-20260508 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 9360 | 1 | 100% | 4 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-28JAN-H0-20260509 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXCABOUT-26APR20-TGAB-20260509 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXIPO-26-DISCORD-20260509 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXLLM1-26MAY09-GOOG-20260508 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27APR-H0-20260508 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27APR-H0-20260507 | rising | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXBTC-26MAY0817-B79750-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXIPO-26-DISCORD-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXIPO-26-DISCORD-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXLLM1-26MAY31-A-20260509 | sideways | 8094 | 1 | 100% | -3 |  |
| take_profit | targetPriceCents=60 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXOSCARPIC-27-DIS-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27APR-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXOSCARACTO-27-TOM-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXOSCARACTO-27-TOM-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXLLM1-26DEC31-XAI-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXLLM1-26MAY31-A-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXOSCARACTO-27-TOM-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXTOPARTIST-26B-DRA-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXIPOSPACEX-26JUN01-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXIPOSPACEX-26JUN01-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXLLM1-26MAY31-A-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXLLM1-26DEC31-XAI-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXETH-26MAY0817-B2390-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXTIME-26-ZOH-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXLLM1-26DEC31-XAI-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXBTC-26MAY0817-B79750-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXIPO-26-DISCORD-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXLLM1-26MAY31-A-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXTIME-26-ZOH-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXTOPARTIST-26B-DRA-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXOSCARPIC-27-DIS-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27MAR-C25-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXTIME-26-ZOH-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27JUN-C25-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXTOPARTIST-26B-DRA-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXCABOUT-26APR20-TGAB-20260507 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27OCT-H0-20260509 | falling | 0 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXCABOUT-26APR20-TGAB-20260508 | falling | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXETH-26MAY0817-B2390-20260508 | rising | 185 | 1 | 100% | -41 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7062 | 1 | 100% | 22 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9148 | 1 | 100% | 32 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 3438 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXINX-26MAY08H1600-B7387-20260508 | rising | 368 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8726 | 1 | 100% | 39 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-28JAN-H0-20260509 | rising | 2563 | 1 | 100% | -23 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1315 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 3634 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3733 | 1 | 100% | 14 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXIPO-26-DISCORD-20260509 | rising | 4923 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 3438 | 1 | 100% | 3 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXLLM1-26MAY09-GOOG-20260508 | rising | 12.85 | 1 | 15% | -13 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4426 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 279 | 1 | 100% | -5 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27APR-H0-20260508 | rising | 6035 | 1 | 100% | 4 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 2078 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27APR-H0-20260507 | rising | 5933 | 1 | 100% | 9 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1410 | 1 | 100% | -20 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 1789 | 1 | 100% | -30 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXIPO-26-DISCORD-20260507 | sideways | 4824 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXIPO-26-DISCORD-20260508 | sideways | 4923 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXLLM1-26MAY31-A-20260509 | sideways | 8094 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 93 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 1791 | 1 | 100% | -32 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXOSCARPIC-27-DIS-20260508 | sideways | 186 | 1 | 100% | -20 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 4227 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27APR-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 1695 | 1 | 100% | -29 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 654 | 1 | 100% | -9 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 3634 | 1 | 100% | -7 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 1695 | 1 | 100% | -32 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 1885 | 1 | 100% | -28 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXOSCARACTO-27-TOM-20260507 | sideways | 2269 | 1 | 100% | -8 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXOSCARACTO-27-TOM-20260508 | sideways | 2270 | 1 | 100% | -11 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 842 | 1 | 100% | -25 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1697 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXLLM1-26DEC31-XAI-20260508 | sideways | 562 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 562 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 1789 | 1 | 100% | -32 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXLLM1-26MAY31-A-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 2368 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 1887 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXOSCARACTO-27-TOM-20260509 | sideways | 2465 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 278 | 1 | 100% | -18 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 93 | 1 | 100% | -99 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 1887 | 1 | 100% | -8 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXTOPARTIST-26B-DRA-20260508 | sideways | 2465 | 1 | 100% | -8 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1983 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXIPOSPACEX-26JUN01-20260508 | sideways | 936 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXIPOSPACEX-26JUN01-20260509 | sideways | 842 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXLLM1-26MAY31-A-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1889 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 1791 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXLLM1-26DEC31-XAI-20260509 | sideways | 653 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 1982 | 1 | 100% | -28 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 2077 | 1 | 100% | -16 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 2665 | 1 | 100% | -23 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 3242 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 12.83 | 1 | 15% | -12 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 2272 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 2562 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 557 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXETH-26MAY0817-B2390-20260507 | sideways | 279 | 1 | 100% | -39 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 8937 | 1 | 100% | 33 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 1982 | 1 | 100% | -29 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 279 | 1 | 100% | -5 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 654 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 2272 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 2368 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3437 | 1 | 100% | 4 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXTIME-26-ZOH-20260508 | sideways | 1694 | 1 | 100% | -11 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXLLM1-26DEC31-XAI-20260507 | sideways | 559 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1411 | 1 | 100% | -20 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 1694 | 1 | 100% | -82 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 1790 | 1 | 100% | -13 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXIPO-26-DISCORD-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXLLM1-26MAY31-A-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 652 | 1 | 100% | -43 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6035 | 1 | 100% | 12 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 93 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 4029 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 936 | 1 | 100% | -27 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXTIME-26-ZOH-20260510 | sideways | 1503 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXTOPARTIST-26B-DRA-20260507 | sideways | 2367 | 1 | 100% | -9 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1034 | 1 | 100% | -39 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 8726 | 1 | 100% | 39 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3733 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5326 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 3635 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 936 | 1 | 100% | -27 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5226 | 1 | 100% | 6 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1983 | 1 | 100% | -13 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3536 | 1 | 100% | -9 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXOSCARPIC-27-DIS-20260509 | falling | 186 | 1 | 100% | -16 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 93 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 654 | 1 | 100% | -12 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27MAR-C25-20260509 | falling | 2562 | 1 | 100% | -12 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 2272 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXTIME-26-ZOH-20260509 | falling | 1694 | 1 | 100% | -12 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27JUN-C25-20260509 | falling | 372 | 1 | 100% | -41 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXTOPARTIST-26B-DRA-20260509 | falling | 2950 | 1 | 100% | -5 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 3733 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXCABOUT-26APR20-TGAB-20260507 | falling | 3733 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27OCT-H0-20260509 | falling | 1791 | 1 | 100% | -28 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3733 | 1 | 100% | 8 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXETH-26MAY0817-B2390-20260508 | rising | 185 | 1 | 100% | -41 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7062 | 1 | 100% | 22 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9148 | 1 | 100% | 32 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 3438 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXINX-26MAY08H1600-B7387-20260508 | rising | 368 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8726 | 1 | 100% | 39 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-28JAN-H0-20260509 | rising | 2563 | 1 | 100% | -23 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1315 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 3634 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3733 | 1 | 100% | 14 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXIPO-26-DISCORD-20260509 | rising | 4923 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 3438 | 1 | 100% | 3 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXLLM1-26MAY09-GOOG-20260508 | rising | 12.85 | 1 | 15% | -13 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4426 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 279 | 1 | 100% | -5 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27APR-H0-20260508 | rising | 6035 | 1 | 100% | 4 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 2078 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27APR-H0-20260507 | rising | 5933 | 1 | 100% | 9 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1410 | 1 | 100% | -20 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 1789 | 1 | 100% | -30 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXIPO-26-DISCORD-20260507 | sideways | 4824 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXIPO-26-DISCORD-20260508 | sideways | 4923 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXLLM1-26MAY31-A-20260509 | sideways | 8094 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 93 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 1791 | 1 | 100% | -32 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXOSCARPIC-27-DIS-20260508 | sideways | 186 | 1 | 100% | -20 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 4227 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27APR-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 1695 | 1 | 100% | -29 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 654 | 1 | 100% | -9 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 3634 | 1 | 100% | -7 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 1695 | 1 | 100% | -32 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 1885 | 1 | 100% | -28 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXOSCARACTO-27-TOM-20260507 | sideways | 2269 | 1 | 100% | -8 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXOSCARACTO-27-TOM-20260508 | sideways | 2270 | 1 | 100% | -11 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 842 | 1 | 100% | -25 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1697 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXLLM1-26DEC31-XAI-20260508 | sideways | 562 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 562 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 1789 | 1 | 100% | -32 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXLLM1-26MAY31-A-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 2368 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 1887 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXOSCARACTO-27-TOM-20260509 | sideways | 2465 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 278 | 1 | 100% | -18 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 93 | 1 | 100% | -99 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 1887 | 1 | 100% | -8 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXTOPARTIST-26B-DRA-20260508 | sideways | 2465 | 1 | 100% | -8 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1983 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXIPOSPACEX-26JUN01-20260508 | sideways | 936 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXIPOSPACEX-26JUN01-20260509 | sideways | 842 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXLLM1-26MAY31-A-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1889 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 1791 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXLLM1-26DEC31-XAI-20260509 | sideways | 653 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 1982 | 1 | 100% | -28 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 2077 | 1 | 100% | -16 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 2665 | 1 | 100% | -23 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 3242 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 12.83 | 1 | 15% | -12 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 2272 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 2562 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 557 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXETH-26MAY0817-B2390-20260507 | sideways | 279 | 1 | 100% | -39 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 8937 | 1 | 100% | 33 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 1982 | 1 | 100% | -29 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 279 | 1 | 100% | -5 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 654 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 2272 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 2368 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3437 | 1 | 100% | 4 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXTIME-26-ZOH-20260508 | sideways | 1694 | 1 | 100% | -11 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXLLM1-26DEC31-XAI-20260507 | sideways | 559 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1411 | 1 | 100% | -20 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 1694 | 1 | 100% | -82 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 1790 | 1 | 100% | -13 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXIPO-26-DISCORD-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXLLM1-26MAY31-A-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 652 | 1 | 100% | -43 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6035 | 1 | 100% | 12 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 93 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 4029 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 936 | 1 | 100% | -27 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXTIME-26-ZOH-20260510 | sideways | 1503 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXTOPARTIST-26B-DRA-20260507 | sideways | 2367 | 1 | 100% | -9 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1034 | 1 | 100% | -39 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 8726 | 1 | 100% | 39 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3733 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5326 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 3635 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 936 | 1 | 100% | -27 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5226 | 1 | 100% | 6 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1983 | 1 | 100% | -13 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3536 | 1 | 100% | -9 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXOSCARPIC-27-DIS-20260509 | falling | 186 | 1 | 100% | -16 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 93 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 654 | 1 | 100% | -12 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27MAR-C25-20260509 | falling | 2562 | 1 | 100% | -12 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 2272 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXTIME-26-ZOH-20260509 | falling | 1694 | 1 | 100% | -12 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27JUN-C25-20260509 | falling | 372 | 1 | 100% | -41 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXTOPARTIST-26B-DRA-20260509 | falling | 2950 | 1 | 100% | -5 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 3733 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXCABOUT-26APR20-TGAB-20260507 | falling | 3733 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27OCT-H0-20260509 | falling | 1791 | 1 | 100% | -28 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3733 | 1 | 100% | 8 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXETH-26MAY0817-B2390-20260508 | rising | 185 | 1 | 100% | -41 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7062 | 1 | 100% | 22 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9148 | 1 | 100% | 32 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 3438 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXINX-26MAY08H1600-B7387-20260508 | rising | 368 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8726 | 1 | 100% | 39 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-28JAN-H0-20260509 | rising | 2563 | 1 | 100% | -23 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1315 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 3634 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3733 | 1 | 100% | 14 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXIPO-26-DISCORD-20260509 | rising | 4923 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 3438 | 1 | 100% | 3 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXLLM1-26MAY09-GOOG-20260508 | rising | 12.85 | 1 | 15% | -13 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4426 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 279 | 1 | 100% | -5 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27APR-H0-20260508 | rising | 6035 | 1 | 100% | 4 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 2078 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27APR-H0-20260507 | rising | 5933 | 1 | 100% | 9 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1410 | 1 | 100% | -20 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 1789 | 1 | 100% | -30 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXIPO-26-DISCORD-20260507 | sideways | 4824 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXIPO-26-DISCORD-20260508 | sideways | 4923 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXLLM1-26MAY31-A-20260509 | sideways | 8094 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 93 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 1791 | 1 | 100% | -32 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXOSCARPIC-27-DIS-20260508 | sideways | 186 | 1 | 100% | -20 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 4227 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27APR-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 1695 | 1 | 100% | -29 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 654 | 1 | 100% | -9 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 3634 | 1 | 100% | -7 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 1695 | 1 | 100% | -32 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 1885 | 1 | 100% | -28 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXOSCARACTO-27-TOM-20260507 | sideways | 2269 | 1 | 100% | -8 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXOSCARACTO-27-TOM-20260508 | sideways | 2270 | 1 | 100% | -11 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 842 | 1 | 100% | -25 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1697 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXLLM1-26DEC31-XAI-20260508 | sideways | 562 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 562 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 1789 | 1 | 100% | -32 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXLLM1-26MAY31-A-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 2368 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 1887 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXOSCARACTO-27-TOM-20260509 | sideways | 2465 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 278 | 1 | 100% | -18 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 93 | 1 | 100% | -99 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 1887 | 1 | 100% | -8 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXTOPARTIST-26B-DRA-20260508 | sideways | 2465 | 1 | 100% | -8 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1983 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXIPOSPACEX-26JUN01-20260508 | sideways | 936 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXIPOSPACEX-26JUN01-20260509 | sideways | 842 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXLLM1-26MAY31-A-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1889 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 1791 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXLLM1-26DEC31-XAI-20260509 | sideways | 653 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 1982 | 1 | 100% | -28 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 2077 | 1 | 100% | -16 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 2665 | 1 | 100% | -23 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 3242 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 12.83 | 1 | 15% | -12 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 2272 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 2562 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 557 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXETH-26MAY0817-B2390-20260507 | sideways | 279 | 1 | 100% | -39 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 8937 | 1 | 100% | 33 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 1982 | 1 | 100% | -29 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 279 | 1 | 100% | -5 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 654 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 2272 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 2368 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3437 | 1 | 100% | 4 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXTIME-26-ZOH-20260508 | sideways | 1694 | 1 | 100% | -11 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXLLM1-26DEC31-XAI-20260507 | sideways | 559 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1411 | 1 | 100% | -20 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 1694 | 1 | 100% | -82 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 1790 | 1 | 100% | -13 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXIPO-26-DISCORD-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXLLM1-26MAY31-A-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 652 | 1 | 100% | -43 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6035 | 1 | 100% | 12 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 93 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 4029 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 936 | 1 | 100% | -27 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXTIME-26-ZOH-20260510 | sideways | 1503 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXTOPARTIST-26B-DRA-20260507 | sideways | 2367 | 1 | 100% | -9 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1034 | 1 | 100% | -39 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 8726 | 1 | 100% | 39 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3733 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5326 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 3635 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 936 | 1 | 100% | -27 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5226 | 1 | 100% | 6 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1983 | 1 | 100% | -13 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3536 | 1 | 100% | -9 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXOSCARPIC-27-DIS-20260509 | falling | 186 | 1 | 100% | -16 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 93 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 654 | 1 | 100% | -12 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27MAR-C25-20260509 | falling | 2562 | 1 | 100% | -12 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 2272 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXTIME-26-ZOH-20260509 | falling | 1694 | 1 | 100% | -12 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27JUN-C25-20260509 | falling | 372 | 1 | 100% | -41 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXTOPARTIST-26B-DRA-20260509 | falling | 2950 | 1 | 100% | -5 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 3733 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXCABOUT-26APR20-TGAB-20260507 | falling | 3733 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27OCT-H0-20260509 | falling | 1791 | 1 | 100% | -28 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3733 | 1 | 100% | 8 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXETH-26MAY0817-B2390-20260508 | rising | 185 | 1 | 100% | -41 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 7062 | 1 | 100% | 22 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 9148 | 1 | 100% | 32 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 3438 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXINX-26MAY08H1600-B7387-20260508 | rising | 368 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 8726 | 1 | 100% | 39 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-28JAN-H0-20260509 | rising | 2563 | 1 | 100% | -23 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | 1315 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 3634 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXCABOUT-26APR20-TGAB-20260509 | rising | 3733 | 1 | 100% | 14 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXIPO-26-DISCORD-20260509 | rising | 4923 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 3438 | 1 | 100% | 3 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXLLM1-26MAY09-GOOG-20260508 | rising | 12.85 | 1 | 15% | -13 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | 4426 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXHIGHCHI-26MAY08-T70-20260508 | rising | 279 | 1 | 100% | -5 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27APR-H0-20260508 | rising | 6035 | 1 | 100% | 4 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | 2078 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27APR-H0-20260507 | rising | 5933 | 1 | 100% | 9 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXBTC-26MAY0817-B79750-20260508 | sideways | 1410 | 1 | 100% | -20 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27SEP-H0-20260509 | sideways | 1789 | 1 | 100% | -30 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXIPO-26-DISCORD-20260507 | sideways | 4824 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXIPO-26-DISCORD-20260508 | sideways | 4923 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXLLM1-26MAY31-A-20260509 | sideways | 8094 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | 93 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27OCT-H0-20260508 | sideways | 1791 | 1 | 100% | -32 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXOSCARPIC-27-DIS-20260508 | sideways | 186 | 1 | 100% | -20 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | 4227 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27APR-H0-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27DEC-H0-20260509 | sideways | 1695 | 1 | 100% | -29 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | 654 | 1 | 100% | -9 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | 3634 | 1 | 100% | -7 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27DEC-H0-20260508 | sideways | 1695 | 1 | 100% | -32 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27JUL-H0-20260509 | sideways | 1885 | 1 | 100% | -28 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXOSCARACTO-27-TOM-20260507 | sideways | 2269 | 1 | 100% | -8 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXOSCARACTO-27-TOM-20260508 | sideways | 2270 | 1 | 100% | -11 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | 842 | 1 | 100% | -25 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 1697 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXLLM1-26DEC31-XAI-20260508 | sideways | 562 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 562 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27SEP-H0-20260508 | sideways | 1789 | 1 | 100% | -32 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXLLM1-26MAY31-A-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | 2368 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | 1887 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXOSCARACTO-27-TOM-20260509 | sideways | 2465 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXINX-26MAY08H1600-B7387-20260507 | sideways | 278 | 1 | 100% | -18 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | 93 | 1 | 100% | -99 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | 1887 | 1 | 100% | -8 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXTOPARTIST-26B-DRA-20260508 | sideways | 2465 | 1 | 100% | -8 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27MAR-C25-20260507 | sideways | 1983 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXIPOSPACEX-26JUN01-20260508 | sideways | 936 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXIPOSPACEX-26JUN01-20260509 | sideways | 842 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXLLM1-26MAY31-A-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXSPACEXCOUNT-26B-170-20260509 | sideways | 1889 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXSPACEXCOUNT-26B-170-20260510 | sideways | 1791 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXLLM1-26DEC31-XAI-20260509 | sideways | 653 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27JUL-H0-20260508 | sideways | 1982 | 1 | 100% | -28 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27MAR-C25-20260508 | sideways | 2077 | 1 | 100% | -16 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 2665 | 1 | 100% | -23 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 3242 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXLLM1-26MAY09-GOOG-20260507 | sideways | 12.83 | 1 | 15% | -12 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | 2272 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | 2562 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | 557 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXETH-26MAY0817-B2390-20260507 | sideways | 279 | 1 | 100% | -39 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 8937 | 1 | 100% | 33 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27JUL-H0-20260507 | sideways | 1982 | 1 | 100% | -29 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | 279 | 1 | 100% | -5 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | 654 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | 2272 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | 2368 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 3437 | 1 | 100% | 4 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXTIME-26-ZOH-20260508 | sideways | 1694 | 1 | 100% | -11 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXLLM1-26DEC31-XAI-20260507 | sideways | 559 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXBTC-26MAY0817-B79750-20260507 | sideways | 1411 | 1 | 100% | -20 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | 1694 | 1 | 100% | -82 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27OCT-H0-20260512 | sideways | 1790 | 1 | 100% | -13 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXIPO-26-DISCORD-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXLLM1-26MAY31-A-20260510 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | 652 | 1 | 100% | -43 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 6035 | 1 | 100% | 12 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | 93 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | 4029 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | 936 | 1 | 100% | -27 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXTIME-26-ZOH-20260510 | sideways | 1503 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXTOPARTIST-26B-DRA-20260507 | sideways | 2367 | 1 | 100% | -9 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | 1034 | 1 | 100% | -39 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | 8726 | 1 | 100% | 39 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | 3733 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | 5326 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 3635 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | 936 | 1 | 100% | -27 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | 5226 | 1 | 100% | 6 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | 1983 | 1 | 100% | -13 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | 3536 | 1 | 100% | -9 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXOSCARPIC-27-DIS-20260509 | falling | 186 | 1 | 100% | -16 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | 93 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXINXY-26DEC31H1600-B8300-20260509 | falling | 654 | 1 | 100% | -12 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27MAR-C25-20260509 | falling | 2562 | 1 | 100% | -12 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | 2272 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXTIME-26-ZOH-20260509 | falling | 1694 | 1 | 100% | -12 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27JUN-C25-20260509 | falling | 372 | 1 | 100% | -41 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | 0 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXTOPARTIST-26B-DRA-20260509 | falling | 2950 | 1 | 100% | -5 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | 3733 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXCABOUT-26APR20-TGAB-20260507 | falling | 3733 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27OCT-H0-20260509 | falling | 1791 | 1 | 100% | -28 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXCABOUT-26APR20-TGAB-20260508 | falling | 3733 | 1 | 100% | 8 |  |
