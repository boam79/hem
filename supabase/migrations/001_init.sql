-- Boardroom MVP. RLS off: all access via service role in Route Handlers.
create table if not exists sessions (
  id          text primary key,
  agenda      text not null check (char_length(agenda) between 10 and 200),
  category    text not null check (category in ('investment','marketing','staffing','pricing')),
  memo        jsonb,
  created_at  timestamptz default now()
);

create table if not exists turns (
  id          bigserial primary key,
  session_id  text references sessions(id) on delete cascade,
  round       smallint not null check (round in (1,2)),
  persona     text not null check (persona in ('cfo','mkt','md')),
  provider    text not null,
  model       text not null,
  status      text not null check (status in ('ok','failed')),
  payload     jsonb,
  error       text,
  usage       jsonb,
  latency_ms  int,
  created_at  timestamptz default now(),
  unique (session_id, round, persona)
);

create table if not exists rate_limits (
  key         text primary key,
  count       int not null default 0,
  updated_at  timestamptz default now()
);

create table if not exists keepalive (
  id int primary key default 1,
  pinged_at timestamptz
);
