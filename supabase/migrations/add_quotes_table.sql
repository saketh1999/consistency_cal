-- Add motivational_quotes table
CREATE TABLE IF NOT EXISTS motivational_quotes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  text text not null,
  author text,
  image_url text,
  date date not null, -- The date this quote was associated with
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Add updated_at trigger
CREATE TRIGGER set_motivational_quotes_updated_at
  BEFORE UPDATE ON motivational_quotes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Add RLS policies
ALTER TABLE motivational_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quotes"
  ON motivational_quotes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quotes"
  ON motivational_quotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotes"
  ON motivational_quotes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quotes"
  ON motivational_quotes FOR DELETE
  USING (auth.uid() = user_id); 