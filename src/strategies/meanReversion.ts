import { Strategy, TradeSignal } from './base';
import { MarketSnapshot } from '../connectors/polymarket';

export class MeanReversionStrategy extends Strategy {
  name = 'meanReversion';
  generateSignals(snapshot: MarketSnapshot): TradeSignal[] {
    if (snapshot.yes.impliedProbability > 0.58) {
      return [
        {
          strategyName: this.name,
          marketId: snapshot.marketId,
          tokenId: snapshot.yes.tokenId,
          price: snapshot.yes.bestBid,
          size: 22,
          side: 'sell',
          confidence: 0.68,
          fairValue: 0.5,
          leg: 'YES',
          rationale: `Fade stretched YES curve back toward parity`,
          tags: ['mean-reversion', snapshot.marketType, snapshot.asset],
        },
      ];
    }
    return [];
  }
}
