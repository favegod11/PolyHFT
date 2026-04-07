# PolyHFT-Autotrading-V3

**A polished TypeScript autotrading bot for Polymarket-style YES/NO, Above/Below, Hit Price, and Range markets.**


PolyHFT-Autotrading-V3 boots into a full operator console, ranks active opportunities, risk-checks every paired entry, and routes trades through a unified execution cycle with paper and live-ready modes.

![PolyHFT-Autotrading-V3 Terminal Preview](docs/assets/terminal-profit-live.svg)

## What It Does

- Trades complementary YES/NO structures across short-horizon crypto event markets.
- Generates signals from a multi-strategy stack: `dualBuyParity`, `curveArb`, `momentum`, `meanReversion`, and `metaConfluence`.
- Runs a full execution cycle with risk approval, cooldown enforcement, and trade tape output.
- Supports `paper`, `live`, and `backtest` operating modes from the same TypeScript runtime.
- Ships with a curated crypto watchlist covering BTC, ETH, SOL, XRP, DOGE, and BNB.

## Quick Start

```bash
cp .env.example .env
```

At minimum, set your private key in `.env`:

```dotenv
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
DRY_RUN=true
ORDER_SIZE=25
COOLDOWN_SECONDS=10
```

```bash
npm install
npm run build
npm start
```

## Runtime Modes

- `npm start` boots the main autotrading runtime.
- `npm run paper` launches the operator flow in paper mode.
- `npm run backtest` replays the configured market universe through the strategy stack.

The runtime reads market definitions from `config/base.yaml`, hydrates normalized market snapshots, evaluates the active strategy ensemble, and emits a structured execution report to the terminal.

## Environment

| Variable | Purpose | Default |
| --- | --- | --- |
| `PRIVATE_KEY` | Wallet private key for authenticated trading | unset |
| `POLYMARKET_API_KEY` | API key for authenticated venue access | unset |
| `POLYMARKET_API_SECRET` | API secret | unset |
| `POLYMARKET_API_PASSPHRASE` | API passphrase | unset |
| `POLYMARKET_SIGNATURE_TYPE` | Signature mode | `0` |
| `POLYMARKET_FUNDER` | Optional proxy or funder address | unset |
| `TARGET_PAIR_COST` | Runtime target for pair selection | `0.98` |
| `ORDER_SIZE` | Units per leg | `25` |
| `DRY_RUN` | Paper execution when `true` | `true` |
| `COOLDOWN_SECONDS` | Re-entry cooldown per pair group | `10` |

## Configuration Surface

The default runtime profile lives in `config/base.yaml`.

- `app` controls mode, cadence, and console behavior.
- `strategy` controls entry sizing and pair-cost targeting.
- `exchange.markets` defines the active market universe and token IDs.
- `risk` defines notional and portfolio guardrails.
- `backtesting` controls replay assumptions.
- `monitoring` toggles dashboard and heartbeat behavior.

Example market definition:

```yaml
- asset: BTC
  slug: bitcoin-up-or-down-5-min
  market_type: up_down
  interval_label: 5 min
  prompt: Bitcoin Up or Down - 5 min
  pair_group: btc-up-down-5m
  reference_price: 84250
  yes_token_id: btc-up-5m
  no_token_id: btc-down-5m
  yes_ask: 0.51
  no_ask: 0.45
  yes_bid: 0.50
  no_bid: 0.44
  volume_label: "$142K Vol."
```

## Execution Stack

- `src/index.ts` orchestrates boot, market hydration, ranking, and execution reporting.
- `src/execution/engine.ts` converts approved paired entries into grouped YES/NO executions with cooldown tracking.
- `src/risk/engine.ts` gates order flow before routing.
- `src/connectors/polymarket.ts` normalizes market state into a consistent trading snapshot.
- `src/utils/logger.ts` renders the operator console and execution tape.

## Terminal Experience

When the bot finds tradeable opportunities, the console looks like this:

```text
╭────────────────────────────────────────────────────────────────────╮
│ ✦ PolyHFT-Autotrading-V3 Command Deck                             │
│ paired-execution runtime • live parity scanner • low-latency console │
│ MODE paper • MARKETS 9 • STRATEGIES 5                             │
│ Stack: dualBuyParity, curveArb, momentum, meanReversion, metaConfluence │
╰────────────────────────────────────────────────────────────────────╯
────────────────────────────────────────────────────────────────
📡 Opportunity Radar ranked by cheapest paired entry
  Eligible Markets   │ 9
  Executed Pairs     │ 9
  Skipped Pairs      │ 0
  Market                           │  Pair │    Edge │  Liquidity
  Solana Up or Down - 15 min       │ 0.950 │   5.00% │  $91K Vol.
  Dogecoin Up or Down - 15 min     │ 0.950 │   5.00% │  $18K Vol.
  Bitcoin Up or Down - 5 min       │ 0.960 │   4.00% │ $142K Vol.
────────────────────────────────────────────────────────────────
⚙️ Auto-Trading Cycle paired order routing and execution tape
  Scanned Markets    │ 9
  Approved Markets   │ 9
  SIMULATED btc-up-down-5m       │ 0.960 │   $24.00 │ YES@0.510 x25 • NO@0.450 x25
  SIMULATED sol-up-down-15m      │ 0.950 │   $23.75 │ YES@0.430 x25 • NO@0.520 x25
2026-04-03T10:56:25.730Z ✓ SUCCESS PolyHFT-Autotrading-V3 runtime live. 9 paired execution(s) processed this cycle
```

## Project Layout

```text
src/
  backtesting/        Replay engine
  connectors/         Market adapters and normalized snapshots
  execution/          Autotrading router and grouped pair execution
  monitoring/         Dashboard hooks
  risk/               Order approval gates
  strategies/         Alpha modules and paired-entry generators
  utils/              Terminal rendering and logging
config/
  base.yaml           Runtime profile and market universe
  paper.yaml          Paper overrides
docs/
  architecture.md     System design
  operating_model.md  Deployment controls
```

## Notes

- The default market set is config-driven, which makes it easy to swap token IDs, prices, and market groups without changing code.
- `redeem-onchain-sdk` is loaded through its proxy entrypoint during runtime boot.
- The terminal preview asset is stored in `docs/assets/terminal-preview.svg`.

## Disclaimer

v. 0.1.25.2026-04-05T14:04:55.674Z
