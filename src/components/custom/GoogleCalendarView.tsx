'use client';

import { FC, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar, LogIn, LogOut, RefreshCw, ExternalLink } from 'lucide-react';
import { useGoogleCalendar, type CalendarEvent } from '@/lib/googleCalendarService';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

interface GoogleCalendarViewProps {
  selectedDate: Date | undefined;
  onSyncEvents?: (date: Date, events: CalendarEvent[]) => void;
}

const GoogleCalendarView: FC<GoogleCalendarViewProps> = ({ selectedDate, onSyncEvents }) => {
  const { toast } = useToast();
  const {
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
  } = useGoogleCalendar();
  const [autoSync, setAutoSync] = useState<boolean>(false);

  // Refresh events when the selected date changes
  useEffect(() => {
    if (isSignedIn && selectedDate) {
      // Calculate the start and end of the month for the selected date
      const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      fetchEvents(start, end);
    }
  }, [isSignedIn, selectedDate, fetchEvents]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Google Calendar Error",
        description: error,
        variant: "destructive",
      });
      
      // Log detailed error information to console for debugging
      console.error("Google Calendar Error:", error);
    }
  }, [error, toast]);

  // Auto-sync events when autoSync is enabled
  useEffect(() => {
    if (autoSync && isSignedIn && selectedDate && onSyncEvents) {
      const eventsForDate = getEventsForDate(selectedDate);
      onSyncEvents(selectedDate, eventsForDate);
    }
  }, [autoSync, isSignedIn, selectedDate, events, onSyncEvents, getEventsForDate]);

  const handleLogin = () => {
    if (!isInitialized) {
      toast({
        title: "Google Calendar",
        description: "Google API is still initializing. Please try again in a moment.",
      });
      return;
    }
    signIn();
  };

  const handleLogout = () => {
    signOut();
    toast({
      title: "Google Calendar",
      description: "Successfully logged out from Google Calendar.",
    });
  };

  const handleRefresh = () => {
    if (selectedDate) {
      const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      fetchEvents(start, end);
      toast({
        title: "Google Calendar",
        description: "Refreshing events from Google Calendar...",
      });
    }
  };

  const handleManualSync = () => {
    if (selectedDate && onSyncEvents) {
      const eventsForDate = getEventsForDate(selectedDate);
      onSyncEvents(selectedDate, eventsForDate);
      toast({
        title: "Google Calendar",
        description: `Synced ${eventsForDate.length} events for ${format(selectedDate, 'MMM dd, yyyy')}`,
      });
    }
  };

  const getEventTimeString = (event: CalendarEvent) => {
    const startTime = new Date(event.start.dateTime);
    const endTime = new Date(event.end.dateTime);
    return `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`;
  };

  const eventsForSelectedDate = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <Card className="shadow-lg h-full flex flex-col bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-primary flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Google Calendar
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {isSignedIn 
            ? `${events.length} events in your calendar`
            : "Connect to see your Google Calendar events"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-grow overflow-y-auto p-4">
        {!isInitialized && (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Initializing Google Calendar...</p>
          </div>
        )}

        {isInitialized && missingCredentials && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-center max-w-md">
              <h3 className="font-medium mb-2">API Keys Missing or Invalid</h3>
              <p className="text-sm mb-2">
                Google Calendar integration requires API credentials. Please add them to your .env.local file:
              </p>
              <pre className="bg-background/80 p-2 rounded text-xs text-left overflow-x-auto mb-2">
                NEXT_PUBLIC_GOOGLE_API_KEY=api_key<br/>
                NEXT_PUBLIC_GOOGLE_CLIENT_ID=client_id
              </pre>
              <div className="text-xs text-left bg-background/80 p-2 rounded mb-2">
                <p><strong>Debug Info:</strong></p>
                <p>API Key defined: {process.env.NEXT_PUBLIC_GOOGLE_API_KEY ? 'Yes' : 'No'}</p>
                <p>Client ID defined: {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'Yes' : 'No'}</p>
                <p>API Key length: {process.env.NEXT_PUBLIC_GOOGLE_API_KEY?.length || 0}</p>
                <p>Client ID length: {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.length || 0}</p>
              </div>
              <div className="text-xs text-left mb-3">
                <p className="font-medium mb-1">Common issues:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Server needs to be restarted after adding environment variables</li>
                  <li>API key or Client ID might be malformed</li>
                  <li>OAuth consent screen not properly configured</li>
                  <li>JavaScript origins not added to allowed origins in Google Console</li>
                  <li>Make sure to add http://localhost:3000 to authorized JavaScript origins</li>
                </ul>
              </div>
              <p className="text-xs mb-2">After adding keys, restart the development server.</p>
              <a 
                href="https://console.cloud.google.com/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs mt-2 inline-block text-accent hover:underline"
              >
                Get credentials from Google Cloud Console
              </a>
            </div>
          </div>
        )}

        {isInitialized && !missingCredentials && !isSignedIn && (
          <div className="flex flex-col items-center justify-center h-full">
            <Button onClick={handleLogin} className="bg-primary hover:bg-primary/90">
              <LogIn className="h-4 w-4 mr-2" />
              Connect Google Calendar
            </Button>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Securely connect to your Google Calendar to view and sync events
            </p>
          </div>
        )}

        {isSignedIn && selectedDate && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">
                Events for {format(selectedDate, 'MMMM d, yyyy')}
              </h3>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="text-xs"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleManualSync}
                  disabled={isLoading || !selectedDate}
                  className="text-xs"
                >
                  Sync to Journal
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-2">
              <Switch 
                id="auto-sync" 
                checked={autoSync} 
                onCheckedChange={setAutoSync}
              />
              <Label htmlFor="auto-sync" className="text-xs">Auto-sync events to journal</Label>
            </div>
            
            {isLoading ? (
              <div className="flex flex-col space-y-3 mt-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ) : eventsForSelectedDate.length > 0 ? (
              <div className="space-y-3 mt-4">
                {eventsForSelectedDate.map((event) => (
                  <div 
                    key={event.id} 
                    className="p-3 rounded-md border border-border bg-background/30 hover:bg-background/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-sm">{event.summary}</h4>
                        <p className="text-xs text-muted-foreground">{getEventTimeString(event)}</p>
                      </div>
                      {event.colorId && (
                        <Badge 
                          variant="outline" 
                          className="text-xs" 
                          style={{ borderColor: `var(--google-calendar-${event.colorId})` }}
                        >
                          {event.colorId}
                        </Badge>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-xs mt-1 text-muted-foreground line-clamp-2">{event.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">No events found for this date</p>
              </div>
            )}
          </>
        )}
      </CardContent>

      {isSignedIn && (
        <CardFooter className="border-t border-border pt-4 flex justify-between">
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-destructive/70 hover:text-destructive hover:bg-destructive/10">
            <LogOut className="h-4 w-4 mr-1" />
            Disconnect
          </Button>
          <a 
            href="https://calendar.google.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-accent hover:underline flex items-center"
          >
            Open Google Calendar <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </CardFooter>
      )}
    </Card>
  );
};

export default GoogleCalendarView; 