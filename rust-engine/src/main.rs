use anyhow::Result;
use solana_trading_bot_engine::{
    config::Config,
    engine::TradingEngine,
    logging::init_tracing,
};
use tokio::signal;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    init_tracing();
    
    // Load configuration
    let config = Config::load()?;
    
    // Create and start the trading engine
    let mut engine = TradingEngine::new(config).await?;
    
    // Start the engine
    engine.start().await?;
    
    // Wait for shutdown signal
    signal::ctrl_c().await?;
    
    tracing::info!("Shutting down trading engine...");
    engine.shutdown().await;
    
    Ok(())
}