export const databaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'solana_trading_bot',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.DB_SSL === 'true',
  max: 20, // connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const timescaleConfig = {
  // TimescaleDB specific configuration
  hypertableChunkTimeInterval: '7 days',
  compression: true,
  retention: '30 days', // Keep 30 days of data
};