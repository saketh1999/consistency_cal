'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { addFeaturedImageUrlColumn } from '@/lib/utils/databaseFix';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string }>({});

  const handleFixDatabase = async () => {
    setIsUpdating(true);
    try {
      const result = await addFeaturedImageUrlColumn();
      setResult(result);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fixing database:', error);
      setResult({ 
        success: false, 
        message: 'An unexpected error occurred. See console for details.'
      });
      toast({
        title: "Error",
        description: "Failed to update database. See console for details.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
        <p>You must be logged in to access this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Database Schema Fix</CardTitle>
          <CardDescription>
            Add the missing featured_image_url column to the daily_entries table
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This will add the featured_image_url column to your daily_entries table in Supabase.
            This is required for the featured image functionality to work properly.
          </p>
          {result.message && (
            <div className={`p-3 rounded mb-4 ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {result.message}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleFixDatabase} 
            disabled={isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Fix Database Schema'}
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Alternative Manual Fix</h2>
        <p className="mb-2">If the automatic fix doesn't work, you can manually add the column in the Supabase SQL editor:</p>
        <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
          ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS featured_image_url TEXT;
        </pre>
      </div>
    </div>
  );
} 