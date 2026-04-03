import { MarketSnapshot } from '../connectors/polymarket';
import { RiskEngine } from '../risk/engine';
import { TradeSignal } from '../strategies/base';

export interface ExecutionLeg {
  leg: 'YES' | 'NO';
  tokenId: string;
  side: 'buy' | 'sell';
  price: number;
  size: number;
  notional: number;
}

export interface PairExecution {
  marketId: string;
  prompt: string;
  pairGroup: string;
  strategyName: string;
  combinedAsk: number;
  expectedEdge: number;
  size: number;
  totalNotional: number;
  status: 'SIMULATED' | 'ROUTED';
  rationale: string;
  legs: ExecutionLeg[];
}

export interface SkippedOpportunity {
  marketId: string;
  prompt: string;
  reason: string;
}

export interface CycleReport {
  scannedMarkets: number;
  eligibleMarkets: number;
  approvedMarkets: number;
  skipped: SkippedOpportunity[];
  executions: PairExecution[];
}

interface AutoTradingEngineOptions {
  mode: 'paper' | 'live' | 'backtest';
  dryRun: boolean;
  orderSize: number;
  cooldownSeconds: number;
  riskEngine: RiskEngine;
}

function round(value: number, decimals = 2): number {
  return Number(value.toFixed(decimals));
}

export class AutoTradingEngine {
  private readonly lastExecutionByPair = new Map<string, number>();

  constructor(private readonly options: AutoTradingEngineOptions) {}

  runCycle(
    snapshots: MarketSnapshot[],
    signalFactory: (snapshot: MarketSnapshot) => TradeSignal[]
  ): CycleReport {
    const skipped: SkippedOpportunity[] = [];
    const executions: PairExecution[] = [];
    const now = Date.now();
    let eligibleMarkets = 0;
    let approvedMarkets = 0;

    for (const snapshot of snapshots) {
      if (snapshot.status !== 'live' || snapshot.combinedAsk >= 1) {
        continue;
      }

      eligibleMarkets += 1;

      const signals = signalFactory(snapshot).filter(
        (signal) => signal.side === 'buy' && signal.tags.includes('paired-entry')
      );
      const yesSignal = signals.find((signal) => signal.leg === 'YES');
      const noSignal = signals.find((signal) => signal.leg === 'NO');

      if (!yesSignal || !noSignal) {
        skipped.push({
          marketId: snapshot.marketId,
          prompt: snapshot.prompt,
          reason: 'paired entry incomplete',
        });
        continue;
      }

      const cooldownActiveUntil =
        (this.lastExecutionByPair.get(snapshot.pairGroup) ?? 0) + this.options.cooldownSeconds * 1000;
      if (cooldownActiveUntil > now) {
        skipped.push({
          marketId: snapshot.marketId,
          prompt: snapshot.prompt,
          reason: `cooldown ${Math.ceil((cooldownActiveUntil - now) / 1000)}s remaining`,
        });
        continue;
      }

      const desiredSize = Math.max(1, this.options.orderSize || yesSignal.size || noSignal.size);
      const riskDecision = this.options.riskEngine.evaluate(desiredSize, snapshot.combinedAsk);
      if (!riskDecision.approved) {
        skipped.push({
          marketId: snapshot.marketId,
          prompt: snapshot.prompt,
          reason: riskDecision.reason ?? 'risk rejected pair',
        });
        continue;
      }

      const approvedSize = riskDecision.approvedSize;
      const legs: ExecutionLeg[] = [yesSignal, noSignal].map((signal) => ({
        leg: signal.leg,
        tokenId: signal.tokenId,
        side: signal.side,
        price: signal.price,
        size: approvedSize,
        notional: round(signal.price * approvedSize, 2),
      }));

      approvedMarkets += 1;
      this.lastExecutionByPair.set(snapshot.pairGroup, now);
      executions.push({
        marketId: snapshot.marketId,
        prompt: snapshot.prompt,
        pairGroup: snapshot.pairGroup,
        strategyName: yesSignal.strategyName,
        combinedAsk: snapshot.combinedAsk,
        expectedEdge: round(1 - snapshot.combinedAsk, 4),
        size: approvedSize,
        totalNotional: round(snapshot.combinedAsk * approvedSize, 2),
        status: this.options.mode === 'live' && !this.options.dryRun ? 'ROUTED' : 'SIMULATED',
        rationale: yesSignal.rationale,
        legs,
      });
    }

    return {
      scannedMarkets: snapshots.length,
      eligibleMarkets,
      approvedMarkets,
      skipped,
      executions,
    };
  }
}
