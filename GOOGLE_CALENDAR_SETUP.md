# Google Calendar Integration Setup Guide

This guide will help you set up Google Calendar integration for your Consistency Calendar app.

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page and then click "New Project"
3. Name your project (e.g., "Consistency Calendar") and click "Create"
4. Once created, select your new project from the dropdown

## Step 2: Enable the Google Calendar API

1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for "Google Calendar API"
3. Click on "Google Calendar API" in the results
4. Click "Enable"

## Step 3: Configure the OAuth Consent Screen

1. In the Google Cloud Console, navigate to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (unless you have a Google Workspace organization) and click "Create"
3. Fill in the required information:
   - App name: "Consistency Calendar"
   - User support email: Your email address
   - Developer contact information: Your email address
4. Click "Save and Continue"
5. On the "Scopes" page, click "Add or Remove Scopes"
6. Add the scope: `https://www.googleapis.com/auth/calendar.readonly`
7. Click "Save and Continue"
8. On the "Test users" page, click "Add Users" and add your Google email
9. Click "Save and Continue"
10. Review your settings and click "Back to Dashboard"

## Step 4: Create OAuth 2.0 Credentials

1. In the Google Cloud Console, navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" and select "OAuth client ID"
3. For Application type, select "Web application"
4. Name: "Consistency Calendar Web Client"
5. Under "Authorized JavaScript origins", add:
   - `http://localhost:3000` (for local development)
   - Your production URL if available
6. Click "Create"
7. You'll see a modal with your Client ID and Client Secret. Make note of the Client ID

## Step 5: Create an API Key

1. In the Google Cloud Console, navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" and select "API Key"
3. Name your key (e.g., "Consistency Calendar API Key")
4. Restrict the key to only the Google Calendar API (optional but recommended)
5. Click "Create"

## Step 6: Add Credentials to Your App

1. Create or edit the `.env.local` file in your project root
2. Add the following entries:
   ```
   NEXT_PUBLIC_GOOGLE_API_KEY=your_api_key_here
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
   ```
3. Restart your development server

## Step 7: Test the Integration

1. Run your app using `npm run dev -- -p 3000`
2. Navigate to the Google Calendar integration section
3. Click "Connect Google Calendar"
4. You should see the Google OAuth consent screen
5. Allow the requested permissions
6. Your calendar events should now be visible in the app

## Troubleshooting

### Common Issues:

1. **Environment variables not loading**
   - Make sure to restart the server after adding environment variables
   - Verify the environment variables are correctly set in `.env.local`

2. **OAuth errors**
   - Ensure JavaScript origins include `http://localhost:3000`
   - Check that the OAuth consent screen is properly configured
   - Verify that you've added yourself as a test user

3. **API Key issues**
   - Check for typos in your API key
   - Ensure the API key has access to the Google Calendar API
   - If you've restricted the API key, make sure it allows your domain

4. **Blank or empty OAuth popup**
   - Check browser console for errors
   - Ensure you're using https:// in production
   - Verify that third-party cookies are allowed in your browser

5. **"Error initializing Google API client"**
   - This usually means something is wrong with your credentials
   - Double-check both the API key and Client ID
   - Make sure the Google Calendar API is enabled in your project

For more detailed troubleshooting, check the browser console for specific error messages. 