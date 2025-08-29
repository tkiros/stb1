use chrono::{DateTime, Utc};
use decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Token {
    pub id: i32,
    pub mint_address: String,
    pub name: Option<String>,
    pub symbol: Option<String>,
    pub description: Option<String>,
    pub bonding_curve_cap: Option<i64>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub last_seen: Option<DateTime<Utc>>,
    pub is_active: bool,
    pub risk_score: Option<Decimal>,
    pub organic_score: Option<Decimal>,
    pub scam_detected: bool,
    pub liquidity_verified: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct MarketDataTick {
    pub time: DateTime<Utc>,
    pub token_id: i32,
    pub price: Decimal,
    pub volume_24h: Option<Decimal>,
    pub market_cap: Option<Decimal>,
    pub buy_volume: Option<Decimal>,
    pub sell_volume: Option<Decimal>,
    pub trade_count: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Candlestick1s {
    pub time: DateTime<Utc>,
    pub token_id: i32,
    pub open: Decimal,
    pub high: Decimal,
    pub low: Decimal,
    pub close: Decimal,
    pub volume: Decimal,
    pub trade_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Candlestick15s {
    pub time: DateTime<Utc>,
    pub token_id: i32,
    pub open: Decimal,
    pub high: Decimal,
    pub low: Decimal,
    pub close: Decimal,
    pub volume: Decimal,
    pub trade_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct TradingSignal {
    pub id: i32,
    pub token_id: i32,
    pub signal_type: SignalType,
    pub signal_strength: Option<Decimal>,
    pub entry_price: Option<Decimal>,
    pub target_price: Option<Decimal>,
    pub stop_loss: Option<Decimal>,
    pub fibonacci_level: Option<Decimal>,
    pub generated_at: DateTime<Utc>,
    pub is_executed: bool,
    pub executed_at: Option<DateTime<Utc>>,
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Position {
    pub id: i32,
    pub token_id: i32,
    pub signal_id: Option<i32>,
    pub trade_type: TradeType,
    pub entry_price: Decimal,
    pub entry_size: Decimal,
    pub current_price: Option<Decimal>,
    pub current_size: Decimal,
    pub entry_timestamp: DateTime<Utc>,
    pub exit_timestamp: Option<DateTime<Utc>>,
    pub status: PositionStatus,
    pub realized_pnl: Option<Decimal>,
    pub unrealized_pnl: Option<Decimal>,
    pub trailing_stop_price: Option<Decimal>,
    pub hard_stop_loss: Option<Decimal>,
    pub fibonacci_target: Option<Decimal>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Alert {
    pub id: i32,
    pub token_id: Option<i32>,
    pub alert_type: AlertType,
    pub severity: AlertSeverity,
    pub message: String,
    pub created_at: DateTime<Utc>,
    pub is_read: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SignalType {
    BUY,
    SELL_PARTIAL,
    SELL_FULL,
    STOP_LOSS,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TradeType {
    LONG,
    SHORT,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PositionStatus {
    NONE,
    OPEN,
    CLOSED,
    CANCELLED,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AlertType {
    TOKEN_DISCOVERED,
    RISK_ALERT,
    TRADE_EXECUTED,
    EMERGENCY_STOP,
    SIGNAL_GENERATED,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AlertSeverity {
    INFO,
    WARNING,
    ERROR,
    CRITICAL,
}

#[derive(Debug, Clone)]
pub struct TradingContext {
    pub token_id: i32,
    pub mint_address: String,
    pub current_market_cap: Decimal,
    pub entry_price: Option<Decimal>,
    pub current_price: Decimal,
    pub position_status: PositionStatus,
    pub last_candle_1s: Option<Candlestick1s>,
    pub last_candle_15s: Option<Candlestick15s>,
    pub recent_high: Decimal,
    pub recent_low: Decimal,
}

#[derive(Debug, Clone)]
pub struct EntrySignal {
    pub token_id: i32,
    pub mint_address: String,
    pub signal_type: SignalType,
    pub entry_price: Decimal,
    pub target_price: Decimal,
    pub stop_loss: Decimal,
    pub reason: String,
    pub generated_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct ExitSignal {
    pub token_id: i32,
    pub mint_address: String,
    pub signal_type: SignalType,
    pub exit_price: Decimal,
    pub exit_reason: String,
    pub generated_at: DateTime<Utc>,
    pub fibonacci_level: Option<Decimal>,
}