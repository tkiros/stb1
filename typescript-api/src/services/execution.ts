import { Jupiter } from '@jup-ag/core';
import { Connection, PublicKey, Keypair, Transaction, SystemProgram } from '@solana/web3.js';
import { Decimal } from 'decimal.js';
import { TradingSignal, Position } from '../models';
import { apiConfig } from '../config';
import { logger } from '../utils/logger';

export interface ExecutionConfig {
  walletPrivateKey: string;
  positionSizeSOL: number;
  maxConcurrentPositions: number;
  slippageBps: number;
  priorityFeeLamports: number;
}

export class TradeExecutor {
  private jupiter: Jupiter;
  private connection: Connection;
  private wallet: Keypair;
  private config: ExecutionConfig;

  constructor(config: ExecutionConfig) {
    this.config = config;
    this.connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    this.wallet = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(config.walletPrivateKey))
    );
    this.jupiter = new Jupiter({
      connection: this.connection,
      cluster: 'mainnet-beta',
      userPublicKey: this.wallet.publicKey.toString(),
    });
  }

  async executeSignal(signal: TradingSignal): Promise<boolean> {
    try {
      logger.info(`Executing signal: ${signal.signal_type} for token ${signal.token_id}`);

      // Validate signal
      if (!this.validateSignal(signal)) {
        logger.warn(`Signal validation failed for token ${signal.token_id}`);
        return false;
      }

      // Get quote from Jupiter
      const quote = await this.getJupiterQuote(signal);
      if (!quote) {
        logger.error(`Failed to get Jupiter quote for token ${signal.token_id}`);
        return false;
      }

      // Execute trade
      const result = await this.executeTrade(quote, signal);
      
      if (result.success) {
        logger.info(`Trade executed successfully: ${result.txHash}`);
        return true;
      } else {
        logger.error(`Trade execution failed: ${result.error}`);
        return false;
      }
    } catch (error) {
      logger.error(`Error executing signal for token ${signal.token_id}:`, error);
      return false;
    }
  }

  private validateSignal(signal: TradingSignal): boolean {
    // Check if we have enough open positions
    // This would be implemented with actual position tracking
    return true;
  }

  private async getJupiterQuote(signal: TradingSignal): Promise<any> {
    try {
      const inputMint = 'So11111111111111111111111111111111111111112'; // SOL
      const outputMint = 'TOKEN_MINT_ADDRESS_HERE'; // This would come from token metadata
      
      const quoteResponse = await fetch(
        `${apiConfig.jupiterUltra.baseUrl}/quote/v2?inputMint=${inputMint}&outputMint=${outputMint}&amount=${this.config.positionSizeSOL * 1e9}&slippageBps=${this.config.slippageBps}`
      );

      if (!quoteResponse.ok) {
        throw new Error(`Jupiter quote failed: ${quoteResponse.statusText}`);
      }

      return await quoteResponse.json();
    } catch (error) {
      logger.error('Failed to get Jupiter quote:', error);
      return null;
    }
  }

  private async executeTrade(quote: any, signal: TradingSignal): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      // Get swap transaction
      const swapResponse = await fetch(
        `${apiConfig.jupiterUltra.baseUrl}/swap/v2`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quoteResponse: quote,
            userPublicKey: this.wallet.publicKey.toString(),
            wrapAndUnwrapSol: true,
          }),
        }
      );

      if (!swapResponse.ok) {
        throw new Error(`Jupiter swap failed: ${swapResponse.statusText}`);
      }

      const swapResult = await swapResponse.json();
      
      // Sign and send transaction
      const transaction = Transaction.from(Buffer.from(swapResult.swapTransaction, 'base64'));
      const signature = await this.connection.sendRawTransaction(
        transaction.serialize(),
        { skipPreflight: false }
      );

      await this.connection.confirmTransaction(signature);

      return {
        success: true,
        txHash: signature,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getBalance(): Promise<number> {
    const balance = await this.connection.getBalance(this.wallet.publicKey);
    return balance / 1e9; // Convert lamports to SOL
  }

  async getTokenBalance(tokenMint: string): Promise<number> {
    try {
      const tokenAccount = await this.connection.getParsedTokenAccountsByOwner(
        this.wallet.publicKey,
        { mint: new PublicKey(tokenMint) }
      );
      
      if (tokenAccount.value.length > 0) {
        const balance = tokenAccount.value[0].account.data.parsed.info.tokenAmount.uiAmount;
        return balance || 0;
      }
      return 0;
    } catch (error) {
      logger.error(`Failed to get token balance for ${tokenMint}:`, error);
      return 0;
    }
  }
}