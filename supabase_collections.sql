-- ============================================================
-- Bảng JSONB chung lưu các collection phụ:
-- quotes, bookings, credits, tasks, careTasks, personalTargets
-- ============================================================
create table if not exists app_collections (
  collection  text not null,           -- "quotes" | "bookings" | "credits" | "tasks" | "careTasks" | "personalTargets"
  id          text not null,
  data        jsonb not null,
  updated_at  timestamptz default now(),
  primary key (collection, id)
);

alter table app_collections enable row level security;

drop policy if exists "allow_all_app_collections" on app_collections;
create policy "allow_all_app_collections" on app_collections for all using (true) with check (true);

-- Realtime
alter publication supabase_realtime add table app_collections;
