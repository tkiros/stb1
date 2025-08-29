# Solana Trading Bot - Bonding Curve & Psychological Levels

A high-performance automated trading system for Solana meme-coin markets that combines speed, precision, and risk management.

## Architecture Overview

- **Rust Engine**: High-performance trading logic, signal generation, and candle building
- **TypeScript API**: Orchestration, WebSocket handling, API integration, and UI backend
- **React Dashboard**: Real-time monitoring and manual override controls
- **PostgreSQL + TimescaleDB**: Time-series data storage and shared state layer

## Core Features

- Real-time token discovery via PumpPortal WebSocket feeds
- Risk filtering with Solana Tracker and Jupiter Ultra scores
- Sub-second market data tracking and technical analysis
- Bonding curve cap and psychological level trading strategies
- Fibonacci-based exit strategies with trailing stops
- Web-based dashboard for monitoring and control

## Quick Start

1. Set up development environment
2. Configure database connection
3. Run TypeScript API server
4. Start Rust trading engine
5. Launch React dashboard

## Technology Stack

- **Rust**: Performance-critical trading logic
- **Node.js/TypeScript**: Orchestration and API integration
- **React**: Web dashboard
- **PostgreSQL + TimescaleDB**: Time-series data storage
- **Docker**: Containerized deployment
- **PumpPortal APIs**: Discovery and trading execution
- **Solana Tracker & Jupiter**: Risk scoring and price feeds