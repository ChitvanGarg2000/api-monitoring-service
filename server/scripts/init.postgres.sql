create table if not exists endpoint_metrics(
    id serial primary key,
    client_id varchar(24) not null,
    service_name varchar(255) not null,
    endpoint varchar(500) not null,
    method varchar(10) not null,
    total_hits integer default 0,
    error_hits integer default 0,
    average_latency numeric(10, 3) default 0.000,
    max_latency numeric(10, 3) default 0.000,
    min_latency numeric(10, 3) default 0.000,
    created_at timestamp default now(),
    updated_at timestamp default now(),

    unique(client_id, service_name, endpoint, method, time_bucket)
);

CREATE INDEX IF NOT EXISTS idx_endpoint_metrics_client_id ON endpoint_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_endpoint_metrics_service ON endpoint_metrics(client_id, service_name);
CREATE INDEX IF NOT EXISTS idx_endpoint_metrics_time ON endpoint_metrics(time_bucket);
CREATE INDEX IF NOT EXISTS idx_endpoint_metrics_endpoint ON endpoint_metrics(client_id, service_name, endpoint);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_endpoint_metrics_updated_at ON endpoint_metrics;
CREATE TRIGGER update_endpoint_metrics_updated_at BEFORE UPDATE ON endpoint_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();