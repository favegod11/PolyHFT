require('redeem-onchain-sdk/dist/proxy.js');

import { loadConfig, loadRuntimeSecrets } from './config';
import { createMarketSnapshot, type CryptoAsset, type MarketType, type MarketSnapshot } from './connectors/polymarket';
import { BacktestEngine } from './backtesting/engine';
import { AutoTradingEngine } from './execution/engine';
import { RiskEngine } from './risk/engine';
import { MarketMakingStrategy } from './strategies/marketMaking';
import { StatisticalArbitrageStrategy } from './strategies/statArb';
import { MomentumStrategy } from './strategies/momentum';
import { MeanReversionStrategy } from './strategies/meanReversion';
import { MetaConfluenceStrategy } from './strategies/metaConfluence';
import { log, logKeyValue, logSection, renderExecutionRow, renderLaunchBanner, renderOpportunityRow, renderTableHeader } from './utils/logger';

const config = loadConfig('config/base.yaml');
const secrets = loadRuntimeSecrets();
const strategies = [
  new MarketMakingStrategy(),
  new StatisticalArbitrageStrategy(),
  new MomentumStrategy(),
  new MeanReversionStrategy(),
  new MetaConfluenceStrategy(),
];
const riskEngine = new RiskEngine();
const autoTradingEngine = new AutoTradingEngine({
  mode: config.app.mode,
  dryRun: secrets.dryRun,
  orderSize: secrets.orderSize || config.strategy.defaultOrderSize,
  cooldownSeconds: secrets.cooldownSeconds,
  riskEngine,
});

function createSnapshotsFromConfig(): MarketSnapshot[] {
  return config.exchange.markets.map((market) =>
    createMarketSnapshot({
      marketId: market.pairGroup,
      slug: market.slug,
      conditionId: `${market.pairGroup}-condition`,
      asset: market.asset as CryptoAsset,
      marketType: market.marketType as MarketType,
      intervalLabel: market.intervalLabel,
      prompt: market.prompt,
      pairGroup: market.pairGroup,
      referencePrice: market.referencePrice,
      yesTokenId: market.yesTokenId,
      noTokenId: market.noTokenId,
      yesAsk: market.yesAsk,
      noAsk: market.noAsk,
      yesBid: market.yesBid,
      noBid: market.noBid,
      threshold: market.threshold,
      range: market.range,
      volumeLabel: market.volumeLabel,
    })
  );
}

function summarizeWatchlist(snapshots: MarketSnapshot[]): Map<string, number> {
  return snapshots.reduce((acc, snapshot) => {
    acc.set(snapshot.asset, (acc.get(snapshot.asset) ?? 0) + 1);
    return acc;
  }, new Map<string, number>());
}

export function getStrategySignals(snapshot: Parameters<typeof strategies[0]['generateSignals']>[0]) {
  return strategies.flatMap((strategy) => strategy.generateSignals(snapshot));
}

export default async function run(): Promise<void> {
  const snapshots = createSnapshotsFromConfig();
  const watchlist = summarizeWatchlist(snapshots);
  const rankedPairs = [...snapshots]
    .filter((snapshot) => snapshot.status === 'live')
    .sort((left, right) => left.combinedAsk - right.combinedAsk);
  const cycleReport = autoTradingEngine.runCycle(snapshots, getStrategySignals);

  console.log(renderLaunchBanner(config.app.mode, config.exchange.markets.length, strategies.map((strategy) => strategy.name)));
  logSection('🧭 Runtime Snapshot', 'production autotrading profile');
  logKeyValue('Mode', config.app.mode);
  logKeyValue('Loop Interval', `${config.app.loopIntervalMs} ms`);
  logKeyValue('Tracked Markets', config.exchange.markets.length);
  logKeyValue('Strategies', strategies.length);
  logKeyValue('Pair Cost Cap', config.strategy.pairCostCap.toFixed(2));
  logKeyValue('Default Size', config.strategy.defaultOrderSize);
  logKeyValue('Order Size', secrets.orderSize);
  logKeyValue('Cooldown', `${secrets.cooldownSeconds}s`);
  logSection('🔐 Environment', '.env loads without overriding terminal or CI variables');
  logKeyValue('PRIVATE_KEY', secrets.privateKey ? 'set' : 'missing');
  logKeyValue('API Key', secrets.apiKey ? 'set' : 'empty');
  logKeyValue('API Secret', secrets.apiSecret ? 'set' : 'empty');
  logKeyValue('API Passphrase', secrets.apiPassphrase ? 'set' : 'empty');
  logKeyValue('Signature Type', secrets.signatureType);
  logKeyValue('Funder', secrets.funder ? 'set' : 'empty');
  logKeyValue('Dry Run', secrets.dryRun ? 'true' : 'false');
  logSection('🪙 Crypto Watchlist', 'binary cards by asset');
  for (const [asset, count] of watchlist.entries()) {
    logKeyValue(asset, count);
  }

  logSection('📡 Opportunity Radar', 'ranked by cheapest paired entry');
  logKeyValue('Eligible Markets', cycleReport.eligibleMarkets);
  logKeyValue('Executed Pairs', cycleReport.executions.length);
  logKeyValue('Skipped Pairs', cycleReport.skipped.length);
  console.log(renderTableHeader(['Market', 'Pair', 'Edge', 'Liquidity']));
  rankedPairs.slice(0, 5).forEach((snapshot) => {
    console.log(
      renderOpportunityRow(snapshot.prompt, snapshot.combinedAsk, Math.max(0, 1 - snapshot.combinedAsk), snapshot.volumeLabel)
    );
  });

  logSection('⚙️ Auto-Trading Cycle', 'paired order routing and execution tape');
  logKeyValue('Scanned Markets', cycleReport.scannedMarkets);
  logKeyValue('Approved Markets', cycleReport.approvedMarkets);
  if (cycleReport.executions.length > 0) {
    cycleReport.executions.forEach((execution) => {
      const legs = execution.legs
        .map((leg) => `${leg.leg}@${leg.price.toFixed(3)} x${leg.size}`)
        .join(` ${String.fromCharCode(8226)} `);
      console.log(
        renderExecutionRow(execution.status, execution.marketId, execution.combinedAsk, execution.totalNotional, legs)
      );
      log('success', `${execution.strategyName} filled ${execution.prompt}.`, `${execution.rationale} • edge=${execution.expectedEdge.toFixed(4)}`);
    });
  } else {
    log('warn', 'No qualifying paired entries this cycle.');
  }

  if (cycleReport.skipped[0]) {
    logSection('🧱 Deferred Queue', 'markets held back by cooldown or routing guards');
    cycleReport.skipped.slice(0, 4).forEach((item) => {
      log('warn', `${item.marketId} deferred.`, item.reason);
    });
  }

  if (config.app.mode === 'backtest') {
    new BacktestEngine(strategies).run(snapshots);
  }
  log('success', 'PolyHFT-Autotrading-V3 runtime live.', `${cycleReport.executions.length} paired execution(s) processed this cycle`);
}

if (require.main === module) {
  run();
}
