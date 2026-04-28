# Supabase Setup (Global Participation)

Use this to enable global cross-device learner sync and shared Readers Sharing feed.

## 1) Create tables

Run this SQL in Supabase SQL editor:

```sql
create table if not exists kb_learners (
  email text primary key,
  phone text,
  name text,
  updated_at timestamptz default now()
);

create table if not exists kb_progress (
  email text primary key references kb_learners(email) on delete cascade,
  phone text,
  state_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists kb_stories (
  id bigint generated always as identity primary key,
  email text,
  chapter int,
  company text,
  role text,
  insight text,
  story text,
  photo text,
  name text,
  date text,
  created_at timestamptz default now()
);
```

## 2) RLS policy (quick starter)

If you want quick public MVP behavior:

```sql
alter table kb_learners enable row level security;
alter table kb_progress enable row level security;
alter table kb_stories enable row level security;

create policy "public read learners" on kb_learners for select using (true);
create policy "public write learners" on kb_learners for insert with check (true);
create policy "public update learners" on kb_learners for update using (true);

create policy "public read progress" on kb_progress for select using (true);
create policy "public write progress" on kb_progress for insert with check (true);
create policy "public update progress" on kb_progress for update using (true);

create policy "public read stories" on kb_stories for select using (true);
create policy "public write stories" on kb_stories for insert with check (true);
```

For production hardening, switch to auth-based policies.

## 3) Configure app

Edit `config.js`:

```js
window.KB_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY"
};
```

## 4) Redeploy

Deploy again to Vercel after adding config values.
