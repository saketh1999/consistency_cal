'use client';

import { useEffect, useState } from 'react';

// Google API configuration
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || ''; // Get from environment variables
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''; // Get from environment variables
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

// Log initialization for debugging
console.log('Google Calendar Service Initializing:');
console.log('API Key available:', !!API_KEY);
console.log('Client ID available:', !!CLIENT_ID);
console.log('API Key length:', API_KEY.length);
console.log('Client ID length:', CLIENT_ID.length);

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  colorId?: string;
  location?: string;
}

export function useGoogleCalendar() {
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Check if we have API keys
  const missingCredentials = !API_KEY || !CLIENT_ID;

  // Initialize the Google API client
  useEffect(() => {
    if (missingCredentials) {
      setError("Google API credentials are missing. Please set them in your environment variables.");
      setIsInitialized(true);
      return;
    }

    // Load the Google API script dynamically
    const loadGapiAndInitialize = () => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = initializeGapiClient;
      script.onerror = () => setError("Failed to load Google API script");
      document.body.appendChild(script);
      
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    };
    
    return loadGapiAndInitialize();
  }, [missingCredentials]);

  const initializeGapiClient = () => {
    console.log("Google API script loaded, initializing client...");
    
    try {
      window.gapi.load('client:auth2', async () => {
        try {
          console.log("Initializing GAPI client with:", { 
            apiKey: API_KEY ? `${API_KEY.substring(0, 3)}...` : 'Not provided',
            clientId: CLIENT_ID ? `${CLIENT_ID.substring(0, 10)}...` : 'Not provided',
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES
          });
          
          // Add extra debugging for OAuth identification
          console.log("Client ID domain check:", CLIENT_ID.includes(".apps.googleusercontent.com") ? "Valid format" : "Invalid format");
          
          // Create a more detailed gapi client initialization with additional checks
          try {
            console.log("Step 1: Initialize API client");
            await window.gapi.client.init({
              apiKey: API_KEY,
              clientId: CLIENT_ID,
              discoveryDocs: DISCOVERY_DOCS,
              scope: SCOPES,
            });
            console.log("GAPI client initialized successfully");
          } catch (initError) {
            console.error("Detailed GAPI client init error:", {
              error: initError,
              message: initError?.message || "No message",
              stack: initError?.stack || "No stack trace",
              toString: initError?.toString?.() || "Cannot convert to string"
            });
            throw initError;
          }
          
          // Check if OAuth is properly initialized
          console.log("Step 2: Check auth instance");
          const authInstance = window.gapi.auth2.getAuthInstance();
          console.log("Auth instance available:", !!authInstance);
          
          if (!authInstance) {
            throw new Error("Auth instance not initialized properly");
          }
          
          // Listen for sign-in state changes
          console.log("Step 3: Setup sign-in listener");
          authInstance.isSignedIn.listen(updateSignInStatus);
          
          // Handle the initial sign-in state
          console.log("Step 4: Check initial sign-in state");
          updateSignInStatus(authInstance.isSignedIn.get());
          setIsInitialized(true);
          
        } catch (error: any) {
          console.error("Error during GAPI client initialization:", error);
          console.error("Error details:", {
            name: error?.name,
            message: error?.message,
            code: error?.code,
            stack: error?.stack,
            toString: error?.toString?.() || "Cannot convert to string"
          });
          const errorMessage = error?.message || JSON.stringify(error) || "Unknown error";
          setError(`Error initializing Google API: ${errorMessage}. Please check your API key and client ID.`);
          setIsInitialized(true);
        }
      });
    } catch (error: any) {
      console.error("Error loading GAPI client:", error);
      setError(`Error loading Google API client: ${error.message || "Unknown error"}`);
      setIsInitialized(true);
    }
  };

  const updateSignInStatus = (signedIn: boolean) => {
    console.log("Google Auth sign-in status changed:", signedIn);
    setIsSignedIn(signedIn);
    if (signedIn) {
      fetchEvents();
    } else {
      setEvents([]);
    }
  };

  const signIn = () => {
    if (!isInitialized || missingCredentials) return;
    
    try {
      console.log("Attempting to sign in to Google...");
      window.gapi.auth2.getAuthInstance().signIn();
    } catch (error: any) {
      console.error("Sign in error:", error);
      setError(`Sign in error: ${error.message || "Unknown error"}`);
    }
  };

  const signOut = () => {
    if (!isInitialized || missingCredentials) return;
    
    try {
      console.log("Signing out from Google...");
      window.gapi.auth2.getAuthInstance().signOut();
    } catch (error: any) {
      console.error("Sign out error:", error);
      setError(`Sign out error: ${error.message || "Unknown error"}`);
    }
  };

  const fetchEvents = async (timeMin?: Date, timeMax?: Date) => {
    if (!isSignedIn || !isInitialized || missingCredentials) return;

    setIsLoading(true);
    setError(null);

    try {
      const now = new Date();
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(now.getMonth() + 1);
      
      console.log("Fetching Google Calendar events...");
      
      const response = await window.gapi.client.calendar.events.list({
        'calendarId': 'primary',
        'timeMin': timeMin ? timeMin.toISOString() : now.toISOString(),
        'timeMax': timeMax ? timeMax.toISOString() : oneMonthFromNow.toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        'maxResults': 100,
        'orderBy': 'startTime',
      });

      if (response.result.items) {
        console.log(`Fetched ${response.result.items.length} events from Google Calendar`);
        setEvents(response.result.items);
      } else {
        console.log("No events found in Google Calendar");
        setEvents([]);
      }
      
      setIsLoading(false);
    } catch (error: any) {
      console.error("Error fetching events:", error);
      setError(`Error fetching events: ${error.message || "Unknown error"}`);
      setIsLoading(false);
    }
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    if (!date) return [];
    
    const dateString = date.toISOString().split('T')[0]; // Get YYYY-MM-DD
    
    return events.filter((event) => {
      if (!event.start?.dateTime) return false;
      
      const eventStartDate = new Date(event.start.dateTime).toISOString().split('T')[0];
      return eventStartDate === dateString;
    });
  };

  return {
    isSignedIn,
    isInitialized,
    events,
    error,
    isLoading,
    signIn,
    signOut,
    fetchEvents,
    getEventsForDate,
    missingCredentials,
  };
}

// Add global type declarations
declare global {
  interface Window {
    gapi: any;
  }
} 