import { Strategy, TradeSignal } from './base';
import { MarketSnapshot } from '../connectors/polymarket';

export class MarketMakingStrategy extends Strategy {
  name = 'dualBuyParity';

  generateSignals(snapshot: MarketSnapshot): TradeSignal[] {
    if (snapshot.combinedAsk >= 1 || snapshot.status !== 'live') return [];
    const fair = snapshot.fairValue ?? 0.5;
    const size = 20;
    return [
      {
        strategyName: this.name,
        marketId: snapshot.marketId,
        tokenId: snapshot.yes.tokenId,
        price: snapshot.yes.bestAsk,
        size,
        side: 'buy',
        confidence: Number((1 - snapshot.combinedAsk + 0.5).toFixed(2)),
        fairValue: fair,
        leg: 'YES',
        rationale: `Buy both sides when total ask is ${snapshot.combinedAsk.toFixed(3)} < 1.00`,
        tags: ['paired-entry', snapshot.marketType, snapshot.asset],
      },
      {
        strategyName: this.name,
        marketId: snapshot.marketId,
        tokenId: snapshot.no.tokenId,
        price: snapshot.no.bestAsk,
        size,
        side: 'buy',
        confidence: Number((1 - snapshot.combinedAsk + 0.5).toFixed(2)),
        fairValue: fair,
        leg: 'NO',
        rationale: `Paired hedge leg for ${snapshot.prompt}`,
        tags: ['paired-entry', snapshot.marketType, snapshot.asset],
      },
    ];
  }
}
