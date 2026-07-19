-- ============================================================
-- Minh Việt ERP — Supabase Migration
-- Chạy toàn bộ file này trong Supabase SQL Editor
-- ============================================================

-- ── 1. USER PROFILES ────────────────────────────────────────
create table if not exists user_profiles (
  id          text primary key,
  username    text unique not null,
  password    text not null,
  name        text not null,
  role        text not null,
  dept        text,
  job_title   text,
  phone       text,
  email       text,
  photo_url   text,
  avatar      text,
  active      boolean default true,
  created_at  timestamptz default now()
);

-- ── 2. ORDERS ───────────────────────────────────────────────
create table if not exists orders (
  id                text primary key,
  service           text,
  service_name      text,
  depart_date       date,
  return_date       date,
  pax               jsonb default '{}',
  pricing           jsonb default '{}',
  customer          jsonb default '{}',
  sale              text,
  status            text default 'pending_payment',
  notes             text,
  total_paid        numeric default 0,
  validation_errors jsonb default '[]',
  vat_invoice       jsonb,
  closed_at         timestamptz,
  audit_log         jsonb default '[]',
  created_by        text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ── 3. VOUCHERS ─────────────────────────────────────────────
create table if not exists vouchers (
  id            text primary key,
  type          text not null,
  order_id      text references orders(id) on delete set null,
  customer_name text,
  ncc           text,
  amount        numeric default 0,
  method        text,
  note          text,
  date          date,
  status        text default 'pending',
  approved_by   text,
  bill_img      text,
  created_by    text,
  installment   int default 1,
  pnr_code      text,
  created_at    timestamptz default now()
);

-- ── 4. EXPENSES ─────────────────────────────────────────────
create table if not exists expenses (
  id          text primary key,
  order_id    text references orders(id) on delete set null,
  ncc         text,
  amount      numeric default 0,
  budget_line numeric default 0,
  method      text,
  note        text,
  status      text default 'pending_kt',
  created_by  text,
  audit_log   jsonb default '[]',
  created_at  timestamptz default now()
);

-- ── 5. REFUNDS ──────────────────────────────────────────────
create table if not exists refunds (
  id                 text primary key,
  order_id           text references orders(id) on delete set null,
  order_name         text,
  customer_name      text,
  customer_phone     text,
  service_type       text,
  reason             text,
  reason_note        text,
  policy_note        text,
  total_paid         numeric default 0,
  fee_amount         numeric default 0,
  refund_amount      numeric default 0,
  ncc_recovery       numeric default 0,
  ncc_recovery_note  text,
  net_loss           numeric default 0,
  method             text,
  bank_info          text,
  status             text default 'pending_approve',
  created_by         text,
  approved_by        text,
  approved_at        timestamptz,
  paid_at            timestamptz,
  audit_log          jsonb default '[]',
  created_at         timestamptz default now()
);

-- ── 6. NCC LIST ─────────────────────────────────────────────
create table if not exists ncc_list (
  id          text primary key,
  name        text not null,
  cat         text,
  custom_cat  text,
  phone       text,
  contact     text,
  bank        text,
  tax_code    text,
  address     text,
  note        text,
  created_at  timestamptz default now()
);

-- ── 7. CUSTOMERS ────────────────────────────────────────────
create table if not exists customers (
  id                text primary key,
  type              text default 'personal',
  name              text not null,
  company_name      text,
  company_size      text,
  industry          text,
  phone             text,
  email             text,
  dob               date,
  province          text,
  cccd              text,
  tags              jsonb default '[]',
  assigned_sale     text,
  total_orders      int default 0,
  total_revenue     numeric default 0,
  total_profit      numeric default 0,
  last_order_date   date,
  first_order_date  date,
  notes             text,
  source            text,
  events            jsonb default '[]',
  interactions      jsonb default '[]',
  created_at        timestamptz default now()
);

-- ============================================================
-- RLS POLICIES — cho phép anon key đọc/ghi (nội bộ)
-- ============================================================
alter table user_profiles enable row level security;
alter table orders         enable row level security;
alter table vouchers       enable row level security;
alter table expenses       enable row level security;
alter table refunds        enable row level security;
alter table ncc_list       enable row level security;
alter table customers      enable row level security;

-- Cho phép tất cả thao tác với anon key (app nội bộ, không public)
create policy "allow_all_user_profiles" on user_profiles for all using (true) with check (true);
create policy "allow_all_orders"        on orders         for all using (true) with check (true);
create policy "allow_all_vouchers"      on vouchers       for all using (true) with check (true);
create policy "allow_all_expenses"      on expenses       for all using (true) with check (true);
create policy "allow_all_refunds"       on refunds        for all using (true) with check (true);
create policy "allow_all_ncc_list"      on ncc_list       for all using (true) with check (true);
create policy "allow_all_customers"     on customers      for all using (true) with check (true);

-- ============================================================
-- REALTIME — bật cho các bảng cần sync live
-- ============================================================
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table vouchers;
alter publication supabase_realtime add table expenses;
alter publication supabase_realtime add table refunds;
alter publication supabase_realtime add table customers;
alter publication supabase_realtime add table ncc_list;
