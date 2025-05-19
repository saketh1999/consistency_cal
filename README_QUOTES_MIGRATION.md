# Motivational Quotes Database Migration

This guide will help you set up the database table for storing your motivational quotes in Supabase.

## Creating the Quotes Table

You need to run the following SQL in your Supabase dashboard:

1. Go to your [Supabase project dashboard](https://app.supabase.com)
2. Click on the "SQL Editor" section in the left sidebar
3. Create a new query and paste the following SQL:

```sql
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
```

4. Click "Run" to execute the SQL

## Feature Details

The new motivational quotes feature allows you to:

1. Add and manage your own collection of inspirational quotes
2. Attach images to quotes
3. Store quotes with their author information
4. Sync your quotes across devices when signed in
5. View a random quote for daily inspiration

## Troubleshooting

If you encounter any errors with the quote storage:

1. Check your browser console for error messages
2. Ensure your database connection is working properly
3. Verify that you have the correct permissions set up for your user in Supabase

If you're still experiencing issues, you can continue to use the feature with local storage only until the database integration is resolved. 