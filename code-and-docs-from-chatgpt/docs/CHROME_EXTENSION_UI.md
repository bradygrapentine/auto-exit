# Chrome Extension UI

The extension injects a floating control panel on Kalshi pages.

Controls:

- Market ticker
- Held side: YES/NO
- Position size
- Chunk size
- Min level size
- Tail sweep threshold
- Dry-run selector
- Mild adaptive chunking toggle
- Preview / Start / Stop buttons

V1 extension behavior:

- checks local engine health
- requests dry-run preview
- starts local engine loop
- polls local engine status
- sends stop request

The extension is complete enough to load locally, but engine execution should still be validated in dry-run mode first.
