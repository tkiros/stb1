-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Token metadata table
CREATE TABLE tokens (
    id SERIAL PRIMARY KEY,
    mint_address VARCHAR(44) UNIQUE NOT NULL,
    name VARCHAR(100),
    symbol VARCHAR(20),
    description TEXT,
    bonding_curve_cap BIGINT DEFAULT 75000, -- $75k default
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    risk_score DECIMAL(5,2),
    organic_score DECIMAL(5,2),
    scam_detected BOOLEAN DEFAULT false,
    liquidity_verified BOOLEAN DEFAULT false
);

-- Create hypertable for 1-second market data ticks
CREATE TABLE market_data_ticks (
    time TIMESTAMP WITH TIME ZONE NOT NULL,
    token_id INTEGER REFERENCES tokens(id),
    price DECIMAL(18, 8) NOT NULL,
    volume_24h DECIMAL(20, 2),
    market_cap DECIMAL(20, 2),
    buy_volume DECIMAL(20, 2),
    sell_volume DECIMAL(20, 2),
    trade_count INTEGER,
    PRIMARY KEY (time, token_id)
);

-- Create hypertable for 1-second candlesticks
CREATE TABLE candlesticks_1s (
    time TIMESTAMP WITH TIME ZONE NOT NULL,
    token_id INTEGER REFERENCES tokens(id),
    open DECIMAL(18, 8) NOT NULL,
    high DECIMAL(18, 8) NOT NULL,
    low DECIMAL(18, 8) NOT NULL,
    close DECIMAL(18, 8) NOT NULL,
    volume DECIMAL(20, 2) NOT NULL,
    trade_count INTEGER NOT NULL,
    PRIMARY KEY (time, token_id)
);

-- Create hypertable for 15-second candlesticks
CREATE TABLE candlesticks_15s (
    time TIMESTAMP WITH TIME ZONE NOT NULL,
    token_id INTEGER REFERENCES tokens(id),
    open DECIMAL(18, 8) NOT NULL,
    high DECIMAL(18, 8) NOT NULL,
    low DECIMAL(18, 8) NOT NULL,
    close DECIMAL(18, 8) NOT NULL,
    volume DECIMAL(20, 2) NOT NULL,
    trade_count INTEGER NOT NULL,
    PRIMARY KEY (time, token_id)
);

-- Trading signals table
CREATE TABLE trading_signals (
    id SERIAL PRIMARY KEY,
    token_id INTEGER REFERENCES tokens(id),
    signal_type VARCHAR(20) NOT NULL, -- 'BUY', 'SELL', 'HOLD'
    signal_strength DECIMAL(5,2),
    entry_price DECIMAL(18, 8),
    target_price DECIMAL(18, 8),
    stop_loss DECIMAL(18, 8),
    fibonacci_level DECIMAL(5,2),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_executed BOOLEAN DEFAULT false,
    executed_at TIMESTAMP WITH TIME ZONE,
    reason TEXT
);

-- Positions/trades table
CREATE TABLE positions (
    id SERIAL PRIMARY KEY,
    token_id INTEGER REFERENCES tokens(id),
    signal_id INTEGER REFERENCES trading_signals(id),
    trade_type VARCHAR(10) NOT NULL, -- 'LONG', 'SHORT'
    entry_price DECIMAL(18, 8) NOT NULL,
    entry_size DECIMAL(18, 8) NOT NULL,
    current_price DECIMAL(18, 8),
    current_size DECIMAL(18, 8),
    entry_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    exit_timestamp TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'OPEN', -- 'OPEN', 'CLOSED', 'CANCELLED'
    realized_pnl DECIMAL(18, 8),
    unrealized_pnl DECIMAL(18, 8),
    trailing_stop_price DECIMAL(18, 8),
    hard_stop_loss DECIMAL(18, 8),
    fibonacci_target DECIMAL(5,2)
);

-- Alerts and events table
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    token_id INTEGER REFERENCES tokens(id),
    alert_type VARCHAR(20) NOT NULL, -- 'TOKEN_DISCOVERED', 'RISK_ALERT', 'TRADE_EXECUTED', 'EMERGENCY_STOP'
    severity VARCHAR(10) DEFAULT 'INFO', -- 'INFO', 'WARNING', 'ERROR', 'CRITICAL'
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT false
);

-- Create hypertables for time-series data
SELECT create_hypertable('market_data_ticks', 'time');
SELECT create_hypertable('candlesticks_1s', 'time');
SELECT create_hypertable('candlesticks_15s', 'time');

-- Create indexes for better performance
CREATE INDEX idx_tokens_mint ON tokens(mint_address);
CREATE INDEX idx_tokens_active ON tokens(is_active) WHERE is_active = true;
CREATE INDEX idx_market_data_token ON market_data_ticks(token_id);
CREATE INDEX idx_market_data_time ON market_data_ticks(time);
CREATE INDEX idx_signals_token ON trading_signals(token_id);
CREATE INDEX idx_signals_generated ON trading_signals(generated_at);
CREATE INDEX idx_positions_token ON positions(token_id);
CREATE INDEX idx_positions_status ON positions(status);
CREATE INDEX idx_alerts_token ON alerts(token_id);
CREATE INDEX idx_alerts_created ON alerts(created_at);

-- Update function for tokens table
CREATE OR REPLACE FUNCTION update_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tokens_updated_at
    BEFORE UPDATE ON tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_tokens_updated_at();