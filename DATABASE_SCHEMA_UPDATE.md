# Database Schema Update for Featured Images

You are encountering an issue with saving featured images because your Supabase database schema is missing the required column.

## Option 1: Using the Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the following SQL query:

```sql
-- Add featured_image_url column to daily_entries table
ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS featured_image_url TEXT;
```

## Option 2: Using Supabase Migrations

If you're using Supabase migrations:

1. We've created a migration file: `supabase/migrations/add_featured_image_url_column.sql`
2. Run the migration using the Supabase CLI:

```bash
supabase db push
```

## Option 3: Manual Database Fix

If you prefer not to modify your database schema yet, you can still use the app, but:

1. Featured images will only be stored locally (in your browser)
2. They will not persist across different browsers or devices
3. They may be lost if you clear your browser cache

## Verifying the Fix

After adding the column:

1. Refresh your app
2. Upload a new image or set an existing image as featured
3. Check if the star indicator appears in the calendar view
4. Refresh the page to confirm the featured image persists

If you continue to experience issues, please check your browser console for more detailed error messages. 