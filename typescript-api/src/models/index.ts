export interface Token {
  id: number;
  mint_address: string;
  name?: string;
  symbol?: string;
  description?: string;
  bonding_curve_cap?: number;
  created_at: Date;
  updated_at: Date;
  last_seen?: Date;
  is_active: boolean;
  risk_score?: number;
  organic_score?: number;
  scam_detected: boolean;
  liquidity_verified: boolean;
}

export interface MarketDataTick {
  time: Date;
  token_id: number;
  price: number;
  volume_24h?: number;
  market_cap?: number;
  buy_volume?: number;
  sell_volume?: number;
  trade_count?: number;
}

export interface Candlestick1s {
  time: Date;
  token_id: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trade_count: number;
}

export interface Candlestick15s {
  time: Date;
  token_id: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trade_count: number;
}

export interface TradingSignal {
  id: number;
  token_id: number;
  signal_type: 'BUY' | 'SELL_PARTIAL' | 'SELL_FULL' | 'STOP_LOSS';
  signal_strength?: number;
  entry_price?: number;
  target_price?: number;
  stop_loss?: number;
  fibonacci_level?: number;
  generated_at: Date;
  is_executed: boolean;
  executed_at?: Date;
  reason?: string;
}

export interface Position {
  id: number;
  token_id: number;
  signal_id?: number;
  trade_type: 'LONG' | 'SHORT';
  entry_price: number;
  entry_size: number;
  current_price?: number;
  current_size: number;
  entry_timestamp: Date;
  exit_timestamp?: Date;
  status: 'NONE' | 'OPEN' | 'CLOSED' | 'CANCELLED';
  realized_pnl?: number;
  unrealized_pnl?: number;
  trailing_stop_price?: number;
  hard_stop_loss?: number;
  fibonacci_target?: number;
}

export interface Alert {
  id: number;
  token_id?: number;
  alert_type: 'TOKEN_DISCOVERED' | 'RISK_ALERT' | 'TRADE_EXECUTED' | 'EMERGENCY_STOP' | 'SIGNAL_GENERATED';
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  created_at: Date;
  is_read: boolean;
}

export interface TradingContext {
  token_id: number;
  mint_address: string;
  current_market_cap: number;
  entry_price?: number;
  current_price: number;
  position_status: 'NONE' | 'OPEN' | 'CLOSED' | 'CANCELLED';
  last_candle_1s?: Candlestick1s;
  last_candle_15s?: Candlestick15s;
  recent_high: number;
  recent_low: number;
}

export interface EntrySignal {
  token_id: number;
  mint_address: string;
  signal_type: 'BUY';
  entry_price: number;
  target_price: number;
  stop_loss: number;
  reason: string;
  generated_at: Date;
}

export interface ExitSignal {
  token_id: number;
  mint_address: string;
  signal_type: 'SELL_PARTIAL' | 'SELL_FULL' | 'STOP_LOSS';
  exit_price: number;
  exit_reason: string;
  generated_at: Date;
  fibonacci_level?: number;
}