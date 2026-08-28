-- Session-scoped uploaded metrics (xlsx/csv). Null = bundled data/metrics.json.
alter table sessions add column if not exists metrics jsonb;
