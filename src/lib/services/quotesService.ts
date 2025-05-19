'use server';

import { supabase } from '../supabase';
import { format } from 'date-fns';
import { MotivationalQuote } from '../types';

export type QuoteEntry = {
  id: string;
  user_id: string;
  text: string;
  author: string | null;
  image_url: string | null;
  date: string; // Format: YYYY-MM-DD
  created_at: string;
  updated_at: string;
};

// Convert database QuoteEntry to MotivationalQuote format
const mapQuoteEntryToMotivationalQuote = (entry: QuoteEntry): MotivationalQuote => ({
  id: entry.id,
  text: entry.text,
  author: entry.author || undefined,
  imageUrl: entry.image_url || undefined,
  dateAdded: entry.created_at,
});

// Get all quotes for a user
export async function getUserQuotes(userId: string): Promise<MotivationalQuote[]> {
  try {
    const { data, error } = await supabase
      .from('motivational_quotes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching quotes:', error);
      return [];
    }
    
    return (data as QuoteEntry[]).map(mapQuoteEntryToMotivationalQuote);
  } catch (err) {
    console.error('Exception fetching quotes:', err);
    return [];
  }
}

// Get quotes for a specific date
export async function getQuotesForDate(date: Date, userId: string): Promise<MotivationalQuote[]> {
  const dateKey = format(date, 'yyyy-MM-dd');
  
  try {
    const { data, error } = await supabase
      .from('motivational_quotes')
      .select('*')
      .eq('date', dateKey)
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error fetching quotes for date:', error);
      return [];
    }
    
    return (data as QuoteEntry[]).map(mapQuoteEntryToMotivationalQuote);
  } catch (err) {
    console.error('Exception fetching quotes for date:', err);
    return [];
  }
}

// Save a quote to database
export async function saveQuote(
  quote: Omit<MotivationalQuote, 'id'>, 
  userId: string, 
  date: Date
): Promise<MotivationalQuote | null> {
  const dateKey = format(date, 'yyyy-MM-dd');
  
  try {
    const entry = {
      user_id: userId,
      text: quote.text,
      author: quote.author || null,
      image_url: quote.imageUrl || null,
      date: dateKey,
    };
    
    const { data, error } = await supabase
      .from('motivational_quotes')
      .insert(entry)
      .select('*')
      .single();
      
    if (error) {
      console.error('Error saving quote:', error);
      return null;
    }
    
    return mapQuoteEntryToMotivationalQuote(data as QuoteEntry);
  } catch (err) {
    console.error('Exception saving quote:', err);
    return null;
  }
}

// Update an existing quote
export async function updateQuote(
  id: string, 
  updates: Partial<Omit<MotivationalQuote, 'id' | 'dateAdded'>>, 
  userId: string
): Promise<MotivationalQuote | null> {
  try {
    const entry = {
      ...(updates.text !== undefined && { text: updates.text }),
      ...(updates.author !== undefined && { author: updates.author || null }),
      ...(updates.imageUrl !== undefined && { image_url: updates.imageUrl || null }),
    };
    
    const { data, error } = await supabase
      .from('motivational_quotes')
      .update(entry)
      .eq('id', id)
      .eq('user_id', userId) // Extra safety check
      .select('*')
      .single();
      
    if (error) {
      console.error('Error updating quote:', error);
      return null;
    }
    
    return mapQuoteEntryToMotivationalQuote(data as QuoteEntry);
  } catch (err) {
    console.error('Exception updating quote:', err);
    return null;
  }
}

// Delete a quote
export async function deleteQuote(id: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('motivational_quotes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Extra safety check
      
    if (error) {
      console.error('Error deleting quote:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Exception deleting quote:', err);
    return false;
  }
}

// Import quotes from local storage to database
export async function importQuotesToDatabase(
  quotes: MotivationalQuote[], 
  userId: string, 
  date: Date
): Promise<MotivationalQuote[]> {
  if (!quotes.length) return [];
  
  try {
    // Map quotes to database format
    const entries = quotes.map(quote => ({
      user_id: userId,
      text: quote.text,
      author: quote.author || null,
      image_url: quote.imageUrl || null,
      date: format(date, 'yyyy-MM-dd'),
    }));
    
    const { data, error } = await supabase
      .from('motivational_quotes')
      .insert(entries)
      .select('*');
      
    if (error) {
      console.error('Error importing quotes:', error);
      return [];
    }
    
    return (data as QuoteEntry[]).map(mapQuoteEntryToMotivationalQuote);
  } catch (err) {
    console.error('Exception importing quotes:', err);
    return [];
  }
} 