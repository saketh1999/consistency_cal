# Environment Setup

To run this application, you need to set up environment variables for Supabase authentication and database access.

## Creating the .env.local File

Create a file named `.env.local` in the root of the project with the following content:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Calendar API (optional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_GOOGLE_API_KEY=your-google-api-key
```

## Getting Supabase Configuration

1. Go to your [Supabase project dashboard](https://app.supabase.com)
2. Click on the "Settings" icon in the left sidebar
3. Go to "API" section
4. Find your Project URL and copy it to `NEXT_PUBLIC_SUPABASE_URL`
5. Find your `anon` public key and copy it to `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Working with the Database

Once environment variables are set up, the application will be able to connect to your Supabase project. Make sure you've also set up the required database tables as described in:

- `SUPABASE_SETUP.md` - For the main application tables
- `README_QUOTES_MIGRATION.md` - For motivational quotes functionality

## Development

After setting up your environment variables, you can start the development server:

```bash
npm run dev
``` 