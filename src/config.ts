import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { parse } from 'yaml';

loadEnv({ path: resolve(process.cwd(), '.env'), override: false });

export interface RuntimeSecrets {
  privateKey?: string;
  apiKey?: string;
  apiSecret?: string;
  apiPassphrase?: string;
  signatureType: '0' | '1' | '2';
  funder?: string;
  targetPairCost: number;
  orderSize: number;
  dryRun: boolean;
  cooldownSeconds: number;
}

export interface RuntimeConfig {
  app: {
    mode: 'paper' | 'live' | 'backtest';
    logLevel: 'info' | 'debug' | 'warn' | 'error';
    loopIntervalMs: number;
  };
  strategy: {
    pairCostCap: number;
    defaultOrderSize: number;
  };
  exchange: {
    markets: Array<{
      asset: string;
      slug: string;
      marketType: string;
      intervalLabel: string;
      prompt: string;
      pairGroup: string;
      referencePrice: number;
      threshold?: number;
      range?: { low?: number; high?: number };
      yesTokenId: string;
      noTokenId: string;
      yesAsk: number;
      noAsk: number;
      yesBid: number;
      noBid: number;
      volumeLabel?: string;
    }>;
  };
}

let cached: RuntimeConfig | null = null;

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (typeof value !== 'string') {
    return fallback;
  }
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function loadRuntimeSecrets(): RuntimeSecrets {
  return {
    privateKey: process.env.PRIVATE_KEY ?? process.env.POLYMARKET_PRIVATE_KEY ?? process.env.POLYHFT_PRIVATE_KEY,
    apiKey: process.env.POLYMARKET_API_KEY,
    apiSecret: process.env.POLYMARKET_API_SECRET,
    apiPassphrase: process.env.POLYMARKET_API_PASSPHRASE,
    signatureType: (process.env.POLYMARKET_SIGNATURE_TYPE as RuntimeSecrets['signatureType']) ?? '0',
    funder: process.env.POLYMARKET_FUNDER,
    targetPairCost: parseNumber(process.env.TARGET_PAIR_COST, 0.98),
    orderSize: parseNumber(process.env.ORDER_SIZE, 25),
    dryRun: parseBoolean(process.env.DRY_RUN, true),
    cooldownSeconds: parseNumber(process.env.COOLDOWN_SECONDS, 10),
  };
}

export function loadConfig(path: string): RuntimeConfig {
  if (cached) {
    return cached;
  }
  const configText = readFileSync(resolve(process.cwd(), path), 'utf8');
  const parsed = parse(configText) as Record<string, unknown>;
  const app = {
    app: { mode: 'paper', logLevel: 'info', loopIntervalMs: 250 },
    strategy: { pairCostCap: 0.98, defaultOrderSize: 25 },
  } as RuntimeConfig;
  if (parsed.app && typeof parsed.app === 'object') {
    const parsedApp = parsed.app as Record<string, unknown>;
    Object.assign(app.app, {
      mode: parsedApp.mode ?? app.app.mode,
      logLevel: parsedApp.log_level ?? parsedApp.logLevel ?? app.app.logLevel,
      loopIntervalMs: parsedApp.loop_interval_ms ?? parsedApp.loopIntervalMs ?? app.app.loopIntervalMs,
    });
  }
  if (parsed.strategy && typeof parsed.strategy === 'object') {
    const parsedStrategy = parsed.strategy as Record<string, unknown>;
    Object.assign(app.strategy, {
      pairCostCap: parsedStrategy.pair_cost_cap ?? parsedStrategy.pairCostCap ?? app.strategy.pairCostCap,
      defaultOrderSize: parsedStrategy.default_order_size ?? parsedStrategy.defaultOrderSize ?? app.strategy.defaultOrderSize,
    });
  }
  if (parsed.exchange && typeof parsed.exchange === 'object') {
    app.exchange = { markets: [] } as RuntimeConfig['exchange'];
    if (Array.isArray((parsed.exchange as Record<string, any>).markets)) {
      app.exchange.markets = (parsed.exchange as Record<string, any>).markets.map((m: any) => ({
        asset: m.asset ?? 'BTC',
        slug: m.slug ?? 'unknown',
        marketType: m.market_type ?? m.marketType ?? 'up_down',
        intervalLabel: m.interval_label ?? m.intervalLabel ?? '5 min',
        prompt: m.prompt ?? 'Unknown crypto market',
        pairGroup: m.pair_group ?? m.pairGroup ?? m.slug ?? 'unknown',
        referencePrice: m.reference_price ?? m.referencePrice ?? 0,
        threshold: m.threshold,
        range: m.range,
        yesTokenId: m.yes_token_id ?? m.yesTokenId ?? `${m.slug ?? 'unknown'}-yes`,
        noTokenId: m.no_token_id ?? m.noTokenId ?? `${m.slug ?? 'unknown'}-no`,
        yesAsk: m.yes_ask ?? m.yesAsk ?? 0.5,
        noAsk: m.no_ask ?? m.noAsk ?? 0.5,
        yesBid: m.yes_bid ?? m.yesBid ?? Math.max(0, (m.yes_ask ?? m.yesAsk ?? 0.5) - 0.02),
        noBid: m.no_bid ?? m.noBid ?? Math.max(0, (m.no_ask ?? m.noAsk ?? 0.5) - 0.02),
        volumeLabel: m.volume_label ?? m.volumeLabel,
      }));
    }
  }
  cached = app;
  return app;
}
