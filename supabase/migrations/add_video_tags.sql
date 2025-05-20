-- Create tables for video tags

-- Table to store individual videos with their metadata
CREATE TABLE videos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  daily_entry_id uuid references daily_entries,
  url text not null,
  title text,
  description text,
  created_at timestamp with time zone default now() not null
);

-- Table to store tags
CREATE TABLE tags (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  name text not null,
  created_at timestamp with time zone default now() not null,
  unique (user_id, name)
);

-- Junction table for many-to-many relationship between videos and tags
CREATE TABLE video_tags (
  id uuid primary key default uuid_generate_v4(),
  video_id uuid references videos not null,
  tag_id uuid references tags not null,
  created_at timestamp with time zone default now() not null,
  unique (video_id, tag_id)
);

-- Add RLS policies
alter table videos enable row level security;
alter table tags enable row level security;
alter table video_tags enable row level security;

-- Create policies for videos table
create policy "Users can create their own videos"
  on videos for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own videos"
  on videos for select
  using (auth.uid() = user_id);

create policy "Users can update their own videos"
  on videos for update
  using (auth.uid() = user_id);

create policy "Users can delete their own videos"
  on videos for delete
  using (auth.uid() = user_id);

-- Create policies for tags table
create policy "Users can create their own tags"
  on tags for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own tags"
  on tags for select
  using (auth.uid() = user_id);

create policy "Users can update their own tags"
  on tags for update
  using (auth.uid() = user_id);

create policy "Users can delete their own tags"
  on tags for delete
  using (auth.uid() = user_id);

-- Create policies for video_tags table
create policy "Users can insert video tags for videos they own"
  on video_tags for insert
  with check (exists (
    select 1 from videos
    where videos.id = video_id
    and videos.user_id = auth.uid()
  ));

create policy "Users can view video tags for videos they own"
  on video_tags for select
  using (exists (
    select 1 from videos
    where videos.id = video_id
    and videos.user_id = auth.uid()
  ));

create policy "Users can delete video tags for videos they own"
  on video_tags for delete
  using (exists (
    select 1 from videos
    where videos.id = video_id
    and videos.user_id = auth.uid()
  )); 