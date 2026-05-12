# Strategy Sweep v3.2 — Expanded Recording Set

**Generated:** 2026-05-12T04:03:27.585Z
**Catalog:** 2026-05-11-recording-catalog.md
**Recordings:** 117 tradable non-dead (snaps ≥ 100)
  - rising: 18
  - falling: 24
  - sideways: 75
**Total cells:** 3978  (runtime 418s)

## Cross-recording winners — overall (avg pnl¢, slippage > -50)

| Strategy | Best params | avg pnl¢ | recordings filled | avg slip¢ |
|---|---|---:|---:|---:|
| s-aggressive | (defaults) | -1169 | 117/117 | -7 |
| s-passive | chunkSize=100, walkStepCents=1 | -849 | 117/117 | -6 |
| s-twap | numIntervals=10, intervalMinutes=1 | -838 | 117/117 | -5 |
| s-trail | trailCents=1 | -1217 | 115/117 | -7 |
| trailing_stop | trailCents=1 | -1217 | 115/117 | -7 |
| stop_loss | stopPriceCents=50 | -1421 | 115/117 | -6 |
| take_profit | targetPriceCents=40 | -3698 | 117/117 | 0 |
| bracket | targetPriceCents=50, stopPriceCents=20 | -1818 | 115/117 | -7 |

## Cross-recording winners — rising (18 recordings)

| Strategy | Best params | avg pnl¢ | recordings filled | avg slip¢ |
|---|---|---:|---:|---:|
| s-aggressive | (defaults) | -135 | 18/18 | 1 |
| s-passive | chunkSize=100, walkStepCents=1 | 141 | 18/18 | 3 |
| s-twap | numIntervals=5, intervalMinutes=1 | 158 | 18/18 | 3 |
| s-trail | trailCents=5 | -347 | 18/18 | 1 |
| trailing_stop | trailCents=5 | -347 | 18/18 | 1 |
| stop_loss | stopPriceCents=30 | -106 | 18/18 | 1 |
| take_profit | targetPriceCents=40 | -1817 | 18/18 | 1 |
| bracket | targetPriceCents=50, stopPriceCents=20 | -106 | 18/18 | 1 |

## Cross-recording winners — falling (24 recordings)

| Strategy | Best params | avg pnl¢ | recordings filled | avg slip¢ |
|---|---|---:|---:|---:|
| s-aggressive | (defaults) | -1071 | 24/24 | -9 |
| s-passive | chunkSize=100, walkStepCents=1 | -988 | 24/24 | -9 |
| s-twap | numIntervals=2, intervalMinutes=1 | -989 | 24/24 | -9 |
| s-trail | trailCents=3 | -1018 | 24/24 | -6 |
| trailing_stop | trailCents=3 | -1018 | 24/24 | -6 |
| stop_loss | stopPriceCents=50 | -1027 | 24/24 | -6 |
| take_profit | targetPriceCents=40 | -4288 | 24/24 | 0 |
| bracket | targetPriceCents=50, stopPriceCents=20 | -1875 | 24/24 | -7 |

## Cross-recording winners — sideways (75 recordings)

| Strategy | Best params | avg pnl¢ | recordings filled | avg slip¢ |
|---|---|---:|---:|---:|
| s-aggressive | (defaults) | -1448 | 75/75 | -8 |
| s-passive | chunkSize=100, walkStepCents=1 | -1043 | 75/75 | -7 |
| s-twap | numIntervals=10, intervalMinutes=1 | -1027 | 75/75 | -7 |
| s-trail | trailCents=1 | -1475 | 73/75 | -9 |
| trailing_stop | trailCents=1 | -1475 | 73/75 | -9 |
| stop_loss | stopPriceCents=50 | -1874 | 73/75 | -8 |
| take_profit | targetPriceCents=40 | -3961 | 75/75 | -0 |
| bracket | targetPriceCents=50, stopPriceCents=20 | -2222 | 73/75 | -8 |

## Per-strategy distribution — best param, top/median/bottom pnl across recordings

| Strategy | Best param | top pnl¢ | median pnl¢ | bottom pnl¢ | recordings |
|---|---|---:|---:|---:|---:|
| s-aggressive | (defaults) | 3826 | -573 | -10000 | 117 |
| s-passive | chunkSize=100, walkStepCents=1 | 3826 | -385 | -10000 | 117 |
| s-twap | numIntervals=10, intervalMinutes=1 | 3820 | -330 | -10000 | 117 |
| s-trail | trailCents=1 | 3826 | -571 | -9000 | 115 |
| trailing_stop | trailCents=1 | 3826 | -571 | -9000 | 115 |
| stop_loss | stopPriceCents=50 | 3826 | -576 | -9100 | 115 |
| take_profit | targetPriceCents=40 | 5114 | -3600 | -10000 | 117 |
| bracket | targetPriceCents=50, stopPriceCents=20 | 3826 | -946 | -9100 | 115 |

## All cells (raw)

