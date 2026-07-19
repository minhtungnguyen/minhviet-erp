-- ================================================================
-- Minh Việt ERP — Supabase Schema
-- Chạy file này trong SQL Editor của Supabase dashboard
-- ================================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ────────────────────────────────────────────────────────────────
-- USER PROFILES
-- ────────────────────────────────────────────────────────────────
create table if not exists user_profiles (
  id          text primary key,
  username    text unique not null,
  password    text not null,  -- bcrypt hash (Phase 5: migrate to Supabase Auth)
  name        text not null,
  role        text not null check (role in ('sale','accountant','manager','dieu_hanh')),
  dept        text,
  job_title   text,
  phone       text,
  email       text,
  photo_url   text,
  avatar      text,
  active      boolean default true,
  created_at  timestamptz default now()
);

-- ────────────────────────────────────────────────────────────────
-- ORDERS (đơn hàng)
-- ────────────────────────────────────────────────────────────────
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
  status            text default 'new',
  notes             text,
  total_paid        numeric(15,2) default 0,
  validation_errors jsonb default '[]',
  vat_invoice       jsonb,
  closed_at         timestamptz,
  created_at        timestamptz default now()
);

-- ────────────────────────────────────────────────────────────────
-- VOUCHERS (phiếu thu/chi)
-- ────────────────────────────────────────────────────────────────
create table if not exists vouchers (
  id            text primary key,
  type          text not null check (type in ('thu','chi')),
  order_id      text references orders(id) on delete set null,
  customer_name text,
  ncc           text,
  amount        numeric(15,2) not null,
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

-- ────────────────────────────────────────────────────────────────
-- EXPENSES (chi phí đơn hàng)
-- ────────────────────────────────────────────────────────────────
create table if not exists expenses (
  id          text primary key,
  order_id    text references orders(id) on delete set null,
  ncc         text,
  amount      numeric(15,2) not null,
  budget_line numeric(15,2) default 0,
  method      text,
  note        text,
  status      text default 'pending_kt',
  created_by  text,
  audit_log   jsonb default '[]',
  created_at  timestamptz default now()
);

-- ────────────────────────────────────────────────────────────────
-- REFUNDS (hoàn tiền)
-- ────────────────────────────────────────────────────────────────
create table if not exists refunds (
  id                  text primary key,
  order_id            text references orders(id) on delete set null,
  order_name          text,
  customer_name       text,
  customer_phone      text,
  service_type        text,
  reason              text,
  reason_note         text,
  policy_note         text,
  total_paid          numeric(15,2) default 0,
  fee_amount          numeric(15,2) default 0,
  refund_amount       numeric(15,2) default 0,
  ncc_recovery        numeric(15,2) default 0,
  ncc_recovery_note   text,
  net_loss            numeric(15,2) default 0,
  method              text,
  bank_info           text,
  status              text default 'pending_approve',
  created_by          text,
  approved_by         text,
  approved_at         timestamptz,
  paid_at             timestamptz,
  audit_log           jsonb default '[]',
  created_at          timestamptz default now()
);

-- ────────────────────────────────────────────────────────────────
-- NCC LIST (nhà cung cấp)
-- ────────────────────────────────────────────────────────────────
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

-- ────────────────────────────────────────────────────────────────
-- CUSTOMERS (khách hàng CRM)
-- ────────────────────────────────────────────────────────────────
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
  total_revenue     numeric(15,2) default 0,
  total_profit      numeric(15,2) default 0,
  last_order_date   date,
  first_order_date  date,
  notes             text,
  source            text,
  events            jsonb default '[]',
  interactions      jsonb default '[]',
  created_at        timestamptz default now()
);

-- ────────────────────────────────────────────────────────────────
-- BOOKING ROOMS — phòng được đặt trong một đơn hàng
-- ────────────────────────────────────────────────────────────────
create table if not exists booking_rooms (
  id                  text primary key default gen_random_uuid()::text,
  order_id            text not null references orders(id) on delete cascade,
  room_name           text not null,          -- "Deluxe King", "Suite 302"
  room_type           text,                   -- loại phòng
  check_in            date,
  check_out           date,
  nights              int default 1,
  base_cost_price     numeric(15,2) default 0,   -- giá vốn phòng gốc
  base_selling_price  numeric(15,2) default 0,   -- giá bán phòng gốc
  sort_order          int default 0,
  created_at          timestamptz default now()
);

