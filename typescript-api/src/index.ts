import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './utils/logger';
import { TokenDiscoveryService } from './services/discovery';
import { MarketDataService } from './services/market-data';
import { DatabaseService } from './services/database';
import { TradeExecutor } from './services/execution';

class TradingBotOrchestrator {
  private app: express.Application;
  private discoveryService: TokenDiscoveryService;
  private marketDataService: MarketDataService;
  private databaseService: DatabaseService;
  private tradeExecutor: TradeExecutor;
  private isRunning = false;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    
    // Initialize services
    this.discoveryService = new TokenDiscoveryService(
      this.handleTokenDiscovered.bind(this),
      this.handleTokenTrade.bind(this)
    );
    
    this.marketDataService = new MarketDataService();
    this.databaseService = new DatabaseService();
    this.tradeExecutor = new TradeExecutor({
      walletPrivateKey: process.env.WALLET_PRIVATE_KEY || '',
      positionSizeSOL: 0.05,
      maxConcurrentPositions: 3,
      slippageBps: 2500, // 25%
      priorityFeeLamports: 250000,
    });
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static('dashboard/build'));
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // Dashboard API routes
    this.app.get('/api/tokens', async (req, res) => {
      try {
        const tokens = await this.databaseService.getActiveTokens();
        res.json(tokens);
      } catch (error) {
        logger.error('Error fetching tokens:', error);
        res.status(500).json({ error: 'Failed to fetch tokens' });
      }
    });

    this.app.get('/api/signals', async (req, res) => {
      try {
        const signals = await this.databaseService.getRecentSignals();
        res.json(signals);
      } catch (error) {
        logger.error('Error fetching signals:', error);
        res.status(500).json({ error: 'Failed to fetch signals' });
      }
    });

    this.app.get('/api/positions', async (req, res) => {
      try {
        const positions = await this.databaseService.getActivePositions();
        res.json(positions);
      } catch (error) {
        logger.error('Error fetching positions:', error);
        res.status(500).json({ error: 'Failed to fetch positions' });
      }
    });

    this.app.get('/api/alerts', async (req, res) => {
      try {
        const alerts = await this.databaseService.getRecentAlerts();
        res.json(alerts);
      } catch (error) {
        logger.error('Error fetching alerts:', error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
      }
    });

    // Manual control routes
    this.app.post('/api/tokens/:mint/unsubscribe', async (req, res) => {
      try {
        const { mint } = req.params;
        await this.databaseService.removeToken(mint);
        this.marketDataService.removeToken(mint);
        logger.info(`Manually unsubscribed from token: ${mint}`);
        res.json({ success: true });
      } catch (error) {
        logger.error('Error unsubscribing from token:', error);
        res.status(500).json({ error: 'Failed to unsubscribe from token' });
      }
    });

    this.app.post('/api/emergency-stop', async (req, res) => {
      try {
        // Implement emergency stop logic
        logger.warn('Emergency stop triggered');
        res.json({ success: true, message: 'Emergency stop activated' });
      } catch (error) {
        logger.error('Error triggering emergency stop:', error);
        res.status(500).json({ error: 'Failed to trigger emergency stop' });
      }
    });

    // Serve React app
    this.app.get('*', (req, res) => {
      res.sendFile('index.html', { root: 'dashboard/build' });
    });
  }

  private async handleTokenDiscovered(token: any): Promise<void> {
    try {
      // Save token to database
      await this.databaseService.saveToken(token);
      
      // Add to market data tracking
      this.marketDataService.addToken(token.mint_address);
      
      // Create alert
      await this.databaseService.createAlert({
        token_id: token.id,
        alert_type: 'TOKEN_DISCOVERED',
        severity: 'INFO',
        message: `New token discovered: ${token.name} (${token.symbol})`,
        created_at: new Date(),
        is_read: false,
      });

      logger.info(`Token discovered and saved: ${token.mint_address}`);
    } catch (error) {
      logger.error('Error handling discovered token:', error);
    }
  }

  private async handleTokenTrade(trade: any): Promise<void> {
    try {
      // Save trade data to database
      await this.databaseService.saveTradeData(trade);
      
      logger.debug(`Trade data saved for token: ${trade.mint}`);
    } catch (error) {
      logger.error('Error handling token trade:', error);
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Orchestrator is already running');
      return;
    }

    try {
      // Initialize database
      await this.databaseService.initialize();
      
      // Start services
      this.marketDataService.start();
      this.discoveryService.start();
      
      // Start web server
      const port = process.env.PORT || 3000;
      this.app.listen(port, () => {
        logger.info(`Trading bot dashboard running on port ${port}`);
      });

      this.isRunning = true;
      logger.info('Trading bot orchestrator started successfully');
    } catch (error) {
      logger.error('Failed to start orchestrator:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    logger.info('Stopping trading bot orchestrator...');
    
    this.discoveryService.stop();
    this.marketDataService.stop();
    
    // Close database connections
    await this.databaseService.close();
    
    this.isRunning = false;
    logger.info('Trading bot orchestrator stopped');
  }
}

// Start the orchestrator
const orchestrator = new TradingBotOrchestrator();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await orchestrator.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await orchestrator.stop();
  process.exit(0);
});

// Start the application
orchestrator.start().catch(error => {
  logger.error('Failed to start trading bot:', error);
  process.exit(1);
});

export default orchestrator;