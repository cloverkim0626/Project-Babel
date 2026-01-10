-- CRITICAL DATABASE FIX
-- Copy and run this ENTIRE block in your Supabase SQL Editor

-- 1. Fix 'continents' table (Add missing columns if they don't exist)
do $$ 
begin
    if not exists (select 1 from information_schema.columns where table_name = 'continents' and column_name = 'display_name') then
        alter table public.continents add column display_name text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'continents' and column_name = 'theme_color') then
        alter table public.continents add column theme_color text default '#D4AF37';
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'continents' and column_name = 'image_url') then
        alter table public.continents add column image_url text;
    end if;
end $$;

-- 2. Ensure 'passages' table exists
create table if not exists public.passages (
  id uuid default gen_random_uuid() primary key,
  continent_id uuid references public.continents(id) on delete cascade,
  title text not null,
  content text not null,
  word_count int default 0,
  words_data jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Enable RLS
alter table public.passages enable row level security;
drop policy if exists "Enable all access for authenticated users" on public.passages;
create policy "Enable all access for authenticated users" on public.passages for all using (auth.role() = 'authenticated');

-- 4. Reload Schema Cache
notify pgrst, 'reload config';
