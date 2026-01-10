-- Enable RLS
alter table auth.users enable row level security;

-- 1. Users Table (Extended Profile)
create table public.users (
  id uuid not null primary key references auth.users(id) on delete cascade,
  nickname text,
  -- Updated Class Types based on Character Design
  class_type text check (class_type in ('Challenger', 'Chaser', 'Fixer', 'Coordinator')),
  level int default 1,
  xp int default 0,
  hp int default 100,
  max_hp int default 100,
  points int default 0, -- Available Currency/Reward Points
  role text default 'student' check (role in ('student', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.users enable row level security;

create policy "Users can view their own data."
  on public.users for select
  using ( auth.uid() = id );

create policy "Users can update their own data."
  on public.users for update
  using ( auth.uid() = id );

-- 2. Stats Table (Observer's Log)
create table public.stats (
  user_id uuid not null primary key references public.users(id) on delete cascade,
  accuracy int default 0,
  speed int default 0,
  persistence int default 0,
  knowledge int default 0,
  planning int default 0,
  trust int default 0
);

alter table public.stats enable row level security;

create policy "Users can view their own stats."
  on public.stats for select
  using ( auth.uid() = user_id );

-- 3. Continents (Game World & Source Data)
create table public.continents (
  id uuid default gen_random_uuid() primary key,
  name text not null, -- Raw Name: "2024 Sep Mock Exam"
  display_name text, -- Paraphrased: "9월의 던전"
  theme_color text, -- "#D4AF37"
  is_conquered boolean default false, -- For individual user tracking, might need a separate table if multi-user
  bgm_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Note: In a real multi-user app, 'is_conquered' should be in a user_progress table. 
-- For this prototype, we'll assume simplicity or add a join table later if needed.

-- Mock Data for Continents
insert into public.continents (id, name, display_name, theme_color) values
(gen_random_uuid(), '2024 Sep Mock Exam', '9월의 던전 (Sep Dungeon)', '#D4AF37'),
(gen_random_uuid(), 'Voca Day 1-5', '시작의 들판 (Field of Beginnings)', '#EF4444');

-- 4. Missions (Teacher Configured - The "Quest" in User terms)
create table public.missions (
  id uuid default gen_random_uuid() primary key,
  continent_id uuid references public.continents(id),
  title text not null, -- "Week 1 Drill"
  description text,
  data_payload jsonb not null, -- Full word list (e.g., 160 words)
  total_sets int default 1, -- Calculated: Total Words / 20
  deadline timestamp with time zone,
  config jsonb default '{}'::jsonb, 
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Quest Sets (The 20-word Nodes - Student Progress)
create table public.quest_sets (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) not null,
    mission_id uuid references public.missions(id), -- Linked to Mission, not generic Quest
    set_index int default 1, -- 1st set, 2nd set...
    status text check (status in ('locked', 'open', 'passed', 'failed', 'corroded')) default 'locked',
    deadline timestamp with time zone, -- Inherited from Mission or specific
    score int default 0,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.quest_sets enable row level security;
create policy "Users can view their own quest sets." on public.quest_sets for select using ( auth.uid() = user_id );
create policy "Users can update their own quest sets." on public.quest_sets for update using ( auth.uid() = user_id );

-- 6. Word Progress (Crystallization Tracking)
create table public.word_progress (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) not null,
    word_id text not null,
    correct_streak int default 0,
    crystallized boolean default false,
    last_tested_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.word_progress enable row level security;
create policy "Users can view their own word progress." on public.word_progress for select using ( auth.uid() = user_id );

-- 7. Incorrect Answers (The Vault of Mistakes)
create table public.incorrect_answers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  quest_set_id uuid references public.quest_sets(id),
  mission_id uuid references public.missions(id), -- Added for Weekly Analytics
  word text not null,
  error_type text check (error_type in ('spelling', 'meaning', 'syntax')),
  user_input text, 
  correct_answer text,
  occurrence_count int default 1,
  repetition_level int default 0, -- Ebbinghaus Level (0=New, 1=1day, 2=7days...)
  next_review_at timestamp with time zone, -- Scheduled date for "Reminiscence"
  last_occurrence_at timestamp with time zone default timezone('utc'::text, now())
);

-- 8. Refund Requests (Cash-out System)
create table public.refund_requests (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) not null,
    amount int not null,
    status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
    admin_note text,
    created_at timestamp with time zone default timezone('utc'::text, now())
);


alter table public.incorrect_answers enable row level security;
create policy "Users can view their own errors." on public.incorrect_answers for select using ( auth.uid() = user_id );

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, nickname, hp, max_hp)
  values (new.id, new.raw_user_meta_data->>'nickname', 100, 100);
  
  insert into public.stats (user_id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
