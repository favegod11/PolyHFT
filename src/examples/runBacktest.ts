import run from '../index';
import { log } from '../utils/logger';

export default async function backtest(): Promise<void> {
  log('info', 'Launching research backtest.', 'execution mode=backtest');
  await run();
}

if (require.main === module) {
  backtest();
}
