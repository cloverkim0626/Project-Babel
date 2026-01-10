-- Run this in your Supabase SQL Editor

-- 1. Create Passages Table
create table if not exists public.passages (
  id uuid default gen_random_uuid() primary key,
  continent_id uuid references public.continents(id) on delete cascade,
  title text not null, -- "Passage 1"
  content text not null,
  word_count int default 0,
  words_data jsonb default '[]'::jsonb, -- AI Analyzed Data (RichWord[])
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. RLS Policies
alter table public.passages enable row level security;
create policy "Enable all access for authenticated users" on public.passages for all using (auth.role() = 'authenticated');

-- 3. (Optional) Check Continents Table
-- If you don't have any continents, run this:
-- insert into public.continents (name, display_name, theme_color) values ('Test Project', '테스트 프로젝트', '#D4AF37');
