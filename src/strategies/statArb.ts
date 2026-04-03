import { Strategy, TradeSignal } from './base';
import { MarketSnapshot } from '../connectors/polymarket';

export class StatisticalArbitrageStrategy extends Strategy {
  name = 'curveArb';
  generateSignals(snapshot: MarketSnapshot): TradeSignal[] {
    const fair = 1 - snapshot.yes.impliedProbability;
    const mispricing = snapshot.no.bestAsk - fair;
    if (Math.abs(mispricing) < 0.02) return [];
    return [
      {
        strategyName: this.name,
        marketId: snapshot.marketId,
        tokenId: mispricing > 0 ? snapshot.no.tokenId : snapshot.yes.tokenId,
        price: mispricing > 0 ? snapshot.no.bestBid : snapshot.yes.bestAsk,
        size: 15,
        side: mispricing > 0 ? 'sell' : 'buy',
        confidence: 0.65,
        fairValue: 0.5,
        leg: mispricing > 0 ? 'NO' : 'YES',
        rationale: `Binary curve dislocation on ${snapshot.asset} ${snapshot.marketType}`,
        tags: ['curve', 'binary-identity', snapshot.asset],
      },
    ];
  }
}
