-- Chạy 1 lần trong Supabase SQL Editor (project tlbumpjugtltznzuwqwt).
--
-- Mục đích: web static export chỉ đọc bảng movies khi có thay đổi thật.
-- Mọi ghi vào movies / comments / ep_notifs / taxonomies / app_settings
-- sẽ tăng cờ `site_version`. Web so sánh cờ này (~250 bytes) thay vì kéo
-- `movies?select=*` (~3,4 MB) mỗi 20 giây như trước.

-- Cờ khởi tạo (row đã có thể tồn tại; on_conflict giữ nguyên nếu có).
insert into public.app_settings (key, value)
values ('site_version', to_jsonb((extract(epoch from now()) * 1000)::bigint))
on conflict (key) do nothing;

-- Cho phép Realtime phát sự thay đổi của row cờ. Nếu chưa bật, web vẫn có
-- poll dự phòng 20s chỉ đọc cờ này (~250B/lần), nên không sao nếu bỏ qua lệnh này.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'app_settings'
  ) then
    alter publication supabase_realtime add table public.app_settings;
  end if;
end $$;

create or replace function public.touch_site_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _key text;
  _ts bigint := (extract(epoch from now()) * 1000)::bigint;
begin
  -- Tránh đệ quy: chính cờ site_version không được làm trigger chạy lại.
  if TG_TABLE_NAME = 'app_settings' then
    if TG_OP = 'DELETE' then
      _key := OLD.key;
    else
      _key := NEW.key;
    end if;
    if _key = 'site_version' then
      return null;
    end if;
  end if;

  insert into public.app_settings (key, value)
  values ('site_version', to_jsonb(_ts))
  on conflict (key) do update set value = to_jsonb(_ts);

  return null;
end;
$$;

-- Row-level để đọc được NEW.key / OLD.key ở bảng app_settings.
drop trigger if exists movies_version_changed on public.movies;
create trigger movies_version_changed
after insert or update or delete on public.movies
for each row execute function public.touch_site_version();

drop trigger if exists comments_version_changed on public.comments;
create trigger comments_version_changed
after insert or update or delete on public.comments
for each row execute function public.touch_site_version();

drop trigger if exists notifs_version_changed on public.ep_notifs;
create trigger notifs_version_changed
after insert or update or delete on public.ep_notifs
for each row execute function public.touch_site_version();

drop trigger if exists taxonomies_version_changed on public.taxonomies;
create trigger taxonomies_version_changed
after insert or update or delete on public.taxonomies
for each row execute function public.touch_site_version();

drop trigger if exists settings_version_changed on public.app_settings;
create trigger settings_version_changed
after insert or update or delete on public.app_settings
for each row execute function public.touch_site_version();

-- Kiểm tra nhanh sau khi chạy:
--   select key, value from public.app_settings where key = 'site_version';
--   select tgname, tgrelid::regclass from pg_trigger where tgname like '%_version_changed';
