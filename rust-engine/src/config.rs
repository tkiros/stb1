use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub database: DatabaseConfig,
    pub trading: TradingConfig,
    pub api: ApiConfig,
    pub websocket: WebSocketConfig,
    pub logging: LoggingConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    pub host: String,
    pub port: u16,
    pub database: String,
    pub username: String,
    pub password: String,
    pub ssl: bool,
    pub max_connections: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradingConfig {
    pub bonding_curve_cap: u64, // $75k default
    pub psychological_level: u64, // $100k default
    pub min_dip_percentage: f64, // 3% default
    pub fibonacci_levels: Vec<f64>, // [1.618, 2.618, 3.618]
    pub trailing_stop_percentage: f64, // 25% default
    pub hard_stop_loss_percentage: f64, // 40% default
    pub max_position_size: f64, // 10% of portfolio
    pub max_concurrent_positions: usize,
    pub max_drawdown: f64, // 20% default
    pub risk_per_trade: f64, // 2% default
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiConfig {
    pub solana_tracker: ApiEndpointConfig,
    pub jupiter_ultra: ApiEndpointConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiEndpointConfig {
    pub base_url: String,
    pub timeout_ms: u64,
    pub retry_attempts: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketConfig {
    pub pump_portal_url: String,
    pub reconnect_delay_ms: u64,
    pub max_reconnect_attempts: u32,
    pub ping_interval_ms: u64,
    pub pong_timeout_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoggingConfig {
    pub level: String,
    pub enable_json: bool,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            database: DatabaseConfig {
                host: env::var("DB_HOST").unwrap_or_else(|_| "localhost".to_string()),
                port: env::var("DB_PORT").unwrap_or_else(|_| "5432".to_string()).parse().unwrap(),
                database: env::var("DB_NAME").unwrap_or_else(|_| "solana_trading_bot".to_string()),
                username: env::var("DB_USER").unwrap_or_else(|_| "postgres".to_string()),
                password: env::var("DB_PASSWORD").unwrap_or_else(|_| "password".to_string()),
                ssl: env::var("DB_SSL").map_or(false, |s| s == "true"),
                max_connections: 20,
            },
            trading: TradingConfig {
                bonding_curve_cap: 75_000,
                psychological_level: 100_000,
                min_dip_percentage: 3.0,
                fibonacci_levels: vec![1.618, 2.618, 3.618],
                trailing_stop_percentage: 25.0,
                hard_stop_loss_percentage: 40.0,
                max_position_size: 0.1,
                max_concurrent_positions: 10,
                max_drawdown: 20.0,
                risk_per_trade: 0.02,
            },
            api: ApiConfig {
                solana_tracker: ApiEndpointConfig {
                    base_url: "https://data.solanatracker.io".to_string(),
                    timeout_ms: 5000,
                    retry_attempts: 3,
                },
                jupiter_ultra: ApiEndpointConfig {
                    base_url: "https://api.jup.ag".to_string(),
                    timeout_ms: 5000,
                    retry_attempts: 3,
                },
            },
            websocket: WebSocketConfig {
                pump_portal_url: "wss://pumpportal.fun/api/data".to_string(),
                reconnect_delay_ms: 1000,
                max_reconnect_attempts: 10,
                ping_interval_ms: 30000,
                pong_timeout_ms: 10000,
            },
            logging: LoggingConfig {
                level: "info".to_string(),
                enable_json: true,
            },
        }
    }
}

impl Config {
    pub fn load() -> Result<Self> {
        Ok(Self::default())
    }
}