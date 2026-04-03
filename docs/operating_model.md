# Operating Model

> [!WARNING]
> **This is not financial advice.** Trading involves substantial risk of loss. Only deploy capital you can afford to lose entirely. The strategies in this repository involve material market, liquidity, and execution risk.

## Deployment Philosophy

PolyHFT-Autotrading-V3 is designed for controlled, incremental deployment rather than immediate capital scaling. The default configuration is sized for paper trading and engineering validation. Live capital should only be introduced after venue behavior, wallet topology, allowance settings, and monitoring are independently verified.

## Pre-Trade Checklist

- Confirm the configured `condition_id` and `token_id` values map to currently active Polymarket markets.
- Validate the wallet signature type and proxy or funder address against the account structure in use.
- Confirm sufficient USDC and allowance state on Polygon before enabling live order submission.
- Run the strategy set in paper mode and compare expected versus observed signal rates.
- Inspect log rotation, dashboard output, and circuit-breaker behavior before trading any size.

## Intraday Controls

| Control | Purpose | Default stance |
| --- | --- | --- |
| Max gross exposure | Prevent overextension across correlated markets | Conservative |
| Max net exposure | Limit directional concentration | Conservative |
| Max market exposure | Prevent single-market concentration | Conservative |
| Max order notional | Avoid oversized child orders | Conservative |
| Max drawdown | Trigger kill-switch behavior under stress | Hard stop |
| Max daily loss | Contain same-session drift or execution error | Hard stop |

## Failure Modes Addressed

### Market Data Degradation

If streaming updates fail or produce sparse state transitions, the connector falls back to public polling. This prevents the strategy layer from trading on obviously stale timestamps.

### Execution Quality Deterioration

High slippage, poor fill ratios, or repeated order rejects should be treated as a risk event rather than an inconvenience. The correct response is to reduce size, widen assumptions, or halt the strategy until the source is understood.

### Model Drift

Backtests can overstate quality if market microstructure changes or if queue-position assumptions are too favorable. Forward paper trading is mandatory before live capital is scaled.

## Recommended Escalation Sequence

1. Paper trade with realistic market IDs and full monitoring.
2. Enable live trading with trivial notional and a single strategy.
3. Review fill quality and drawdown behavior over multiple sessions.
4. Increase participation gradually and only after execution assumptions hold up under live conditions.

## Reporting Standard

The operating standard for a serious deployment should include:

- Daily PnL and realized versus unrealized attribution.
- Rolling Sharpe, hit rate, and average holding period.
- Order acceptance, rejection, and cancellation ratios.
- Average slippage versus modeled slippage.
- Equity curve and drawdown chart snapshots retained per release.
