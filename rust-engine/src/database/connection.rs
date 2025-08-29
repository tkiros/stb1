use anyhow::Result;
use sqlx::{postgres::PgPoolOptions, Pool, Postgres};
use std::time::Duration;
use tracing::{error, info};
use crate::config::Config;

pub struct DatabaseConnection {
    pub pool: Pool<Postgres>,
}

impl DatabaseConnection {
    pub async fn new(config: &Config) -> Result<Self> {
        let database_url = format!(
            "postgresql://{}:{}@{}:{}/{}?sslmode={}",
            config.database.username,
            config.database.password,
            config.database.host,
            config.database.port,
            config.database.database,
            if config.database.ssl { "require" } else { "disable" }
        );

        info!("Connecting to database at {}", config.database.host);

        let pool = PgPoolOptions::new()
            .max_connections(config.database.max_connections)
            .connect_timeout(Duration::from_secs(10))
            .idle_timeout(Duration::from_secs(30))
            .max_lifetime(Duration::from_secs(3600))
            .connect(&database_url)
            .await?;

        // Test the connection
        sqlx::query("SELECT 1")
            .fetch_one(&pool)
            .await?;

        info!("Database connection established successfully");

        Ok(Self { pool })
    }

    pub fn get_pool(&self) -> &Pool<Postgres> {
        &self.pool
    }

    pub async fn close(&self) -> Result<()> {
        info!("Closing database connections");
        Ok(())
    }
}