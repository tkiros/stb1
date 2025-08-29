use crate::{
    config::TradingConfig,
    models::{Candlestick1s, PositionStatus, TradingContext, EntrySignal},
};
use anyhow::Result;
use chrono::{DateTime, Utc};
use decimal::Decimal;
use tracing::{debug, info, warn};

pub struct EntryDetector {
    config: TradingConfig,
}

impl EntryDetector {
    pub fn new(config: TradingConfig) -> Self {
        Self { config }
    }

    pub fn detect_entry_signal(
        &self,
        context: &TradingContext,
        lookback_period: usize,
    ) -> Option<EntrySignal> {
        debug!("Checking for entry signal for token {}", context.mint_address);

        // Skip if position already exists
        if context.position_status != PositionStatus::NONE {
            debug!("Token {} already has open position, skipping entry", context.mint_address);
            return None;
        }

        // Get the trading reference level (bonding curve cap or psychological level)
        let reference_level = self.get_trading_reference_level(context);
        let dip_threshold = reference_level * Decimal::new(100 - (self.config.min_dip_percentage * 100) as i64, 4);

        debug!(
            "Token {} - Reference level: {}, Dip threshold: {}",
            context.mint_address, reference_level, dip_threshold
        );

        // Check if we have a recent dip
        if !self.has_recent_dip(context, dip_threshold, lookback_period) {
            debug!("Token {} - No recent dip detected", context.mint_address);
            return None;
        }

        // Check if current market cap has reclaimed above reference level
        if context.current_market_cap <= reference_level {
            debug!("Token {} - Market cap hasn't reclaimed reference level", context.mint_address);
            return None;
        }

        // Generate entry signal
        let entry_signal = self.create_entry_signal(context, reference_level);
        info!(
            "Entry signal generated for token {} at market cap {} (reference: {})",
            context.mint_address, context.current_market_cap, reference_level
        );

        Some(entry_signal)
    }

    fn get_trading_reference_level(&self, context: &TradingContext) -> Decimal {
        // Try to get bonding curve cap first, fallback to psychological level
        if let Some(bonding_curve_cap) = context.entry_price {
            bonding_curve_cap
        } else {
            Decimal::new(self.config.psychological_level as i64, 0)
        }
    }

    fn has_recent_dip(&self, context: &TradingContext, dip_threshold: Decimal, lookback_period: usize) -> bool {
        // Check if the recent low is below the dip threshold
        if context.recent_low <= dip_threshold {
            debug!("Token {} - Recent low {} is below dip threshold {}", 
                context.mint_address, context.recent_low, dip_threshold);
            return true;
        }

        // Check the last 1-second candle for dip
        if let Some(last_candle) = &context.last_candle_1s {
            if last_candle.low <= dip_threshold {
                debug!("Token {} - Last candle low {} is below dip threshold {}", 
                    context.mint_address, last_candle.low, dip_threshold);
                return true;
            }
        }

        false
    }

    fn create_entry_signal(&self, context: &TradingContext, reference_level: Decimal) -> EntrySignal {
        let stop_loss = reference_level * Decimal::new(100 - (self.config.hard_stop_loss_percentage * 100) as i64, 4);
        
        EntrySignal {
            token_id: context.token_id,
            mint_address: context.mint_address.clone(),
            signal_type: crate::models::SignalType::BUY,
            entry_price: reference_level,
            target_price: reference_level * Decimal::new(1618, 3), // 161.8% Fibonacci level
            stop_loss,
            reason: format!("Dip and reclaim above {} (bonding curve cap)", reference_level),
            generated_at: Utc::now(),
        }
    }

    pub fn validate_dip(&self, current_market_cap: Decimal, recent_high: Decimal) -> bool {
        let dip_percentage = ((recent_high - current_market_cap) / recent_high) * Decimal::new(100, 0);
        dip_percentage >= Decimal::new(self.config.min_dip_percentage as i64 * 100, 2)
    }

    pub fn validate_reclaim(&self, current_market_cap: Decimal, reference_level: Decimal) -> bool {
        current_market_cap > reference_level
    }
}