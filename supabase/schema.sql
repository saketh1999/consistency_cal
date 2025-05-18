-- Create database tables for Consistency App

-- Enable Row Level Security (RLS)
alter default privileges revoke execute on functions from public;

-- User profiles table (extends auth.users)
create table profiles (
  id uuid references auth.users not null primary key,
  email text unique not null,
  name text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Create trigger to create a profile when a user signs up
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Daily entries table
create table daily_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  date date not null,
  notes text,
  video_urls text[] default '{}',
  important_events text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  -- Unique constraint to ensure one entry per day per user
  unique (user_id, date)
);

-- Images table
create table images (
  id uuid primary key default uuid_generate_v4(),
  daily_entry_id uuid references daily_entries not null,
  storage_path text not null,
  url text not null,
  created_at timestamp with time zone default now() not null
);

-- Tasks table
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  text text not null,
  date date not null,
  completed boolean default false not null,
  completed_at timestamp with time zone,
  is_global boolean default false not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Create RLS policies

-- Daily entries policies
alter table daily_entries enable row level security;

create policy "Users can view their own daily entries"
  on daily_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert their own daily entries"
  on daily_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own daily entries"
  on daily_entries for update
  using (auth.uid() = user_id);

create policy "Users can delete their own daily entries"
  on daily_entries for delete
  using (auth.uid() = user_id);

-- Images policies
alter table images enable row level security;

create policy "Users can view their own images"
  on images for select
  using (exists (
    select 1 from daily_entries
    where daily_entries.id = images.daily_entry_id
    and daily_entries.user_id = auth.uid()
  ));

create policy "Users can insert their own images"
  on images for insert
  with check (exists (
    select 1 from daily_entries
    where daily_entries.id = images.daily_entry_id
    and daily_entries.user_id = auth.uid()
  ));

create policy "Users can delete their own images"
  on images for delete
  using (exists (
    select 1 from daily_entries
    where daily_entries.id = images.daily_entry_id
    and daily_entries.user_id = auth.uid()
  ));

-- Tasks policies
alter table tasks enable row level security;

create policy "Users can view their own tasks"
  on tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
  on tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
  on tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own tasks"
  on tasks for delete
  using (auth.uid() = user_id);

-- Profiles policies
alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Storage policies
-- Let storage bucket for user images
insert into storage.buckets (id, name, public) values ('images', 'images', true);

-- Allow authenticated users to upload to storage
create policy "Authenticated users can upload images"
  on storage.objects for insert
  with check (auth.role() = 'authenticated' and bucket_id = 'images');

-- Only the owner can view their own images (private option)
create policy "Users can view their own images in storage"
  on storage.objects for select
  using (auth.uid()::text = (storage.foldername(name))[1]);

-- Only the owner can delete their own images
create policy "Users can delete their own images in storage"
  on storage.objects for delete
  using (auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to automatically update updated_at field
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Create triggers for updated_at
create trigger set_daily_entries_updated_at
  before update on daily_entries
  for each row execute procedure public.handle_updated_at();

create trigger set_tasks_updated_at
  before update on tasks
  for each row execute procedure public.handle_updated_at();

create trigger set_profiles_updated_at
  before update on profiles
  for each row execute procedure public.handle_updated_at(); 