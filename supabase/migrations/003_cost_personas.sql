-- Cost dashboard budget + editable persona copy. Provider/model stay in code.
create table if not exists app_settings (
  id int primary key default 1,
  monthly_budget_usd numeric not null default 10,
  updated_at timestamptz default now()
);

insert into app_settings (id, monthly_budget_usd)
values (1, 10)
on conflict (id) do nothing;

create table if not exists persona_overrides (
  key text primary key check (key in ('cfo', 'mkt', 'md')),
  name text not null,
  role text not null,
  habits text not null,
  temperature numeric not null,
  updated_at timestamptz default now()
);
