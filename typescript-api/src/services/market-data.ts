import { MarketDataTick, Candlestick1s, Candlestick15s } from '../models';
import { logger } from '../utils/logger';
import { apiConfig } from '../config';

export class MarketDataService {
  private activeTokens = new Map<string, MarketDataTick[]>();
  private candlesticks1s = new Map<string, Candlestick1s[]>();
  private candlesticks15s = new Map<string, Candlestick15s[]>();
  private isRunning = false;

  start(): void {
    if (this.isRunning) {
      logger.warn('Market data service is already running');
      return;
    }

    this.isRunning = true;
    this.startDataPolling();
  }

  stop(): void {
    this.isRunning = false;
  }

  addToken(mintAddress: string): void {
    this.activeTokens.set(mintAddress, []);
    logger.info(`Added token to market data tracking: ${mintAddress}`);
  }

  removeToken(mintAddress: string): void {
    this.activeTokens.delete(mintAddress);
    this.candlesticks1s.delete(mintAddress);
    this.candlesticks15s.delete(mintAddress);
    logger.info(`Removed token from market data tracking: ${mintAddress}`);
  }

  private async startDataPolling(): Promise<void> {
    logger.info('Starting market data polling');

    while (this.isRunning) {
      try {
        await this.pollAllTokens();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Poll every second
      } catch (error) {
        logger.error('Error in market data polling:', error);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds on error
      }
    }
  }

  private async pollAllTokens(): Promise<void> {
    const promises = Array.from(this.activeTokens.keys()).map(mintAddress => 
      this.fetchTokenData(mintAddress)
    );

    await Promise.allSettled(promises);
  }

  private async fetchTokenData(mintAddress: string): Promise<void> {
    try {
      const response = await fetch(
        `${apiConfig.jupiterUltra.baseUrl}/price/${mintAddress}`
      );

      if (!response.ok) {
        throw new Error(`Price API failed: ${response.statusText}`);
      }

      const priceData = await response.json();
      
      const tick: MarketDataTick = {
        time: new Date(),
        token_id: 0, // Will be set by database
        price: priceData.price,
        volume_24h: priceData.volume24h,
        market_cap: priceData.marketCap,
        buy_volume: priceData.buyVolume,
        sell_volume: priceData.sellVolume,
        trade_count: priceData.tradeCount,
      };

      // Store the tick
      const ticks = this.activeTokens.get(mintAddress) || [];
      ticks.push(tick);
      
      // Keep only last 60 seconds of data (for 1s candles)
      if (ticks.length > 60) {
        ticks.shift();
      }
      
      this.activeTokens.set(mintAddress, ticks);

      // Build 1-second candlestick
      this.buildCandlesticks(mintAddress);

    } catch (error) {
      logger.error(`Error fetching data for ${mintAddress}:`, error);
    }
  }

  private buildCandlesticks(mintAddress: string): void {
    const ticks = this.activeTokens.get(mintAddress) || [];
    
    if (ticks.length < 1) return;

    // Get current second
    const now = new Date();
    const currentSecond = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getSeconds());
    
    // Build 1-second candle
    const candle1s = this.buildCandleFromTicks(ticks, currentSecond, 1000);
    if (candle1s) {
      let candles1s = this.candlesticks1s.get(mintAddress) || [];
      candles1s.push(candle1s);
      
      // Keep only last 900 candles (15 minutes)
      if (candles1s.length > 900) {
        candles1s.shift();
      }
      
      this.candlesticks1s.set(mintAddress, candles1s);

      // Build 15-second candles from 1-second candles
      this.build15SecondCandles(mintAddress);
    }
  }

  private build15SecondCandles(mintAddress: string): void {
    const candles1s = this.candlesticks1s.get(mintAddress) || [];
    
    if (candles1s.length < 15) return;

    // Get current 15-second interval
    const now = new Date();
    const current15s = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      now.getMinutes(),
      Math.floor(now.getSeconds() / 15) * 15
    );

    // Aggregate last 15 1-second candles
    const startIndex = Math.max(0, candles1s.length - 15);
    const relevantCandles = candles1s.slice(startIndex);
    
    const candle15s = this.aggregateCandles(relevantCandles, current15s);
    if (candle15s) {
      let candles15s = this.candlesticks15s.get(mintAddress) || [];
      
      // Remove overlapping candles
      candles15s = candles15s.filter(c => 
        c.time.getTime() !== current15s.getTime()
      );
      
      candles15s.push(candle15s);
      
      // Keep only last 400 candles (100 minutes)
      if (candles15s.length > 400) {
        candles15s.shift();
      }
      
      this.candlesticks15s.set(mintAddress, candles15s);
    }
  }

  private buildCandleFromTicks(ticks: MarketDataTick[], time: Date, intervalMs: number): Candlestick1s | null {
    if (ticks.length === 0) return null;

    const relevantTicks = ticks.filter(tick => 
      tick.time.getTime() >= time.getTime() - intervalMs &&
      tick.time.getTime() <= time.getTime()
    );

    if (relevantTicks.length === 0) return null;

    const open = relevantTicks[0].price;
    const close = relevantTicks[relevantTicks.length - 1].price;
    const high = Math.max(...relevantTicks.map(t => t.price));
    const low = Math.min(...relevantTicks.map(t => t.price));
    const volume = relevantTicks.reduce((sum, t) => sum + (t.volume_24h || 0), 0);
    const tradeCount = relevantTicks.reduce((sum, t) => sum + (t.trade_count || 0), 0);

    return {
      time,
      token_id: 0, // Will be set by database
      open,
      high,
      low,
      close,
      volume,
      tradeCount,
    };
  }

  private aggregateCandles(candles: Candlestick1s[], time: Date): Candlestick15s | null {
    if (candles.length === 0) return null;

    const open = candles[0].open;
    const close = candles[candles.length - 1].close;
    const high = Math.max(...candles.map(c => c.high));
    const low = Math.min(...candles.map(c => c.low));
    const volume = candles.reduce((sum, c) => sum + c.volume, 0);
    const tradeCount = candles.reduce((sum, c) => sum + c.tradeCount, 0);

    return {
      time,
      token_id: 0, // Will be set by database
      open,
      high,
      low,
      close,
      volume,
      tradeCount,
    };
  }

  // Getters for the trading engine
  getLatestCandle1s(mintAddress: string): Candlestick1s | null {
    const candles = this.candlesticks1s.get(mintAddress) || [];
    return candles.length > 0 ? candles[candles.length - 1] : null;
  }

  getLatestCandle15s(mintAddress: string): Candlestick15s | null {
    const candles = this.candlesticks15s.get(mintAddress) || [];
    return candles.length > 0 ? candles[candles.length - 1] : null;
  }

  getCandlesticks1s(mintAddress: string): Candlestick1s[] {
    return this.candlesticks1s.get(mintAddress) || [];
  }

  getCandlesticks15s(mintAddress: string): Candlestick15s[] {
    return this.candlesticks15s.get(mintAddress) || [];
  }

  getCurrentMarketCap(mintAddress: string): number | null {
    const ticks = this.activeTokens.get(mintAddress) || [];
    if (ticks.length === 0) return null;
    
    const latestTick = ticks[ticks.length - 1];
    return latestTick.market_cap || null;
  }
}