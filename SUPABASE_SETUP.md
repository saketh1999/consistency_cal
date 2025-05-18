# Supabase Setup for Consistency App

This document explains how to set up Supabase for the Consistency app, including authentication, database tables, and storage.

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and sign up or log in.
2. Create a new project.
3. Note your project URL and anon key (you'll need these for configuration).

## 2. Configure Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Set Up Authentication

1. In your Supabase dashboard, go to Authentication → Settings.
2. Configure your auth providers. At minimum, enable Email auth.
3. Optionally, set up additional providers like Google, GitHub, etc.
4. Configure email templates if needed.

## 4. Create the Database Schema

You can run the SQL from `supabase/schema.sql` in the SQL Editor in your Supabase dashboard. This will:

1. Create the required tables:
   - `profiles` - User profiles (extends auth.users)
   - `daily_entries` - Daily journal entries
   - `images` - Image metadata
   - `tasks` - Tasks with deadlines and completion status

2. Set up Row Level Security (RLS) policies to ensure users can only access their own data.

3. Set up a storage bucket for images.

4. Create triggers for updated timestamps and new user profile creation.

## 5. Enable Storage

1. In your Supabase dashboard, go to Storage.
2. Verify that the 'images' bucket has been created via the SQL setup.
3. Check that the storage policies are correctly applied.

## 6. Additional Configuration

### Email Confirmation

If you want users to confirm their email address:

1. Go to Authentication → Settings → Email.
2. Enable "Confirm email" option.
3. Customize the email template if needed.

### Password Reset

To enable password reset:

1. Go to Authentication → Settings → Email.
2. Enable "Enable password reset" option.
3. Customize the email template if needed.

### CORS Configuration

If you're deploying to a different domain:

1. Go to Settings → API.
2. Add your domain to the "Additional allowed websites" list.

## 7. Development vs Production

For development:
- You can use the development credentials.
- No additional setup is needed.

For production:
- Create a separate Supabase project.
- Configure the environment variables for your production environment.
- You may want to disable signups and use invite-only mode.

## 8. Testing the Integration

1. Start your app with `npm run dev`.
2. Try signing up and logging in.
3. Test creating entries, uploading images, and managing tasks.
4. Verify that data is correctly saved to and retrieved from Supabase.

## Troubleshooting

### Authentication Issues

- Check the network requests in your browser's developer tools.
- Look for error responses from Supabase.
- Verify your environment variables are correctly set.

### Database Issues

- Check the SQL queries in the Supabase dashboard.
- Verify the table structure matches the expected schema.
- Check that RLS policies are correctly applied.

### Storage Issues

- Check the storage bucket configuration.
- Verify the storage policies allow the operations you're trying to perform.
- Check file sizes are within limits.

## Getting Help

If you're having issues:

1. Check the [Supabase documentation](https://supabase.com/docs).
2. Visit the [Supabase GitHub repository](https://github.com/supabase/supabase).
3. Join the [Supabase Discord server](https://discord.supabase.com). 