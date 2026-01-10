-- FIX: Ensure 'display_name' and other columns exist in 'continents'
-- Run this in Supabase SQL Editor to sync the schema.

do $$ 
begin
    -- 1. Add display_name if missing
    if not exists (select 1 from information_schema.columns where table_name = 'continents' and column_name = 'display_name') then
        alter table public.continents add column display_name text;
    end if;

    -- 2. Add theme_color if missing
    if not exists (select 1 from information_schema.columns where table_name = 'continents' and column_name = 'theme_color') then
        alter table public.continents add column theme_color text default '#D4AF37';
    end if;

    -- 3. Add image_url if missing
    if not exists (select 1 from information_schema.columns where table_name = 'continents' and column_name = 'image_url') then
        alter table public.continents add column image_url text;
    end if;

    -- 4. Force Schema Cache Reload (by notifying PostgREST)
    notify pgrst, 'reload config';
end $$;
