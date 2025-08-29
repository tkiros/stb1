# Multi-stage build for Rust trading engine
FROM rust:1.75-slim-bullseye as builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Cargo files
COPY Cargo.toml Cargo.lock ./

# Download dependencies to cache them
RUN cargo build --release

# Copy source code
COPY src/ ./src/

# Build the application
RUN cargo build --release

# Runtime stage
FROM debian:bullseye-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 tradingbot

# Set working directory
WORKDIR /app

# Copy binary from builder stage
COPY --from=builder /app/target/release/solana-trading-bot-engine .

# Copy configuration files
COPY config/ ./config/

# Create directories for logs and data
RUN mkdir -p /app/logs /app/data

# Set permissions
RUN chown -R tradingbot:tradingbot /app

# Switch to non-root user
USER tradingbot

# Expose port (if needed for health checks)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Run the application
CMD ["./solana-trading-bot-engine"]