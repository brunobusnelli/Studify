create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null default 'purple',
  target_hours numeric not null default 5,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  file_type text not null default 'PDF',
  file_path text,
  file_name text,
  file_size text,
  storage text not null default 'manual',
  created_at timestamptz not null default now()
);

alter table public.notes add column if not exists file_name text;
alter table public.notes add column if not exists storage text not null default 'manual';

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  exam_date date not null,
  estimated_hours numeric not null default 5,
  topics jsonb not null default '[]'::jsonb,
  completed_topics jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  subject_id uuid references public.subjects(id) on delete set null,
  minutes integer not null,
  session_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.assistant_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  note_id uuid references public.notes(id) on delete cascade not null,
  mode text not null,
  question text,
  answer text not null,
  provider text not null default 'gemini',
  created_at timestamptz not null default now()
);

alter table public.subjects enable row level security;
alter table public.notes enable row level security;
alter table public.exams enable row level security;
alter table public.study_sessions enable row level security;
alter table public.assistant_responses enable row level security;

drop policy if exists "Users manage own subjects" on public.subjects;
drop policy if exists "Users manage own notes" on public.notes;
drop policy if exists "Users manage own exams" on public.exams;
drop policy if exists "Users manage own study sessions" on public.study_sessions;
drop policy if exists "Users manage own assistant responses" on public.assistant_responses;

create policy "Users manage own subjects" on public.subjects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own notes" on public.notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own exams" on public.exams for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own study sessions" on public.study_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own assistant responses" on public.assistant_responses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('study-files', 'study-files', false)
on conflict (id) do nothing;

drop policy if exists "Users upload own study files" on storage.objects;
drop policy if exists "Users read own study files" on storage.objects;
drop policy if exists "Users delete own study files" on storage.objects;

create policy "Users upload own study files" on storage.objects
for insert with check (bucket_id = 'study-files' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users read own study files" on storage.objects
for select using (bucket_id = 'study-files' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users delete own study files" on storage.objects
for delete using (bucket_id = 'study-files' and auth.uid()::text = (storage.foldername(name))[1]);
