import { MarketSnapshot } from '../connectors/polymarket';

export interface TradeSignal {
  strategyName: string;
  marketId: string;
  tokenId: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
  confidence: number;
  fairValue: number;
  leg: 'YES' | 'NO';
  rationale: string;
  tags: string[];
}

export abstract class Strategy {
  abstract name: string;
  abstract generateSignals(snapshot: MarketSnapshot): TradeSignal[];
}
