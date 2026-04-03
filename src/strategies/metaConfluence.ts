import { Strategy, TradeSignal } from './base';
import { MarketSnapshot } from '../connectors/polymarket';

const jargon = [
  'Support and Resistance Flip', 'BOS', 'CHoCH', 'MSS', 'Order Block', 'FVG', 'Liquidity Sweep',
  'Stop Hunt', 'Wyckoff Accumulation', 'VWAP', 'Anchored VWAP', 'RSI', 'MACD', 'Stochastic',
  'Bollinger', 'ATR', 'OBV', 'Volume Profile', 'CVD', 'Funding Rate', 'Open Interest',
];

export class MetaConfluenceStrategy extends Strategy {
  name = 'metaConfluence';
  generateSignals(snapshot: MarketSnapshot): TradeSignal[] {
    const indicatorBlend =
      snapshot.indicators.supportResistanceFlip * 0.08 +
      snapshot.indicators.bos * 0.08 +
      snapshot.indicators.choch * 0.08 +
      snapshot.indicators.mss * 0.08 +
      snapshot.indicators.wyckoffAccumulation * 0.08 +
      (snapshot.indicators.rsi / 100) * 0.1 +
      (snapshot.indicators.stochastic / 100) * 0.08 +
      Math.min(1, snapshot.indicators.liquiditySweep / 100) * 0.08 +
      Math.min(1, snapshot.indicators.stopHunt / 100) * 0.08 +
      Math.min(1, snapshot.indicators.cvd / 1000) * 0.08 +
      Math.min(1, snapshot.indicators.openInterest / Math.max(1, snapshot.referencePrice * 1000000)) * 0.08;
    const score = Number(Math.min(0.97, Math.max(0.3, indicatorBlend)).toFixed(2));
    if (score < 0.55) return [];
    const leg = snapshot.orderImbalance > 0 ? 'YES' : 'NO';
    const price = leg === 'YES' ? snapshot.yes.bestAsk : snapshot.no.bestAsk;
    return [
      {
        strategyName: this.name,
        marketId: snapshot.marketId,
        tokenId: leg === 'YES' ? snapshot.yes.tokenId : snapshot.no.tokenId,
        price,
        size: 25,
        side: 'buy',
        confidence: score,
        fairValue: snapshot.midpoint,
        leg,
        rationale: `Confluence stack ${jargon.slice(0, 8).join(', ')} on ${snapshot.asset}`,
        tags: ['meta-confluence', ...jargon.slice(0, 6)],
      },
    ];
  }
}
