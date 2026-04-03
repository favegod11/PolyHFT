import { MarketSnapshot } from '../connectors/polymarket';
import { Strategy } from '../strategies/base';
import { log, logKeyValue, logSection } from '../utils/logger';

export class BacktestEngine {
  constructor(private strategies: Strategy[]) {}

  run(snapshots: MarketSnapshot[]): void {
    logSection('📈 Backtest Engine', 'iterating snapshots through the active strategy stack');
    logKeyValue('Snapshots', snapshots.length);
    logKeyValue('Strategies', this.strategies.length);
    log('info', 'Running backtest loop.');
    snapshots.forEach((snapshot) => {
      this.strategies.forEach((strategy) => {
        const signals = strategy.generateSignals(snapshot);
        if (signals.length > 0) {
          log('info', `${strategy.name} generated ${signals.length} signal(s) on ${snapshot.asset} ${snapshot.marketType}.`);
        }
      });
    });
  }
}
