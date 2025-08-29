import WebSocket from 'ws';
import { logger } from '../utils/logger';
import { Token } from '../models';
import { apiConfig } from '../config';

export class TokenDiscoveryService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = apiConfig.pumpPortal.maxReconnectAttempts;
  private reconnectDelay = apiConfig.pumpPortal.reconnectDelayMs;
  private isRunning = false;
  private onTokenDiscovered: (token: Token) => void;
  private onTokenTrade: (trade: any) => void;

  constructor(
    onTokenDiscovered: (token: Token) => void,
    onTokenTrade: (trade: any) => void
  ) {
    this.onTokenDiscovered = onTokenDiscovered;
    this.onTokenTrade = onTokenTrade;
  }

  start(): void {
    if (this.isRunning) {
      logger.warn('Discovery service is already running');
      return;
    }

    this.isRunning = true;
    this.connect();
  }

  stop(): void {
    this.isRunning = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private connect(): void {
    if (!this.isRunning) return;

    logger.info(`Connecting to PumpPortal WebSocket: ${apiConfig.pumpPortal.wsUrl}`);
    
    this.ws = new WebSocket(apiConfig.pumpPortal.wsUrl);

    this.ws.on('open', () => {
      logger.info('Connected to PumpPortal WebSocket');
      this.reconnectAttempts = 0;
      this.subscribeToStreams();
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        logger.error('Error parsing WebSocket message:', error);
      }
    });

    this.ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
      this.handleReconnect();
    });

    this.ws.on('close', (code, reason) => {
      logger.warn(`WebSocket closed: ${code} - ${reason}`);
      this.handleReconnect();
    });
  }

  private subscribeToStreams(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // Subscribe to token migration events (new tokens)
    this.ws.send(JSON.stringify({
      method: 'subscribeMigration',
      params: [],
    }));

    // Subscribe to token trade events
    this.ws.send(JSON.stringify({
      method: 'subscribeTokenTrade',
      params: [],
    }));

    logger.info('Subscribed to PumpPortal streams');
  }

  private handleMessage(message: any): void {
    const { method, params } = message;

    switch (method) {
      case 'subscribeMigration':
        this.handleTokenMigration(params[0]);
        break;
      case 'subscribeTokenTrade':
        this.handleTokenTrade(params[0]);
        break;
      default:
        logger.debug('Unhandled WebSocket method:', method);
    }
  }

  private handleTokenMigration(data: any): void {
    logger.info('New token migration detected:', data);

    const token: Token = {
      id: 0, // Will be set by database
      mint_address: data.mint,
      name: data.name,
      symbol: data.symbol,
      description: data.description,
      bonding_curve_cap: data.bondingCurveCap || 75000,
      created_at: new Date(),
      updated_at: new Date(),
      last_seen: new Date(),
      is_active: true,
      risk_score: undefined,
      organic_score: undefined,
      scam_detected: false,
      liquidity_verified: false,
    };

    // Trigger risk assessment
    this.assessTokenRisk(token);
    
    // Notify callback
    this.onTokenDiscovered(token);
  }

  private handleTokenTrade(data: any): void {
    logger.debug('Token trade event:', data);
    this.onTokenTrade(data);
  }

  private async assessTokenRisk(token: Token): Promise<void> {
    try {
      // Query Solana Tracker for risk assessment
      const response = await fetch(
        `${apiConfig.solanaTracker.baseUrl}/risk/${token.mint_address}`
      );

      if (!response.ok) {
        throw new Error(`Risk API failed: ${response.statusText}`);
      }

      const riskData = await response.json();
      
      // Update token with risk information
      token.risk_score = riskData.riskScore;
      token.scam_detected = riskData.riskScore > 4;
      
      logger.info(`Risk assessment for ${token.mint_address}: ${token.risk_score}`);

      // Check if token should be kept or rejected
      if (token.scam_detected) {
        logger.warn(`Token ${token.mint_address} rejected due to high risk score: ${token.risk_score}`);
        // This would trigger token deletion from database
        return;
      }

      // Query Jupiter Ultra for organic score
      await this.assessOrganicScore(token);

    } catch (error) {
      logger.error(`Error assessing risk for ${token.mint_address}:`, error);
      // On API error, reject the token
      token.scam_detected = true;
    }
  }

  private async assessOrganicScore(token: Token): Promise<void> {
    try {
      const response = await fetch(
        `${apiConfig.jupiterUltra.baseUrl}/token/${token.mint_address}`
      );

      if (!response.ok) {
        throw new Error(`Jupiter API failed: ${response.statusText}`);
      }

      const tokenData = await response.json();
      
      if (tokenData.organicScoreLabel === 'low') {
        logger.warn(`Token ${token.mint_address} rejected due to low organic score`);
        token.scam_detected = true;
        return;
      }

      token.organic_score = tokenData.organicScore;
      token.liquidity_verified = tokenData.liquidity > 0;
      
      logger.info(`Organic score for ${token.mint_address}: ${token.organic_score}`);

    } catch (error) {
      logger.error(`Error assessing organic score for ${token.mint_address}:`, error);
    }
  }

  private handleReconnect(): void {
    if (!this.isRunning) return;

    this.reconnectAttempts++;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached. Stopping discovery service.');
      this.stop();
      return;
    }

    logger.info(`Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }
}