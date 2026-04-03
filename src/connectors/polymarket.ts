export type CryptoAsset = 'BTC' | 'ETH' | 'SOL' | 'XRP' | 'DOGE' | 'BNB';
export type MarketType = 'up_down' | 'above_below' | 'hit_price' | 'price_range';
export type MarketStatus = 'live' | 'prelive' | 'resolved';

export interface MarketLeg {
  label: 'YES' | 'NO';
  tokenId: string;
  bestBid: number;
  bestAsk: number;
  impliedProbability: number;
  lastTrade?: number;
}

export interface IndicatorState {
  supportResistanceFlip: number;
  bos: number;
  choch: number;
  mss: number;
  orderBlocks: number;
  fvg: number;
  liquiditySweep: number;
  stopHunt: number;
  wyckoffAccumulation: number;
  vwap: number;
  anchoredVwap: number;
  rsi: number;
  macd: number;
  stochastic: number;
  bollingerStretch: number;
  atr: number;
  obv: number;
  volumeProfile: number;
  cvd: number;
  fundingRate: number;
  openInterest: number;
}

export interface MarketSnapshot {
  marketId: string;
  slug: string;
  conditionId: string;
  asset: CryptoAsset;
  marketType: MarketType;
  intervalLabel: string;
  prompt: string;
  status: MarketStatus;
  pairGroup: string;
  referencePrice: number;
  threshold?: number;
  range?: { low?: number; high?: number };
  volumeLabel?: string;
  yes: MarketLeg;
  no: MarketLeg;
  midpoint: number;
  combinedAsk: number;
  combinedBid: number;
  orderImbalance: number;
  fairValue?: number;
  indicators: IndicatorState;
  metadata: Record<string, unknown>;
}

function clampProbability(value: number): number {
  return Number(Math.min(0.999, Math.max(0.001, value)).toFixed(4));
}

export function createIndicatorState(referencePrice: number, midpoint: number, imbalance: number): IndicatorState {
  const centered = midpoint - 0.5;
  const amplitude = Math.abs(centered) + Math.abs(imbalance);
  return {
    supportResistanceFlip: Number((0.45 + centered * 0.6).toFixed(4)),
    bos: Number((0.4 + imbalance * 0.8).toFixed(4)),
    choch: Number((0.35 + amplitude * 0.5).toFixed(4)),
    mss: Number((0.3 + amplitude * 0.7).toFixed(4)),
    orderBlocks: Number((referencePrice * 0.015).toFixed(4)),
    fvg: Number((Math.abs(centered) * 100).toFixed(4)),
    liquiditySweep: Number((Math.abs(imbalance) * 100).toFixed(4)),
    stopHunt: Number((Math.abs(imbalance) * 80).toFixed(4)),
    wyckoffAccumulation: Number((0.5 - centered * 0.5).toFixed(4)),
    vwap: Number(referencePrice.toFixed(2)),
    anchoredVwap: Number((referencePrice * (1 + centered * 0.02)).toFixed(2)),
    rsi: Number((50 + centered * 100).toFixed(2)),
    macd: Number((centered * 12).toFixed(4)),
    stochastic: Number((50 + imbalance * 100).toFixed(2)),
    bollingerStretch: Number((amplitude * 10).toFixed(4)),
    atr: Number((referencePrice * 0.012).toFixed(4)),
    obv: Number((imbalance * 100000).toFixed(0)),
    volumeProfile: Number((midpoint * 100).toFixed(2)),
    cvd: Number((imbalance * 1000).toFixed(2)),
    fundingRate: Number((centered * 0.01).toFixed(5)),
    openInterest: Number((referencePrice * 1000000).toFixed(0)),
  };
}

export function createMarketSnapshot(input: {
  marketId: string;
  slug: string;
  conditionId: string;
  asset: CryptoAsset;
  marketType: MarketType;
  intervalLabel: string;
  prompt: string;
  pairGroup: string;
  referencePrice: number;
  yesTokenId: string;
  noTokenId: string;
  yesAsk: number;
  noAsk: number;
  yesBid?: number;
  noBid?: number;
  threshold?: number;
  range?: { low?: number; high?: number };
  volumeLabel?: string;
  status?: MarketStatus;
}): MarketSnapshot {
  const yesMid = input.yesBid ?? Math.max(0.001, input.yesAsk - 0.01);
  const noMid = input.noBid ?? Math.max(0.001, input.noAsk - 0.01);
  const midpoint = (input.yesAsk + (1 - input.noAsk)) / 2;
  const orderImbalance = (input.yesAsk - input.noAsk) / Math.max(0.01, input.yesAsk + input.noAsk);
  const indicators = createIndicatorState(input.referencePrice, midpoint, orderImbalance);

  return {
    marketId: input.marketId,
    slug: input.slug,
    conditionId: input.conditionId,
    asset: input.asset,
    marketType: input.marketType,
    intervalLabel: input.intervalLabel,
    prompt: input.prompt,
    status: input.status ?? 'live',
    pairGroup: input.pairGroup,
    referencePrice: input.referencePrice,
    threshold: input.threshold,
    range: input.range,
    volumeLabel: input.volumeLabel,
    yes: {
      label: 'YES',
      tokenId: input.yesTokenId,
      bestBid: Number(yesMid.toFixed(3)),
      bestAsk: Number(input.yesAsk.toFixed(3)),
      impliedProbability: clampProbability(input.yesAsk),
      lastTrade: Number(((yesMid + input.yesAsk) / 2).toFixed(3)),
    },
    no: {
      label: 'NO',
      tokenId: input.noTokenId,
      bestBid: Number(noMid.toFixed(3)),
      bestAsk: Number(input.noAsk.toFixed(3)),
      impliedProbability: clampProbability(input.noAsk),
      lastTrade: Number(((noMid + input.noAsk) / 2).toFixed(3)),
    },
    midpoint: Number(midpoint.toFixed(4)),
    combinedAsk: Number((input.yesAsk + input.noAsk).toFixed(4)),
    combinedBid: Number(((input.yesBid ?? yesMid) + (input.noBid ?? noMid)).toFixed(4)),
    orderImbalance: Number(orderImbalance.toFixed(4)),
    fairValue: 0.5,
    indicators,
    metadata: {},
  };
}

export class PolymarketConnector {
  async connect(): Promise<void> {
    // stub: would initialize WebSocket clients, authentication, market discovery, and pair-state hydration
  }
}
