import run from '../index';
import { log } from '../utils/logger';

export default async function paper(): Promise<void> {
  log('info', 'Launching paper trading session.', 'execution mode=paper');
  await run();
}

if (require.main === module) {
  paper();
}
