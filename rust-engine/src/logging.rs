use tracing_subscriber::{fmt, EnvFilter};

pub fn init_tracing() {
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info"));

    fmt()
        .json()
        .with_current_span(true)
        .with_span_events(fmt::format::FmtSpan::CLOSE)
        .with_timer()
        .with_target(false)
        .with_thread_ids(true)
        .with_thread_names(true)
        .init();
}