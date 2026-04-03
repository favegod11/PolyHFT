import { Strategy, TradeSignal } from './base';
import { MarketSnapshot } from '../connectors/polymarket';

export class MomentumStrategy extends Strategy {
  name = 'momentum';
  generateSignals(snapshot: MarketSnapshot): TradeSignal[] {
    if (snapshot.orderImbalance > 0.2) {
      return [
        {
          strategyName: this.name,
          marketId: snapshot.marketId,
          tokenId: snapshot.yes.tokenId,
          price: snapshot.yes.bestAsk,
          size: 18,
          side: 'buy',
          confidence: 0.7,
          fairValue: snapshot.midpoint,
          leg: 'YES',
          rationale: `${snapshot.asset} upside pressure on ${snapshot.intervalLabel} card`,
          tags: ['momentum', snapshot.intervalLabel, snapshot.asset],
        },
      ];
    }
    return [];
  }
}