-- ────────────────────────────────────────────────────────────────
-- BOOKING PASSENGERS — hành khách trong đơn (ID riêng để liên kết phòng)
-- ────────────────────────────────────────────────────────────────
create table if not exists booking_passengers (
  id           text primary key default gen_random_uuid()::text,
  order_id     text not null references orders(id) on delete cascade,
  name         text not null,
  type         text default 'adult' check (type in ('adult','child','baby')),
  dob          date,
  gender       text,
  nationality  text default 'Việt Nam',
  cccd         text,
  cccd_img     text,   -- base64 data URL hoặc link Drive
  phone        text,
  note         text,
  created_at   timestamptz default now()
);

-- ────────────────────────────────────────────────────────────────
-- BOOKING ROOM GUESTS — ánh xạ phòng ↔ hành khách (nhiều-nhiều)
-- ────────────────────────────────────────────────────────────────
create table if not exists booking_room_guests (
  id                    text primary key default gen_random_uuid()::text,
  order_id              text not null references orders(id) on delete cascade,
  booking_room_id       text not null references booking_rooms(id) on delete cascade,
  booking_passenger_id  text not null references booking_passengers(id) on delete cascade,
  created_at            timestamptz default now(),
  unique (booking_room_id, booking_passenger_id)
);

-- ────────────────────────────────────────────────────────────────
-- BOOKING ROOM PRICES — phụ thu nhập tay cho từng phòng
-- ────────────────────────────────────────────────────────────────
create table if not exists booking_room_prices (
  id              text primary key default gen_random_uuid()::text,
  booking_room_id text not null references booking_rooms(id) on delete cascade,
  type            text not null default 'surcharge' check (type in ('surcharge')),
  label           text not null default 'Phụ thu',
  cost_price      numeric(15,2) default 0,
  selling_price   numeric(15,2) default 0,
  created_at      timestamptz default now()
);

-- Index tăng tốc lookup theo order
create index if not exists idx_booking_rooms_order         on booking_rooms(order_id);
create index if not exists idx_booking_passengers_order    on booking_passengers(order_id);
create index if not exists idx_booking_room_guests_order   on booking_room_guests(order_id);
create index if not exists idx_booking_room_guests_room    on booking_room_guests(booking_room_id);
create index if not exists idx_booking_room_prices_room    on booking_room_prices(booking_room_id);

-- ────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (bật RLS, chỉ cho authenticated users)
-- ────────────────────────────────────────────────────────────────
alter table user_profiles enable row level security;
alter table orders         enable row level security;
alter table vouchers       enable row level security;
alter table expenses       enable row level security;
alter table refunds        enable row level security;
alter table ncc_list       enable row level security;
alter table customers      enable row level security;

-- Policy: tất cả authenticated users đều đọc/ghi được (RBAC do app xử lý)
-- Thay bằng policy chi tiết hơn khi migrate sang Supabase Auth
create policy "allow all authenticated" on user_profiles       for all using (true) with check (true);
create policy "allow all authenticated" on orders              for all using (true) with check (true);
create policy "allow all authenticated" on vouchers            for all using (true) with check (true);
create policy "allow all authenticated" on expenses            for all using (true) with check (true);
create policy "allow all authenticated" on refunds             for all using (true) with check (true);
create policy "allow all authenticated" on ncc_list            for all using (true) with check (true);
create policy "allow all authenticated" on customers           for all using (true) with check (true);
create policy "allow all authenticated" on booking_rooms       for all using (true) with check (true);
create policy "allow all authenticated" on booking_passengers  for all using (true) with check (true);
create policy "allow all authenticated" on booking_room_guests for all using (true) with check (true);
create policy "allow all authenticated" on booking_room_prices for all using (true) with check (true);

-- ────────────────────────────────────────────────────────────────
-- REALTIME: bật cho các bảng cần sync real-time
-- ────────────────────────────────────────────────────────────────
-- Chạy trong Supabase dashboard > Database > Replication:
-- Bật replication cho: orders, vouchers, expenses, refunds, ncc_list, customers
