# Architecture

## Components
1. Chrome Extension (UI Layer)
2. Local Engine (Execution Core)
3. Kalshi API Client

## Flow
UI → Background Script → Local Engine → API → Response → UI

## Design Principles
- Local-first
- Deterministic execution
- Idempotent operations
- Fail-safe defaults
