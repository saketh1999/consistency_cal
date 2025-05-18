-- Add featured_image_url column to daily_entries table
ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS featured_image_url TEXT;

-- Ensure RLS policies are updated if you're using RLS
-- Example (adjust according to your actual RLS setup):
-- ALTER POLICY "Users can read their own entries" ON daily_entries USING (auth.uid() = user_id);
-- ALTER POLICY "Users can update their own entries" ON daily_entries USING (auth.uid() = user_id); 