| Strategy | Params | Recording | dir | pnl¢ | fills | rate | slip¢ | error |
|---|---|---|---|---:|---:|---:|---:|---|
| s-aggressive | (defaults) | KXETH-26MAY0817-B2390-20260508 | rising | -4292 | 1 | 3% | -40 |  |
| s-aggressive | (defaults) | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2062 | 1 | 100% | 22 |  |
| s-aggressive | (defaults) | KXETHD-26MAY0817-T2209.99-20260508 | rising | 748 | 1 | 100% | 8 |  |
| s-aggressive | (defaults) | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 38 | 1 | 100% | 2 |  |
| s-aggressive | (defaults) | KXINX-26MAY08H1600-B7387-20260508 | rising | -1889 | 1 | 1% | -7 |  |
| s-aggressive | (defaults) | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3826 | 1 | 100% | 39 |  |
| s-aggressive | (defaults) | KXFEDDECISION-28JAN-H0-20260509 | rising | -2437 | 1 | 100% | -23 |  |
| s-aggressive | (defaults) | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -385 | 1 | 100% | -3 |  |
| s-aggressive | (defaults) | KXHIGHNY-26MAY08-B64.5-20260507 | rising | -66 | 1 | 100% | 1 |  |
| s-aggressive | (defaults) | KXCABOUT-26APR20-TGAB-20260509 | rising | 1233 | 1 | 100% | 14 |  |
| s-aggressive | (defaults) | KXIPO-26-DISCORD-20260509 | rising | 23 | 1 | 100% | 2 |  |
| s-aggressive | (defaults) | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 138 | 1 | 100% | 3 |  |
| s-aggressive | (defaults) | KXLLM1-26MAY09-GOOG-20260508 | rising | -1387.15 | 1 | 15% | -13 |  |
| s-aggressive | (defaults) | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -174 | 1 | 100% | 0 |  |
| s-aggressive | (defaults) | KXHIGHCHI-26MAY08-T70-20260508 | rising | -521 | 1 | 100% | -5 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27APR-H0-20260508 | rising | 235 | 1 | 100% | 4 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -322 | 1 | 100% | -2 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27APR-H0-20260507 | rising | 733 | 1 | 100% | 9 |  |
| s-aggressive | (defaults) | KXBTC-26MAY0817-B79750-20260508 | sideways | -2090 | 1 | 100% | -20 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27SEP-H0-20260509 | sideways | -3111 | 1 | 100% | -30 |  |
| s-aggressive | (defaults) | KXIPO-26-DISCORD-20260507 | sideways | -76 | 1 | 100% | 1 |  |
| s-aggressive | (defaults) | KXIPO-26-DISCORD-20260508 | sideways | -477 | 1 | 100% | -3 |  |
| s-aggressive | (defaults) | KXLLM1-26MAY31-A-20260509 | sideways | -217 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -607 | 1 | 100% | -6 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27OCT-H0-20260508 | sideways | -3309 | 1 | 100% | -32 |  |
| s-aggressive | (defaults) | KXOSCARPIC-27-DIS-20260508 | sideways | -2014 | 1 | 100% | -20 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -270 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -275 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -273 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27APR-H0-20260509 | sideways | 147 | 1 | 100% | 3 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27DEC-H0-20260509 | sideways | -3005 | 1 | 100% | -29 |  |
| s-aggressive | (defaults) | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -946 | 1 | 100% | -9 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -771 | 1 | 100% | -6 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27DEC-H0-20260508 | sideways | -3305 | 1 | 100% | -32 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27JUL-H0-20260509 | sideways | -2915 | 1 | 100% | -28 |  |
| s-aggressive | (defaults) | KXOSCARACTO-27-TOM-20260507 | sideways | -931 | 1 | 100% | -8 |  |
| s-aggressive | (defaults) | KXOSCARACTO-27-TOM-20260508 | sideways | -1230 | 1 | 100% | -11 |  |
| s-aggressive | (defaults) | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2558 | 1 | 100% | -25 |  |
| s-aggressive | (defaults) | KXSPACEXCOUNT-26B-170-20260508 | sideways | 97 | 1 | 100% | 2 |  |
| s-aggressive | (defaults) | KXLLM1-26DEC31-XAI-20260508 | sideways | -38 | 1 | 100% | 0 |  |
| s-aggressive | (defaults) | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | -38 | 1 | 100% | 0 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27SEP-H0-20260508 | sideways | -3311 | 1 | 100% | -32 |  |
| s-aggressive | (defaults) | KXLLM1-26MAY31-A-20260507 | sideways | -317 | 1 | 100% | -2 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -132 | 1 | 100% | 0 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -713 | 1 | 100% | -6 |  |
| s-aggressive | (defaults) | KXOSCARACTO-27-TOM-20260509 | sideways | -735 | 1 | 100% | -6 |  |
| s-aggressive | (defaults) | KXINX-26MAY08H1600-B7387-20260507 | sideways | -2089 | 1 | 1% | -9 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -913 | 1 | 100% | -8 |  |
| s-aggressive | (defaults) | KXTOPARTIST-26B-DRA-20260508 | sideways | -935 | 1 | 100% | -8 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1617 | 1 | 100% | -15 |  |
| s-aggressive | (defaults) | KXIPOSPACEX-26JUN01-20260508 | sideways | -264 | 1 | 100% | -2 |  |
| s-aggressive | (defaults) | KXIPOSPACEX-26JUN01-20260509 | sideways | -158 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXLLM1-26MAY31-A-20260508 | sideways | -121 | 1 | 100% | 0 |  |
| s-aggressive | (defaults) | KXSPACEXCOUNT-26B-170-20260509 | sideways | -11 | 1 | 100% | 1 |  |
| s-aggressive | (defaults) | KXSPACEXCOUNT-26B-170-20260510 | sideways | -741 | 1 | 72% | -1 |  |
| s-aggressive | (defaults) | KXLLM1-26DEC31-XAI-20260509 | sideways | -147 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -61 | 1 | 100% | 0 |  |
| s-aggressive | (defaults) | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -60 | 1 | 100% | 0 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27JUL-H0-20260508 | sideways | -2918 | 1 | 100% | -28 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27MAR-C25-20260508 | sideways | -1723 | 1 | 100% | -16 |  |
| s-aggressive | (defaults) | KXFEDDECISION-28JAN-H0-20260508 | sideways | -2435 | 1 | 100% | -23 |  |
| s-aggressive | (defaults) | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -258 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1287.17 | 1 | 15% | -12 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -328 | 1 | 100% | -2 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -260 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -238 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -66 | 1 | 100% | 0 |  |
| s-aggressive | (defaults) | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -143 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXETH-26MAY0817-B2390-20260507 | sideways | -3921 | 1 | 100% | -39 |  |
| s-aggressive | (defaults) | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 631 | 1 | 100% | 7 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27JUL-H0-20260507 | sideways | -3018 | 1 | 100% | -29 |  |
| s-aggressive | (defaults) | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -521 | 1 | 100% | -5 |  |
| s-aggressive | (defaults) | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -900 | 0 | 0% | 0 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -328 | 1 | 100% | -2 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -262 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -432 | 1 | 100% | -3 |  |
| s-aggressive | (defaults) | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 237 | 1 | 100% | 4 |  |
| s-aggressive | (defaults) | KXTIME-26-ZOH-20260508 | sideways | -1206 | 1 | 100% | -11 |  |
| s-aggressive | (defaults) | KXLLM1-26DEC31-XAI-20260507 | sideways | -41 | 1 | 100% | 0 |  |
| s-aggressive | (defaults) | KXBTC-26MAY0817-B79750-20260507 | sideways | -2089 | 1 | 100% | -20 |  |
| s-aggressive | (defaults) | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27OCT-H0-20260512 | sideways | -3172 | 1 | 1% | -2 |  |
| s-aggressive | (defaults) | KXIPO-26-DISCORD-20260510 | sideways | -3962.69 | 1 | 38% | -1 |  |
| s-aggressive | (defaults) | KXLLM1-26MAY31-A-20260510 | sideways | -7762 | 1 | 9% | -2 |  |
| s-aggressive | (defaults) | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -4567 | 1 | 42% | -39 |  |
| s-aggressive | (defaults) | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1035 | 1 | 100% | 12 |  |
| s-aggressive | (defaults) | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1507 | 1 | 100% | -15 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -576 | 1 | 100% | -4 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -573 | 1 | 100% | -4 |  |
| s-aggressive | (defaults) | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2764 | 1 | 100% | -27 |  |
| s-aggressive | (defaults) | KXTIME-26-ZOH-20260510 | sideways | -1697 | 1 | 12% | -1 |  |
| s-aggressive | (defaults) | KXTOPARTIST-26B-DRA-20260507 | sideways | -1033 | 1 | 100% | -9 |  |
| s-aggressive | (defaults) | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -4217 | 1 | 52% | -34 |  |
| s-aggressive | (defaults) | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -580 | 1 | 100% | -5 |  |
| s-aggressive | (defaults) | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 1073 | 1 | 100% | 11 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -270 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -174 | 1 | 100% | 0 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -265 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2764 | 1 | 100% | -27 |  |
| s-aggressive | (defaults) | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -74 | 1 | 100% | 1 |  |
| s-aggressive | (defaults) | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1417 | 1 | 100% | -13 |  |
| s-aggressive | (defaults) | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1064 | 1 | 100% | -9 |  |
| s-aggressive | (defaults) | KXOSCARPIC-27-DIS-20260509 | falling | -1614 | 1 | 100% | -16 |  |
| s-aggressive | (defaults) | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1507 | 1 | 100% | -15 |  |
| s-aggressive | (defaults) | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1246 | 1 | 100% | -12 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27MAR-C25-20260509 | falling | -1338 | 1 | 100% | -12 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -228 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXTIME-26-ZOH-20260509 | falling | -1306 | 1 | 100% | -12 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27JUN-C25-20260509 | falling | -4493 | 1 | 1% | -37 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | -276 | 1 | 100% | -1 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -476 | 1 | 100% | -3 |  |
| s-aggressive | (defaults) | KXTOPARTIST-26B-DRA-20260509 | falling | -650 | 1 | 100% | -5 |  |
| s-aggressive | (defaults) | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -571 | 1 | 100% | -4 |  |
| s-aggressive | (defaults) | KXCABOUT-26APR20-TGAB-20260507 | falling | 33 | 1 | 100% | 2 |  |
| s-aggressive | (defaults) | KXFEDDECISION-27OCT-H0-20260509 | falling | -2909 | 1 | 100% | -28 |  |
| s-aggressive | (defaults) | KXCABOUT-26APR20-TGAB-20260508 | falling | 633 | 1 | 100% | 8 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXETH-26MAY0817-B2390-20260508 | rising | -4120 | 4 | 100% | -41 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2576 | 4 | 100% | 27 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 748 | 4 | 100% | 10 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 36 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXINX-26MAY08H1600-B7387-20260508 | rising | -1064 | 76 | 76% | -6 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3824 | 4 | 100% | 39 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-28JAN-H0-20260509 | rising | -878 | 22 | 76% | 6 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -388 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 32 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1232 | 4 | 100% | 14 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXIPO-26-DISCORD-20260509 | rising | 120 | 4 | 100% | 3 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | -240 | 10 | 82% | 6 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1378 | 2 | 25% | -13 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -176 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -524 | 4 | 100% | -5 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27APR-H0-20260508 | rising | 232 | 4 | 100% | 4 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -224 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27APR-H0-20260507 | rising | 732 | 4 | 100% | 9 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2092 | 4 | 100% | -20 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -2620 | 76 | 76% | -17 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXIPO-26-DISCORD-20260507 | sideways | 24 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXIPO-26-DISCORD-20260508 | sideways | -380 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXLLM1-26MAY31-A-20260509 | sideways | -220 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -677 | 1 | 25% | -6 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -3392 | 40 | 76% | -27 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXOSCARPIC-27-DIS-20260508 | sideways | -2016 | 4 | 100% | -20 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -272 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -276 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -276 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27APR-H0-20260509 | sideways | 144 | 4 | 100% | 3 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -3028 | 76 | 76% | -23 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -948 | 4 | 100% | -9 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -576 | 4 | 100% | -4 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -3328 | 76 | 76% | -26 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -2216 | 76 | 76% | -12 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXOSCARACTO-27-TOM-20260507 | sideways | -832 | 4 | 100% | -7 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXOSCARACTO-27-TOM-20260508 | sideways | -1132 | 4 | 100% | -10 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2560 | 4 | 100% | -25 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 92 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXLLM1-26DEC31-XAI-20260508 | sideways | -44 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | -40 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -2820 | 76 | 76% | -19 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXLLM1-26MAY31-A-20260507 | sideways | -320 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -132 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -716 | 4 | 100% | -6 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXOSCARACTO-27-TOM-20260509 | sideways | -736 | 4 | 100% | -6 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1264 | 76 | 76% | -9 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -916 | 4 | 100% | -8 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXTOPARTIST-26B-DRA-20260508 | sideways | -1146 | 7 | 85% | -7 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1620 | 4 | 100% | -15 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXIPOSPACEX-26JUN01-20260508 | sideways | -264 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXIPOSPACEX-26JUN01-20260509 | sideways | -160 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXLLM1-26MAY31-A-20260508 | sideways | -124 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -16 | 4 | 100% | 1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -216 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXLLM1-26DEC31-XAI-20260509 | sideways | -152 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -64 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -60 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -2316 | 76 | 76% | -13 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -1528 | 4 | 100% | -14 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-28JAN-H0-20260508 | sideways | -764 | 16 | 80% | 5 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -260 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1278 | 2 | 25% | -12 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -328 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -260 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -240 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -68 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -148 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXETH-26MAY0817-B2390-20260507 | sideways | -3924 | 4 | 100% | -39 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | -480.2999999999997 | 7 | 86% | 6 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -2416 | 76 | 76% | -14 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -524 | 4 | 100% | -5 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -248 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -328 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -264 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -432 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | -320 | 9 | 83% | 5 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXTIME-26-ZOH-20260508 | sideways | -1350.96 | 7 | 78% | -8 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXLLM1-26DEC31-XAI-20260507 | sideways | -44 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2092 | 4 | 100% | -19 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -1072 | 76 | 76% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXIPO-26-DISCORD-20260510 | sideways | -268 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXLLM1-26MAY31-A-20260510 | sideways | -404 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -3972 | 4 | 100% | -39 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1340 | 4 | 100% | 15 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1577 | 1 | 25% | -15 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -476 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -576 | 4 | 100% | -4 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2764 | 4 | 100% | -27 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXTIME-26-ZOH-20260510 | sideways | -304 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXTOPARTIST-26B-DRA-20260507 | sideways | -1247 | 7 | 83% | -6 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3496 | 4 | 100% | -34 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -7045 | 1 | 25% | -5 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 1072 | 4 | 100% | 11 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -272 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -245 | 13 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -268 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2764 | 4 | 100% | -27 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -76 | 4 | 100% | 1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1420 | 4 | 100% | -13 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1064 | 4 | 100% | -9 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXOSCARPIC-27-DIS-20260509 | falling | -1616 | 4 | 100% | -16 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1577 | 1 | 25% | -15 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1248 | 4 | 100% | -12 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27MAR-C25-20260509 | falling | -1340 | 4 | 100% | -12 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -228 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXTIME-26-ZOH-20260509 | falling | -1112 | 4 | 100% | -10 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27JUN-C25-20260509 | falling | -3968 | 76 | 76% | -37 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | -276 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -476 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXTOPARTIST-26B-DRA-20260509 | falling | -652 | 4 | 100% | -5 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -572 | 4 | 100% | -4 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXCABOUT-26APR20-TGAB-20260507 | falling | 32 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXFEDDECISION-27OCT-H0-20260509 | falling | -2992 | 40 | 76% | -23 |  |
| s-passive | chunkSize=25, walkStepCents=1 | KXCABOUT-26APR20-TGAB-20260508 | falling | 632 | 4 | 100% | 8 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXETH-26MAY0817-B2390-20260508 | rising | -4255 | 1 | 25% | -41 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2576 | 4 | 100% | 27 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 748 | 4 | 100% | 10 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 36 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXINX-26MAY08H1600-B7387-20260508 | rising | -1136 | 40 | 76% | -7 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3824 | 4 | 100% | 39 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-28JAN-H0-20260509 | rising | -878 | 22 | 76% | 6 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -388 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 32 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1232 | 4 | 100% | 14 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXIPO-26-DISCORD-20260509 | rising | 120 | 4 | 100% | 3 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | -240 | 10 | 82% | 6 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1400 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -176 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -524 | 4 | 100% | -5 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27APR-H0-20260508 | rising | 232 | 4 | 100% | 4 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -224 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27APR-H0-20260507 | rising | 732 | 4 | 100% | 9 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2092 | 4 | 100% | -20 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -2620 | 76 | 76% | -17 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXIPO-26-DISCORD-20260507 | sideways | 24 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXIPO-26-DISCORD-20260508 | sideways | -380 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXLLM1-26MAY31-A-20260509 | sideways | -220 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -700 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -3392 | 40 | 76% | -27 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXOSCARPIC-27-DIS-20260508 | sideways | -2154 | 1 | 25% | -20 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -272 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -276 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -276 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27APR-H0-20260509 | sideways | 144 | 4 | 100% | 3 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -3028 | 76 | 76% | -23 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -948 | 4 | 100% | -9 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -576 | 4 | 100% | -4 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -3328 | 76 | 76% | -26 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -2216 | 76 | 76% | -12 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXOSCARACTO-27-TOM-20260507 | sideways | -832 | 4 | 100% | -7 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXOSCARACTO-27-TOM-20260508 | sideways | -1132 | 4 | 100% | -10 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2560 | 4 | 100% | -25 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 92 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXLLM1-26DEC31-XAI-20260508 | sideways | -44 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | -460 | 1 | 25% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -2820 | 76 | 76% | -19 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXLLM1-26MAY31-A-20260507 | sideways | -320 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -132 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -716 | 4 | 100% | -6 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXOSCARACTO-27-TOM-20260509 | sideways | -736 | 4 | 100% | -6 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1336 | 40 | 76% | -10 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -916 | 4 | 100% | -8 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXTOPARTIST-26B-DRA-20260508 | sideways | -844 | 4 | 100% | -7 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1620 | 4 | 100% | -15 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXIPOSPACEX-26JUN01-20260508 | sideways | -264 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXIPOSPACEX-26JUN01-20260509 | sideways | -160 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXLLM1-26MAY31-A-20260508 | sideways | -124 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -16 | 4 | 100% | 1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -216 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXLLM1-26DEC31-XAI-20260509 | sideways | -638 | 1 | 25% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -64 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -6840 | 1 | 25% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -2316 | 76 | 76% | -13 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -1528 | 4 | 100% | -14 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-28JAN-H0-20260508 | sideways | -764 | 16 | 80% | 5 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -260 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1300 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -328 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -260 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -240 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -6767 | 1 | 25% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -562 | 1 | 25% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXETH-26MAY0817-B2390-20260507 | sideways | -4131 | 1 | 25% | -39 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 732 | 4 | 100% | 7 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -2416 | 76 | 76% | -14 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -524 | 4 | 100% | -5 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -248 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -328 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -264 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -432 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 234 | 4 | 100% | 4 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXTIME-26-ZOH-20260508 | sideways | -1350.96 | 7 | 78% | -8 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXLLM1-26DEC31-XAI-20260507 | sideways | -44 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2092 | 4 | 100% | -19 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -1072 | 76 | 76% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXIPO-26-DISCORD-20260510 | sideways | -268 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXLLM1-26MAY31-A-20260510 | sideways | -404 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -3972 | 4 | 100% | -39 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1340 | 4 | 100% | 15 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1600 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -476 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -576 | 4 | 100% | -4 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2764 | 4 | 100% | -27 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXTIME-26-ZOH-20260510 | sideways | -304 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXTOPARTIST-26B-DRA-20260507 | sideways | -1247 | 7 | 83% | -6 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3496 | 4 | 100% | -34 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -7045 | 1 | 25% | -5 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 1072 | 4 | 100% | 11 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -272 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -245 | 13 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -268 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2764 | 4 | 100% | -27 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -76 | 4 | 100% | 1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1420 | 4 | 100% | -13 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1064 | 4 | 100% | -9 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXOSCARPIC-27-DIS-20260509 | falling | -1754 | 1 | 25% | -16 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1600 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1248 | 4 | 100% | -12 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27MAR-C25-20260509 | falling | -1340 | 4 | 100% | -12 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -228 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXTIME-26-ZOH-20260509 | falling | -1112 | 4 | 100% | -10 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27JUN-C25-20260509 | falling | -3968 | 76 | 76% | -37 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | -276 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -476 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXTOPARTIST-26B-DRA-20260509 | falling | -652 | 4 | 100% | -5 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -572 | 4 | 100% | -4 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXCABOUT-26APR20-TGAB-20260507 | falling | 32 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXFEDDECISION-27OCT-H0-20260509 | falling | -2992 | 40 | 76% | -23 |  |
| s-passive | chunkSize=25, walkStepCents=2 | KXCABOUT-26APR20-TGAB-20260508 | falling | 632 | 4 | 100% | 8 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXETH-26MAY0817-B2390-20260508 | rising | -4300 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2576 | 4 | 100% | 27 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 748 | 4 | 100% | 10 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 36 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXINX-26MAY08H1600-B7387-20260508 | rising | -1253 | 7 | 76% | -8 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3824 | 4 | 100% | 39 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-28JAN-H0-20260509 | rising | -878 | 22 | 76% | 6 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -388 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 32 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1232 | 4 | 100% | 14 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXIPO-26-DISCORD-20260509 | rising | 120 | 4 | 100% | 3 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 236 | 4 | 100% | 4 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1400 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -176 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -800 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27APR-H0-20260508 | rising | 232 | 4 | 100% | 4 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -224 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27APR-H0-20260507 | rising | 732 | 4 | 100% | 9 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2092 | 4 | 100% | -20 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -2620 | 76 | 76% | -17 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXIPO-26-DISCORD-20260507 | sideways | 24 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXIPO-26-DISCORD-20260508 | sideways | -380 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXLLM1-26MAY31-A-20260509 | sideways | -220 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -700 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -3312 | 4 | 100% | -32 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXOSCARPIC-27-DIS-20260508 | sideways | -2200 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -272 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -276 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -276 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27APR-H0-20260509 | sideways | 144 | 4 | 100% | 3 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -3028 | 76 | 76% | -23 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -948 | 4 | 100% | -9 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -576 | 4 | 100% | -4 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -3328 | 76 | 76% | -26 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -2216 | 76 | 76% | -12 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXOSCARACTO-27-TOM-20260507 | sideways | -832 | 4 | 100% | -7 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXOSCARACTO-27-TOM-20260508 | sideways | -1132 | 4 | 100% | -10 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2560 | 4 | 100% | -25 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 92 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXLLM1-26DEC31-XAI-20260508 | sideways | -461 | 1 | 25% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | -460 | 1 | 25% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -2820 | 76 | 76% | -19 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXLLM1-26MAY31-A-20260507 | sideways | -320 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -132 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -716 | 4 | 100% | -6 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXOSCARACTO-27-TOM-20260509 | sideways | -736 | 4 | 100% | -6 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1408 | 22 | 76% | -11 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -916 | 4 | 100% | -8 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXTOPARTIST-26B-DRA-20260508 | sideways | -844 | 4 | 100% | -7 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1620 | 4 | 100% | -15 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXIPOSPACEX-26JUN01-20260508 | sideways | -264 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXIPOSPACEX-26JUN01-20260509 | sideways | -160 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXLLM1-26MAY31-A-20260508 | sideways | -124 | 4 | 100% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -16 | 4 | 100% | 1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -216 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXLLM1-26DEC31-XAI-20260509 | sideways | -638 | 1 | 25% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -6766 | 1 | 25% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -6840 | 1 | 25% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -2316 | 76 | 76% | -13 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -1528 | 4 | 100% | -14 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-28JAN-H0-20260508 | sideways | -764 | 16 | 80% | 5 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -260 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1300 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -328 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -260 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -240 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -6767 | 1 | 25% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -562 | 1 | 25% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXETH-26MAY0817-B2390-20260507 | sideways | -4200 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 732 | 4 | 100% | 7 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -2416 | 76 | 76% | -14 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -800 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -248 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -328 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -264 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -432 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 234 | 4 | 100% | 4 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXTIME-26-ZOH-20260508 | sideways | -920 | 4 | 100% | -8 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXLLM1-26DEC31-XAI-20260507 | sideways | -461 | 1 | 25% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2092 | 4 | 100% | -19 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -1072 | 76 | 76% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXIPO-26-DISCORD-20260510 | sideways | -268 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXLLM1-26MAY31-A-20260510 | sideways | -404 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -3972 | 4 | 100% | -39 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1340 | 4 | 100% | 15 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1600 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -476 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -576 | 4 | 100% | -4 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2764 | 4 | 100% | -27 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXTIME-26-ZOH-20260510 | sideways | -304 | 4 | 100% | -2 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXTOPARTIST-26B-DRA-20260507 | sideways | -840 | 4 | 100% | -7 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3496 | 4 | 100% | -34 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -7045 | 1 | 25% | -5 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 1072 | 4 | 100% | 11 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -272 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -479 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -268 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2764 | 4 | 100% | -27 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -76 | 4 | 100% | 1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1420 | 4 | 100% | -13 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1064 | 4 | 100% | -9 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXOSCARPIC-27-DIS-20260509 | falling | -1800 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1600 | 0 | 0% | 0 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1248 | 4 | 100% | -12 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27MAR-C25-20260509 | falling | -1340 | 4 | 100% | -12 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -228 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXTIME-26-ZOH-20260509 | falling | -1112 | 4 | 100% | -10 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27JUN-C25-20260509 | falling | -4132 | 4 | 100% | -41 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | -276 | 4 | 100% | -1 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -476 | 4 | 100% | -3 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXTOPARTIST-26B-DRA-20260509 | falling | -652 | 4 | 100% | -5 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -572 | 4 | 100% | -4 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXCABOUT-26APR20-TGAB-20260507 | falling | 32 | 4 | 100% | 2 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXFEDDECISION-27OCT-H0-20260509 | falling | -2912 | 4 | 100% | -28 |  |
| s-passive | chunkSize=25, walkStepCents=5 | KXCABOUT-26APR20-TGAB-20260508 | falling | 632 | 4 | 100% | 8 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXETH-26MAY0817-B2390-20260508 | rising | -4116 | 2 | 100% | -41 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2576 | 2 | 100% | 27 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 748 | 2 | 100% | 9 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 38 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXINX-26MAY08H1600-B7387-20260508 | rising | -1339 | 51 | 51% | -6 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3826 | 2 | 100% | 39 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-28JAN-H0-20260509 | rising | -2180 | 14 | 52% | 6 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -386 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 32 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1232 | 2 | 100% | 14 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXIPO-26-DISCORD-20260509 | rising | -1701.7399999999998 | 3 | 64% | 3 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | -1248 | 7 | 55% | 6 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1374.3000000000002 | 2 | 30% | -13 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -174 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -522 | 2 | 100% | -5 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27APR-H0-20260508 | rising | 234 | 2 | 100% | 4 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -224 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27APR-H0-20260507 | rising | 732 | 2 | 100% | 9 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2090 | 2 | 100% | -20 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -3370 | 51 | 51% | -17 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXIPO-26-DISCORD-20260507 | sideways | 24 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXIPO-26-DISCORD-20260508 | sideways | -2865.16 | 3 | 50% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXLLM1-26MAY31-A-20260509 | sideways | -218 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -654 | 1 | 50% | -6 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -3930 | 26 | 52% | -27 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXOSCARPIC-27-DIS-20260508 | sideways | -2014 | 2 | 100% | -20 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -270 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -276 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -274 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27APR-H0-20260509 | sideways | 146 | 2 | 100% | 3 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -3578 | 51 | 51% | -23 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -946 | 2 | 100% | -9 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -2518 | 3 | 54% | -4 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -3878 | 51 | 51% | -26 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -3066 | 51 | 51% | -12 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXOSCARACTO-27-TOM-20260507 | sideways | -834 | 2 | 100% | -7 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXOSCARACTO-27-TOM-20260508 | sideways | -1134 | 2 | 100% | -10 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2558 | 2 | 100% | -25 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 94 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXLLM1-26DEC31-XAI-20260508 | sideways | -40 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | -38 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -3570 | 51 | 51% | -19 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXLLM1-26MAY31-A-20260507 | sideways | -318 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -132 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -714 | 2 | 100% | -6 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXOSCARACTO-27-TOM-20260509 | sideways | -736 | 2 | 100% | -6 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1539 | 51 | 51% | -9 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -914 | 2 | 100% | -8 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXTOPARTIST-26B-DRA-20260508 | sideways | -1942 | 5 | 55% | -7 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1618 | 2 | 100% | -15 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXIPOSPACEX-26JUN01-20260508 | sideways | -264 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXIPOSPACEX-26JUN01-20260509 | sideways | -158 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXLLM1-26MAY31-A-20260508 | sideways | -122 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -14 | 2 | 100% | 1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -214 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXLLM1-26DEC31-XAI-20260509 | sideways | -148 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -62 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -60 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -3166 | 51 | 51% | -13 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -2211 | 3 | 70% | -14 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-28JAN-H0-20260508 | sideways | -2119 | 11 | 55% | 5 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -258 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1274.3400000000001 | 2 | 30% | -12 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -328 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -260 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -238 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -66 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -144 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXETH-26MAY0817-B2390-20260507 | sideways | -3922 | 2 | 100% | -39 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | -2904.8999999999996 | 5 | 59% | 6 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -3266 | 51 | 51% | -14 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -522 | 2 | 100% | -5 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -246 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -328 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -262 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -432 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 245 | 4 | 100% | 5 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXTIME-26-ZOH-20260508 | sideways | -1781.92 | 4 | 56% | -8 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXLLM1-26DEC31-XAI-20260507 | sideways | -42 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2090 | 2 | 100% | -19 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -1772 | 51 | 51% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXIPO-26-DISCORD-20260510 | sideways | -268 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXLLM1-26MAY31-A-20260510 | sideways | -404 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -3970 | 2 | 100% | -39 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1340 | 2 | 100% | 15 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1554 | 1 | 50% | -15 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -478 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -574 | 2 | 100% | -4 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2764 | 2 | 100% | -27 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXTIME-26-ZOH-20260510 | sideways | -302 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXTOPARTIST-26B-DRA-20260507 | sideways | -1712 | 4 | 66% | -7 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3496 | 2 | 100% | -34 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -4890 | 1 | 50% | -5 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 1072 | 2 | 100% | 11 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -270 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -218 | 11 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -266 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2764 | 2 | 100% | -27 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -74 | 2 | 100% | 1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1418 | 2 | 100% | -13 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1064 | 2 | 100% | -9 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXOSCARPIC-27-DIS-20260509 | falling | -1614 | 2 | 100% | -16 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1554 | 1 | 50% | -15 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1246 | 2 | 100% | -12 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27MAR-C25-20260509 | falling | -1338 | 2 | 100% | -12 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -228 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXTIME-26-ZOH-20260509 | falling | -1650 | 3 | 73% | -10 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27JUN-C25-20260509 | falling | -4143 | 51 | 51% | -37 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | -276 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -476 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXTOPARTIST-26B-DRA-20260509 | falling | -650 | 2 | 100% | -5 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -572 | 2 | 100% | -4 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXCABOUT-26APR20-TGAB-20260507 | falling | 32 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXFEDDECISION-27OCT-H0-20260509 | falling | -3530 | 26 | 52% | -23 |  |
| s-passive | chunkSize=50, walkStepCents=1 | KXCABOUT-26APR20-TGAB-20260508 | falling | 632 | 2 | 100% | 8 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXETH-26MAY0817-B2390-20260508 | rising | -4208 | 1 | 50% | -41 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2576 | 2 | 100% | 27 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 748 | 2 | 100% | 9 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 38 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXINX-26MAY08H1600-B7387-20260508 | rising | -1380 | 26 | 52% | -7 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3826 | 2 | 100% | 39 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-28JAN-H0-20260509 | rising | -2180 | 14 | 52% | 6 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -386 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 32 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1232 | 2 | 100% | 14 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXIPO-26-DISCORD-20260509 | rising | 20 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | -1248 | 7 | 55% | 6 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1400 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -174 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -522 | 2 | 100% | -5 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27APR-H0-20260508 | rising | 234 | 2 | 100% | 4 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -224 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27APR-H0-20260507 | rising | 732 | 2 | 100% | 9 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2090 | 2 | 100% | -20 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -3370 | 51 | 51% | -17 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXIPO-26-DISCORD-20260507 | sideways | 24 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXIPO-26-DISCORD-20260508 | sideways | -378 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXLLM1-26MAY31-A-20260509 | sideways | -218 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -700 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -3930 | 26 | 52% | -27 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXOSCARPIC-27-DIS-20260508 | sideways | -2107 | 1 | 50% | -20 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -270 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -276 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -274 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27APR-H0-20260509 | sideways | 146 | 2 | 100% | 3 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -3578 | 51 | 51% | -23 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -946 | 2 | 100% | -9 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -2518 | 3 | 54% | -4 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -3878 | 51 | 51% | -26 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -3066 | 51 | 51% | -12 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXOSCARACTO-27-TOM-20260507 | sideways | -834 | 2 | 100% | -7 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXOSCARACTO-27-TOM-20260508 | sideways | -1134 | 2 | 100% | -10 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2558 | 2 | 100% | -25 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 94 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXLLM1-26DEC31-XAI-20260508 | sideways | -40 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | -319 | 1 | 50% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -3570 | 51 | 51% | -19 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXLLM1-26MAY31-A-20260507 | sideways | -318 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -132 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -714 | 2 | 100% | -6 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXOSCARACTO-27-TOM-20260509 | sideways | -736 | 2 | 100% | -6 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1580 | 26 | 52% | -10 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -914 | 2 | 100% | -8 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXTOPARTIST-26B-DRA-20260508 | sideways | -1708 | 3 | 65% | -6 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1618 | 2 | 100% | -15 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXIPOSPACEX-26JUN01-20260508 | sideways | -264 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXIPOSPACEX-26JUN01-20260509 | sideways | -158 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXLLM1-26MAY31-A-20260508 | sideways | -122 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -14 | 2 | 100% | 1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -214 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXLLM1-26DEC31-XAI-20260509 | sideways | -474 | 1 | 50% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -62 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -4580 | 1 | 50% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -3166 | 51 | 51% | -13 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -1628 | 2 | 100% | -15 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-28JAN-H0-20260508 | sideways | -2119 | 11 | 55% | 5 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -258 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1300 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -328 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -260 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -238 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -4533 | 1 | 50% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -422 | 1 | 50% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXETH-26MAY0817-B2390-20260507 | sideways | -4061 | 1 | 50% | -39 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 632 | 2 | 100% | 6 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -3266 | 51 | 51% | -14 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -522 | 2 | 100% | -5 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -246 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -328 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -262 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -432 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 237 | 2 | 100% | 4 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXTIME-26-ZOH-20260508 | sideways | -1781.92 | 4 | 56% | -8 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXLLM1-26DEC31-XAI-20260507 | sideways | -42 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2090 | 2 | 100% | -19 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -1772 | 51 | 51% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXIPO-26-DISCORD-20260510 | sideways | -268 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXLLM1-26MAY31-A-20260510 | sideways | -404 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -3970 | 2 | 100% | -39 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1340 | 2 | 100% | 15 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1600 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -478 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -574 | 2 | 100% | -4 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2764 | 2 | 100% | -27 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXTIME-26-ZOH-20260510 | sideways | -302 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXTOPARTIST-26B-DRA-20260507 | sideways | -1712 | 4 | 66% | -7 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3496 | 2 | 100% | -34 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -4890 | 1 | 50% | -5 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 1072 | 2 | 100% | 11 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -270 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -218 | 11 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -266 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2764 | 2 | 100% | -27 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -74 | 2 | 100% | 1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1418 | 2 | 100% | -13 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1064 | 2 | 100% | -9 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXOSCARPIC-27-DIS-20260509 | falling | -1707 | 1 | 50% | -16 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1600 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1246 | 2 | 100% | -12 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27MAR-C25-20260509 | falling | -1338 | 2 | 100% | -12 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -228 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXTIME-26-ZOH-20260509 | falling | -1210 | 2 | 100% | -11 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27JUN-C25-20260509 | falling | -4143 | 51 | 51% | -37 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | -276 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -476 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXTOPARTIST-26B-DRA-20260509 | falling | -650 | 2 | 100% | -5 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -572 | 2 | 100% | -4 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXCABOUT-26APR20-TGAB-20260507 | falling | 32 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXFEDDECISION-27OCT-H0-20260509 | falling | -3530 | 26 | 52% | -23 |  |
| s-passive | chunkSize=50, walkStepCents=2 | KXCABOUT-26APR20-TGAB-20260508 | falling | 632 | 2 | 100% | 8 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXETH-26MAY0817-B2390-20260508 | rising | -4300 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2576 | 2 | 100% | 27 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 748 | 2 | 100% | 9 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 38 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXINX-26MAY08H1600-B7387-20260508 | rising | -1458 | 4 | 52% | -8 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3826 | 2 | 100% | 39 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-28JAN-H0-20260509 | rising | -2180 | 14 | 52% | 6 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -386 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 32 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1232 | 2 | 100% | 14 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXIPO-26-DISCORD-20260509 | rising | 20 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 236 | 2 | 100% | 4 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1400 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -174 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -800 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27APR-H0-20260508 | rising | 234 | 2 | 100% | 4 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -224 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27APR-H0-20260507 | rising | 732 | 2 | 100% | 9 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2090 | 2 | 100% | -20 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -3370 | 51 | 51% | -17 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXIPO-26-DISCORD-20260507 | sideways | 24 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXIPO-26-DISCORD-20260508 | sideways | -378 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXLLM1-26MAY31-A-20260509 | sideways | -218 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -700 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -3310 | 2 | 100% | -32 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXOSCARPIC-27-DIS-20260508 | sideways | -2200 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -270 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -276 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -274 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27APR-H0-20260509 | sideways | 146 | 2 | 100% | 3 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -3578 | 51 | 51% | -23 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -946 | 2 | 100% | -9 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -574 | 2 | 100% | -4 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -3878 | 51 | 51% | -26 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -3066 | 51 | 51% | -12 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXOSCARACTO-27-TOM-20260507 | sideways | -834 | 2 | 100% | -7 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXOSCARACTO-27-TOM-20260508 | sideways | -1134 | 2 | 100% | -10 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2558 | 2 | 100% | -25 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 94 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXLLM1-26DEC31-XAI-20260508 | sideways | -320 | 1 | 50% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | -319 | 1 | 50% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -3570 | 51 | 51% | -19 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXLLM1-26MAY31-A-20260507 | sideways | -318 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -132 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -714 | 2 | 100% | -6 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXOSCARACTO-27-TOM-20260509 | sideways | -736 | 2 | 100% | -6 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1628 | 14 | 52% | -11 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -914 | 2 | 100% | -8 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXTOPARTIST-26B-DRA-20260508 | sideways | -938 | 2 | 100% | -8 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1618 | 2 | 100% | -15 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXIPOSPACEX-26JUN01-20260508 | sideways | -264 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXIPOSPACEX-26JUN01-20260509 | sideways | -158 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXLLM1-26MAY31-A-20260508 | sideways | -122 | 2 | 100% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -14 | 2 | 100% | 1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -214 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXLLM1-26DEC31-XAI-20260509 | sideways | -474 | 1 | 50% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -4531 | 1 | 50% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -4580 | 1 | 50% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -3166 | 51 | 51% | -13 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -1628 | 2 | 100% | -15 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-28JAN-H0-20260508 | sideways | -2119 | 11 | 55% | 5 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -258 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1300 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -328 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -260 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -238 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -4533 | 1 | 50% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -422 | 1 | 50% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXETH-26MAY0817-B2390-20260507 | sideways | -4200 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 632 | 2 | 100% | 6 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -3266 | 51 | 51% | -14 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -800 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -246 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -328 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -262 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -432 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 237 | 2 | 100% | 4 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXTIME-26-ZOH-20260508 | sideways | -1112 | 2 | 100% | -10 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXLLM1-26DEC31-XAI-20260507 | sideways | -321 | 1 | 50% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2090 | 2 | 100% | -19 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -1772 | 51 | 51% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXIPO-26-DISCORD-20260510 | sideways | -268 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXLLM1-26MAY31-A-20260510 | sideways | -404 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -3970 | 2 | 100% | -39 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1340 | 2 | 100% | 15 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1600 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -478 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -574 | 2 | 100% | -4 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2764 | 2 | 100% | -27 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXTIME-26-ZOH-20260510 | sideways | -302 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXTOPARTIST-26B-DRA-20260507 | sideways | -936 | 2 | 100% | -8 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3496 | 2 | 100% | -34 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -4890 | 1 | 50% | -5 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 1072 | 2 | 100% | 11 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -270 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -375 | 2 | 100% | -2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -266 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2764 | 2 | 100% | -27 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -74 | 2 | 100% | 1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1418 | 2 | 100% | -13 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1064 | 2 | 100% | -9 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXOSCARPIC-27-DIS-20260509 | falling | -1800 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1600 | 0 | 0% | 0 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1246 | 2 | 100% | -12 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27MAR-C25-20260509 | falling | -1338 | 2 | 100% | -12 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -228 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXTIME-26-ZOH-20260509 | falling | -1210 | 2 | 100% | -11 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27JUN-C25-20260509 | falling | -4130 | 2 | 100% | -41 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | -276 | 2 | 100% | -1 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -476 | 2 | 100% | -3 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXTOPARTIST-26B-DRA-20260509 | falling | -650 | 2 | 100% | -5 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -572 | 2 | 100% | -4 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXCABOUT-26APR20-TGAB-20260507 | falling | 32 | 2 | 100% | 2 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXFEDDECISION-27OCT-H0-20260509 | falling | -2910 | 2 | 100% | -28 |  |
| s-passive | chunkSize=50, walkStepCents=5 | KXCABOUT-26APR20-TGAB-20260508 | falling | 632 | 2 | 100% | 8 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXETH-26MAY0817-B2390-20260508 | rising | -4115 | 1 | 100% | -41 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2574 | 2 | 100% | 27 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 748 | 1 | 100% | 8 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 38 | 1 | 100% | 2 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXINX-26MAY08H1600-B7387-20260508 | rising | -800 | 100 | 100% | -6 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3826 | 1 | 100% | 39 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-28JAN-H0-20260509 | rising | 425 | 25 | 100% | 6 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -385 | 1 | 100% | -3 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | -66 | 1 | 100% | 1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1233 | 1 | 100% | 14 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXIPO-26-DISCORD-20260509 | rising | 48.840000000000146 | 3 | 100% | 2 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 433 | 12 | 100% | 7 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1374.3000000000002 | 2 | 30% | -13 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -174 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -521 | 1 | 100% | -5 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27APR-H0-20260508 | rising | 235 | 1 | 100% | 4 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -322 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27APR-H0-20260507 | rising | 733 | 1 | 100% | 9 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2090 | 1 | 100% | -20 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -1900 | 100 | 100% | -17 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXIPO-26-DISCORD-20260507 | sideways | -76 | 1 | 100% | 1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXIPO-26-DISCORD-20260508 | sideways | -377.08000000000004 | 3 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXLLM1-26MAY31-A-20260509 | sideways | -217 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -607 | 1 | 100% | -6 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -2850 | 50 | 100% | -27 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXOSCARPIC-27-DIS-20260508 | sideways | -2014 | 1 | 100% | -20 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -270 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -275 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -273 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27APR-H0-20260509 | sideways | 147 | 1 | 100% | 3 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -2500 | 100 | 100% | -23 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -946 | 1 | 100% | -9 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -574 | 3 | 100% | -4 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -2800 | 100 | 100% | -26 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -1400 | 100 | 100% | -12 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXOSCARACTO-27-TOM-20260507 | sideways | -931 | 1 | 100% | -8 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXOSCARACTO-27-TOM-20260508 | sideways | -1230 | 1 | 100% | -11 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2558 | 1 | 100% | -25 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 94 | 2 | 100% | 2 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXLLM1-26DEC31-XAI-20260508 | sideways | -38 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | -38 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -2100 | 100 | 100% | -19 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXLLM1-26MAY31-A-20260507 | sideways | -317 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -132 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -713 | 1 | 100% | -6 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXOSCARACTO-27-TOM-20260509 | sideways | -735 | 1 | 100% | -6 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1000 | 100 | 100% | -9 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -913 | 1 | 100% | -8 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXTOPARTIST-26B-DRA-20260508 | sideways | -747 | 7 | 100% | -7 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1617 | 1 | 100% | -15 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXIPOSPACEX-26JUN01-20260508 | sideways | -264 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXIPOSPACEX-26JUN01-20260509 | sideways | -158 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXLLM1-26MAY31-A-20260508 | sideways | -121 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -11 | 1 | 100% | 1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -213 | 2 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXLLM1-26DEC31-XAI-20260509 | sideways | -147 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -61 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -60 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -1500 | 100 | 100% | -13 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -1530 | 4 | 100% | -14 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 320 | 20 | 100% | 5 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -258 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1274.3400000000001 | 2 | 30% | -12 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -328 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -260 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -238 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -66 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -143 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXETH-26MAY0817-B2390-20260507 | sideways | -3921 | 1 | 100% | -39 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 733.0000000000019 | 8 | 100% | 6 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -1600 | 100 | 100% | -14 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -521 | 1 | 100% | -5 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -246 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -328 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -262 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -432 | 1 | 100% | -3 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 73 | 3 | 95% | 5 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXTIME-26-ZOH-20260508 | sideways | -920.0000000000002 | 5 | 100% | -8 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXLLM1-26DEC31-XAI-20260507 | sideways | -41 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2089 | 1 | 100% | -20 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -400 | 100 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXIPO-26-DISCORD-20260510 | sideways | -350.13000000000056 | 2 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXLLM1-26MAY31-A-20260510 | sideways | -404 | 1 | 100% | -3 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -3969 | 2 | 100% | -39 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1339 | 2 | 100% | 15 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1507 | 1 | 100% | -15 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -576 | 1 | 100% | -4 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -573 | 1 | 100% | -4 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2764 | 1 | 100% | -27 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXTIME-26-ZOH-20260510 | sideways | -302 | 2 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXTOPARTIST-26B-DRA-20260507 | sideways | -842 | 6 | 100% | -7 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3495 | 2 | 100% | -34 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -580 | 1 | 100% | -5 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 1073 | 1 | 100% | 11 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -270 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -174 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -265 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2764 | 1 | 100% | -27 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -74 | 1 | 100% | 1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1417 | 1 | 100% | -13 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1064 | 1 | 100% | -9 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXOSCARPIC-27-DIS-20260509 | falling | -1614 | 1 | 100% | -16 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1507 | 1 | 100% | -15 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1246 | 1 | 100% | -12 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27MAR-C25-20260509 | falling | -1338 | 1 | 100% | -12 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -228 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXTIME-26-ZOH-20260509 | falling | -1196 | 4 | 100% | -11 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27JUN-C25-20260509 | falling | -3800 | 100 | 100% | -37 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | -276 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -476 | 1 | 100% | -3 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXTOPARTIST-26B-DRA-20260509 | falling | -650 | 1 | 100% | -5 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -571 | 1 | 100% | -4 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXCABOUT-26APR20-TGAB-20260507 | falling | 33 | 1 | 100% | 2 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXFEDDECISION-27OCT-H0-20260509 | falling | -2450 | 50 | 100% | -23 |  |
| s-passive | chunkSize=100, walkStepCents=1 | KXCABOUT-26APR20-TGAB-20260508 | falling | 633 | 1 | 100% | 8 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXETH-26MAY0817-B2390-20260508 | rising | -4115 | 1 | 100% | -41 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2574 | 2 | 100% | 27 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 748 | 1 | 100% | 8 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 38 | 1 | 100% | 2 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXINX-26MAY08H1600-B7387-20260508 | rising | -900 | 50 | 100% | -7 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3826 | 1 | 100% | 39 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-28JAN-H0-20260509 | rising | 425 | 25 | 100% | 6 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -385 | 1 | 100% | -3 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | -66 | 1 | 100% | 1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1233 | 1 | 100% | 14 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXIPO-26-DISCORD-20260509 | rising | 23 | 1 | 100% | 2 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 433 | 12 | 100% | 7 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1400 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -174 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -521 | 1 | 100% | -5 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27APR-H0-20260508 | rising | 235 | 1 | 100% | 4 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -322 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27APR-H0-20260507 | rising | 733 | 1 | 100% | 9 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2090 | 1 | 100% | -20 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -1900 | 100 | 100% | -17 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXIPO-26-DISCORD-20260507 | sideways | -76 | 1 | 100% | 1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXIPO-26-DISCORD-20260508 | sideways | -376.99999999999966 | 2 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXLLM1-26MAY31-A-20260509 | sideways | -217 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -700 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -2850 | 50 | 100% | -27 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXOSCARPIC-27-DIS-20260508 | sideways | -2014 | 1 | 100% | -20 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -270 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -275 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -273 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27APR-H0-20260509 | sideways | 147 | 1 | 100% | 3 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -2500 | 100 | 100% | -23 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -946 | 1 | 100% | -9 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -574 | 3 | 100% | -4 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -2800 | 100 | 100% | -26 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -1400 | 100 | 100% | -12 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXOSCARACTO-27-TOM-20260507 | sideways | -931 | 1 | 100% | -8 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXOSCARACTO-27-TOM-20260508 | sideways | -1230 | 1 | 100% | -11 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2558 | 1 | 100% | -25 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 97 | 1 | 100% | 2 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXLLM1-26DEC31-XAI-20260508 | sideways | -38 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | -38 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -2100 | 100 | 100% | -19 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXLLM1-26MAY31-A-20260507 | sideways | -317 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -132 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -713 | 1 | 100% | -6 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXOSCARACTO-27-TOM-20260509 | sideways | -735 | 1 | 100% | -6 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1100 | 50 | 100% | -10 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -913 | 1 | 100% | -8 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXTOPARTIST-26B-DRA-20260508 | sideways | -841 | 3 | 100% | -7 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1617 | 1 | 100% | -15 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXIPOSPACEX-26JUN01-20260508 | sideways | -264 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXIPOSPACEX-26JUN01-20260509 | sideways | -158 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXLLM1-26MAY31-A-20260508 | sideways | -121 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -11 | 1 | 100% | 1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -212.9999999999999 | 2 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXLLM1-26DEC31-XAI-20260509 | sideways | -147 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -61 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -60 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -1500 | 100 | 100% | -13 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -1589 | 2 | 100% | -14 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 320 | 20 | 100% | 5 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -258 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1300 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -328 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -260 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -238 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -66 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -143 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXETH-26MAY0817-B2390-20260507 | sideways | -3921 | 1 | 100% | -39 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 631 | 1 | 100% | 7 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -1600 | 100 | 100% | -14 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -521 | 1 | 100% | -5 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -246 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -328 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -262 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -432 | 1 | 100% | -3 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 237 | 1 | 100% | 4 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXTIME-26-ZOH-20260508 | sideways | -920.0000000000002 | 5 | 100% | -8 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXLLM1-26DEC31-XAI-20260507 | sideways | -41 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2089 | 1 | 100% | -20 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -400 | 100 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXIPO-26-DISCORD-20260510 | sideways | -369 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXLLM1-26MAY31-A-20260510 | sideways | -404 | 1 | 100% | -3 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -3969 | 2 | 100% | -39 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1339 | 2 | 100% | 15 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1600 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -576 | 1 | 100% | -4 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -573 | 1 | 100% | -4 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2764 | 1 | 100% | -27 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXTIME-26-ZOH-20260510 | sideways | -302 | 2 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXTOPARTIST-26B-DRA-20260507 | sideways | -842 | 6 | 100% | -7 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3495 | 2 | 100% | -34 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -580 | 1 | 100% | -5 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 1073 | 1 | 100% | 11 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -270 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -174 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -265 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2764 | 1 | 100% | -27 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -74 | 1 | 100% | 1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1417 | 1 | 100% | -13 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1064 | 1 | 100% | -9 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXOSCARPIC-27-DIS-20260509 | falling | -1614 | 1 | 100% | -16 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1600 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1246 | 1 | 100% | -12 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27MAR-C25-20260509 | falling | -1338 | 1 | 100% | -12 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -228 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXTIME-26-ZOH-20260509 | falling | -1211 | 2 | 100% | -11 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27JUN-C25-20260509 | falling | -3800 | 100 | 100% | -37 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | -276 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -476 | 1 | 100% | -3 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXTOPARTIST-26B-DRA-20260509 | falling | -650 | 1 | 100% | -5 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -571 | 1 | 100% | -4 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXCABOUT-26APR20-TGAB-20260507 | falling | 33 | 1 | 100% | 2 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXFEDDECISION-27OCT-H0-20260509 | falling | -2450 | 50 | 100% | -23 |  |
| s-passive | chunkSize=100, walkStepCents=2 | KXCABOUT-26APR20-TGAB-20260508 | falling | 633 | 1 | 100% | 8 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXETH-26MAY0817-B2390-20260508 | rising | -4300 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2574 | 2 | 100% | 27 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 748 | 1 | 100% | 8 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 38 | 1 | 100% | 2 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXINX-26MAY08H1600-B7387-20260508 | rising | -1060 | 5 | 100% | -9 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3826 | 1 | 100% | 39 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-28JAN-H0-20260509 | rising | 425 | 25 | 100% | 6 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -385 | 1 | 100% | -3 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | -66 | 1 | 100% | 1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1233 | 1 | 100% | 14 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXIPO-26-DISCORD-20260509 | rising | 23 | 1 | 100% | 2 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 138 | 1 | 100% | 3 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1400 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -174 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -800 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27APR-H0-20260508 | rising | 235 | 1 | 100% | 4 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -322 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27APR-H0-20260507 | rising | 733 | 1 | 100% | 9 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2090 | 1 | 100% | -20 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -1900 | 100 | 100% | -17 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXIPO-26-DISCORD-20260507 | sideways | -76 | 1 | 100% | 1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXIPO-26-DISCORD-20260508 | sideways | -477 | 1 | 100% | -3 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXLLM1-26MAY31-A-20260509 | sideways | -217 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -700 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -3309 | 1 | 100% | -32 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXOSCARPIC-27-DIS-20260508 | sideways | -2200 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -270 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -275 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -273 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27APR-H0-20260509 | sideways | 147 | 1 | 100% | 3 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -2500 | 100 | 100% | -23 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -946 | 1 | 100% | -9 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -771 | 1 | 100% | -6 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -2800 | 100 | 100% | -26 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -1400 | 100 | 100% | -12 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXOSCARACTO-27-TOM-20260507 | sideways | -931 | 1 | 100% | -8 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXOSCARACTO-27-TOM-20260508 | sideways | -1230 | 1 | 100% | -11 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2558 | 1 | 100% | -25 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 97 | 1 | 100% | 2 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXLLM1-26DEC31-XAI-20260508 | sideways | -38 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | -38 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -2100 | 100 | 100% | -19 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXLLM1-26MAY31-A-20260507 | sideways | -317 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -132 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -713 | 1 | 100% | -6 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXOSCARACTO-27-TOM-20260509 | sideways | -735 | 1 | 100% | -6 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1200 | 25 | 100% | -11 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -913 | 1 | 100% | -8 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXTOPARTIST-26B-DRA-20260508 | sideways | -935 | 1 | 100% | -8 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1617 | 1 | 100% | -15 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXIPOSPACEX-26JUN01-20260508 | sideways | -264 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXIPOSPACEX-26JUN01-20260509 | sideways | -158 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXLLM1-26MAY31-A-20260508 | sideways | -121 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -11 | 1 | 100% | 1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -309 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXLLM1-26DEC31-XAI-20260509 | sideways | -147 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -61 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -60 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -1500 | 100 | 100% | -13 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -1723 | 1 | 100% | -16 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 320 | 20 | 100% | 5 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -258 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1300 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -328 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -260 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -238 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -66 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -143 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXETH-26MAY0817-B2390-20260507 | sideways | -4200 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 631 | 1 | 100% | 7 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -1600 | 100 | 100% | -14 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -800 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -246 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -328 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -262 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -432 | 1 | 100% | -3 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 237 | 1 | 100% | 4 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXTIME-26-ZOH-20260508 | sideways | -1206 | 1 | 100% | -11 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXLLM1-26DEC31-XAI-20260507 | sideways | -41 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2089 | 1 | 100% | -20 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -400 | 100 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXIPO-26-DISCORD-20260510 | sideways | -369 | 1 | 100% | -2 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXLLM1-26MAY31-A-20260510 | sideways | -404 | 1 | 100% | -3 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -3969 | 2 | 100% | -39 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1339 | 2 | 100% | 15 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1600 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -576 | 1 | 100% | -4 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -573 | 1 | 100% | -4 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2764 | 1 | 100% | -27 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXTIME-26-ZOH-20260510 | sideways | -397 | 1 | 100% | -3 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXTOPARTIST-26B-DRA-20260507 | sideways | -1033 | 1 | 100% | -9 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3495 | 2 | 100% | -34 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -580 | 1 | 100% | -5 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 1073 | 1 | 100% | 11 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -270 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -174 | 1 | 100% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -265 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2764 | 1 | 100% | -27 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -74 | 1 | 100% | 1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1417 | 1 | 100% | -13 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1064 | 1 | 100% | -9 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXOSCARPIC-27-DIS-20260509 | falling | -1800 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1600 | 0 | 0% | 0 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1246 | 1 | 100% | -12 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27MAR-C25-20260509 | falling | -1338 | 1 | 100% | -12 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -228 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXTIME-26-ZOH-20260509 | falling | -1306 | 1 | 100% | -12 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27JUN-C25-20260509 | falling | -4128 | 1 | 100% | -41 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | -276 | 1 | 100% | -1 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -476 | 1 | 100% | -3 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXTOPARTIST-26B-DRA-20260509 | falling | -650 | 1 | 100% | -5 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -571 | 1 | 100% | -4 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXCABOUT-26APR20-TGAB-20260507 | falling | 33 | 1 | 100% | 2 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXFEDDECISION-27OCT-H0-20260509 | falling | -2909 | 1 | 100% | -28 |  |
| s-passive | chunkSize=100, walkStepCents=5 | KXCABOUT-26APR20-TGAB-20260508 | falling | 633 | 1 | 100% | 8 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXETH-26MAY0817-B2390-20260508 | rising | -4116 | 2 | 100% | -41 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2576 | 2 | 100% | 27 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 748 | 2 | 100% | 9 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 38 | 2 | 100% | 2 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXINX-26MAY08H1600-B7387-20260508 | rising | -800 | 100 | 100% | -6 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3826 | 2 | 100% | 39 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-28JAN-H0-20260509 | rising | 424 | 26 | 100% | 6 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -386 | 2 | 100% | -3 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 32 | 2 | 100% | 2 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1232 | 2 | 100% | 14 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXIPO-26-DISCORD-20260509 | rising | 48.840000000000146 | 4 | 100% | 3 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 432 | 12 | 100% | 6 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1314.0000000000005 | 8 | 100% | -13 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -174 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -522 | 2 | 100% | -5 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27APR-H0-20260508 | rising | 234 | 2 | 100% | 4 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -224 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27APR-H0-20260507 | rising | 732 | 2 | 100% | 9 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2090 | 2 | 100% | -20 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -1900 | 100 | 100% | -17 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXIPO-26-DISCORD-20260507 | sideways | 24 | 2 | 100% | 2 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXIPO-26-DISCORD-20260508 | sideways | -377.08 | 4 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXLLM1-26MAY31-A-20260509 | sideways | -218 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -608 | 2 | 100% | -6 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -2850 | 50 | 100% | -27 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXOSCARPIC-27-DIS-20260508 | sideways | -2014 | 2 | 100% | -20 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -270 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -276 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -274 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27APR-H0-20260509 | sideways | 146 | 2 | 100% | 3 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -2500 | 100 | 100% | -23 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -946 | 2 | 100% | -9 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -574 | 4 | 100% | -4 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -2800 | 100 | 100% | -26 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -1400 | 100 | 100% | -12 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXOSCARACTO-27-TOM-20260507 | sideways | -834 | 2 | 100% | -7 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXOSCARACTO-27-TOM-20260508 | sideways | -1134 | 2 | 100% | -10 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2558 | 2 | 100% | -25 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 94 | 2 | 100% | 2 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXLLM1-26DEC31-XAI-20260508 | sideways | -40 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | -38 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -2100 | 100 | 100% | -19 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXLLM1-26MAY31-A-20260507 | sideways | -318 | 2 | 100% | -2 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -132 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -714 | 2 | 100% | -6 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXOSCARACTO-27-TOM-20260509 | sideways | -736 | 2 | 100% | -6 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1000 | 100 | 100% | -9 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -914 | 2 | 100% | -8 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXTOPARTIST-26B-DRA-20260508 | sideways | -748 | 8 | 100% | -7 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1618 | 2 | 100% | -15 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXIPOSPACEX-26JUN01-20260508 | sideways | -264 | 2 | 100% | -2 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXIPOSPACEX-26JUN01-20260509 | sideways | -158 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXLLM1-26MAY31-A-20260508 | sideways | -122 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -14 | 2 | 100% | 1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -214 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXLLM1-26DEC31-XAI-20260509 | sideways | -148 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -62 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -60 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -1500 | 100 | 100% | -13 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -1530 | 4 | 100% | -14 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 320 | 20 | 100% | 5 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -258 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1214.0000000000005 | 8 | 100% | -12 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -328 | 2 | 100% | -2 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -260 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -238 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -66 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -144 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXETH-26MAY0817-B2390-20260507 | sideways | -3922 | 2 | 100% | -39 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 732.0000000000007 | 8 | 100% | 6 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -1600 | 100 | 100% | -14 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -522 | 2 | 100% | -5 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -246 | 2 | 100% | -2 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -328 | 2 | 100% | -2 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -262 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -432 | 2 | 100% | -3 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 283 | 12 | 100% | 5 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXTIME-26-ZOH-20260508 | sideways | -920 | 6 | 100% | -8 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXLLM1-26DEC31-XAI-20260507 | sideways | -42 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2090 | 2 | 100% | -19 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -400 | 100 | 100% | -2 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXIPO-26-DISCORD-20260510 | sideways | -268 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXLLM1-26MAY31-A-20260510 | sideways | -404 | 2 | 100% | -3 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -3970 | 2 | 100% | -39 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1340 | 2 | 100% | 15 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1508 | 2 | 100% | -15 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -478 | 2 | 100% | -3 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -574 | 2 | 100% | -4 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2764 | 2 | 100% | -27 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXTIME-26-ZOH-20260510 | sideways | -302 | 2 | 100% | -2 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXTOPARTIST-26B-DRA-20260507 | sideways | -842 | 6 | 100% | -7 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3496 | 2 | 100% | -34 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -580 | 2 | 100% | -5 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 1072 | 2 | 100% | 11 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -270 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -218 | 11 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -266 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2764 | 2 | 100% | -27 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -74 | 2 | 100% | 1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1418 | 2 | 100% | -13 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1064 | 2 | 100% | -9 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXOSCARPIC-27-DIS-20260509 | falling | -1614 | 2 | 100% | -16 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1508 | 2 | 100% | -15 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1246 | 2 | 100% | -12 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27MAR-C25-20260509 | falling | -1338 | 2 | 100% | -12 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -228 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXTIME-26-ZOH-20260509 | falling | -1168 | 4 | 100% | -10 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27JUN-C25-20260509 | falling | -3800 | 100 | 100% | -37 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | -276 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -476 | 2 | 100% | -3 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXTOPARTIST-26B-DRA-20260509 | falling | -650 | 2 | 100% | -5 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -572 | 2 | 100% | -4 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXCABOUT-26APR20-TGAB-20260507 | falling | 32 | 2 | 100% | 2 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXFEDDECISION-27OCT-H0-20260509 | falling | -2450 | 50 | 100% | -23 |  |
| s-twap | numIntervals=2, intervalMinutes=1 | KXCABOUT-26APR20-TGAB-20260508 | falling | 632 | 2 | 100% | 8 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXETH-26MAY0817-B2390-20260508 | rising | -4116 | 2 | 100% | -41 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2576 | 2 | 100% | 27 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 748 | 2 | 100% | 9 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 38 | 2 | 100% | 2 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXINX-26MAY08H1600-B7387-20260508 | rising | -800 | 100 | 100% | -6 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3826 | 2 | 100% | 39 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-28JAN-H0-20260509 | rising | 424 | 26 | 100% | 6 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -386 | 2 | 100% | -3 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 32 | 2 | 100% | 2 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1232 | 2 | 100% | 14 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXIPO-26-DISCORD-20260509 | rising | 48.840000000000146 | 4 | 100% | 3 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 432 | 12 | 100% | 6 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1314.0000000000005 | 8 | 100% | -13 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -174 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -522 | 2 | 100% | -5 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27APR-H0-20260508 | rising | 234 | 2 | 100% | 4 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -224 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27APR-H0-20260507 | rising | 732 | 2 | 100% | 9 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2090 | 2 | 100% | -20 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -1900 | 100 | 100% | -17 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXIPO-26-DISCORD-20260507 | sideways | 24 | 2 | 100% | 2 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXIPO-26-DISCORD-20260508 | sideways | -377.08 | 4 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXLLM1-26MAY31-A-20260509 | sideways | -218 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -608 | 2 | 100% | -6 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -2850 | 50 | 100% | -27 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXOSCARPIC-27-DIS-20260508 | sideways | -2014 | 2 | 100% | -20 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -270 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -276 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -274 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27APR-H0-20260509 | sideways | 146 | 2 | 100% | 3 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -2500 | 100 | 100% | -23 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -946 | 2 | 100% | -9 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -574 | 4 | 100% | -4 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -2800 | 100 | 100% | -26 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -1400 | 100 | 100% | -12 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXOSCARACTO-27-TOM-20260507 | sideways | -834 | 2 | 100% | -7 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXOSCARACTO-27-TOM-20260508 | sideways | -1134 | 2 | 100% | -10 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2558 | 2 | 100% | -25 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 94 | 2 | 100% | 2 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXLLM1-26DEC31-XAI-20260508 | sideways | -40 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | -38 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -2100 | 100 | 100% | -19 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXLLM1-26MAY31-A-20260507 | sideways | -318 | 2 | 100% | -2 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -132 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -714 | 2 | 100% | -6 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXOSCARACTO-27-TOM-20260509 | sideways | -736 | 2 | 100% | -6 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1000 | 100 | 100% | -9 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -914 | 2 | 100% | -8 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXTOPARTIST-26B-DRA-20260508 | sideways | -748 | 8 | 100% | -7 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1618 | 2 | 100% | -15 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXIPOSPACEX-26JUN01-20260508 | sideways | -264 | 2 | 100% | -2 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXIPOSPACEX-26JUN01-20260509 | sideways | -158 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXLLM1-26MAY31-A-20260508 | sideways | -122 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -14 | 2 | 100% | 1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -214 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXLLM1-26DEC31-XAI-20260509 | sideways | -148 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -62 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -60 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -1500 | 100 | 100% | -13 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -1530 | 4 | 100% | -14 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 320 | 20 | 100% | 5 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -258 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1214.0000000000005 | 8 | 100% | -12 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -328 | 2 | 100% | -2 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -260 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -238 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -66 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -144 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXETH-26MAY0817-B2390-20260507 | sideways | -3922 | 2 | 100% | -39 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 732.0000000000007 | 8 | 100% | 6 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -1600 | 100 | 100% | -14 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -522 | 2 | 100% | -5 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -246 | 2 | 100% | -2 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -328 | 2 | 100% | -2 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -262 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -432 | 2 | 100% | -3 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 283 | 12 | 100% | 5 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXTIME-26-ZOH-20260508 | sideways | -920 | 6 | 100% | -8 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXLLM1-26DEC31-XAI-20260507 | sideways | -42 | 2 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2090 | 2 | 100% | -19 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -400 | 100 | 100% | -2 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXIPO-26-DISCORD-20260510 | sideways | -268 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXLLM1-26MAY31-A-20260510 | sideways | -404 | 2 | 100% | -3 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -3970 | 2 | 100% | -39 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1340 | 2 | 100% | 15 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1508 | 2 | 100% | -15 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -478 | 2 | 100% | -3 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -574 | 2 | 100% | -4 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2764 | 2 | 100% | -27 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXTIME-26-ZOH-20260510 | sideways | -302 | 2 | 100% | -2 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXTOPARTIST-26B-DRA-20260507 | sideways | -842 | 6 | 100% | -7 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3496 | 2 | 100% | -34 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -580 | 2 | 100% | -5 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 1072 | 2 | 100% | 11 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -270 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -218 | 11 | 100% | 0 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -266 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2764 | 2 | 100% | -27 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -74 | 2 | 100% | 1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1418 | 2 | 100% | -13 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1064 | 2 | 100% | -9 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXOSCARPIC-27-DIS-20260509 | falling | -1614 | 2 | 100% | -16 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1508 | 2 | 100% | -15 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1246 | 2 | 100% | -12 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27MAR-C25-20260509 | falling | -1338 | 2 | 100% | -12 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -228 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXTIME-26-ZOH-20260509 | falling | -1168 | 4 | 100% | -10 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27JUN-C25-20260509 | falling | -3800 | 100 | 100% | -37 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | -276 | 2 | 100% | -1 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -476 | 2 | 100% | -3 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXTOPARTIST-26B-DRA-20260509 | falling | -650 | 2 | 100% | -5 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -572 | 2 | 100% | -4 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXCABOUT-26APR20-TGAB-20260507 | falling | 32 | 2 | 100% | 2 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXFEDDECISION-27OCT-H0-20260509 | falling | -2450 | 50 | 100% | -23 |  |
| s-twap | numIntervals=2, intervalMinutes=5 | KXCABOUT-26APR20-TGAB-20260508 | falling | 632 | 2 | 100% | 8 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXETH-26MAY0817-B2390-20260508 | rising | -4120 | 5 | 100% | -41 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2575 | 5 | 100% | 27 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 745 | 5 | 100% | 10 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 35 | 5 | 100% | 2 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXINX-26MAY08H1600-B7387-20260508 | rising | -800 | 100 | 100% | -6 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3825 | 5 | 100% | 39 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-28JAN-H0-20260509 | rising | 425 | 25 | 100% | 6 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -385 | 5 | 100% | -3 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 30 | 5 | 100% | 2 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1230 | 5 | 100% | 14 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXIPO-26-DISCORD-20260509 | rising | 120 | 5 | 100% | 3 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 430 | 15 | 100% | 6 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1315 | 10 | 100% | -13 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -175 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -525 | 5 | 100% | -5 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27APR-H0-20260508 | rising | 235 | 5 | 100% | 4 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -225 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27APR-H0-20260507 | rising | 730 | 5 | 100% | 9 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2090 | 5 | 100% | -20 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -1900 | 100 | 100% | -17 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXIPO-26-DISCORD-20260507 | sideways | 44 | 5 | 100% | 1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXIPO-26-DISCORD-20260508 | sideways | -380 | 5 | 100% | -2 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXLLM1-26MAY31-A-20260509 | sideways | -220 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -610 | 5 | 100% | -6 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -2850 | 50 | 100% | -27 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXOSCARPIC-27-DIS-20260508 | sideways | -2015 | 5 | 100% | -20 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -270 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -275 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -276 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27APR-H0-20260509 | sideways | 145 | 5 | 100% | 3 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -2500 | 100 | 100% | -23 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -950 | 5 | 100% | -9 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -575 | 5 | 100% | -4 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -2800 | 100 | 100% | -26 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -1400 | 100 | 100% | -12 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXOSCARACTO-27-TOM-20260507 | sideways | -835 | 5 | 100% | -7 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXOSCARACTO-27-TOM-20260508 | sideways | -1135 | 5 | 100% | -10 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2560 | 5 | 100% | -25 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 190 | 5 | 100% | 3 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXLLM1-26DEC31-XAI-20260508 | sideways | -45 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | -40 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -2100 | 100 | 100% | -19 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXLLM1-26MAY31-A-20260507 | sideways | -320 | 5 | 100% | -2 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -135 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -715 | 5 | 100% | -6 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXOSCARACTO-27-TOM-20260509 | sideways | -735 | 5 | 100% | -6 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1000 | 100 | 100% | -9 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -915 | 5 | 100% | -8 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXTOPARTIST-26B-DRA-20260508 | sideways | -750 | 10 | 100% | -7 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1620 | 5 | 100% | -15 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXIPOSPACEX-26JUN01-20260508 | sideways | -265 | 5 | 100% | -2 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXIPOSPACEX-26JUN01-20260509 | sideways | -160 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXLLM1-26MAY31-A-20260508 | sideways | -125 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -15 | 5 | 100% | 1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -215 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXLLM1-26DEC31-XAI-20260509 | sideways | -150 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -65 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -60 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -1500 | 100 | 100% | -13 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -1530 | 5 | 100% | -14 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 320 | 20 | 100% | 5 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -260 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1215 | 10 | 100% | -12 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -330 | 5 | 100% | -2 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -260 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -240 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -70 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -150 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXETH-26MAY0817-B2390-20260507 | sideways | -3925 | 5 | 100% | -39 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 729.9999999999999 | 10 | 100% | 6 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -1600 | 100 | 100% | -14 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -525 | 5 | 100% | -5 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -250 | 5 | 100% | -2 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -330 | 5 | 100% | -2 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -265 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -435 | 5 | 100% | -3 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 290 | 15 | 100% | 5 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXTIME-26-ZOH-20260508 | sideways | -920 | 5 | 100% | -8 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXLLM1-26DEC31-XAI-20260507 | sideways | -45 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2090 | 5 | 100% | -19 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -400 | 100 | 100% | -2 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXIPO-26-DISCORD-20260510 | sideways | -270 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXLLM1-26MAY31-A-20260510 | sideways | -405 | 5 | 100% | -3 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -3970 | 5 | 100% | -39 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1340 | 5 | 100% | 15 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1510 | 5 | 100% | -15 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -475 | 5 | 100% | -3 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -575 | 5 | 100% | -4 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2765 | 5 | 100% | -27 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXTIME-26-ZOH-20260510 | sideways | -205 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXTOPARTIST-26B-DRA-20260507 | sideways | -830 | 10 | 100% | -6 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3495 | 5 | 100% | -34 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -580 | 5 | 100% | -5 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 1070 | 5 | 100% | 11 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -290 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -235 | 35 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -265 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2765 | 5 | 100% | -27 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -75 | 5 | 100% | 1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1420 | 5 | 100% | -13 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1065 | 5 | 100% | -9 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXOSCARPIC-27-DIS-20260509 | falling | -1615 | 5 | 100% | -16 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1510 | 5 | 100% | -15 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1250 | 5 | 100% | -12 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27MAR-C25-20260509 | falling | -1340 | 5 | 100% | -12 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -230 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXTIME-26-ZOH-20260509 | falling | -1115 | 5 | 100% | -10 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27JUN-C25-20260509 | falling | -3800 | 100 | 100% | -37 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | -275 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -475 | 5 | 100% | -3 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXTOPARTIST-26B-DRA-20260509 | falling | -650 | 5 | 100% | -5 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -575 | 5 | 100% | -4 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXCABOUT-26APR20-TGAB-20260507 | falling | 30 | 5 | 100% | 2 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXFEDDECISION-27OCT-H0-20260509 | falling | -2450 | 50 | 100% | -23 |  |
| s-twap | numIntervals=5, intervalMinutes=1 | KXCABOUT-26APR20-TGAB-20260508 | falling | 630 | 5 | 100% | 8 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXETH-26MAY0817-B2390-20260508 | rising | -4120 | 5 | 100% | -41 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2575 | 5 | 100% | 27 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 745 | 5 | 100% | 10 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 35 | 5 | 100% | 2 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXINX-26MAY08H1600-B7387-20260508 | rising | -800 | 100 | 100% | -6 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3825 | 5 | 100% | 39 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-28JAN-H0-20260509 | rising | 425 | 25 | 100% | 6 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -385 | 5 | 100% | -3 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 30 | 5 | 100% | 2 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1230 | 5 | 100% | 14 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXIPO-26-DISCORD-20260509 | rising | 120 | 5 | 100% | 3 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 430 | 15 | 100% | 6 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1315 | 10 | 100% | -13 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -175 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -525 | 5 | 100% | -5 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27APR-H0-20260508 | rising | 235 | 5 | 100% | 4 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -225 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27APR-H0-20260507 | rising | 730 | 5 | 100% | 9 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2090 | 5 | 100% | -20 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -1900 | 100 | 100% | -17 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXIPO-26-DISCORD-20260507 | sideways | 44 | 5 | 100% | 1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXIPO-26-DISCORD-20260508 | sideways | -380 | 5 | 100% | -2 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXLLM1-26MAY31-A-20260509 | sideways | -220 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -610 | 5 | 100% | -6 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -2850 | 50 | 100% | -27 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXOSCARPIC-27-DIS-20260508 | sideways | -2015 | 5 | 100% | -20 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -270 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -275 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -276 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27APR-H0-20260509 | sideways | 145 | 5 | 100% | 3 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -2500 | 100 | 100% | -23 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -950 | 5 | 100% | -9 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -575 | 5 | 100% | -4 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -2800 | 100 | 100% | -26 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -1400 | 100 | 100% | -12 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXOSCARACTO-27-TOM-20260507 | sideways | -835 | 5 | 100% | -7 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXOSCARACTO-27-TOM-20260508 | sideways | -1135 | 5 | 100% | -10 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2560 | 5 | 100% | -25 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 190 | 5 | 100% | 3 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXLLM1-26DEC31-XAI-20260508 | sideways | -45 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | -40 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -2100 | 100 | 100% | -19 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXLLM1-26MAY31-A-20260507 | sideways | -320 | 5 | 100% | -2 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -135 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -715 | 5 | 100% | -6 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXOSCARACTO-27-TOM-20260509 | sideways | -735 | 5 | 100% | -6 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1000 | 100 | 100% | -9 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -915 | 5 | 100% | -8 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXTOPARTIST-26B-DRA-20260508 | sideways | -750 | 10 | 100% | -7 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1620 | 5 | 100% | -15 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXIPOSPACEX-26JUN01-20260508 | sideways | -265 | 5 | 100% | -2 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXIPOSPACEX-26JUN01-20260509 | sideways | -160 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXLLM1-26MAY31-A-20260508 | sideways | -125 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -15 | 5 | 100% | 1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -215 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXLLM1-26DEC31-XAI-20260509 | sideways | -150 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -65 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -60 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -1500 | 100 | 100% | -13 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -1530 | 5 | 100% | -14 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 320 | 20 | 100% | 5 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -260 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1215 | 10 | 100% | -12 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -330 | 5 | 100% | -2 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -260 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -240 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -70 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -150 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXETH-26MAY0817-B2390-20260507 | sideways | -3925 | 5 | 100% | -39 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 729.9999999999999 | 10 | 100% | 6 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -1600 | 100 | 100% | -14 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -525 | 5 | 100% | -5 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -250 | 5 | 100% | -2 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -330 | 5 | 100% | -2 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -265 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -435 | 5 | 100% | -3 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 290 | 15 | 100% | 5 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXTIME-26-ZOH-20260508 | sideways | -920 | 5 | 100% | -8 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXLLM1-26DEC31-XAI-20260507 | sideways | -45 | 5 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2090 | 5 | 100% | -19 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -400 | 100 | 100% | -2 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXIPO-26-DISCORD-20260510 | sideways | -270 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXLLM1-26MAY31-A-20260510 | sideways | -405 | 5 | 100% | -3 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -3970 | 5 | 100% | -39 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1340 | 5 | 100% | 15 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1510 | 5 | 100% | -15 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -475 | 5 | 100% | -3 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -575 | 5 | 100% | -4 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2765 | 5 | 100% | -27 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXTIME-26-ZOH-20260510 | sideways | -205 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXTOPARTIST-26B-DRA-20260507 | sideways | -830 | 10 | 100% | -6 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3495 | 5 | 100% | -34 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -580 | 5 | 100% | -5 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 1070 | 5 | 100% | 11 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -290 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -235 | 35 | 100% | 0 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -265 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2765 | 5 | 100% | -27 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -75 | 5 | 100% | 1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1420 | 5 | 100% | -13 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1065 | 5 | 100% | -9 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXOSCARPIC-27-DIS-20260509 | falling | -1615 | 5 | 100% | -16 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1510 | 5 | 100% | -15 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1250 | 5 | 100% | -12 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27MAR-C25-20260509 | falling | -1340 | 5 | 100% | -12 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -230 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXTIME-26-ZOH-20260509 | falling | -1115 | 5 | 100% | -10 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27JUN-C25-20260509 | falling | -3800 | 100 | 100% | -37 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | -275 | 5 | 100% | -1 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -475 | 5 | 100% | -3 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXTOPARTIST-26B-DRA-20260509 | falling | -650 | 5 | 100% | -5 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -575 | 5 | 100% | -4 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXCABOUT-26APR20-TGAB-20260507 | falling | 30 | 5 | 100% | 2 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXFEDDECISION-27OCT-H0-20260509 | falling | -2450 | 50 | 100% | -23 |  |
| s-twap | numIntervals=5, intervalMinutes=5 | KXCABOUT-26APR20-TGAB-20260508 | falling | 630 | 5 | 100% | 8 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXETH-26MAY0817-B2390-20260508 | rising | -4120 | 10 | 100% | -41 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2570 | 10 | 100% | 27 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 740 | 10 | 100% | 12 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 30 | 10 | 100% | 1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXINX-26MAY08H1600-B7387-20260508 | rising | -800 | 100 | 100% | -6 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3820 | 10 | 100% | 39 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-28JAN-H0-20260509 | rising | 420 | 30 | 100% | 6 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -360 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 30 | 10 | 100% | 2 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1230 | 10 | 100% | 13 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXIPO-26-DISCORD-20260509 | rising | 120 | 10 | 100% | 3 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 430 | 20 | 100% | 7 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1310 | 10 | 100% | -13 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -180 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -530 | 10 | 100% | -6 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27APR-H0-20260508 | rising | 230 | 10 | 100% | 4 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -230 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27APR-H0-20260507 | rising | 730 | 10 | 100% | 9 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2090 | 10 | 100% | -20 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -1900 | 100 | 100% | -17 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXIPO-26-DISCORD-20260507 | sideways | 134 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXIPO-26-DISCORD-20260508 | sideways | -290 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXLLM1-26MAY31-A-20260509 | sideways | -220 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -610 | 10 | 100% | -6 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -2850 | 50 | 100% | -27 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXOSCARPIC-27-DIS-20260508 | sideways | -2020 | 10 | 100% | -20 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -270 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -260 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -224 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27APR-H0-20260509 | sideways | 140 | 10 | 100% | 3 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -2500 | 100 | 100% | -23 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -950 | 10 | 100% | -9 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -580 | 10 | 100% | -4 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -2800 | 100 | 100% | -26 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -1400 | 100 | 100% | -12 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXOSCARACTO-27-TOM-20260507 | sideways | -840 | 10 | 100% | -7 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXOSCARACTO-27-TOM-20260508 | sideways | -1140 | 10 | 100% | -10 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2560 | 10 | 100% | -25 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 190 | 10 | 100% | 3 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXLLM1-26DEC31-XAI-20260508 | sideways | -50 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | -40 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -2100 | 100 | 100% | -19 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXLLM1-26MAY31-A-20260507 | sideways | -320 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -140 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -720 | 10 | 100% | -6 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXOSCARACTO-27-TOM-20260509 | sideways | -740 | 10 | 100% | -6 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1000 | 100 | 100% | -9 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -920 | 10 | 100% | -8 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXTOPARTIST-26B-DRA-20260508 | sideways | -750 | 10 | 100% | -7 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1620 | 10 | 100% | -15 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXIPOSPACEX-26JUN01-20260508 | sideways | -270 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXIPOSPACEX-26JUN01-20260509 | sideways | -160 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXLLM1-26MAY31-A-20260508 | sideways | -130 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -20 | 10 | 100% | 1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -220 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXLLM1-26DEC31-XAI-20260509 | sideways | -160 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -70 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -60 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -1500 | 100 | 100% | -13 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -1530 | 10 | 100% | -14 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 320 | 20 | 100% | 5 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -260 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1210 | 10 | 100% | -12 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -330 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -260 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -240 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -70 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -160 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXETH-26MAY0817-B2390-20260507 | sideways | -3930 | 10 | 100% | -39 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 760 | 13 | 100% | 7 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -1600 | 100 | 100% | -14 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -530 | 10 | 100% | -5 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -250 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -330 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -270 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -440 | 10 | 100% | -3 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 302 | 19 | 100% | 5 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXTIME-26-ZOH-20260508 | sideways | -920 | 10 | 100% | -8 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXLLM1-26DEC31-XAI-20260507 | sideways | -50 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2090 | 10 | 100% | -19 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -400 | 100 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXIPO-26-DISCORD-20260510 | sideways | -270 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXLLM1-26MAY31-A-20260510 | sideways | -310 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -3970 | 10 | 100% | -39 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1340 | 10 | 100% | 15 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1510 | 10 | 100% | -15 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -480 | 10 | 100% | -3 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -580 | 10 | 100% | -4 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2770 | 10 | 100% | -27 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXTIME-26-ZOH-20260510 | sideways | -210 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXTOPARTIST-26B-DRA-20260507 | sideways | -750 | 10 | 100% | -6 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3500 | 10 | 100% | -34 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -580 | 10 | 100% | -5 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 1070 | 10 | 100% | 11 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -330 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -234 | 55 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -270 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2770 | 10 | 100% | -27 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -80 | 10 | 100% | 2 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1420 | 10 | 100% | -15 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1070 | 10 | 100% | -9 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXOSCARPIC-27-DIS-20260509 | falling | -1620 | 10 | 100% | -16 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1510 | 10 | 100% | -15 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1250 | 10 | 100% | -12 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27MAR-C25-20260509 | falling | -1340 | 10 | 100% | -12 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -230 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXTIME-26-ZOH-20260509 | falling | -1120 | 10 | 100% | -10 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27JUN-C25-20260509 | falling | -3800 | 100 | 100% | -37 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | -280 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -480 | 10 | 100% | -3 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXTOPARTIST-26B-DRA-20260509 | falling | -650 | 10 | 100% | -5 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -580 | 10 | 100% | -4 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXCABOUT-26APR20-TGAB-20260507 | falling | 30 | 10 | 100% | 2 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXFEDDECISION-27OCT-H0-20260509 | falling | -2450 | 50 | 100% | -23 |  |
| s-twap | numIntervals=10, intervalMinutes=1 | KXCABOUT-26APR20-TGAB-20260508 | falling | 630 | 10 | 100% | 8 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXETH-26MAY0817-B2390-20260508 | rising | -4120 | 10 | 100% | -41 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2570 | 10 | 100% | 27 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 740 | 10 | 100% | 12 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 30 | 10 | 100% | 1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXINX-26MAY08H1600-B7387-20260508 | rising | -800 | 100 | 100% | -6 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3820 | 10 | 100% | 39 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-28JAN-H0-20260509 | rising | 420 | 30 | 100% | 6 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -360 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 30 | 10 | 100% | 2 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1230 | 10 | 100% | 13 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXIPO-26-DISCORD-20260509 | rising | 120 | 10 | 100% | 3 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 430 | 20 | 100% | 7 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1310 | 10 | 100% | -13 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -180 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -530 | 10 | 100% | -6 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27APR-H0-20260508 | rising | 230 | 10 | 100% | 4 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -230 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27APR-H0-20260507 | rising | 730 | 10 | 100% | 9 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2090 | 10 | 100% | -20 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -1900 | 100 | 100% | -17 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXIPO-26-DISCORD-20260507 | sideways | 134 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXIPO-26-DISCORD-20260508 | sideways | -290 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXLLM1-26MAY31-A-20260509 | sideways | -220 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -610 | 10 | 100% | -6 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -2850 | 50 | 100% | -27 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXOSCARPIC-27-DIS-20260508 | sideways | -2020 | 10 | 100% | -20 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -270 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -260 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -224 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27APR-H0-20260509 | sideways | 140 | 10 | 100% | 3 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -2500 | 100 | 100% | -23 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -950 | 10 | 100% | -9 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -580 | 10 | 100% | -4 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -2800 | 100 | 100% | -26 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -1400 | 100 | 100% | -12 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXOSCARACTO-27-TOM-20260507 | sideways | -840 | 10 | 100% | -7 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXOSCARACTO-27-TOM-20260508 | sideways | -1140 | 10 | 100% | -10 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2560 | 10 | 100% | -25 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 190 | 10 | 100% | 3 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXLLM1-26DEC31-XAI-20260508 | sideways | -50 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | -40 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -2100 | 100 | 100% | -19 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXLLM1-26MAY31-A-20260507 | sideways | -320 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -140 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -720 | 10 | 100% | -6 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXOSCARACTO-27-TOM-20260509 | sideways | -740 | 10 | 100% | -6 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1000 | 100 | 100% | -9 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -920 | 10 | 100% | -8 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXTOPARTIST-26B-DRA-20260508 | sideways | -750 | 10 | 100% | -7 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1620 | 10 | 100% | -15 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXIPOSPACEX-26JUN01-20260508 | sideways | -270 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXIPOSPACEX-26JUN01-20260509 | sideways | -160 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXLLM1-26MAY31-A-20260508 | sideways | -130 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -20 | 10 | 100% | 1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -220 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXLLM1-26DEC31-XAI-20260509 | sideways | -160 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -70 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -60 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -1500 | 100 | 100% | -13 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -1530 | 10 | 100% | -14 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 320 | 20 | 100% | 5 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -260 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1210 | 10 | 100% | -12 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -330 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -260 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -240 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -70 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -160 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXETH-26MAY0817-B2390-20260507 | sideways | -3930 | 10 | 100% | -39 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 760 | 13 | 100% | 7 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -1600 | 100 | 100% | -14 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -530 | 10 | 100% | -5 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -250 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -330 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -270 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -440 | 10 | 100% | -3 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 302 | 19 | 100% | 5 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXTIME-26-ZOH-20260508 | sideways | -920 | 10 | 100% | -8 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXLLM1-26DEC31-XAI-20260507 | sideways | -50 | 10 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2090 | 10 | 100% | -19 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -400 | 100 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXIPO-26-DISCORD-20260510 | sideways | -270 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXLLM1-26MAY31-A-20260510 | sideways | -310 | 10 | 100% | -2 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -3970 | 10 | 100% | -39 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1340 | 10 | 100% | 15 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1510 | 10 | 100% | -15 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -480 | 10 | 100% | -3 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -580 | 10 | 100% | -4 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2770 | 10 | 100% | -27 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXTIME-26-ZOH-20260510 | sideways | -210 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXTOPARTIST-26B-DRA-20260507 | sideways | -750 | 10 | 100% | -6 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3500 | 10 | 100% | -34 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -580 | 10 | 100% | -5 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 1070 | 10 | 100% | 11 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -330 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -234 | 55 | 100% | 0 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -270 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2770 | 10 | 100% | -27 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -80 | 10 | 100% | 2 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1420 | 10 | 100% | -15 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1070 | 10 | 100% | -9 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXOSCARPIC-27-DIS-20260509 | falling | -1620 | 10 | 100% | -16 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1510 | 10 | 100% | -15 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1250 | 10 | 100% | -12 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27MAR-C25-20260509 | falling | -1340 | 10 | 100% | -12 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -230 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXTIME-26-ZOH-20260509 | falling | -1120 | 10 | 100% | -10 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27JUN-C25-20260509 | falling | -3800 | 100 | 100% | -37 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | -280 | 10 | 100% | -1 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -480 | 10 | 100% | -3 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXTOPARTIST-26B-DRA-20260509 | falling | -650 | 10 | 100% | -5 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -580 | 10 | 100% | -4 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXCABOUT-26APR20-TGAB-20260507 | falling | 30 | 10 | 100% | 2 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXFEDDECISION-27OCT-H0-20260509 | falling | -2450 | 50 | 100% | -23 |  |
| s-twap | numIntervals=10, intervalMinutes=5 | KXCABOUT-26APR20-TGAB-20260508 | falling | 630 | 10 | 100% | 8 |  |
| s-trail | trailCents=1 | KXETH-26MAY0817-B2390-20260508 | rising | -4208 | 1 | 100% | -42 |  |
| s-trail | trailCents=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2062 | 1 | 100% | 22 |  |
| s-trail | trailCents=1 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 748 | 1 | 100% | 10 |  |
| s-trail | trailCents=1 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 38 | 1 | 100% | 2 |  |
| s-trail | trailCents=1 | KXINX-26MAY08H1600-B7387-20260508 | rising | -1532 | 1 | 100% | -15 |  |
| s-trail | trailCents=1 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3826 | 1 | 100% | 39 |  |
| s-trail | trailCents=1 | KXFEDDECISION-28JAN-H0-20260509 | rising | -2437 | 1 | 100% | -22 |  |
| s-trail | trailCents=1 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -385 | 1 | 100% | -2 |  |
| s-trail | trailCents=1 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | -66 | 1 | 100% | -1 |  |
| s-trail | trailCents=1 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1233 | 1 | 100% | 14 |  |
| s-trail | trailCents=1 | KXIPO-26-DISCORD-20260509 | rising | -77 | 1 | 100% | 0 |  |
| s-trail | trailCents=1 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 138 | 1 | 100% | 4 |  |
| s-trail | trailCents=1 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1387.15 | 1 | 15% | -13 |  |
| s-trail | trailCents=1 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -174 | 1 | 100% | 0 |  |
| s-trail | trailCents=1 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -521 | 1 | 100% | -5 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27APR-H0-20260508 | rising | 847 | 1 | 100% | 9 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -322 | 1 | 100% | -2 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27APR-H0-20260507 | rising | -5200 | 0 | 0% | 0 |  |
| s-trail | trailCents=1 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2090 | 1 | 100% | -20 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -4900 | 0 | 0% | 0 |  |
| s-trail | trailCents=1 | KXIPO-26-DISCORD-20260507 | sideways | -76 | 1 | 100% | 1 |  |
| s-trail | trailCents=1 | KXIPO-26-DISCORD-20260508 | sideways | -276 | 1 | 100% | 6 |  |
| s-trail | trailCents=1 | KXLLM1-26MAY31-A-20260509 | sideways | -321 | 1 | 100% | 0 |  |
| s-trail | trailCents=1 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -607 | 1 | 100% | -6 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -3309 | 1 | 100% | -32 |  |
| s-trail | trailCents=1 | KXOSCARPIC-27-DIS-20260508 | sideways | -2014 | 1 | 100% | -20 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -270 | 1 | 100% | -1 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -275 | 1 | 100% | -2 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -273 | 1 | 100% | 0 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27APR-H0-20260509 | sideways | -6500 | 0 | 0% | 0 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -3005 | 1 | 100% | -29 |  |
| s-trail | trailCents=1 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -946 | 1 | 100% | -9 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -771 | 1 | 100% | -6 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -3305 | 1 | 100% | -32 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -2915 | 1 | 100% | -28 |  |
| s-trail | trailCents=1 | KXOSCARACTO-27-TOM-20260507 | sideways | -931 | 1 | 100% | -8 |  |
| s-trail | trailCents=1 | KXOSCARACTO-27-TOM-20260508 | sideways | -1230 | 1 | 100% | -11 |  |
| s-trail | trailCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2464 | 1 | 100% | -30 |  |
| s-trail | trailCents=1 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 97 | 1 | 100% | 2 |  |
| s-trail | trailCents=1 | KXLLM1-26DEC31-XAI-20260508 | sideways | -38 | 1 | 100% | 0 |  |
| s-trail | trailCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 813 | 1 | 100% | -24 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -3311 | 1 | 100% | -31 |  |
| s-trail | trailCents=1 | KXLLM1-26MAY31-A-20260507 | sideways | -317 | 1 | 100% | -1 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -132 | 1 | 100% | -2 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -713 | 1 | 100% | -5 |  |
| s-trail | trailCents=1 | KXOSCARACTO-27-TOM-20260509 | sideways | -735 | 1 | 100% | -6 |  |
| s-trail | trailCents=1 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1822 | 1 | 100% | -18 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -9907 | 1 | 100% | -99 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -913 | 1 | 100% | -5 |  |
| s-trail | trailCents=1 | KXTOPARTIST-26B-DRA-20260508 | sideways | -1032 | 1 | 100% | -16 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1617 | 1 | 100% | -15 |  |
| s-trail | trailCents=1 | KXIPOSPACEX-26JUN01-20260508 | sideways | -264 | 1 | 100% | -2 |  |
| s-trail | trailCents=1 | KXIPOSPACEX-26JUN01-20260509 | sideways | -158 | 1 | 100% | -1 |  |
| s-trail | trailCents=1 | KXLLM1-26MAY31-A-20260508 | sideways | -121 | 1 | 100% | -1 |  |
| s-trail | trailCents=1 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -111 | 1 | 100% | 1 |  |
| s-trail | trailCents=1 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -500 | 1 | 100% | -4 |  |
| s-trail | trailCents=1 | KXLLM1-26DEC31-XAI-20260509 | sideways | -147 | 1 | 100% | -1 |  |
| s-trail | trailCents=1 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -9000 | 0 | 0% | 0 |  |
| s-trail | trailCents=1 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -59 | 1 | 100% | 1 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -3015 | 1 | 100% | -30 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -1818 | 1 | 100% | -16 |  |
| s-trail | trailCents=1 | KXFEDDECISION-28JAN-H0-20260508 | sideways | -2919 | 1 | 100% | -27 |  |
| s-trail | trailCents=1 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -258 | 1 | 100% | 0 |  |
| s-trail | trailCents=1 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1287.17 | 1 | 15% | -12 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -424 | 1 | 100% | -2 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -260 | 1 | 100% | 0 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -238 | 1 | 100% | -1 |  |
| s-trail | trailCents=1 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -9000 | 0 | 0% | 0 |  |
| s-trail | trailCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -138 | 1 | 100% | 0 |  |
| s-trail | trailCents=1 | KXETH-26MAY0817-B2390-20260507 | sideways | -3921 | 1 | 100% | -40 |  |
| s-trail | trailCents=1 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 632 | 1 | 100% | 6 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -3115 | 1 | 100% | -30 |  |
| s-trail | trailCents=1 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -521 | 1 | 100% | -5 |  |
| s-trail | trailCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -344 | 1 | 100% | -4 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -2600 | 0 | 0% | 0 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -262 | 1 | 100% | -1 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -432 | 1 | 100% | -2 |  |
| s-trail | trailCents=1 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 238 | 1 | 100% | 4 |  |
| s-trail | trailCents=1 | KXTIME-26-ZOH-20260508 | sideways | -1203 | 1 | 100% | -11 |  |
| s-trail | trailCents=1 | KXLLM1-26DEC31-XAI-20260507 | sideways | -41 | 1 | 100% | -1 |  |
| s-trail | trailCents=1 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2089 | 1 | 100% | -20 |  |
| s-trail | trailCents=1 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -8306 | 1 | 100% | -82 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -1409 | 1 | 100% | -14 |  |
| s-trail | trailCents=1 | KXIPO-26-DISCORD-20260510 | sideways | -875 | 1 | 100% | -7 |  |
| s-trail | trailCents=1 | KXLLM1-26MAY31-A-20260510 | sideways | -404 | 1 | 100% | -2 |  |
| s-trail | trailCents=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -4348 | 1 | 100% | -43 |  |
| s-trail | trailCents=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1035 | 1 | 100% | 12 |  |
| s-trail | trailCents=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1507 | 1 | 100% | -15 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -5600 | 0 | 0% | 0 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -673 | 1 | 100% | -6 |  |
| s-trail | trailCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2764 | 1 | 100% | -27 |  |
| s-trail | trailCents=1 | KXTIME-26-ZOH-20260510 | sideways | -491 | 1 | 100% | -4 |  |
| s-trail | trailCents=1 | KXTOPARTIST-26B-DRA-20260507 | sideways | -1033 | 1 | 100% | -9 |  |
| s-trail | trailCents=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3966 | 1 | 100% | -39 |  |
| s-trail | trailCents=1 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -474 | 1 | 100% | 39 |  |
| s-trail | trailCents=1 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 1391 | 1 | 100% | 36 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -369 | 1 | 100% | -1 |  |
| s-trail | trailCents=1 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -73 | 1 | 100% | 1 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -265 | 1 | 100% | -1 |  |
| s-trail | trailCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2764 | 1 | 100% | -27 |  |
| s-trail | trailCents=1 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -74 | 1 | 100% | 1 |  |
| s-trail | trailCents=1 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1417 | 1 | 100% | -15 |  |
| s-trail | trailCents=1 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1064 | 1 | 100% | -8 |  |
| s-trail | trailCents=1 | KXOSCARPIC-27-DIS-20260509 | falling | -1614 | 1 | 100% | -16 |  |
| s-trail | trailCents=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1507 | 1 | 100% | -15 |  |
| s-trail | trailCents=1 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1246 | 1 | 100% | -12 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27MAR-C25-20260509 | falling | -1916 | 1 | 100% | -17 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -324 | 1 | 100% | -1 |  |
| s-trail | trailCents=1 | KXTIME-26-ZOH-20260509 | falling | -1209 | 1 | 100% | -10 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27JUN-C25-20260509 | falling | -4128 | 1 | 100% | -41 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | -276 | 1 | 100% | -1 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -475 | 1 | 100% | -4 |  |
| s-trail | trailCents=1 | KXTOPARTIST-26B-DRA-20260509 | falling | -748 | 1 | 100% | -1 |  |
| s-trail | trailCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -571 | 1 | 100% | 0 |  |
| s-trail | trailCents=1 | KXCABOUT-26APR20-TGAB-20260507 | falling | 33 | 1 | 100% | 9 |  |
| s-trail | trailCents=1 | KXFEDDECISION-27OCT-H0-20260509 | falling | -2427 | 1 | 100% | -26 |  |
| s-trail | trailCents=1 | KXCABOUT-26APR20-TGAB-20260508 | falling | 633 | 1 | 100% | 9 |  |
| s-trail | trailCents=3 | KXETH-26MAY0817-B2390-20260508 | rising | -4208 | 1 | 100% | -42 |  |
| s-trail | trailCents=3 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2062 | 1 | 100% | 22 |  |
| s-trail | trailCents=3 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 748 | 1 | 100% | 10 |  |
| s-trail | trailCents=3 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 38 | 1 | 100% | 2 |  |
| s-trail | trailCents=3 | KXINX-26MAY08H1600-B7387-20260508 | rising | -1532 | 1 | 100% | -15 |  |
| s-trail | trailCents=3 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3826 | 1 | 100% | 39 |  |
| s-trail | trailCents=3 | KXFEDDECISION-28JAN-H0-20260509 | rising | -2437 | 1 | 100% | -22 |  |
| s-trail | trailCents=3 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -290 | 1 | 100% | 0 |  |
| s-trail | trailCents=3 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | -66 | 1 | 100% | 0 |  |
| s-trail | trailCents=3 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1233 | 1 | 100% | 14 |  |
| s-trail | trailCents=3 | KXIPO-26-DISCORD-20260509 | rising | -76 | 1 | 100% | 5 |  |
| s-trail | trailCents=3 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 138 | 1 | 100% | 4 |  |
| s-trail | trailCents=3 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1387.15 | 1 | 15% | -13 |  |
| s-trail | trailCents=3 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -174 | 1 | 100% | 0 |  |
| s-trail | trailCents=3 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -521 | 1 | 100% | -5 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27APR-H0-20260508 | rising | 847 | 1 | 100% | 9 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -224 | 1 | 100% | -1 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27APR-H0-20260507 | rising | -5200 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2090 | 1 | 100% | -20 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -4900 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXIPO-26-DISCORD-20260507 | sideways | -76 | 1 | 100% | 1 |  |
| s-trail | trailCents=3 | KXIPO-26-DISCORD-20260508 | sideways | -276 | 1 | 100% | 6 |  |
| s-trail | trailCents=3 | KXLLM1-26MAY31-A-20260509 | sideways | -321 | 1 | 100% | 1 |  |
| s-trail | trailCents=3 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -607 | 1 | 100% | -6 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -3309 | 1 | 100% | -27 |  |
| s-trail | trailCents=3 | KXOSCARPIC-27-DIS-20260508 | sideways | -2014 | 1 | 100% | -20 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -4200 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 426 | 1 | 100% | -4 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -174 | 1 | 100% | 1 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27APR-H0-20260509 | sideways | -6500 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -3005 | 1 | 100% | -29 |  |
| s-trail | trailCents=3 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -946 | 1 | 100% | -9 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -573 | 1 | 100% | -5 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -3305 | 1 | 100% | -32 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -2915 | 1 | 100% | -27 |  |
| s-trail | trailCents=3 | KXOSCARACTO-27-TOM-20260507 | sideways | -931 | 1 | 100% | -8 |  |
| s-trail | trailCents=3 | KXOSCARACTO-27-TOM-20260508 | sideways | -1230 | 1 | 100% | -11 |  |
| s-trail | trailCents=3 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2464 | 1 | 100% | -30 |  |
| s-trail | trailCents=3 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 97 | 1 | 100% | 2 |  |
| s-trail | trailCents=3 | KXLLM1-26DEC31-XAI-20260508 | sideways | -40 | 1 | 100% | 0 |  |
| s-trail | trailCents=3 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 1479 | 1 | 100% | -17 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -3311 | 1 | 100% | -28 |  |
| s-trail | trailCents=3 | KXLLM1-26MAY31-A-20260507 | sideways | -317 | 1 | 100% | -2 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -132 | 1 | 100% | 0 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -713 | 1 | 100% | -5 |  |
| s-trail | trailCents=3 | KXOSCARACTO-27-TOM-20260509 | sideways | -735 | 1 | 100% | -6 |  |
| s-trail | trailCents=3 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1822 | 1 | 100% | -18 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -9907 | 1 | 100% | -99 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -2800 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXTOPARTIST-26B-DRA-20260508 | sideways | -645 | 1 | 100% | -7 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1617 | 1 | 100% | -15 |  |
| s-trail | trailCents=3 | KXIPOSPACEX-26JUN01-20260508 | sideways | -264 | 1 | 100% | -2 |  |
| s-trail | trailCents=3 | KXIPOSPACEX-26JUN01-20260509 | sideways | -158 | 1 | 100% | -1 |  |
| s-trail | trailCents=3 | KXLLM1-26MAY31-A-20260508 | sideways | -7800 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -111 | 1 | 100% | 2 |  |
| s-trail | trailCents=3 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -500 | 1 | 100% | -4 |  |
| s-trail | trailCents=3 | KXLLM1-26DEC31-XAI-20260509 | sideways | -243 | 1 | 100% | -2 |  |
| s-trail | trailCents=3 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -9000 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -164 | 1 | 100% | 0 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -3015 | 1 | 100% | -28 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -1818 | 1 | 100% | -16 |  |
| s-trail | trailCents=3 | KXFEDDECISION-28JAN-H0-20260508 | sideways | -3210 | 1 | 100% | -30 |  |
| s-trail | trailCents=3 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -258 | 1 | 100% | -1 |  |
| s-trail | trailCents=3 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1287.17 | 1 | 15% | -12 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -521 | 1 | 100% | -1 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -260 | 1 | 100% | -1 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -335 | 1 | 100% | -1 |  |
| s-trail | trailCents=3 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -9000 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -234 | 1 | 100% | 0 |  |
| s-trail | trailCents=3 | KXETH-26MAY0817-B2390-20260507 | sideways | -4200 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 736 | 1 | 100% | 9 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -5000 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -521 | 1 | 100% | -5 |  |
| s-trail | trailCents=3 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -900 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -2600 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -262 | 1 | 100% | 1 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -432 | 1 | 100% | -1 |  |
| s-trail | trailCents=3 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 238 | 1 | 100% | 4 |  |
| s-trail | trailCents=3 | KXTIME-26-ZOH-20260508 | sideways | -2900 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXLLM1-26DEC31-XAI-20260507 | sideways | -600 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2089 | 1 | 100% | -20 |  |
| s-trail | trailCents=3 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -8306 | 1 | 100% | -82 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -1409 | 1 | 100% | -14 |  |
| s-trail | trailCents=3 | KXIPO-26-DISCORD-20260510 | sideways | -975 | 1 | 100% | -5 |  |
| s-trail | trailCents=3 | KXLLM1-26MAY31-A-20260510 | sideways | -8500 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -4348 | 1 | 100% | -43 |  |
| s-trail | trailCents=3 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1035 | 1 | 100% | 12 |  |
| s-trail | trailCents=3 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1507 | 1 | 100% | -15 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -5600 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -574 | 1 | 100% | -3 |  |
| s-trail | trailCents=3 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2764 | 1 | 100% | -27 |  |
| s-trail | trailCents=3 | KXTIME-26-ZOH-20260510 | sideways | -1900 | 0 | 0% | 0 |  |
| s-trail | trailCents=3 | KXTOPARTIST-26B-DRA-20260507 | sideways | -1033 | 1 | 100% | -5 |  |
| s-trail | trailCents=3 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3966 | 1 | 100% | -39 |  |
| s-trail | trailCents=3 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -474 | 1 | 100% | 39 |  |
| s-trail | trailCents=3 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 1391 | 1 | 100% | 36 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -270 | 1 | 100% | -1 |  |
| s-trail | trailCents=3 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -73 | 1 | 100% | 1 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -167 | 1 | 100% | -1 |  |
| s-trail | trailCents=3 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2764 | 1 | 100% | -27 |  |
| s-trail | trailCents=3 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -74 | 1 | 100% | 6 |  |
| s-trail | trailCents=3 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1417 | 1 | 100% | -15 |  |
| s-trail | trailCents=3 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1064 | 1 | 100% | -11 |  |
| s-trail | trailCents=3 | KXOSCARPIC-27-DIS-20260509 | falling | -1614 | 1 | 100% | -16 |  |
| s-trail | trailCents=3 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1507 | 1 | 100% | -15 |  |
| s-trail | trailCents=3 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1246 | 1 | 100% | -12 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27MAR-C25-20260509 | falling | -1916 | 1 | 100% | -17 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -324 | 1 | 100% | -1 |  |
| s-trail | trailCents=3 | KXTIME-26-ZOH-20260509 | falling | -1400 | 1 | 100% | -11 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27JUN-C25-20260509 | falling | -4128 | 1 | 100% | -41 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 428 | 1 | 100% | -1 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -476 | 1 | 100% | -3 |  |
| s-trail | trailCents=3 | KXTOPARTIST-26B-DRA-20260509 | falling | -748 | 1 | 100% | -1 |  |
| s-trail | trailCents=3 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -867 | 1 | 100% | -1 |  |
| s-trail | trailCents=3 | KXCABOUT-26APR20-TGAB-20260507 | falling | 33 | 1 | 100% | 9 |  |
| s-trail | trailCents=3 | KXFEDDECISION-27OCT-H0-20260509 | falling | -2427 | 1 | 100% | -27 |  |
| s-trail | trailCents=3 | KXCABOUT-26APR20-TGAB-20260508 | falling | 633 | 1 | 100% | 3 |  |
| s-trail | trailCents=5 | KXETH-26MAY0817-B2390-20260508 | rising | -4208 | 1 | 100% | -42 |  |
| s-trail | trailCents=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2062 | 1 | 100% | 22 |  |
| s-trail | trailCents=5 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 748 | 1 | 100% | 32 |  |
| s-trail | trailCents=5 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 926 | 1 | 100% | -2 |  |
| s-trail | trailCents=5 | KXINX-26MAY08H1600-B7387-20260508 | rising | -1532 | 1 | 100% | -15 |  |
| s-trail | trailCents=5 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3826 | 1 | 100% | 39 |  |
| s-trail | trailCents=5 | KXFEDDECISION-28JAN-H0-20260509 | rising | -2437 | 1 | 100% | -22 |  |
| s-trail | trailCents=5 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -290 | 1 | 100% | 0 |  |
| s-trail | trailCents=5 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | -66 | 1 | 100% | 1 |  |
| s-trail | trailCents=5 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1233 | 1 | 100% | 14 |  |
| s-trail | trailCents=5 | KXIPO-26-DISCORD-20260509 | rising | -76 | 1 | 100% | 5 |  |
| s-trail | trailCents=5 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 138 | 1 | 100% | 4 |  |
| s-trail | trailCents=5 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1387.15 | 1 | 15% | -13 |  |
| s-trail | trailCents=5 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -174 | 1 | 100% | 0 |  |
| s-trail | trailCents=5 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -521 | 1 | 100% | -5 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27APR-H0-20260508 | rising | 847 | 1 | 100% | 9 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -129 | 1 | 100% | -1 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27APR-H0-20260507 | rising | -5200 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2090 | 1 | 100% | -20 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -4900 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXIPO-26-DISCORD-20260507 | sideways | -76 | 1 | 100% | 1 |  |
| s-trail | trailCents=5 | KXIPO-26-DISCORD-20260508 | sideways | -276 | 1 | 100% | 6 |  |
| s-trail | trailCents=5 | KXLLM1-26MAY31-A-20260509 | sideways | -8000 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -607 | 1 | 100% | -6 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -5100 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXOSCARPIC-27-DIS-20260508 | sideways | -2014 | 1 | 100% | -20 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -4200 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 526 | 1 | 100% | -5 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -273 | 1 | 100% | 1 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27APR-H0-20260509 | sideways | -6500 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -3005 | 1 | 100% | -29 |  |
| s-trail | trailCents=5 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -946 | 1 | 100% | -9 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -870 | 1 | 100% | -4 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -3305 | 1 | 100% | -32 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -2915 | 1 | 100% | -27 |  |
| s-trail | trailCents=5 | KXOSCARACTO-27-TOM-20260507 | sideways | -931 | 1 | 100% | -8 |  |
| s-trail | trailCents=5 | KXOSCARACTO-27-TOM-20260508 | sideways | -1230 | 1 | 100% | -11 |  |
| s-trail | trailCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2464 | 1 | 100% | -30 |  |
| s-trail | trailCents=5 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 97 | 1 | 100% | 2 |  |
| s-trail | trailCents=5 | KXLLM1-26DEC31-XAI-20260508 | sideways | -600 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 1479 | 1 | 100% | -17 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -5100 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXLLM1-26MAY31-A-20260507 | sideways | -317 | 1 | 100% | -1 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -132 | 1 | 100% | 1 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -713 | 1 | 100% | -5 |  |
| s-trail | trailCents=5 | KXOSCARACTO-27-TOM-20260509 | sideways | -735 | 1 | 100% | -6 |  |
| s-trail | trailCents=5 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1822 | 1 | 100% | -18 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -9907 | 1 | 100% | -99 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -2800 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXTOPARTIST-26B-DRA-20260508 | sideways | -645 | 1 | 100% | -7 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1617 | 1 | 100% | -15 |  |
| s-trail | trailCents=5 | KXIPOSPACEX-26JUN01-20260508 | sideways | -264 | 1 | 100% | -2 |  |
| s-trail | trailCents=5 | KXIPOSPACEX-26JUN01-20260509 | sideways | -158 | 1 | 100% | -1 |  |
| s-trail | trailCents=5 | KXLLM1-26MAY31-A-20260508 | sideways | -7800 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -111 | 1 | 100% | 2 |  |
| s-trail | trailCents=5 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -2100 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXLLM1-26DEC31-XAI-20260509 | sideways | -800 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -9000 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -9100 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -3015 | 1 | 100% | -28 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -3800 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 225 | 1 | 100% | 4 |  |
| s-trail | trailCents=5 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 36 | 1 | 100% | 2 |  |
| s-trail | trailCents=5 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1287.17 | 1 | 15% | -12 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -2600 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -158 | 1 | 100% | -1 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -2800 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -9000 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -700 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXETH-26MAY0817-B2390-20260507 | sideways | -4200 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 736 | 1 | 100% | 9 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -5000 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -521 | 1 | 100% | -5 |  |
| s-trail | trailCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -900 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -2600 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -262 | 1 | 100% | 1 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -2800 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 238 | 1 | 100% | 4 |  |
| s-trail | trailCents=5 | KXTIME-26-ZOH-20260508 | sideways | -2900 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXLLM1-26DEC31-XAI-20260507 | sideways | -600 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2089 | 1 | 100% | -20 |  |
| s-trail | trailCents=5 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -8306 | 1 | 100% | -82 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -1409 | 1 | 100% | -14 |  |
| s-trail | trailCents=5 | KXIPO-26-DISCORD-20260510 | sideways | -975 | 1 | 100% | -5 |  |
| s-trail | trailCents=5 | KXLLM1-26MAY31-A-20260510 | sideways | -8500 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -4348 | 1 | 100% | -43 |  |
| s-trail | trailCents=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1035 | 1 | 100% | 12 |  |
| s-trail | trailCents=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1507 | 1 | 100% | -15 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -5600 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -771 | 1 | 100% | -6 |  |
| s-trail | trailCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2764 | 1 | 100% | -27 |  |
| s-trail | trailCents=5 | KXTIME-26-ZOH-20260510 | sideways | -1900 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXTOPARTIST-26B-DRA-20260507 | sideways | -1033 | 1 | 100% | -5 |  |
| s-trail | trailCents=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3966 | 1 | 100% | -39 |  |
| s-trail | trailCents=5 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -474 | 1 | 100% | 39 |  |
| s-trail | trailCents=5 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 1391 | 1 | 100% | 36 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -467 | 1 | 100% | -2 |  |
| s-trail | trailCents=5 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -73 | 1 | 100% | 1 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 426 | 1 | 100% | -1 |  |
| s-trail | trailCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2764 | 1 | 100% | -27 |  |
| s-trail | trailCents=5 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -74 | 1 | 100% | 6 |  |
| s-trail | trailCents=5 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1417 | 1 | 100% | -13 |  |
| s-trail | trailCents=5 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1064 | 1 | 100% | -11 |  |
| s-trail | trailCents=5 | KXOSCARPIC-27-DIS-20260509 | falling | -1614 | 1 | 100% | -16 |  |
| s-trail | trailCents=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1507 | 1 | 100% | -15 |  |
| s-trail | trailCents=5 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1246 | 1 | 100% | -12 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27MAR-C25-20260509 | falling | -1338 | 1 | 100% | -10 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -517 | 1 | 100% | -1 |  |
| s-trail | trailCents=5 | KXTIME-26-ZOH-20260509 | falling | -1590 | 1 | 100% | -12 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27JUN-C25-20260509 | falling | -4128 | 1 | 100% | -41 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 935 | 1 | 100% | -1 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -476 | 1 | 100% | 1 |  |
| s-trail | trailCents=5 | KXTOPARTIST-26B-DRA-20260509 | falling | -748 | 1 | 100% | -1 |  |
| s-trail | trailCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -4600 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXCABOUT-26APR20-TGAB-20260507 | falling | -3700 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXFEDDECISION-27OCT-H0-20260509 | falling | -4700 | 0 | 0% | 0 |  |
| s-trail | trailCents=5 | KXCABOUT-26APR20-TGAB-20260508 | falling | 633 | 1 | 100% | 11 |  |
| s-trail | trailCents=10 | KXETH-26MAY0817-B2390-20260508 | rising | -4208 | 1 | 100% | -42 |  |
| s-trail | trailCents=10 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2062 | 1 | 100% | 22 |  |
| s-trail | trailCents=10 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 748 | 1 | 100% | 32 |  |
| s-trail | trailCents=10 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 332 | 1 | 100% | -3 |  |
| s-trail | trailCents=10 | KXINX-26MAY08H1600-B7387-20260508 | rising | -1532 | 1 | 100% | -15 |  |
| s-trail | trailCents=10 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3826 | 1 | 100% | 39 |  |
| s-trail | trailCents=10 | KXFEDDECISION-28JAN-H0-20260509 | rising | -2437 | 1 | 100% | -22 |  |
| s-trail | trailCents=10 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -290 | 1 | 100% | 0 |  |
| s-trail | trailCents=10 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 925 | 1 | 100% | 1 |  |
| s-trail | trailCents=10 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1233 | 1 | 100% | 14 |  |
| s-trail | trailCents=10 | KXIPO-26-DISCORD-20260509 | rising | -76 | 1 | 100% | 5 |  |
| s-trail | trailCents=10 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 138 | 1 | 100% | 4 |  |
| s-trail | trailCents=10 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1387.15 | 1 | 15% | -13 |  |
| s-trail | trailCents=10 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -174 | 1 | 100% | 0 |  |
| s-trail | trailCents=10 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -521 | 1 | 100% | -5 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27APR-H0-20260508 | rising | 235 | 1 | 100% | -3 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -2400 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27APR-H0-20260507 | rising | -5200 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2090 | 1 | 100% | -20 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -4900 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXIPO-26-DISCORD-20260507 | sideways | -76 | 1 | 100% | 1 |  |
| s-trail | trailCents=10 | KXIPO-26-DISCORD-20260508 | sideways | -276 | 1 | 100% | 6 |  |
| s-trail | trailCents=10 | KXLLM1-26MAY31-A-20260509 | sideways | -8000 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -607 | 1 | 100% | -6 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -5100 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXOSCARPIC-27-DIS-20260508 | sideways | -2014 | 1 | 100% | -20 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -4200 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -275 | 1 | 100% | -9 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -866 | 1 | 100% | -4 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27APR-H0-20260509 | sideways | -6500 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -3005 | 1 | 100% | -29 |  |
| s-trail | trailCents=10 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -946 | 1 | 100% | -9 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -1067 | 1 | 100% | -3 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -3305 | 1 | 100% | -32 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -4800 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXOSCARACTO-27-TOM-20260507 | sideways | -931 | 1 | 100% | -8 |  |
| s-trail | trailCents=10 | KXOSCARACTO-27-TOM-20260508 | sideways | -1230 | 1 | 100% | -11 |  |
| s-trail | trailCents=10 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2464 | 1 | 100% | -30 |  |
| s-trail | trailCents=10 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 97 | 1 | 100% | 2 |  |
| s-trail | trailCents=10 | KXLLM1-26DEC31-XAI-20260508 | sideways | -600 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | -600 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -5100 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXLLM1-26MAY31-A-20260507 | sideways | -8100 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -2500 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -2600 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXOSCARACTO-27-TOM-20260509 | sideways | -735 | 1 | 100% | -6 |  |
| s-trail | trailCents=10 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1822 | 1 | 100% | -18 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -9907 | 1 | 100% | -99 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -2800 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXTOPARTIST-26B-DRA-20260508 | sideways | -645 | 1 | 100% | -7 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1617 | 1 | 100% | -15 |  |
| s-trail | trailCents=10 | KXIPOSPACEX-26JUN01-20260508 | sideways | -264 | 1 | 100% | -2 |  |
| s-trail | trailCents=10 | KXIPOSPACEX-26JUN01-20260509 | sideways | -158 | 1 | 100% | -1 |  |
| s-trail | trailCents=10 | KXLLM1-26MAY31-A-20260508 | sideways | -7800 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -10 | 1 | 100% | 4 |  |
| s-trail | trailCents=10 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -2100 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXLLM1-26DEC31-XAI-20260509 | sideways | -800 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -9000 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -9100 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -4900 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -3800 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXFEDDECISION-28JAN-H0-20260508 | sideways | -2537 | 1 | 100% | -23 |  |
| s-trail | trailCents=10 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -3500 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1287.17 | 1 | 15% | -12 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -2600 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -55 | 1 | 100% | 6 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -2800 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -9000 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -700 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXETH-26MAY0817-B2390-20260507 | sideways | -4200 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 737 | 1 | 100% | 33 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -5000 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -521 | 1 | 100% | -5 |  |
| s-trail | trailCents=10 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -900 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -2600 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -262 | 1 | 100% | 4 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -2800 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 238 | 1 | 100% | 4 |  |
| s-trail | trailCents=10 | KXTIME-26-ZOH-20260508 | sideways | -2900 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXLLM1-26DEC31-XAI-20260507 | sideways | -600 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2089 | 1 | 100% | -20 |  |
| s-trail | trailCents=10 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -8306 | 1 | 100% | -82 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -3200 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXIPO-26-DISCORD-20260510 | sideways | -6200 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXLLM1-26MAY31-A-20260510 | sideways | -8500 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -4348 | 1 | 100% | -43 |  |
| s-trail | trailCents=10 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1035 | 1 | 100% | 12 |  |
| s-trail | trailCents=10 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1507 | 1 | 100% | -15 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -5600 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -4800 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2764 | 1 | 100% | -27 |  |
| s-trail | trailCents=10 | KXTIME-26-ZOH-20260510 | sideways | -1900 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXTOPARTIST-26B-DRA-20260507 | sideways | -1033 | 1 | 100% | -5 |  |
| s-trail | trailCents=10 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3966 | 1 | 100% | -39 |  |
| s-trail | trailCents=10 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -474 | 1 | 100% | 39 |  |
| s-trail | trailCents=10 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 1071 | 1 | 100% | 18 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -958 | 1 | 100% | -1 |  |
| s-trail | trailCents=10 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -73 | 1 | 100% | 1 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -167 | 1 | 100% | -1 |  |
| s-trail | trailCents=10 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2764 | 1 | 100% | -27 |  |
| s-trail | trailCents=10 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -74 | 1 | 100% | 6 |  |
| s-trail | trailCents=10 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1990 | 1 | 100% | -2 |  |
| s-trail | trailCents=10 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1065 | 1 | 100% | -6 |  |
| s-trail | trailCents=10 | KXOSCARPIC-27-DIS-20260509 | falling | -1614 | 1 | 100% | -16 |  |
| s-trail | trailCents=10 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1507 | 1 | 100% | -15 |  |
| s-trail | trailCents=10 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1246 | 1 | 100% | -12 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27MAR-C25-20260509 | falling | -3900 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -899 | 1 | 100% | -1 |  |
| s-trail | trailCents=10 | KXTIME-26-ZOH-20260509 | falling | -3000 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27JUN-C25-20260509 | falling | -4128 | 1 | 100% | -41 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 1036 | 1 | 100% | -1 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -475 | 1 | 100% | -5 |  |
| s-trail | trailCents=10 | KXTOPARTIST-26B-DRA-20260509 | falling | -748 | 1 | 100% | -1 |  |
| s-trail | trailCents=10 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -4600 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXCABOUT-26APR20-TGAB-20260507 | falling | -3700 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXFEDDECISION-27OCT-H0-20260509 | falling | -4700 | 0 | 0% | 0 |  |
| s-trail | trailCents=10 | KXCABOUT-26APR20-TGAB-20260508 | falling | 633 | 1 | 100% | 13 |  |
| trailing_stop | trailCents=1 | KXETH-26MAY0817-B2390-20260508 | rising | -4208 | 1 | 100% | -42 |  |
| trailing_stop | trailCents=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2062 | 1 | 100% | 22 |  |
| trailing_stop | trailCents=1 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 748 | 1 | 100% | 10 |  |
| trailing_stop | trailCents=1 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 38 | 1 | 100% | 2 |  |
| trailing_stop | trailCents=1 | KXINX-26MAY08H1600-B7387-20260508 | rising | -1532 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=1 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3826 | 1 | 100% | 39 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-28JAN-H0-20260509 | rising | -2437 | 1 | 100% | -22 |  |
| trailing_stop | trailCents=1 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -385 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=1 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | -66 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=1 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1233 | 1 | 100% | 14 |  |
| trailing_stop | trailCents=1 | KXIPO-26-DISCORD-20260509 | rising | -77 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=1 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 138 | 1 | 100% | 4 |  |
| trailing_stop | trailCents=1 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1387.15 | 1 | 15% | -13 |  |
| trailing_stop | trailCents=1 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -174 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=1 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -521 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27APR-H0-20260508 | rising | 847 | 1 | 100% | 9 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -322 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27APR-H0-20260507 | rising | -5200 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=1 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2090 | 1 | 100% | -20 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -4900 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=1 | KXIPO-26-DISCORD-20260507 | sideways | -76 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=1 | KXIPO-26-DISCORD-20260508 | sideways | -276 | 1 | 100% | 6 |  |
| trailing_stop | trailCents=1 | KXLLM1-26MAY31-A-20260509 | sideways | -321 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=1 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -607 | 1 | 100% | -6 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -3309 | 1 | 100% | -32 |  |
| trailing_stop | trailCents=1 | KXOSCARPIC-27-DIS-20260508 | sideways | -2014 | 1 | 100% | -20 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -270 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -275 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -273 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27APR-H0-20260509 | sideways | -6500 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -3005 | 1 | 100% | -29 |  |
| trailing_stop | trailCents=1 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -946 | 1 | 100% | -9 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -771 | 1 | 100% | -6 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -3305 | 1 | 100% | -32 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -2915 | 1 | 100% | -28 |  |
| trailing_stop | trailCents=1 | KXOSCARACTO-27-TOM-20260507 | sideways | -931 | 1 | 100% | -8 |  |
| trailing_stop | trailCents=1 | KXOSCARACTO-27-TOM-20260508 | sideways | -1230 | 1 | 100% | -11 |  |
| trailing_stop | trailCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2464 | 1 | 100% | -30 |  |
| trailing_stop | trailCents=1 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 97 | 1 | 100% | 2 |  |
| trailing_stop | trailCents=1 | KXLLM1-26DEC31-XAI-20260508 | sideways | -38 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 813 | 1 | 100% | -24 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -3311 | 1 | 100% | -31 |  |
| trailing_stop | trailCents=1 | KXLLM1-26MAY31-A-20260507 | sideways | -317 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -132 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -713 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=1 | KXOSCARACTO-27-TOM-20260509 | sideways | -735 | 1 | 100% | -6 |  |
| trailing_stop | trailCents=1 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1822 | 1 | 100% | -18 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -9907 | 1 | 100% | -99 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -913 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=1 | KXTOPARTIST-26B-DRA-20260508 | sideways | -1032 | 1 | 100% | -16 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1617 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=1 | KXIPOSPACEX-26JUN01-20260508 | sideways | -264 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=1 | KXIPOSPACEX-26JUN01-20260509 | sideways | -158 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=1 | KXLLM1-26MAY31-A-20260508 | sideways | -121 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=1 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -111 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=1 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -500 | 1 | 100% | -4 |  |
| trailing_stop | trailCents=1 | KXLLM1-26DEC31-XAI-20260509 | sideways | -147 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=1 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -9000 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=1 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -59 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -3015 | 1 | 100% | -30 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -1818 | 1 | 100% | -16 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-28JAN-H0-20260508 | sideways | -2919 | 1 | 100% | -27 |  |
| trailing_stop | trailCents=1 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -258 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=1 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1287.17 | 1 | 15% | -12 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -424 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -260 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -238 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=1 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -9000 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -138 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=1 | KXETH-26MAY0817-B2390-20260507 | sideways | -3921 | 1 | 100% | -40 |  |
| trailing_stop | trailCents=1 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 632 | 1 | 100% | 6 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -3115 | 1 | 100% | -30 |  |
| trailing_stop | trailCents=1 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -521 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=1 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -344 | 1 | 100% | -4 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -2600 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -262 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -432 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=1 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 238 | 1 | 100% | 4 |  |
| trailing_stop | trailCents=1 | KXTIME-26-ZOH-20260508 | sideways | -1203 | 1 | 100% | -11 |  |
| trailing_stop | trailCents=1 | KXLLM1-26DEC31-XAI-20260507 | sideways | -41 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=1 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2089 | 1 | 100% | -20 |  |
| trailing_stop | trailCents=1 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -8306 | 1 | 100% | -82 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -1409 | 1 | 100% | -14 |  |
| trailing_stop | trailCents=1 | KXIPO-26-DISCORD-20260510 | sideways | -875 | 1 | 100% | -7 |  |
| trailing_stop | trailCents=1 | KXLLM1-26MAY31-A-20260510 | sideways | -404 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -4348 | 1 | 100% | -43 |  |
| trailing_stop | trailCents=1 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1035 | 1 | 100% | 12 |  |
| trailing_stop | trailCents=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1507 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -5600 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -673 | 1 | 100% | -6 |  |
| trailing_stop | trailCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2764 | 1 | 100% | -27 |  |
| trailing_stop | trailCents=1 | KXTIME-26-ZOH-20260510 | sideways | -491 | 1 | 100% | -4 |  |
| trailing_stop | trailCents=1 | KXTOPARTIST-26B-DRA-20260507 | sideways | -1033 | 1 | 100% | -9 |  |
| trailing_stop | trailCents=1 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3966 | 1 | 100% | -39 |  |
| trailing_stop | trailCents=1 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -474 | 1 | 100% | 39 |  |
| trailing_stop | trailCents=1 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 1391 | 1 | 100% | 36 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -369 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=1 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -73 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -265 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=1 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2764 | 1 | 100% | -27 |  |
| trailing_stop | trailCents=1 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -74 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=1 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1417 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=1 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1064 | 1 | 100% | -8 |  |
| trailing_stop | trailCents=1 | KXOSCARPIC-27-DIS-20260509 | falling | -1614 | 1 | 100% | -16 |  |
| trailing_stop | trailCents=1 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1507 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=1 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1246 | 1 | 100% | -12 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27MAR-C25-20260509 | falling | -1916 | 1 | 100% | -17 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -324 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=1 | KXTIME-26-ZOH-20260509 | falling | -1209 | 1 | 100% | -10 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27JUN-C25-20260509 | falling | -4128 | 1 | 100% | -41 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | -276 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -475 | 1 | 100% | -4 |  |
| trailing_stop | trailCents=1 | KXTOPARTIST-26B-DRA-20260509 | falling | -748 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=1 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -571 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=1 | KXCABOUT-26APR20-TGAB-20260507 | falling | 33 | 1 | 100% | 9 |  |
| trailing_stop | trailCents=1 | KXFEDDECISION-27OCT-H0-20260509 | falling | -2427 | 1 | 100% | -26 |  |
| trailing_stop | trailCents=1 | KXCABOUT-26APR20-TGAB-20260508 | falling | 633 | 1 | 100% | 9 |  |
| trailing_stop | trailCents=3 | KXETH-26MAY0817-B2390-20260508 | rising | -4208 | 1 | 100% | -42 |  |
| trailing_stop | trailCents=3 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2062 | 1 | 100% | 22 |  |
| trailing_stop | trailCents=3 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 748 | 1 | 100% | 10 |  |
| trailing_stop | trailCents=3 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 38 | 1 | 100% | 2 |  |
| trailing_stop | trailCents=3 | KXINX-26MAY08H1600-B7387-20260508 | rising | -1532 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=3 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3826 | 1 | 100% | 39 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-28JAN-H0-20260509 | rising | -2437 | 1 | 100% | -22 |  |
| trailing_stop | trailCents=3 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -290 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=3 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | -66 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=3 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1233 | 1 | 100% | 14 |  |
| trailing_stop | trailCents=3 | KXIPO-26-DISCORD-20260509 | rising | -76 | 1 | 100% | 5 |  |
| trailing_stop | trailCents=3 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 138 | 1 | 100% | 4 |  |
| trailing_stop | trailCents=3 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1387.15 | 1 | 15% | -13 |  |
| trailing_stop | trailCents=3 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -174 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=3 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -521 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27APR-H0-20260508 | rising | 847 | 1 | 100% | 9 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -224 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27APR-H0-20260507 | rising | -5200 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2090 | 1 | 100% | -20 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -4900 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXIPO-26-DISCORD-20260507 | sideways | -76 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=3 | KXIPO-26-DISCORD-20260508 | sideways | -276 | 1 | 100% | 6 |  |
| trailing_stop | trailCents=3 | KXLLM1-26MAY31-A-20260509 | sideways | -321 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=3 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -607 | 1 | 100% | -6 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -3309 | 1 | 100% | -27 |  |
| trailing_stop | trailCents=3 | KXOSCARPIC-27-DIS-20260508 | sideways | -2014 | 1 | 100% | -20 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -4200 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 426 | 1 | 100% | -4 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -174 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27APR-H0-20260509 | sideways | -6500 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -3005 | 1 | 100% | -29 |  |
| trailing_stop | trailCents=3 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -946 | 1 | 100% | -9 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -573 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -3305 | 1 | 100% | -32 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -2915 | 1 | 100% | -27 |  |
| trailing_stop | trailCents=3 | KXOSCARACTO-27-TOM-20260507 | sideways | -931 | 1 | 100% | -8 |  |
| trailing_stop | trailCents=3 | KXOSCARACTO-27-TOM-20260508 | sideways | -1230 | 1 | 100% | -11 |  |
| trailing_stop | trailCents=3 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2464 | 1 | 100% | -30 |  |
| trailing_stop | trailCents=3 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 97 | 1 | 100% | 2 |  |
| trailing_stop | trailCents=3 | KXLLM1-26DEC31-XAI-20260508 | sideways | -40 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=3 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 1479 | 1 | 100% | -17 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -3311 | 1 | 100% | -28 |  |
| trailing_stop | trailCents=3 | KXLLM1-26MAY31-A-20260507 | sideways | -317 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -132 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -713 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=3 | KXOSCARACTO-27-TOM-20260509 | sideways | -735 | 1 | 100% | -6 |  |
| trailing_stop | trailCents=3 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1822 | 1 | 100% | -18 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -9907 | 1 | 100% | -99 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -2800 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXTOPARTIST-26B-DRA-20260508 | sideways | -645 | 1 | 100% | -7 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1617 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=3 | KXIPOSPACEX-26JUN01-20260508 | sideways | -264 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=3 | KXIPOSPACEX-26JUN01-20260509 | sideways | -158 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=3 | KXLLM1-26MAY31-A-20260508 | sideways | -7800 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -111 | 1 | 100% | 2 |  |
| trailing_stop | trailCents=3 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -500 | 1 | 100% | -4 |  |
| trailing_stop | trailCents=3 | KXLLM1-26DEC31-XAI-20260509 | sideways | -243 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=3 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -9000 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -164 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -3015 | 1 | 100% | -28 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -1818 | 1 | 100% | -16 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-28JAN-H0-20260508 | sideways | -3210 | 1 | 100% | -30 |  |
| trailing_stop | trailCents=3 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -258 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=3 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1287.17 | 1 | 15% | -12 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -521 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -260 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -335 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=3 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -9000 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -234 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=3 | KXETH-26MAY0817-B2390-20260507 | sideways | -4200 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 736 | 1 | 100% | 9 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -5000 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -521 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=3 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -900 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -2600 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -262 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -432 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=3 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 238 | 1 | 100% | 4 |  |
| trailing_stop | trailCents=3 | KXTIME-26-ZOH-20260508 | sideways | -2900 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXLLM1-26DEC31-XAI-20260507 | sideways | -600 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2089 | 1 | 100% | -20 |  |
| trailing_stop | trailCents=3 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -8306 | 1 | 100% | -82 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -1409 | 1 | 100% | -14 |  |
| trailing_stop | trailCents=3 | KXIPO-26-DISCORD-20260510 | sideways | -975 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=3 | KXLLM1-26MAY31-A-20260510 | sideways | -8500 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -4348 | 1 | 100% | -43 |  |
| trailing_stop | trailCents=3 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1035 | 1 | 100% | 12 |  |
| trailing_stop | trailCents=3 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1507 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -5600 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -574 | 1 | 100% | -3 |  |
| trailing_stop | trailCents=3 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2764 | 1 | 100% | -27 |  |
| trailing_stop | trailCents=3 | KXTIME-26-ZOH-20260510 | sideways | -1900 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=3 | KXTOPARTIST-26B-DRA-20260507 | sideways | -1033 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=3 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3966 | 1 | 100% | -39 |  |
| trailing_stop | trailCents=3 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -474 | 1 | 100% | 39 |  |
| trailing_stop | trailCents=3 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 1391 | 1 | 100% | 36 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -270 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=3 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -73 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -167 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=3 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2764 | 1 | 100% | -27 |  |
| trailing_stop | trailCents=3 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -74 | 1 | 100% | 6 |  |
| trailing_stop | trailCents=3 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1417 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=3 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1064 | 1 | 100% | -11 |  |
| trailing_stop | trailCents=3 | KXOSCARPIC-27-DIS-20260509 | falling | -1614 | 1 | 100% | -16 |  |
| trailing_stop | trailCents=3 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1507 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=3 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1246 | 1 | 100% | -12 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27MAR-C25-20260509 | falling | -1916 | 1 | 100% | -17 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -324 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=3 | KXTIME-26-ZOH-20260509 | falling | -1400 | 1 | 100% | -11 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27JUN-C25-20260509 | falling | -4128 | 1 | 100% | -41 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 428 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -476 | 1 | 100% | -3 |  |
| trailing_stop | trailCents=3 | KXTOPARTIST-26B-DRA-20260509 | falling | -748 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=3 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -867 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=3 | KXCABOUT-26APR20-TGAB-20260507 | falling | 33 | 1 | 100% | 9 |  |
| trailing_stop | trailCents=3 | KXFEDDECISION-27OCT-H0-20260509 | falling | -2427 | 1 | 100% | -27 |  |
| trailing_stop | trailCents=3 | KXCABOUT-26APR20-TGAB-20260508 | falling | 633 | 1 | 100% | 3 |  |
| trailing_stop | trailCents=5 | KXETH-26MAY0817-B2390-20260508 | rising | -4208 | 1 | 100% | -42 |  |
| trailing_stop | trailCents=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2062 | 1 | 100% | 22 |  |
| trailing_stop | trailCents=5 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 748 | 1 | 100% | 32 |  |
| trailing_stop | trailCents=5 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 926 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=5 | KXINX-26MAY08H1600-B7387-20260508 | rising | -1532 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=5 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3826 | 1 | 100% | 39 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-28JAN-H0-20260509 | rising | -2437 | 1 | 100% | -22 |  |
| trailing_stop | trailCents=5 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -290 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=5 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | -66 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=5 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1233 | 1 | 100% | 14 |  |
| trailing_stop | trailCents=5 | KXIPO-26-DISCORD-20260509 | rising | -76 | 1 | 100% | 5 |  |
| trailing_stop | trailCents=5 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 138 | 1 | 100% | 4 |  |
| trailing_stop | trailCents=5 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1387.15 | 1 | 15% | -13 |  |
| trailing_stop | trailCents=5 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -174 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=5 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -521 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27APR-H0-20260508 | rising | 847 | 1 | 100% | 9 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -129 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27APR-H0-20260507 | rising | -5200 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2090 | 1 | 100% | -20 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -4900 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXIPO-26-DISCORD-20260507 | sideways | -76 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=5 | KXIPO-26-DISCORD-20260508 | sideways | -276 | 1 | 100% | 6 |  |
| trailing_stop | trailCents=5 | KXLLM1-26MAY31-A-20260509 | sideways | -8000 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -607 | 1 | 100% | -6 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -5100 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXOSCARPIC-27-DIS-20260508 | sideways | -2014 | 1 | 100% | -20 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -4200 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | 526 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -273 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27APR-H0-20260509 | sideways | -6500 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -3005 | 1 | 100% | -29 |  |
| trailing_stop | trailCents=5 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -946 | 1 | 100% | -9 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -870 | 1 | 100% | -4 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -3305 | 1 | 100% | -32 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -2915 | 1 | 100% | -27 |  |
| trailing_stop | trailCents=5 | KXOSCARACTO-27-TOM-20260507 | sideways | -931 | 1 | 100% | -8 |  |
| trailing_stop | trailCents=5 | KXOSCARACTO-27-TOM-20260508 | sideways | -1230 | 1 | 100% | -11 |  |
| trailing_stop | trailCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2464 | 1 | 100% | -30 |  |
| trailing_stop | trailCents=5 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 97 | 1 | 100% | 2 |  |
| trailing_stop | trailCents=5 | KXLLM1-26DEC31-XAI-20260508 | sideways | -600 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | 1479 | 1 | 100% | -17 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -5100 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXLLM1-26MAY31-A-20260507 | sideways | -317 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -132 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -713 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=5 | KXOSCARACTO-27-TOM-20260509 | sideways | -735 | 1 | 100% | -6 |  |
| trailing_stop | trailCents=5 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1822 | 1 | 100% | -18 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -9907 | 1 | 100% | -99 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -2800 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXTOPARTIST-26B-DRA-20260508 | sideways | -645 | 1 | 100% | -7 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1617 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=5 | KXIPOSPACEX-26JUN01-20260508 | sideways | -264 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=5 | KXIPOSPACEX-26JUN01-20260509 | sideways | -158 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=5 | KXLLM1-26MAY31-A-20260508 | sideways | -7800 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -111 | 1 | 100% | 2 |  |
| trailing_stop | trailCents=5 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -2100 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXLLM1-26DEC31-XAI-20260509 | sideways | -800 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -9000 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -9100 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -3015 | 1 | 100% | -28 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -3800 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-28JAN-H0-20260508 | sideways | 225 | 1 | 100% | 4 |  |
| trailing_stop | trailCents=5 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | 36 | 1 | 100% | 2 |  |
| trailing_stop | trailCents=5 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1287.17 | 1 | 15% | -12 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -2600 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -158 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -2800 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -9000 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -700 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXETH-26MAY0817-B2390-20260507 | sideways | -4200 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 736 | 1 | 100% | 9 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -5000 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -521 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=5 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -900 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -2600 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -262 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -2800 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 238 | 1 | 100% | 4 |  |
| trailing_stop | trailCents=5 | KXTIME-26-ZOH-20260508 | sideways | -2900 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXLLM1-26DEC31-XAI-20260507 | sideways | -600 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2089 | 1 | 100% | -20 |  |
| trailing_stop | trailCents=5 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -8306 | 1 | 100% | -82 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -1409 | 1 | 100% | -14 |  |
| trailing_stop | trailCents=5 | KXIPO-26-DISCORD-20260510 | sideways | -975 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=5 | KXLLM1-26MAY31-A-20260510 | sideways | -8500 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -4348 | 1 | 100% | -43 |  |
| trailing_stop | trailCents=5 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1035 | 1 | 100% | 12 |  |
| trailing_stop | trailCents=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1507 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -5600 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -771 | 1 | 100% | -6 |  |
| trailing_stop | trailCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2764 | 1 | 100% | -27 |  |
| trailing_stop | trailCents=5 | KXTIME-26-ZOH-20260510 | sideways | -1900 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXTOPARTIST-26B-DRA-20260507 | sideways | -1033 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=5 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3966 | 1 | 100% | -39 |  |
| trailing_stop | trailCents=5 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -474 | 1 | 100% | 39 |  |
| trailing_stop | trailCents=5 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 1391 | 1 | 100% | 36 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -467 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=5 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -73 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | 426 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=5 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2764 | 1 | 100% | -27 |  |
| trailing_stop | trailCents=5 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -74 | 1 | 100% | 6 |  |
| trailing_stop | trailCents=5 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1417 | 1 | 100% | -13 |  |
| trailing_stop | trailCents=5 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1064 | 1 | 100% | -11 |  |
| trailing_stop | trailCents=5 | KXOSCARPIC-27-DIS-20260509 | falling | -1614 | 1 | 100% | -16 |  |
| trailing_stop | trailCents=5 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1507 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=5 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1246 | 1 | 100% | -12 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27MAR-C25-20260509 | falling | -1338 | 1 | 100% | -10 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -517 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=5 | KXTIME-26-ZOH-20260509 | falling | -1590 | 1 | 100% | -12 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27JUN-C25-20260509 | falling | -4128 | 1 | 100% | -41 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 935 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -476 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=5 | KXTOPARTIST-26B-DRA-20260509 | falling | -748 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=5 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -4600 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXCABOUT-26APR20-TGAB-20260507 | falling | -3700 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXFEDDECISION-27OCT-H0-20260509 | falling | -4700 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=5 | KXCABOUT-26APR20-TGAB-20260508 | falling | 633 | 1 | 100% | 11 |  |
| trailing_stop | trailCents=10 | KXETH-26MAY0817-B2390-20260508 | rising | -4208 | 1 | 100% | -42 |  |
| trailing_stop | trailCents=10 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2062 | 1 | 100% | 22 |  |
| trailing_stop | trailCents=10 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 748 | 1 | 100% | 32 |  |
| trailing_stop | trailCents=10 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 332 | 1 | 100% | -3 |  |
| trailing_stop | trailCents=10 | KXINX-26MAY08H1600-B7387-20260508 | rising | -1532 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=10 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3826 | 1 | 100% | 39 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-28JAN-H0-20260509 | rising | -2437 | 1 | 100% | -22 |  |
| trailing_stop | trailCents=10 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -290 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=10 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | 925 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=10 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1233 | 1 | 100% | 14 |  |
| trailing_stop | trailCents=10 | KXIPO-26-DISCORD-20260509 | rising | -76 | 1 | 100% | 5 |  |
| trailing_stop | trailCents=10 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 138 | 1 | 100% | 4 |  |
| trailing_stop | trailCents=10 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1387.15 | 1 | 15% | -13 |  |
| trailing_stop | trailCents=10 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -174 | 1 | 100% | 0 |  |
| trailing_stop | trailCents=10 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -521 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27APR-H0-20260508 | rising | 235 | 1 | 100% | -3 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -2400 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27APR-H0-20260507 | rising | -5200 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2090 | 1 | 100% | -20 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -4900 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXIPO-26-DISCORD-20260507 | sideways | -76 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=10 | KXIPO-26-DISCORD-20260508 | sideways | -276 | 1 | 100% | 6 |  |
| trailing_stop | trailCents=10 | KXLLM1-26MAY31-A-20260509 | sideways | -8000 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -607 | 1 | 100% | -6 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -5100 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXOSCARPIC-27-DIS-20260508 | sideways | -2014 | 1 | 100% | -20 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -4200 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -275 | 1 | 100% | -9 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -866 | 1 | 100% | -4 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27APR-H0-20260509 | sideways | -6500 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -3005 | 1 | 100% | -29 |  |
| trailing_stop | trailCents=10 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -946 | 1 | 100% | -9 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -1067 | 1 | 100% | -3 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -3305 | 1 | 100% | -32 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -4800 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXOSCARACTO-27-TOM-20260507 | sideways | -931 | 1 | 100% | -8 |  |
| trailing_stop | trailCents=10 | KXOSCARACTO-27-TOM-20260508 | sideways | -1230 | 1 | 100% | -11 |  |
| trailing_stop | trailCents=10 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2464 | 1 | 100% | -30 |  |
| trailing_stop | trailCents=10 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 97 | 1 | 100% | 2 |  |
| trailing_stop | trailCents=10 | KXLLM1-26DEC31-XAI-20260508 | sideways | -600 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | -600 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -5100 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXLLM1-26MAY31-A-20260507 | sideways | -8100 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -2500 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -2600 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXOSCARACTO-27-TOM-20260509 | sideways | -735 | 1 | 100% | -6 |  |
| trailing_stop | trailCents=10 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1822 | 1 | 100% | -18 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -9907 | 1 | 100% | -99 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -2800 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXTOPARTIST-26B-DRA-20260508 | sideways | -645 | 1 | 100% | -7 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1617 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=10 | KXIPOSPACEX-26JUN01-20260508 | sideways | -264 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=10 | KXIPOSPACEX-26JUN01-20260509 | sideways | -158 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=10 | KXLLM1-26MAY31-A-20260508 | sideways | -7800 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -10 | 1 | 100% | 4 |  |
| trailing_stop | trailCents=10 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -2100 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXLLM1-26DEC31-XAI-20260509 | sideways | -800 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -9000 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -9100 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -4900 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -3800 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-28JAN-H0-20260508 | sideways | -2537 | 1 | 100% | -23 |  |
| trailing_stop | trailCents=10 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -3500 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1287.17 | 1 | 15% | -12 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -2600 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -55 | 1 | 100% | 6 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -2800 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -9000 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -700 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXETH-26MAY0817-B2390-20260507 | sideways | -4200 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 737 | 1 | 100% | 33 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -5000 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -521 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=10 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -900 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -2600 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -262 | 1 | 100% | 4 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -2800 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 238 | 1 | 100% | 4 |  |
| trailing_stop | trailCents=10 | KXTIME-26-ZOH-20260508 | sideways | -2900 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXLLM1-26DEC31-XAI-20260507 | sideways | -600 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2089 | 1 | 100% | -20 |  |
| trailing_stop | trailCents=10 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -8306 | 1 | 100% | -82 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -3200 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXIPO-26-DISCORD-20260510 | sideways | -6200 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXLLM1-26MAY31-A-20260510 | sideways | -8500 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -4348 | 1 | 100% | -43 |  |
| trailing_stop | trailCents=10 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1035 | 1 | 100% | 12 |  |
| trailing_stop | trailCents=10 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1507 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -5600 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -4800 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2764 | 1 | 100% | -27 |  |
| trailing_stop | trailCents=10 | KXTIME-26-ZOH-20260510 | sideways | -1900 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXTOPARTIST-26B-DRA-20260507 | sideways | -1033 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=10 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3966 | 1 | 100% | -39 |  |
| trailing_stop | trailCents=10 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -474 | 1 | 100% | 39 |  |
| trailing_stop | trailCents=10 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 1071 | 1 | 100% | 18 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -958 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=10 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -73 | 1 | 100% | 1 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -167 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=10 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2764 | 1 | 100% | -27 |  |
| trailing_stop | trailCents=10 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -74 | 1 | 100% | 6 |  |
| trailing_stop | trailCents=10 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1990 | 1 | 100% | -2 |  |
| trailing_stop | trailCents=10 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1065 | 1 | 100% | -6 |  |
| trailing_stop | trailCents=10 | KXOSCARPIC-27-DIS-20260509 | falling | -1614 | 1 | 100% | -16 |  |
| trailing_stop | trailCents=10 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1507 | 1 | 100% | -15 |  |
| trailing_stop | trailCents=10 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1246 | 1 | 100% | -12 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27MAR-C25-20260509 | falling | -3900 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -899 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=10 | KXTIME-26-ZOH-20260509 | falling | -3000 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27JUN-C25-20260509 | falling | -4128 | 1 | 100% | -41 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | 1036 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -475 | 1 | 100% | -5 |  |
| trailing_stop | trailCents=10 | KXTOPARTIST-26B-DRA-20260509 | falling | -748 | 1 | 100% | -1 |  |
| trailing_stop | trailCents=10 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -4600 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXCABOUT-26APR20-TGAB-20260507 | falling | -3700 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXFEDDECISION-27OCT-H0-20260509 | falling | -4700 | 0 | 0% | 0 |  |
| trailing_stop | trailCents=10 | KXCABOUT-26APR20-TGAB-20260508 | falling | 633 | 1 | 100% | 13 |  |
| stop_loss | stopPriceCents=10 | KXETH-26MAY0817-B2390-20260508 | rising | -4115 | 1 | 100% | -41 |  |
| stop_loss | stopPriceCents=10 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2062 | 1 | 100% | 22 |  |
| stop_loss | stopPriceCents=10 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 1386 | 1 | 100% | 97 |  |
| stop_loss | stopPriceCents=10 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | -1224 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=10 | KXINX-26MAY08H1600-B7387-20260508 | rising | -1532 | 1 | 100% | -15 |  |
| stop_loss | stopPriceCents=10 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3826 | 1 | 100% | 39 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-28JAN-H0-20260509 | rising | -2437 | 1 | 100% | -23 |  |
| stop_loss | stopPriceCents=10 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -385 | 1 | 100% | -3 |  |
| stop_loss | stopPriceCents=10 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | -3700 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1233 | 1 | 100% | 14 |  |
| stop_loss | stopPriceCents=10 | KXIPO-26-DISCORD-20260509 | rising | 23 | 1 | 100% | 2 |  |
| stop_loss | stopPriceCents=10 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 138 | 1 | 100% | 3 |  |
| stop_loss | stopPriceCents=10 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1387.15 | 1 | 15% | -13 |  |
| stop_loss | stopPriceCents=10 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -174 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=10 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -521 | 1 | 100% | -5 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27APR-H0-20260508 | rising | -5800 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -224 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27APR-H0-20260507 | rising | 733 | 1 | 100% | 9 |  |
| stop_loss | stopPriceCents=10 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2090 | 1 | 100% | -20 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -3111 | 1 | 100% | -30 |  |
| stop_loss | stopPriceCents=10 | KXIPO-26-DISCORD-20260507 | sideways | -76 | 1 | 100% | 1 |  |
| stop_loss | stopPriceCents=10 | KXIPO-26-DISCORD-20260508 | sideways | -276 | 1 | 100% | 6 |  |
| stop_loss | stopPriceCents=10 | KXLLM1-26MAY31-A-20260509 | sideways | -8000 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -607 | 1 | 100% | -6 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -3309 | 1 | 100% | -32 |  |
| stop_loss | stopPriceCents=10 | KXOSCARPIC-27-DIS-20260508 | sideways | -2014 | 1 | 100% | -20 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -4200 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -4800 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -4500 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27APR-H0-20260509 | sideways | -6500 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -3005 | 1 | 100% | -29 |  |
| stop_loss | stopPriceCents=10 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -946 | 1 | 100% | -9 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -4800 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -3305 | 1 | 100% | -32 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -2915 | 1 | 100% | -28 |  |
| stop_loss | stopPriceCents=10 | KXOSCARACTO-27-TOM-20260507 | sideways | -931 | 1 | 100% | -8 |  |
| stop_loss | stopPriceCents=10 | KXOSCARACTO-27-TOM-20260508 | sideways | -1230 | 1 | 100% | -11 |  |
| stop_loss | stopPriceCents=10 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2558 | 1 | 100% | -25 |  |
| stop_loss | stopPriceCents=10 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 97 | 1 | 100% | 2 |  |
| stop_loss | stopPriceCents=10 | KXLLM1-26DEC31-XAI-20260508 | sideways | -38 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=10 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | -38 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -3311 | 1 | 100% | -32 |  |
| stop_loss | stopPriceCents=10 | KXLLM1-26MAY31-A-20260507 | sideways | -8100 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -2500 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -713 | 1 | 100% | -6 |  |
| stop_loss | stopPriceCents=10 | KXOSCARACTO-27-TOM-20260509 | sideways | -735 | 1 | 100% | -6 |  |
| stop_loss | stopPriceCents=10 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1822 | 1 | 100% | -18 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -9907 | 1 | 100% | -99 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -913 | 1 | 100% | -8 |  |
| stop_loss | stopPriceCents=10 | KXTOPARTIST-26B-DRA-20260508 | sideways | -935 | 1 | 100% | -8 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1617 | 1 | 100% | -15 |  |
| stop_loss | stopPriceCents=10 | KXIPOSPACEX-26JUN01-20260508 | sideways | -264 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=10 | KXIPOSPACEX-26JUN01-20260509 | sideways | -158 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=10 | KXLLM1-26MAY31-A-20260508 | sideways | -7800 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -11 | 1 | 100% | 1 |  |
| stop_loss | stopPriceCents=10 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -2100 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXLLM1-26DEC31-XAI-20260509 | sideways | -147 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=10 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -9000 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -9100 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -2918 | 1 | 100% | -28 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -1723 | 1 | 100% | -16 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-28JAN-H0-20260508 | sideways | -2435 | 1 | 100% | -23 |  |
| stop_loss | stopPriceCents=10 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -3500 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1287.17 | 1 | 15% | -12 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -2600 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -6600 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -2800 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -9000 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -143 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=10 | KXETH-26MAY0817-B2390-20260507 | sideways | -3921 | 1 | 100% | -39 |  |
| stop_loss | stopPriceCents=10 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | -8200 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -3018 | 1 | 100% | -29 |  |
| stop_loss | stopPriceCents=10 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -521 | 1 | 100% | -5 |  |
| stop_loss | stopPriceCents=10 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -246 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -2600 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -6500 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -2800 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 237 | 1 | 100% | 4 |  |
| stop_loss | stopPriceCents=10 | KXTIME-26-ZOH-20260508 | sideways | -1206 | 1 | 100% | -11 |  |
| stop_loss | stopPriceCents=10 | KXLLM1-26DEC31-XAI-20260507 | sideways | -41 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=10 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2089 | 1 | 100% | -20 |  |
| stop_loss | stopPriceCents=10 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -8306 | 1 | 100% | -82 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -3200 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXIPO-26-DISCORD-20260510 | sideways | -6200 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXLLM1-26MAY31-A-20260510 | sideways | -8500 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -4348 | 1 | 100% | -43 |  |
| stop_loss | stopPriceCents=10 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1035 | 1 | 100% | 12 |  |
| stop_loss | stopPriceCents=10 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1507 | 1 | 100% | -15 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -5600 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -4800 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2764 | 1 | 100% | -27 |  |
| stop_loss | stopPriceCents=10 | KXTIME-26-ZOH-20260510 | sideways | -1900 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXTOPARTIST-26B-DRA-20260507 | sideways | -1033 | 1 | 100% | -9 |  |
| stop_loss | stopPriceCents=10 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3966 | 1 | 100% | -39 |  |
| stop_loss | stopPriceCents=10 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -474 | 1 | 100% | 39 |  |
| stop_loss | stopPriceCents=10 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | -8500 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -2599 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=10 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -73 | 1 | 100% | 3 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -2108 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=10 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2764 | 1 | 100% | -27 |  |
| stop_loss | stopPriceCents=10 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -476 | 1 | 100% | 14 |  |
| stop_loss | stopPriceCents=10 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1417 | 1 | 100% | -13 |  |
| stop_loss | stopPriceCents=10 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -2040 | 1 | 100% | -12 |  |
| stop_loss | stopPriceCents=10 | KXOSCARPIC-27-DIS-20260509 | falling | -1614 | 1 | 100% | -16 |  |
| stop_loss | stopPriceCents=10 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1507 | 1 | 100% | -15 |  |
| stop_loss | stopPriceCents=10 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1246 | 1 | 100% | -12 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27MAR-C25-20260509 | falling | -1338 | 1 | 100% | -12 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -2500 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXTIME-26-ZOH-20260509 | falling | -1209 | 1 | 100% | -10 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27JUN-C25-20260509 | falling | -4128 | 1 | 100% | -41 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | -5100 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -5600 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXTOPARTIST-26B-DRA-20260509 | falling | -748 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=10 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -4600 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=10 | KXCABOUT-26APR20-TGAB-20260507 | falling | 33 | 1 | 100% | 2 |  |
| stop_loss | stopPriceCents=10 | KXFEDDECISION-27OCT-H0-20260509 | falling | -2909 | 1 | 100% | -28 |  |
| stop_loss | stopPriceCents=10 | KXCABOUT-26APR20-TGAB-20260508 | falling | 633 | 1 | 100% | 3 |  |
| stop_loss | stopPriceCents=30 | KXETH-26MAY0817-B2390-20260508 | rising | -4115 | 1 | 100% | -41 |  |
| stop_loss | stopPriceCents=30 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2062 | 1 | 100% | 22 |  |
| stop_loss | stopPriceCents=30 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 748 | 1 | 100% | 32 |  |
| stop_loss | stopPriceCents=30 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 38 | 1 | 100% | 2 |  |
| stop_loss | stopPriceCents=30 | KXINX-26MAY08H1600-B7387-20260508 | rising | -1532 | 1 | 100% | -15 |  |
| stop_loss | stopPriceCents=30 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3826 | 1 | 100% | 39 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-28JAN-H0-20260509 | rising | -2437 | 1 | 100% | -23 |  |
| stop_loss | stopPriceCents=30 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -385 | 1 | 100% | -3 |  |
| stop_loss | stopPriceCents=30 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | -66 | 1 | 100% | 1 |  |
| stop_loss | stopPriceCents=30 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1233 | 1 | 100% | 14 |  |
| stop_loss | stopPriceCents=30 | KXIPO-26-DISCORD-20260509 | rising | 23 | 1 | 100% | 2 |  |
| stop_loss | stopPriceCents=30 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 138 | 1 | 100% | 3 |  |
| stop_loss | stopPriceCents=30 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1387.15 | 1 | 15% | -13 |  |
| stop_loss | stopPriceCents=30 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -174 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=30 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -521 | 1 | 100% | -5 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27APR-H0-20260508 | rising | 235 | 1 | 100% | 4 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -322 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27APR-H0-20260507 | rising | 733 | 1 | 100% | 9 |  |
| stop_loss | stopPriceCents=30 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2090 | 1 | 100% | -20 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -3111 | 1 | 100% | -30 |  |
| stop_loss | stopPriceCents=30 | KXIPO-26-DISCORD-20260507 | sideways | -76 | 1 | 100% | 1 |  |
| stop_loss | stopPriceCents=30 | KXIPO-26-DISCORD-20260508 | sideways | -477 | 1 | 100% | -3 |  |
| stop_loss | stopPriceCents=30 | KXLLM1-26MAY31-A-20260509 | sideways | -8000 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -607 | 1 | 100% | -6 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -3309 | 1 | 100% | -32 |  |
| stop_loss | stopPriceCents=30 | KXOSCARPIC-27-DIS-20260508 | sideways | -2014 | 1 | 100% | -20 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -4200 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -4800 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -273 | 1 | 100% | 1 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27APR-H0-20260509 | sideways | -6500 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -3005 | 1 | 100% | -29 |  |
| stop_loss | stopPriceCents=30 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -946 | 1 | 100% | -9 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -1166 | 1 | 100% | -7 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -3305 | 1 | 100% | -32 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -2915 | 1 | 100% | -28 |  |
| stop_loss | stopPriceCents=30 | KXOSCARACTO-27-TOM-20260507 | sideways | -931 | 1 | 100% | -8 |  |
| stop_loss | stopPriceCents=30 | KXOSCARACTO-27-TOM-20260508 | sideways | -1230 | 1 | 100% | -11 |  |
| stop_loss | stopPriceCents=30 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2558 | 1 | 100% | -25 |  |
| stop_loss | stopPriceCents=30 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 97 | 1 | 100% | 2 |  |
| stop_loss | stopPriceCents=30 | KXLLM1-26DEC31-XAI-20260508 | sideways | -38 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=30 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | -38 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -3311 | 1 | 100% | -32 |  |
| stop_loss | stopPriceCents=30 | KXLLM1-26MAY31-A-20260507 | sideways | -8100 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -132 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -713 | 1 | 100% | -6 |  |
| stop_loss | stopPriceCents=30 | KXOSCARACTO-27-TOM-20260509 | sideways | -735 | 1 | 100% | -6 |  |
| stop_loss | stopPriceCents=30 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1822 | 1 | 100% | -18 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -9907 | 1 | 100% | -99 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -913 | 1 | 100% | -8 |  |
| stop_loss | stopPriceCents=30 | KXTOPARTIST-26B-DRA-20260508 | sideways | -935 | 1 | 100% | -8 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1617 | 1 | 100% | -15 |  |
| stop_loss | stopPriceCents=30 | KXIPOSPACEX-26JUN01-20260508 | sideways | -264 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=30 | KXIPOSPACEX-26JUN01-20260509 | sideways | -158 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=30 | KXLLM1-26MAY31-A-20260508 | sideways | -7800 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -11 | 1 | 100% | 1 |  |
| stop_loss | stopPriceCents=30 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -309 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=30 | KXLLM1-26DEC31-XAI-20260509 | sideways | -147 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=30 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -9000 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -9100 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -2918 | 1 | 100% | -28 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -1723 | 1 | 100% | -16 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-28JAN-H0-20260508 | sideways | -2435 | 1 | 100% | -23 |  |
| stop_loss | stopPriceCents=30 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -258 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=30 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1287.17 | 1 | 15% | -12 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -328 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -6600 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -238 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=30 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -9000 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -143 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=30 | KXETH-26MAY0817-B2390-20260507 | sideways | -3921 | 1 | 100% | -39 |  |
| stop_loss | stopPriceCents=30 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 737 | 1 | 100% | 33 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -3018 | 1 | 100% | -29 |  |
| stop_loss | stopPriceCents=30 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -521 | 1 | 100% | -5 |  |
| stop_loss | stopPriceCents=30 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -246 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -328 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -6500 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -432 | 1 | 100% | -3 |  |
| stop_loss | stopPriceCents=30 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 237 | 1 | 100% | 4 |  |
| stop_loss | stopPriceCents=30 | KXTIME-26-ZOH-20260508 | sideways | -1206 | 1 | 100% | -11 |  |
| stop_loss | stopPriceCents=30 | KXLLM1-26DEC31-XAI-20260507 | sideways | -41 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=30 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2089 | 1 | 100% | -20 |  |
| stop_loss | stopPriceCents=30 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -8306 | 1 | 100% | -82 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -1410 | 1 | 100% | -13 |  |
| stop_loss | stopPriceCents=30 | KXIPO-26-DISCORD-20260510 | sideways | -6200 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXLLM1-26MAY31-A-20260510 | sideways | -8500 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -4348 | 1 | 100% | -43 |  |
| stop_loss | stopPriceCents=30 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1035 | 1 | 100% | 12 |  |
| stop_loss | stopPriceCents=30 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1507 | 1 | 100% | -15 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -5600 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -771 | 1 | 100% | -6 |  |
| stop_loss | stopPriceCents=30 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2764 | 1 | 100% | -27 |  |
| stop_loss | stopPriceCents=30 | KXTIME-26-ZOH-20260510 | sideways | -397 | 1 | 100% | -3 |  |
| stop_loss | stopPriceCents=30 | KXTOPARTIST-26B-DRA-20260507 | sideways | -1033 | 1 | 100% | -9 |  |
| stop_loss | stopPriceCents=30 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3966 | 1 | 100% | -39 |  |
| stop_loss | stopPriceCents=30 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -474 | 1 | 100% | 39 |  |
| stop_loss | stopPriceCents=30 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | -8500 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -467 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=30 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -174 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -265 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=30 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2764 | 1 | 100% | -27 |  |
| stop_loss | stopPriceCents=30 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -74 | 1 | 100% | 6 |  |
| stop_loss | stopPriceCents=30 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1417 | 1 | 100% | -13 |  |
| stop_loss | stopPriceCents=30 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1064 | 1 | 100% | -9 |  |
| stop_loss | stopPriceCents=30 | KXOSCARPIC-27-DIS-20260509 | falling | -1614 | 1 | 100% | -16 |  |
| stop_loss | stopPriceCents=30 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1507 | 1 | 100% | -15 |  |
| stop_loss | stopPriceCents=30 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1246 | 1 | 100% | -12 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27MAR-C25-20260509 | falling | -1338 | 1 | 100% | -12 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -228 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=30 | KXTIME-26-ZOH-20260509 | falling | -1306 | 1 | 100% | -12 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27JUN-C25-20260509 | falling | -4128 | 1 | 100% | -41 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | -5100 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -5600 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=30 | KXTOPARTIST-26B-DRA-20260509 | falling | -650 | 1 | 100% | -5 |  |
| stop_loss | stopPriceCents=30 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -867 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=30 | KXCABOUT-26APR20-TGAB-20260507 | falling | 33 | 1 | 100% | 2 |  |
| stop_loss | stopPriceCents=30 | KXFEDDECISION-27OCT-H0-20260509 | falling | -2909 | 1 | 100% | -28 |  |
| stop_loss | stopPriceCents=30 | KXCABOUT-26APR20-TGAB-20260508 | falling | 633 | 1 | 100% | 8 |  |
| stop_loss | stopPriceCents=50 | KXETH-26MAY0817-B2390-20260508 | rising | -4115 | 1 | 100% | -41 |  |
| stop_loss | stopPriceCents=50 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2062 | 1 | 100% | 22 |  |
| stop_loss | stopPriceCents=50 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 748 | 1 | 100% | 32 |  |
| stop_loss | stopPriceCents=50 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 38 | 1 | 100% | 2 |  |
| stop_loss | stopPriceCents=50 | KXINX-26MAY08H1600-B7387-20260508 | rising | -1532 | 1 | 100% | -15 |  |
| stop_loss | stopPriceCents=50 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3826 | 1 | 100% | 39 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-28JAN-H0-20260509 | rising | -2437 | 1 | 100% | -23 |  |
| stop_loss | stopPriceCents=50 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -385 | 1 | 100% | -3 |  |
| stop_loss | stopPriceCents=50 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | -66 | 1 | 100% | 1 |  |
| stop_loss | stopPriceCents=50 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1233 | 1 | 100% | 14 |  |
| stop_loss | stopPriceCents=50 | KXIPO-26-DISCORD-20260509 | rising | 23 | 1 | 100% | 2 |  |
| stop_loss | stopPriceCents=50 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 138 | 1 | 100% | 3 |  |
| stop_loss | stopPriceCents=50 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1387.15 | 1 | 15% | -13 |  |
| stop_loss | stopPriceCents=50 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -174 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=50 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -521 | 1 | 100% | -5 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27APR-H0-20260508 | rising | 235 | 1 | 100% | 4 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -322 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27APR-H0-20260507 | rising | 733 | 1 | 100% | 9 |  |
| stop_loss | stopPriceCents=50 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2090 | 1 | 100% | -20 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -3111 | 1 | 100% | -30 |  |
| stop_loss | stopPriceCents=50 | KXIPO-26-DISCORD-20260507 | sideways | -76 | 1 | 100% | 1 |  |
| stop_loss | stopPriceCents=50 | KXIPO-26-DISCORD-20260508 | sideways | -477 | 1 | 100% | -3 |  |
| stop_loss | stopPriceCents=50 | KXLLM1-26MAY31-A-20260509 | sideways | -8000 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=50 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -607 | 1 | 100% | -6 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -3309 | 1 | 100% | -32 |  |
| stop_loss | stopPriceCents=50 | KXOSCARPIC-27-DIS-20260508 | sideways | -2014 | 1 | 100% | -20 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -270 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -275 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -273 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27APR-H0-20260509 | sideways | 147 | 1 | 100% | 3 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -3005 | 1 | 100% | -29 |  |
| stop_loss | stopPriceCents=50 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -946 | 1 | 100% | -9 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -771 | 1 | 100% | -6 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -3305 | 1 | 100% | -32 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -2915 | 1 | 100% | -28 |  |
| stop_loss | stopPriceCents=50 | KXOSCARACTO-27-TOM-20260507 | sideways | -931 | 1 | 100% | -8 |  |
| stop_loss | stopPriceCents=50 | KXOSCARACTO-27-TOM-20260508 | sideways | -1230 | 1 | 100% | -11 |  |
| stop_loss | stopPriceCents=50 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2558 | 1 | 100% | -25 |  |
| stop_loss | stopPriceCents=50 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 97 | 1 | 100% | 2 |  |
| stop_loss | stopPriceCents=50 | KXLLM1-26DEC31-XAI-20260508 | sideways | -38 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=50 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | -38 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -3311 | 1 | 100% | -32 |  |
| stop_loss | stopPriceCents=50 | KXLLM1-26MAY31-A-20260507 | sideways | -8100 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -132 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -713 | 1 | 100% | -6 |  |
| stop_loss | stopPriceCents=50 | KXOSCARACTO-27-TOM-20260509 | sideways | -735 | 1 | 100% | -6 |  |
| stop_loss | stopPriceCents=50 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1822 | 1 | 100% | -18 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -9907 | 1 | 100% | -99 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -913 | 1 | 100% | -8 |  |
| stop_loss | stopPriceCents=50 | KXTOPARTIST-26B-DRA-20260508 | sideways | -935 | 1 | 100% | -8 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1617 | 1 | 100% | -15 |  |
| stop_loss | stopPriceCents=50 | KXIPOSPACEX-26JUN01-20260508 | sideways | -264 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=50 | KXIPOSPACEX-26JUN01-20260509 | sideways | -158 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=50 | KXLLM1-26MAY31-A-20260508 | sideways | -7800 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=50 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -11 | 1 | 100% | 1 |  |
| stop_loss | stopPriceCents=50 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -309 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=50 | KXLLM1-26DEC31-XAI-20260509 | sideways | -147 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=50 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -9000 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=50 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -9100 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -2918 | 1 | 100% | -28 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -1723 | 1 | 100% | -16 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-28JAN-H0-20260508 | sideways | -2435 | 1 | 100% | -23 |  |
| stop_loss | stopPriceCents=50 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -258 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=50 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1287.17 | 1 | 15% | -12 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -328 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -55 | 1 | 100% | 6 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -238 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=50 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -9000 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=50 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -143 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=50 | KXETH-26MAY0817-B2390-20260507 | sideways | -3921 | 1 | 100% | -39 |  |
| stop_loss | stopPriceCents=50 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 737 | 1 | 100% | 33 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -3018 | 1 | 100% | -29 |  |
| stop_loss | stopPriceCents=50 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -521 | 1 | 100% | -5 |  |
| stop_loss | stopPriceCents=50 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -246 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -328 | 1 | 100% | -2 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -262 | 1 | 100% | 1 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -432 | 1 | 100% | -3 |  |
| stop_loss | stopPriceCents=50 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 237 | 1 | 100% | 4 |  |
| stop_loss | stopPriceCents=50 | KXTIME-26-ZOH-20260508 | sideways | -1206 | 1 | 100% | -11 |  |
| stop_loss | stopPriceCents=50 | KXLLM1-26DEC31-XAI-20260507 | sideways | -41 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=50 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2089 | 1 | 100% | -20 |  |
| stop_loss | stopPriceCents=50 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -8306 | 1 | 100% | -82 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -1410 | 1 | 100% | -13 |  |
| stop_loss | stopPriceCents=50 | KXIPO-26-DISCORD-20260510 | sideways | -6200 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=50 | KXLLM1-26MAY31-A-20260510 | sideways | -8500 | 0 | 0% | 0 |  |
| stop_loss | stopPriceCents=50 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -4348 | 1 | 100% | -43 |  |
| stop_loss | stopPriceCents=50 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1035 | 1 | 100% | 12 |  |
| stop_loss | stopPriceCents=50 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1507 | 1 | 100% | -15 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -576 | 1 | 100% | -4 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -573 | 1 | 100% | -4 |  |
| stop_loss | stopPriceCents=50 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2764 | 1 | 100% | -27 |  |
| stop_loss | stopPriceCents=50 | KXTIME-26-ZOH-20260510 | sideways | -397 | 1 | 100% | -3 |  |
| stop_loss | stopPriceCents=50 | KXTOPARTIST-26B-DRA-20260507 | sideways | -1033 | 1 | 100% | -9 |  |
| stop_loss | stopPriceCents=50 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3966 | 1 | 100% | -39 |  |
| stop_loss | stopPriceCents=50 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -474 | 1 | 100% | 39 |  |
| stop_loss | stopPriceCents=50 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | 1393 | 1 | 100% | 53 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -270 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=50 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -174 | 1 | 100% | 0 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -265 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=50 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2764 | 1 | 100% | -27 |  |
| stop_loss | stopPriceCents=50 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -74 | 1 | 100% | 1 |  |
| stop_loss | stopPriceCents=50 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1417 | 1 | 100% | -13 |  |
| stop_loss | stopPriceCents=50 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1064 | 1 | 100% | -9 |  |
| stop_loss | stopPriceCents=50 | KXOSCARPIC-27-DIS-20260509 | falling | -1614 | 1 | 100% | -16 |  |
| stop_loss | stopPriceCents=50 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1507 | 1 | 100% | -15 |  |
| stop_loss | stopPriceCents=50 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1246 | 1 | 100% | -12 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27MAR-C25-20260509 | falling | -1338 | 1 | 100% | -12 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -228 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=50 | KXTIME-26-ZOH-20260509 | falling | -1306 | 1 | 100% | -12 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27JUN-C25-20260509 | falling | -4128 | 1 | 100% | -41 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | -276 | 1 | 100% | -1 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -476 | 1 | 100% | -3 |  |
| stop_loss | stopPriceCents=50 | KXTOPARTIST-26B-DRA-20260509 | falling | -650 | 1 | 100% | -5 |  |
| stop_loss | stopPriceCents=50 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -571 | 1 | 100% | -4 |  |
| stop_loss | stopPriceCents=50 | KXCABOUT-26APR20-TGAB-20260507 | falling | 33 | 1 | 100% | 2 |  |
| stop_loss | stopPriceCents=50 | KXFEDDECISION-27OCT-H0-20260509 | falling | -2909 | 1 | 100% | -28 |  |
| stop_loss | stopPriceCents=50 | KXCABOUT-26APR20-TGAB-20260508 | falling | 633 | 1 | 100% | 8 |  |
| take_profit | targetPriceCents=40 | KXETH-26MAY0817-B2390-20260508 | rising | -4300 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 4893 | 1 | 100% | 20 |  |
| take_profit | targetPriceCents=40 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 326 | 1 | 100% | 0 |  |
| take_profit | targetPriceCents=40 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 5114 | 1 | 100% | -1 |  |
| take_profit | targetPriceCents=40 | KXINX-26MAY08H1600-B7387-20260508 | rising | -1900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 4460 | 1 | 100% | 4 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-28JAN-H0-20260509 | rising | -5000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -1700 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | -3700 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXCABOUT-26APR20-TGAB-20260509 | rising | -2500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXIPO-26-DISCORD-20260509 | rising | -4900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | -3300 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1400 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -4600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27APR-H0-20260508 | rising | -5800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -2400 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27APR-H0-20260507 | rising | -5200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXBTC-26MAY0817-B79750-20260508 | sideways | -3500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -4900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXIPO-26-DISCORD-20260507 | sideways | -4900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXIPO-26-DISCORD-20260508 | sideways | -5400 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXLLM1-26MAY31-A-20260509 | sideways | 94 | 1 | 100% | -3 |  |
| take_profit | targetPriceCents=40 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -700 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -5100 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXOSCARPIC-27-DIS-20260508 | sideways | -2200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -4200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -4800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -4500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27APR-H0-20260509 | sideways | -6500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -4700 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -1600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -4800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -5000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -4800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXOSCARACTO-27-TOM-20260507 | sideways | -3200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXOSCARACTO-27-TOM-20260508 | sideways | -3500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -3400 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXSPACEXCOUNT-26B-170-20260508 | sideways | -1600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXLLM1-26DEC31-XAI-20260508 | sideways | -600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | -600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -5100 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXLLM1-26MAY31-A-20260507 | sideways | -8100 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -2500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -2600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXOSCARACTO-27-TOM-20260509 | sideways | -3200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -2100 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -2800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXTOPARTIST-26B-DRA-20260508 | sideways | -3400 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -3600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXIPOSPACEX-26JUN01-20260508 | sideways | -1200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXIPOSPACEX-26JUN01-20260509 | sideways | -1000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXLLM1-26MAY31-A-20260508 | sideways | -7800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -1900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -2100 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXLLM1-26DEC31-XAI-20260509 | sideways | -800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -9000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -9100 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -4900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -3800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-28JAN-H0-20260508 | sideways | -5100 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -3500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1300 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -2600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -6600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -2800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -9000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -700 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXETH-26MAY0817-B2390-20260507 | sideways | -4200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | -8200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -5000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -2600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -6500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -2800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | -3200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXTIME-26-ZOH-20260508 | sideways | -2900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXLLM1-26DEC31-XAI-20260507 | sideways | -600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXBTC-26MAY0817-B79750-20260507 | sideways | -3500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -3200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXIPO-26-DISCORD-20260510 | sideways | -6200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXLLM1-26MAY31-A-20260510 | sideways | -8500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -5000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | -5000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -5600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -4800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -3700 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXTIME-26-ZOH-20260510 | sideways | -1900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXTOPARTIST-26B-DRA-20260507 | sideways | -3400 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -5000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -9200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | -8500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -4200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -5500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -3900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -3700 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -5300 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -3400 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -4600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXOSCARPIC-27-DIS-20260509 | falling | -1800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27MAR-C25-20260509 | falling | -3900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -2500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXTIME-26-ZOH-20260509 | falling | -3000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27JUN-C25-20260509 | falling | -4500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | -5100 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -5600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXTOPARTIST-26B-DRA-20260509 | falling | -3600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -4600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXCABOUT-26APR20-TGAB-20260507 | falling | -3700 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXFEDDECISION-27OCT-H0-20260509 | falling | -4700 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=40 | KXCABOUT-26APR20-TGAB-20260508 | falling | -3100 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXETH-26MAY0817-B2390-20260508 | rising | -4300 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 4893 | 1 | 100% | 20 |  |
| take_profit | targetPriceCents=50 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 326 | 1 | 100% | 0 |  |
| take_profit | targetPriceCents=50 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 5114 | 1 | 100% | -1 |  |
| take_profit | targetPriceCents=50 | KXINX-26MAY08H1600-B7387-20260508 | rising | -1900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 4460 | 1 | 100% | 4 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-28JAN-H0-20260509 | rising | -5000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -1700 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | -3700 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXCABOUT-26APR20-TGAB-20260509 | rising | -2500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXIPO-26-DISCORD-20260509 | rising | -4900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | -3300 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1400 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -4600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27APR-H0-20260508 | rising | -5800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -2400 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27APR-H0-20260507 | rising | -5200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXBTC-26MAY0817-B79750-20260508 | sideways | -3500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -4900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXIPO-26-DISCORD-20260507 | sideways | -4900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXIPO-26-DISCORD-20260508 | sideways | -5400 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXLLM1-26MAY31-A-20260509 | sideways | 94 | 1 | 100% | -3 |  |
| take_profit | targetPriceCents=50 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -700 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -5100 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXOSCARPIC-27-DIS-20260508 | sideways | -2200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -4200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -4800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -4500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27APR-H0-20260509 | sideways | -6500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -4700 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -1600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -4800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -5000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -4800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXOSCARACTO-27-TOM-20260507 | sideways | -3200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXOSCARACTO-27-TOM-20260508 | sideways | -3500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -3400 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXSPACEXCOUNT-26B-170-20260508 | sideways | -1600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXLLM1-26DEC31-XAI-20260508 | sideways | -600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | -600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -5100 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXLLM1-26MAY31-A-20260507 | sideways | -8100 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -2500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -2600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXOSCARACTO-27-TOM-20260509 | sideways | -3200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -2100 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -2800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXTOPARTIST-26B-DRA-20260508 | sideways | -3400 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -3600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXIPOSPACEX-26JUN01-20260508 | sideways | -1200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXIPOSPACEX-26JUN01-20260509 | sideways | -1000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXLLM1-26MAY31-A-20260508 | sideways | -7800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -1900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -2100 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXLLM1-26DEC31-XAI-20260509 | sideways | -800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -9000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -9100 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -4900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -3800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-28JAN-H0-20260508 | sideways | -5100 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -3500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1300 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -2600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -6600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -2800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -9000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -700 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXETH-26MAY0817-B2390-20260507 | sideways | -4200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | -8200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -5000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -2600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -6500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -2800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | -3200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXTIME-26-ZOH-20260508 | sideways | -2900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXLLM1-26DEC31-XAI-20260507 | sideways | -600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXBTC-26MAY0817-B79750-20260507 | sideways | -3500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -3200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXIPO-26-DISCORD-20260510 | sideways | -6200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXLLM1-26MAY31-A-20260510 | sideways | -8500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -5000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | -5000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -5600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -4800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -3700 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXTIME-26-ZOH-20260510 | sideways | -1900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXTOPARTIST-26B-DRA-20260507 | sideways | -3400 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -5000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -9200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | -8500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -4200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -5500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -3900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -3700 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -5300 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -3400 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -4600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXOSCARPIC-27-DIS-20260509 | falling | -1800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27MAR-C25-20260509 | falling | -3900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -2500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXTIME-26-ZOH-20260509 | falling | -3000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27JUN-C25-20260509 | falling | -4500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | -5100 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -5600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXTOPARTIST-26B-DRA-20260509 | falling | -3600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -4600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXCABOUT-26APR20-TGAB-20260507 | falling | -3700 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXFEDDECISION-27OCT-H0-20260509 | falling | -4700 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=50 | KXCABOUT-26APR20-TGAB-20260508 | falling | -3100 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXETH-26MAY0817-B2390-20260508 | rising | -4300 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 4893 | 1 | 100% | 20 |  |
| take_profit | targetPriceCents=60 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 326 | 1 | 100% | 0 |  |
| take_profit | targetPriceCents=60 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 5114 | 1 | 100% | -1 |  |
| take_profit | targetPriceCents=60 | KXINX-26MAY08H1600-B7387-20260508 | rising | -1900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 4460 | 1 | 100% | 4 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-28JAN-H0-20260509 | rising | -5000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -1700 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | -3700 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXCABOUT-26APR20-TGAB-20260509 | rising | -2500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXIPO-26-DISCORD-20260509 | rising | -4900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | -3300 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1400 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -4600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27APR-H0-20260508 | rising | -5800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -2400 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27APR-H0-20260507 | rising | -5200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXBTC-26MAY0817-B79750-20260508 | sideways | -3500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -4900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXIPO-26-DISCORD-20260507 | sideways | -4900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXIPO-26-DISCORD-20260508 | sideways | -5400 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXLLM1-26MAY31-A-20260509 | sideways | 94 | 1 | 100% | -3 |  |
| take_profit | targetPriceCents=60 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -700 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -5100 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXOSCARPIC-27-DIS-20260508 | sideways | -2200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -4200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -4800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -4500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27APR-H0-20260509 | sideways | -6500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -4700 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -1600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -4800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -5000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -4800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXOSCARACTO-27-TOM-20260507 | sideways | -3200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXOSCARACTO-27-TOM-20260508 | sideways | -3500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -3400 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXSPACEXCOUNT-26B-170-20260508 | sideways | -1600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXLLM1-26DEC31-XAI-20260508 | sideways | -600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | -600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -5100 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXLLM1-26MAY31-A-20260507 | sideways | -8100 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -2500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -2600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXOSCARACTO-27-TOM-20260509 | sideways | -3200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -2100 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -2800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXTOPARTIST-26B-DRA-20260508 | sideways | -3400 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -3600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXIPOSPACEX-26JUN01-20260508 | sideways | -1200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXIPOSPACEX-26JUN01-20260509 | sideways | -1000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXLLM1-26MAY31-A-20260508 | sideways | -7800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -1900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -2100 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXLLM1-26DEC31-XAI-20260509 | sideways | -800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -9000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -9100 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -4900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -3800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-28JAN-H0-20260508 | sideways | -5100 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -3500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1300 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -2600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -6600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -2800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -9000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -700 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXETH-26MAY0817-B2390-20260507 | sideways | -4200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | -8200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -5000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -2600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -6500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -2800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | -3200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXTIME-26-ZOH-20260508 | sideways | -2900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXLLM1-26DEC31-XAI-20260507 | sideways | -600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXBTC-26MAY0817-B79750-20260507 | sideways | -3500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -10000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -3200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXIPO-26-DISCORD-20260510 | sideways | -6200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXLLM1-26MAY31-A-20260510 | sideways | -8500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -5000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | -5000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -5600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -4800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -3700 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXTIME-26-ZOH-20260510 | sideways | -1900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXTOPARTIST-26B-DRA-20260507 | sideways | -3400 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -5000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -9200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | -8500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -4200 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -5500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -3900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -3700 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -5300 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -3400 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -4600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXOSCARPIC-27-DIS-20260509 | falling | -1800 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27MAR-C25-20260509 | falling | -3900 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -2500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXTIME-26-ZOH-20260509 | falling | -3000 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27JUN-C25-20260509 | falling | -4500 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | -5100 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -5600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXTOPARTIST-26B-DRA-20260509 | falling | -3600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -4600 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXCABOUT-26APR20-TGAB-20260507 | falling | -3700 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXFEDDECISION-27OCT-H0-20260509 | falling | -4700 | 0 | 0% | 0 |  |
| take_profit | targetPriceCents=60 | KXCABOUT-26APR20-TGAB-20260508 | falling | -3100 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXETH-26MAY0817-B2390-20260508 | rising | -4115 | 1 | 100% | -41 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2062 | 1 | 100% | 22 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 748 | 1 | 100% | 32 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 38 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXINX-26MAY08H1600-B7387-20260508 | rising | -1532 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3826 | 1 | 100% | 39 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-28JAN-H0-20260509 | rising | -2437 | 1 | 100% | -23 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -385 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | -66 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1233 | 1 | 100% | 14 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXIPO-26-DISCORD-20260509 | rising | 23 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 138 | 1 | 100% | 3 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1387.15 | 1 | 15% | -13 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -174 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -521 | 1 | 100% | -5 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27APR-H0-20260508 | rising | 235 | 1 | 100% | 4 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -322 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27APR-H0-20260507 | rising | 733 | 1 | 100% | 9 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2090 | 1 | 100% | -20 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -3111 | 1 | 100% | -30 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXIPO-26-DISCORD-20260507 | sideways | -76 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXIPO-26-DISCORD-20260508 | sideways | -477 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXLLM1-26MAY31-A-20260509 | sideways | 94 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -607 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -3309 | 1 | 100% | -32 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXOSCARPIC-27-DIS-20260508 | sideways | -2014 | 1 | 100% | -20 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -4200 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -4800 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -273 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27APR-H0-20260509 | sideways | -6500 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -3005 | 1 | 100% | -29 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -946 | 1 | 100% | -9 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -1166 | 1 | 100% | -7 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -3305 | 1 | 100% | -32 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -2915 | 1 | 100% | -28 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXOSCARACTO-27-TOM-20260507 | sideways | -931 | 1 | 100% | -8 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXOSCARACTO-27-TOM-20260508 | sideways | -1230 | 1 | 100% | -11 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2558 | 1 | 100% | -25 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 97 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXLLM1-26DEC31-XAI-20260508 | sideways | -38 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | -38 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -3311 | 1 | 100% | -32 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXLLM1-26MAY31-A-20260507 | sideways | -8100 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -132 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -713 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXOSCARACTO-27-TOM-20260509 | sideways | -735 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1822 | 1 | 100% | -18 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -9907 | 1 | 100% | -99 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -913 | 1 | 100% | -8 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXTOPARTIST-26B-DRA-20260508 | sideways | -935 | 1 | 100% | -8 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1617 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXIPOSPACEX-26JUN01-20260508 | sideways | -264 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXIPOSPACEX-26JUN01-20260509 | sideways | -158 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXLLM1-26MAY31-A-20260508 | sideways | -7800 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -11 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -309 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXLLM1-26DEC31-XAI-20260509 | sideways | -147 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -9000 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -9100 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -2918 | 1 | 100% | -28 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -1723 | 1 | 100% | -16 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-28JAN-H0-20260508 | sideways | -2435 | 1 | 100% | -23 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -258 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1287.17 | 1 | 15% | -12 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -328 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -6600 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -238 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -9000 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -143 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXETH-26MAY0817-B2390-20260507 | sideways | -3921 | 1 | 100% | -39 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 737 | 1 | 100% | 33 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -3018 | 1 | 100% | -29 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -521 | 1 | 100% | -5 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -246 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -328 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -6500 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -432 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 237 | 1 | 100% | 4 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXTIME-26-ZOH-20260508 | sideways | -1206 | 1 | 100% | -11 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXLLM1-26DEC31-XAI-20260507 | sideways | -41 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2089 | 1 | 100% | -20 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -8306 | 1 | 100% | -82 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -1410 | 1 | 100% | -13 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXIPO-26-DISCORD-20260510 | sideways | -6200 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXLLM1-26MAY31-A-20260510 | sideways | -8500 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -4348 | 1 | 100% | -43 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1035 | 1 | 100% | 12 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1507 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -5600 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -771 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2764 | 1 | 100% | -27 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXTIME-26-ZOH-20260510 | sideways | -397 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXTOPARTIST-26B-DRA-20260507 | sideways | -1033 | 1 | 100% | -9 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3966 | 1 | 100% | -39 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -474 | 1 | 100% | 39 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | -8500 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -467 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -174 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -265 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2764 | 1 | 100% | -27 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -74 | 1 | 100% | 6 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1417 | 1 | 100% | -13 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1064 | 1 | 100% | -9 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXOSCARPIC-27-DIS-20260509 | falling | -1614 | 1 | 100% | -16 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1507 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1246 | 1 | 100% | -12 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27MAR-C25-20260509 | falling | -1338 | 1 | 100% | -12 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -228 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXTIME-26-ZOH-20260509 | falling | -1306 | 1 | 100% | -12 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27JUN-C25-20260509 | falling | -4128 | 1 | 100% | -41 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | -5100 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -5600 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXTOPARTIST-26B-DRA-20260509 | falling | -650 | 1 | 100% | -5 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -867 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXCABOUT-26APR20-TGAB-20260507 | falling | 33 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXFEDDECISION-27OCT-H0-20260509 | falling | -2909 | 1 | 100% | -28 |  |
| bracket | targetPriceCents=50, stopPriceCents=20 | KXCABOUT-26APR20-TGAB-20260508 | falling | 633 | 1 | 100% | 8 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXETH-26MAY0817-B2390-20260508 | rising | -4115 | 1 | 100% | -41 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2062 | 1 | 100% | 22 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 748 | 1 | 100% | 32 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 38 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXINX-26MAY08H1600-B7387-20260508 | rising | -1532 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3826 | 1 | 100% | 39 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-28JAN-H0-20260509 | rising | -2437 | 1 | 100% | -23 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -385 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | -66 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1233 | 1 | 100% | 14 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXIPO-26-DISCORD-20260509 | rising | 23 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 138 | 1 | 100% | 3 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1387.15 | 1 | 15% | -13 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -174 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -521 | 1 | 100% | -5 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27APR-H0-20260508 | rising | 235 | 1 | 100% | 4 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -322 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27APR-H0-20260507 | rising | 733 | 1 | 100% | 9 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2090 | 1 | 100% | -20 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -3111 | 1 | 100% | -30 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXIPO-26-DISCORD-20260507 | sideways | -76 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXIPO-26-DISCORD-20260508 | sideways | -477 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXLLM1-26MAY31-A-20260509 | sideways | 94 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -607 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -3309 | 1 | 100% | -32 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXOSCARPIC-27-DIS-20260508 | sideways | -2014 | 1 | 100% | -20 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -4200 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -4800 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -273 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27APR-H0-20260509 | sideways | -6500 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -3005 | 1 | 100% | -29 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -946 | 1 | 100% | -9 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -1166 | 1 | 100% | -7 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -3305 | 1 | 100% | -32 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -2915 | 1 | 100% | -28 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXOSCARACTO-27-TOM-20260507 | sideways | -931 | 1 | 100% | -8 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXOSCARACTO-27-TOM-20260508 | sideways | -1230 | 1 | 100% | -11 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2558 | 1 | 100% | -25 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 97 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXLLM1-26DEC31-XAI-20260508 | sideways | -38 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | -38 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -3311 | 1 | 100% | -32 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXLLM1-26MAY31-A-20260507 | sideways | -8100 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -132 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -713 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXOSCARACTO-27-TOM-20260509 | sideways | -735 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1822 | 1 | 100% | -18 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -9907 | 1 | 100% | -99 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -913 | 1 | 100% | -8 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXTOPARTIST-26B-DRA-20260508 | sideways | -935 | 1 | 100% | -8 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1617 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXIPOSPACEX-26JUN01-20260508 | sideways | -264 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXIPOSPACEX-26JUN01-20260509 | sideways | -158 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXLLM1-26MAY31-A-20260508 | sideways | -7800 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -11 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -309 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXLLM1-26DEC31-XAI-20260509 | sideways | -147 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -9000 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -9100 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -2918 | 1 | 100% | -28 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -1723 | 1 | 100% | -16 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-28JAN-H0-20260508 | sideways | -2435 | 1 | 100% | -23 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -258 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1287.17 | 1 | 15% | -12 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -328 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -6600 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -238 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -9000 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -143 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXETH-26MAY0817-B2390-20260507 | sideways | -3921 | 1 | 100% | -39 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 737 | 1 | 100% | 33 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -3018 | 1 | 100% | -29 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -521 | 1 | 100% | -5 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -246 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -328 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -6500 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -432 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 237 | 1 | 100% | 4 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXTIME-26-ZOH-20260508 | sideways | -1206 | 1 | 100% | -11 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXLLM1-26DEC31-XAI-20260507 | sideways | -41 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2089 | 1 | 100% | -20 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -8306 | 1 | 100% | -82 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -1410 | 1 | 100% | -13 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXIPO-26-DISCORD-20260510 | sideways | -6200 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXLLM1-26MAY31-A-20260510 | sideways | -8500 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -4348 | 1 | 100% | -43 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1035 | 1 | 100% | 12 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1507 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -5600 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -771 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2764 | 1 | 100% | -27 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXTIME-26-ZOH-20260510 | sideways | -397 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXTOPARTIST-26B-DRA-20260507 | sideways | -1033 | 1 | 100% | -9 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3966 | 1 | 100% | -39 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -474 | 1 | 100% | 39 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | -8500 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -467 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -174 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -265 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2764 | 1 | 100% | -27 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -74 | 1 | 100% | 6 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1417 | 1 | 100% | -13 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1064 | 1 | 100% | -9 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXOSCARPIC-27-DIS-20260509 | falling | -1614 | 1 | 100% | -16 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1507 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1246 | 1 | 100% | -12 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27MAR-C25-20260509 | falling | -1338 | 1 | 100% | -12 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -228 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXTIME-26-ZOH-20260509 | falling | -1306 | 1 | 100% | -12 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27JUN-C25-20260509 | falling | -4128 | 1 | 100% | -41 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | -5100 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -5600 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXTOPARTIST-26B-DRA-20260509 | falling | -650 | 1 | 100% | -5 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -867 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXCABOUT-26APR20-TGAB-20260507 | falling | 33 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXFEDDECISION-27OCT-H0-20260509 | falling | -2909 | 1 | 100% | -28 |  |
| bracket | targetPriceCents=50, stopPriceCents=30 | KXCABOUT-26APR20-TGAB-20260508 | falling | 633 | 1 | 100% | 8 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXETH-26MAY0817-B2390-20260508 | rising | -4115 | 1 | 100% | -41 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2062 | 1 | 100% | 22 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 748 | 1 | 100% | 32 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 38 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXINX-26MAY08H1600-B7387-20260508 | rising | -1532 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3826 | 1 | 100% | 39 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-28JAN-H0-20260509 | rising | -2437 | 1 | 100% | -23 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -385 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | -66 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1233 | 1 | 100% | 14 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXIPO-26-DISCORD-20260509 | rising | 23 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 138 | 1 | 100% | 3 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1387.15 | 1 | 15% | -13 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -174 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -521 | 1 | 100% | -5 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27APR-H0-20260508 | rising | 235 | 1 | 100% | 4 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -322 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27APR-H0-20260507 | rising | 733 | 1 | 100% | 9 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2090 | 1 | 100% | -20 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -3111 | 1 | 100% | -30 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXIPO-26-DISCORD-20260507 | sideways | -76 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXIPO-26-DISCORD-20260508 | sideways | -477 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXLLM1-26MAY31-A-20260509 | sideways | 94 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -607 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -3309 | 1 | 100% | -32 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXOSCARPIC-27-DIS-20260508 | sideways | -2014 | 1 | 100% | -20 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -4200 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -4800 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -273 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27APR-H0-20260509 | sideways | -6500 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -3005 | 1 | 100% | -29 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -946 | 1 | 100% | -9 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -1166 | 1 | 100% | -7 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -3305 | 1 | 100% | -32 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -2915 | 1 | 100% | -28 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXOSCARACTO-27-TOM-20260507 | sideways | -931 | 1 | 100% | -8 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXOSCARACTO-27-TOM-20260508 | sideways | -1230 | 1 | 100% | -11 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2558 | 1 | 100% | -25 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 97 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXLLM1-26DEC31-XAI-20260508 | sideways | -38 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | -38 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -3311 | 1 | 100% | -32 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXLLM1-26MAY31-A-20260507 | sideways | -8100 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -132 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -713 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXOSCARACTO-27-TOM-20260509 | sideways | -735 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1822 | 1 | 100% | -18 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -9907 | 1 | 100% | -99 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -913 | 1 | 100% | -8 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXTOPARTIST-26B-DRA-20260508 | sideways | -935 | 1 | 100% | -8 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1617 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXIPOSPACEX-26JUN01-20260508 | sideways | -264 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXIPOSPACEX-26JUN01-20260509 | sideways | -158 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXLLM1-26MAY31-A-20260508 | sideways | -7800 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -11 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -309 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXLLM1-26DEC31-XAI-20260509 | sideways | -147 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -9000 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -9100 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -2918 | 1 | 100% | -28 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -1723 | 1 | 100% | -16 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-28JAN-H0-20260508 | sideways | -2435 | 1 | 100% | -23 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -258 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1287.17 | 1 | 15% | -12 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -328 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -6600 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -238 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -9000 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -143 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXETH-26MAY0817-B2390-20260507 | sideways | -3921 | 1 | 100% | -39 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 737 | 1 | 100% | 33 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -3018 | 1 | 100% | -29 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -521 | 1 | 100% | -5 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -246 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -328 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -6500 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -432 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 237 | 1 | 100% | 4 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXTIME-26-ZOH-20260508 | sideways | -1206 | 1 | 100% | -11 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXLLM1-26DEC31-XAI-20260507 | sideways | -41 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2089 | 1 | 100% | -20 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -8306 | 1 | 100% | -82 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -1410 | 1 | 100% | -13 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXIPO-26-DISCORD-20260510 | sideways | -6200 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXLLM1-26MAY31-A-20260510 | sideways | -8500 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -4348 | 1 | 100% | -43 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1035 | 1 | 100% | 12 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1507 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -5600 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -771 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2764 | 1 | 100% | -27 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXTIME-26-ZOH-20260510 | sideways | -397 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXTOPARTIST-26B-DRA-20260507 | sideways | -1033 | 1 | 100% | -9 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3966 | 1 | 100% | -39 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -474 | 1 | 100% | 39 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | -8500 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -467 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -174 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -265 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2764 | 1 | 100% | -27 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -74 | 1 | 100% | 6 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1417 | 1 | 100% | -13 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1064 | 1 | 100% | -9 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXOSCARPIC-27-DIS-20260509 | falling | -1614 | 1 | 100% | -16 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1507 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1246 | 1 | 100% | -12 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27MAR-C25-20260509 | falling | -1338 | 1 | 100% | -12 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -228 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXTIME-26-ZOH-20260509 | falling | -1306 | 1 | 100% | -12 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27JUN-C25-20260509 | falling | -4128 | 1 | 100% | -41 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | -5100 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -5600 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXTOPARTIST-26B-DRA-20260509 | falling | -650 | 1 | 100% | -5 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -867 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXCABOUT-26APR20-TGAB-20260507 | falling | 33 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXFEDDECISION-27OCT-H0-20260509 | falling | -2909 | 1 | 100% | -28 |  |
| bracket | targetPriceCents=60, stopPriceCents=20 | KXCABOUT-26APR20-TGAB-20260508 | falling | 633 | 1 | 100% | 8 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXETH-26MAY0817-B2390-20260508 | rising | -4115 | 1 | 100% | -41 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260508 | rising | 2062 | 1 | 100% | 22 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXETHD-26MAY0817-T2209.99-20260508 | rising | 748 | 1 | 100% | 32 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXHIGHLAX-26MAY08-B68.5-20260508 | rising | 38 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXINX-26MAY08H1600-B7387-20260508 | rising | -1532 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXSPOTIFYD-26MAY08-DRO-20260508 | rising | 3826 | 1 | 100% | 39 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-28JAN-H0-20260509 | rising | -2437 | 1 | 100% | -23 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXBTCD-26MAY0817-T80999.99-20260507 | rising | -385 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXHIGHNY-26MAY08-B64.5-20260507 | rising | -66 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXCABOUT-26APR20-TGAB-20260509 | rising | 1233 | 1 | 100% | 14 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXIPO-26-DISCORD-20260509 | rising | 23 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXSPACEXCOUNT-26MAY-12-20260508 | rising | 138 | 1 | 100% | 3 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXLLM1-26MAY09-GOOG-20260508 | rising | -1387.15 | 1 | 15% | -13 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXINXU-26MAY08H1600-T7324.9999-20260507 | rising | -174 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXHIGHCHI-26MAY08-T70-20260508 | rising | -521 | 1 | 100% | -5 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27APR-H0-20260508 | rising | 235 | 1 | 100% | 4 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY12MINSAS-MIN-20260509 | rising | -322 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27APR-H0-20260507 | rising | 733 | 1 | 100% | 9 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXBTC-26MAY0817-B79750-20260508 | sideways | -2090 | 1 | 100% | -20 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27SEP-H0-20260509 | sideways | -3111 | 1 | 100% | -30 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXIPO-26-DISCORD-20260507 | sideways | -76 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXIPO-26-DISCORD-20260508 | sideways | -477 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXLLM1-26MAY31-A-20260509 | sideways | 94 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXSURVIVOR-26DEC31-RIZ-20260509 | sideways | -607 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27OCT-H0-20260508 | sideways | -3309 | 1 | 100% | -32 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXOSCARPIC-27-DIS-20260508 | sideways | -2014 | 1 | 100% | -20 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY09DETCLE-DET-20260507 | sideways | -4200 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY10NYKPHI-NYK-20260509 | sideways | -4800 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY11DETCLE-DET-20260509 | sideways | -273 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27APR-H0-20260509 | sideways | -6500 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27DEC-H0-20260509 | sideways | -3005 | 1 | 100% | -29 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXINXY-26DEC31H1600-B8300-20260508 | sideways | -946 | 1 | 100% | -9 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY11DETCLE-DET-20260508 | sideways | -1166 | 1 | 100% | -7 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27DEC-H0-20260508 | sideways | -3305 | 1 | 100% | -32 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27JUL-H0-20260509 | sideways | -2915 | 1 | 100% | -28 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXOSCARACTO-27-TOM-20260507 | sideways | -931 | 1 | 100% | -8 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXOSCARACTO-27-TOM-20260508 | sideways | -1230 | 1 | 100% | -11 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260507 | sideways | -2558 | 1 | 100% | -25 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXSPACEXCOUNT-26B-170-20260508 | sideways | 97 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXLLM1-26DEC31-XAI-20260508 | sideways | -38 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260509 | sideways | -38 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27SEP-H0-20260508 | sideways | -3311 | 1 | 100% | -32 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXLLM1-26MAY31-A-20260507 | sideways | -8100 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY11OKCLAL-LAL-20260508 | sideways | -132 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY12MINSAS-MIN-20260508 | sideways | -713 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXOSCARACTO-27-TOM-20260509 | sideways | -735 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXINX-26MAY08H1600-B7387-20260507 | sideways | -1822 | 1 | 100% | -18 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY10NYKPHI-NYK-20260512 | sideways | -9907 | 1 | 100% | -99 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY12MINSAS-MIN-20260507 | sideways | -913 | 1 | 100% | -8 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXTOPARTIST-26B-DRA-20260508 | sideways | -935 | 1 | 100% | -8 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27MAR-C25-20260507 | sideways | -1617 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXIPOSPACEX-26JUN01-20260508 | sideways | -264 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXIPOSPACEX-26JUN01-20260509 | sideways | -158 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXLLM1-26MAY31-A-20260508 | sideways | -7800 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXSPACEXCOUNT-26B-170-20260509 | sideways | -11 | 1 | 100% | 1 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXSPACEXCOUNT-26B-170-20260510 | sideways | -309 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXLLM1-26DEC31-XAI-20260509 | sideways | -147 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXLAYOFFSYINFO-26-494000-20260507 | sideways | -9000 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXLAYOFFSYINFO-26-494000-20260508 | sideways | -9100 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27JUL-H0-20260508 | sideways | -2918 | 1 | 100% | -28 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27MAR-C25-20260508 | sideways | -1723 | 1 | 100% | -16 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-28JAN-H0-20260508 | sideways | -2435 | 1 | 100% | -23 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXHIGHLAX-26MAY08-B68.5-20260507 | sideways | -258 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXLLM1-26MAY09-GOOG-20260507 | sideways | -1287.17 | 1 | 15% | -12 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY09OKCLAL-LAL-20260508 | sideways | -328 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY10SASMIN-SAS-20260509 | sideways | -6600 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY11OKCLAL-LAL-20260510 | sideways | -238 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXLAYOFFSYINFO-26-494000-20260509 | sideways | -9000 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260508 | sideways | -143 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXETH-26MAY0817-B2390-20260507 | sideways | -3921 | 1 | 100% | -39 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXETHD-26MAY0817-T2209.99-20260507 | sideways | 737 | 1 | 100% | 33 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27JUL-H0-20260507 | sideways | -3018 | 1 | 100% | -29 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXHIGHCHI-26MAY08-T70-20260507 | sideways | -521 | 1 | 100% | -5 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXMOVVAREDISTRICT-26APR21-YES-P4-20260510 | sideways | -246 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY09OKCLAL-LAL-20260507 | sideways | -328 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY10SASMIN-SAS-20260508 | sideways | -6500 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY11OKCLAL-LAL-20260509 | sideways | -432 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXSPACEXCOUNT-26MAY-12-20260507 | sideways | 237 | 1 | 100% | 4 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXTIME-26-ZOH-20260508 | sideways | -1206 | 1 | 100% | -11 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXLLM1-26DEC31-XAI-20260507 | sideways | -41 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXBTC-26MAY0817-B79750-20260507 | sideways | -2089 | 1 | 100% | -20 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXBTCD-26MAY0817-T80999.99-20260512 | sideways | -8306 | 1 | 100% | -82 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27OCT-H0-20260512 | sideways | -1410 | 1 | 100% | -13 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXIPO-26-DISCORD-20260510 | sideways | -6200 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXLLM1-26MAY31-A-20260510 | sideways | -8500 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260507 | sideways | -4348 | 1 | 100% | -43 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNASDAQ100U-26MAY08H1600-T28199.99-20260507 | sideways | 1035 | 1 | 100% | 12 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNASDAQ100Y-26DEC31H1600-B24250-20260508 | sideways | -1507 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY10NYKPHI-NYK-20260507 | sideways | -5600 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY11DETCLE-DET-20260507 | sideways | -771 | 1 | 100% | -6 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260508 | sideways | -2764 | 1 | 100% | -27 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXTIME-26-ZOH-20260510 | sideways | -397 | 1 | 100% | -3 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXTOPARTIST-26B-DRA-20260507 | sideways | -1033 | 1 | 100% | -9 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNASDAQ100-26MAY08H1600-T28799.9900-20260508 | falling | -3966 | 1 | 100% | -39 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXSPOTIFYD-26MAY08-DRO-20260507 | falling | -474 | 1 | 100% | 39 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXHIGHCHI-26MAY07-B60.5-20260507 | falling | -8500 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY08NYKPHI-PHI-20260509 | falling | -467 | 1 | 100% | -2 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXINXU-26MAY08H1600-T7324.9999-20260508 | falling | -174 | 1 | 100% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY09DETCLE-DET-20260509 | falling | -265 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXRANKLISTGOOGLESEARCH-26DEC-ELO-20260509 | falling | -2764 | 1 | 100% | -27 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXHIGHNY-26MAY08-B64.5-20260508 | falling | -74 | 1 | 100% | 6 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXBTCD-26MAY0817-T80999.99-20260508 | falling | -1417 | 1 | 100% | -13 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXSPACEXCOUNT-26MAY-12-20260509 | falling | -1064 | 1 | 100% | -9 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXOSCARPIC-27-DIS-20260509 | falling | -1614 | 1 | 100% | -16 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNASDAQ100Y-26DEC31H1600-B24250-20260509 | falling | -1507 | 1 | 100% | -15 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXINXY-26DEC31H1600-B8300-20260509 | falling | -1246 | 1 | 100% | -12 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27MAR-C25-20260509 | falling | -1338 | 1 | 100% | -12 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY09OKCLAL-LAL-20260510 | falling | -228 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXTIME-26-ZOH-20260509 | falling | -1306 | 1 | 100% | -12 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27JUN-C25-20260509 | falling | -4128 | 1 | 100% | -41 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY08NYKPHI-PHI-20260508 | falling | -5100 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY10NYKPHI-NYK-20260508 | falling | -5600 | 0 | 0% | 0 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXTOPARTIST-26B-DRA-20260509 | falling | -650 | 1 | 100% | -5 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXNBAGAME-26MAY09DETCLE-DET-20260508 | falling | -867 | 1 | 100% | -1 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXCABOUT-26APR20-TGAB-20260507 | falling | 33 | 1 | 100% | 2 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXFEDDECISION-27OCT-H0-20260509 | falling | -2909 | 1 | 100% | -28 |  |
| bracket | targetPriceCents=60, stopPriceCents=30 | KXCABOUT-26APR20-TGAB-20260508 | falling | 633 | 1 | 100% | 8 |  |
