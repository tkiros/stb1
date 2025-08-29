export * from './database';
export * from './trading';

// Trading configuration
export const tradingConfig = {
  // Entry conditions
  bondingCurveCap: 75000, // $75k default
  psychologicalLevel: 100000, // $100k default
  minDipPercentage: 3, // 3% minimum dip for entry
  
  // Exit conditions
  fibonacciLevels: [1.618, 2.618, 3.618], // Fibonacci extensions
  trailingStopPercentage: 25, // 25% trailing stop
  hardStopLossPercentage: 40, // 40% hard stop loss
  
  // Position management
  maxPositionSize: 0.1, // 10% of portfolio per position
  maxConcurrentPositions: 10,
  
  // Risk management
  maxDrawdown: 20, // 20% maximum portfolio drawdown
  riskPerTrade: 0.02, // 2% risk per trade
};

// API configuration
export const apiConfig = {
  solanaTracker: {
    baseUrl: 'https://data.solanatracker.io',
    timeout: 5000,
    retryAttempts: 3,
  },
  jupiterUltra: {
    baseUrl: 'https://api.jup.ag',
    timeout: 5000,
    retryAttempts: 3,
  },
  pumpPortal: {
    wsUrl: 'wss://pumpportal.fun/api/data',
    reconnectDelay: 1000,
    maxReconnectAttempts: 10,
  },
};

// WebSocket configuration
export const wsConfig = {
  pingInterval: 30000,
  pongTimeout: 10000,
  maxMessageSize: 1024 * 1024, // 1MB
};

// Logging configuration
export const loggingConfig = {
  level: process.env.LOG_LEVEL || 'info',
  file: process.env.LOG_FILE || 'logs/bot.log',
  maxSize: '20m',
  maxFiles: 5,
};