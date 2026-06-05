import { supabase } from './supabase';
import { assertAdminClient } from './require-admin-client';
import type { ActivityEntry } from './activity';

export type MediaType = 'Anime' | 'Manga' | 'Manhwa' | 'Manhua';
export type MediaTypeFilter = 'All' | MediaType;

export const MEDIA_TYPES = ['Anime', 'Manga', 'Manhwa', 'Manhua'] as const;

export interface CollectionItem {
  id: number;
  created_at: string;
  title: string;
  type: MediaType;
  status: 'Watching' | 'Completed' | 'Plan to Watch';
  genre: string;
  rating: number;
  progress_current: number;
  progress_total: number;
  cover_image: string;
}

export interface Suggestion {
  id: number;
  created_at: string;
  title: string;
  type: MediaType;
  description: string;
  status: string;
  votes: number;
  cover_image: string;
}

const EMPTY_COLLECTION: CollectionItem[] = [];
const EMPTY_SUGGESTIONS: Suggestion[] = [];

// Helper to check if we are in client browser environment
const isClient = typeof window !== 'undefined';

// Local storage keys
const STORAGE_KEYS = {
  COLLECTION: 'ninalist_collection',
  SUGGESTIONS: 'ninalist_suggestions',
  ACTIVITY: 'ninalist_activity',
};

const getLocalData = <T>(key: string, initial: T[]): T[] => {
  if (!isClient) return initial;
  const stored = localStorage.getItem(key);
  if (!stored) return initial;
  try {
    return JSON.parse(stored);
  } catch {
    return initial;
  }
};

async function requireAdminForCollectionWrite(): Promise<boolean> {
  return assertAdminClient();
}

function appendLocalActivity(entry: Omit<ActivityEntry, 'id' | 'created_at'>) {
  const activities = getLocalData<ActivityEntry>(STORAGE_KEYS.ACTIVITY, []);
  const newEntry: ActivityEntry = {
    ...entry,
    id: activities.length > 0 ? Math.max(...activities.map((a) => a.id)) + 1 : 1,
    created_at: new Date().toISOString(),
  };
  setLocalData(STORAGE_KEYS.ACTIVITY, [newEntry, ...activities].slice(0, 200));
}

function logLocalCollectionPatch(existing: CollectionItem, updates: Partial<CollectionItem>) {
  if (updates.status === 'Completed' && existing.status !== 'Completed') {
    appendLocalActivity({
      action: 'completed_series',
      item_id: existing.id,
      title: existing.title,
      detail: `Score: ${updates.rating ?? existing.rating}/10`,
      media_type: existing.type,
    });
    return;
  }

  if (
    typeof updates.progress_current === 'number' &&
    updates.progress_current > existing.progress_current
  ) {
    const isAnime = existing.type === 'Anime';
    appendLocalActivity({
      action: isAnime ? 'watched_episode' : 'read_chapter',
      item_id: existing.id,
      title: existing.title,
      detail: isAnime
        ? `Episode ${updates.progress_current}`
        : `Chapter ${updates.progress_current}`,
      media_type: existing.type,
    });
    return;
  }

  if (typeof updates.rating === 'number' && updates.rating !== existing.rating) {
    appendLocalActivity({
      action: 'updated_rating',
      item_id: existing.id,
      title: existing.title,
      detail: `Score: ${updates.rating}/10`,
      media_type: existing.type,
    });
  }
}

const setLocalData = <T>(key: string, data: T[]) => {
  if (isClient) {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

// DATABASE OPERATIONS WITH DYNAMIC FALLBACK
export const supabaseService = {
  // COLLECTION SERVICES
  async getCollection(): Promise<CollectionItem[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('collection')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return data as CollectionItem[];
        console.warn('Supabase collection fetch failed, falling back to local/mock:', error);
      } catch (err) {
        console.warn('Supabase collection error, using fallback:', err);
      }
    }
    return getLocalData(STORAGE_KEYS.COLLECTION, EMPTY_COLLECTION);
  },

  async getActivities(): Promise<ActivityEntry[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('activity_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        if (!error && data) return data as ActivityEntry[];
        console.warn('Supabase activity fetch failed, using fallback:', error);
      } catch (err) {
        console.warn('Supabase activity fetch error:', err);
      }
    }
    return getLocalData<ActivityEntry>(STORAGE_KEYS.ACTIVITY, []);
  },

  async addCollectionItem(
    item: Omit<CollectionItem, 'id' | 'created_at'>
  ): Promise<{ item: CollectionItem | null; error?: string }> {
    if (!(await requireAdminForCollectionWrite())) {
      return { item: null, error: 'Admin sign-in required.' };
    }

    if (supabase) {
      try {
        const response = await fetch('/api/collection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(item),
        });
        const payload = await response.json().catch(() => ({}));
        if (response.ok) return { item: payload as CollectionItem };
        const message = typeof payload.error === 'string' ? payload.error : 'Failed to add entry.';
        console.warn('Collection insert API failed:', message);
        return { item: null, error: message };
      } catch (err) {
        console.warn('Collection insert API error:', err);
        return { item: null, error: 'Network error while saving entry.' };
      }
    }

    const localItems = getLocalData(STORAGE_KEYS.COLLECTION, EMPTY_COLLECTION);
    const newItem: CollectionItem = {
      ...item,
      id: localItems.length > 0 ? Math.max(...localItems.map(i => i.id)) + 1 : 1,
      created_at: new Date().toISOString()
    };
    const updated = [newItem, ...localItems];
    setLocalData(STORAGE_KEYS.COLLECTION, updated);
    appendLocalActivity({
      action: 'added_entry',
      item_id: newItem.id,
      title: newItem.title,
      detail: `Added to ${newItem.type} list`,
      media_type: newItem.type,
    });
    return { item: newItem };
  },

  async updateCollectionProgress(id: number, progress: number): Promise<boolean> {
    if (!(await requireAdminForCollectionWrite())) return false;

    const allItems = await this.getCollection();
    const existing = allItems.find((item) => item.id === id);
    const nextProgress = existing ? Math.min(progress, existing.progress_total) : progress;
    const updates: Partial<CollectionItem> = { progress_current: nextProgress };
    if (existing && nextProgress >= existing.progress_total) {
      updates.status = 'Completed';
    }

    if (supabase) {
      try {
        const response = await fetch(`/api/collection/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updates),
        });
        if (response.ok) return true;
        console.warn('Collection progress API failed:', await response.text());
        return false;
      } catch (err) {
        console.warn('Collection progress API error:', err);
        return false;
      }
    }

    const localItems = getLocalData(STORAGE_KEYS.COLLECTION, EMPTY_COLLECTION);
    const updated = localItems.map(item => {
      if (item.id === id) {
        const nextItem = { ...item, ...updates };
        if (existing) logLocalCollectionPatch(existing, updates);
        return nextItem;
      }
      return item;
    });
    setLocalData(STORAGE_KEYS.COLLECTION, updated);
    return true;
  },

  async updateCollectionRating(id: number, rating: number): Promise<boolean> {
    if (!(await requireAdminForCollectionWrite())) return false;

    const allItems = await this.getCollection();
    const existing = allItems.find((item) => item.id === id);

    if (supabase) {
      try {
        const response = await fetch(`/api/collection/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ rating }),
        });
        if (response.ok) return true;
        return false;
      } catch (err) {
        console.warn('Collection rating API error:', err);
        return false;
      }
    }

    const localItems = getLocalData(STORAGE_KEYS.COLLECTION, EMPTY_COLLECTION);
    const updated = localItems.map(item => {
      if (item.id === id) {
        if (existing) logLocalCollectionPatch(existing, { rating });
        return { ...item, rating };
      }
      return item;
    });
    setLocalData(STORAGE_KEYS.COLLECTION, updated);
    return true;
  },

  // SUGGESTIONS SERVICES
  async getSuggestions(): Promise<Suggestion[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('suggestions')
          .select('*')
          .order('votes', { ascending: false });
        if (!error && data) return data as Suggestion[];
        console.warn('Supabase suggestions fetch failed, using fallback:', error);
      } catch (err) {
        console.warn('Supabase suggestions fetch error:', err);
      }
    }
    return getLocalData(STORAGE_KEYS.SUGGESTIONS, EMPTY_SUGGESTIONS);
  },

  async addSuggestion(suggestion: Omit<Suggestion, 'id' | 'created_at' | 'votes' | 'status'>): Promise<Suggestion> {
    const fullSuggestion = {
      ...suggestion,
      votes: 0,
      status: 'Pending Review'
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('suggestions')
          .insert([fullSuggestion])
          .select();
        if (!error && data && data[0]) return data[0] as Suggestion;
        console.warn('Supabase suggestion insert failed, using fallback:', error);
      } catch (err) {
        console.warn('Supabase suggestion insert error:', err);
      }
    }

    const localSuggestions = getLocalData(STORAGE_KEYS.SUGGESTIONS, EMPTY_SUGGESTIONS);
    const newSuggestion: Suggestion = {
      ...fullSuggestion,
      id: localSuggestions.length > 0 ? Math.max(...localSuggestions.map(s => s.id)) + 1 : 1,
      created_at: new Date().toISOString()
    };
    const updated = [newSuggestion, ...localSuggestions];
    setLocalData(STORAGE_KEYS.SUGGESTIONS, updated);
    return newSuggestion;
  },

  async voteSuggestion(id: number): Promise<number | null> {
    if (supabase) {
      try {
        // Fetch current votes
        const { data: fetchResult, error: fetchError } = await supabase
          .from('suggestions')
          .select('votes')
          .eq('id', id)
          .single();

        if (!fetchError && fetchResult) {
          const nextVotes = (fetchResult.votes || 0) + 1;
          const { error: updateError } = await supabase
            .from('suggestions')
            .update({ votes: nextVotes })
            .eq('id', id);
          if (!updateError) return nextVotes;
        }
        console.warn('Supabase vote transaction failed, using fallback');
      } catch (err) {
        console.warn('Supabase vote error:', err);
      }
    }

    const localSuggestions = getLocalData(STORAGE_KEYS.SUGGESTIONS, EMPTY_SUGGESTIONS);
    let nextVotes = 1;
    const updated = localSuggestions.map(s => {
      if (s.id === id) {
        nextVotes = s.votes + 1;
        return { ...s, votes: nextVotes };
      }
      return s;
    });
    setLocalData(STORAGE_KEYS.SUGGESTIONS, updated);
    return nextVotes;
  },

  async deleteCollectionItem(id: number): Promise<boolean> {
    if (!(await requireAdminForCollectionWrite())) return false;

    if (supabase) {
      try {
        const response = await fetch(`/api/collection/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (response.ok) return true;
        console.warn('Collection delete API failed:', await response.text());
        return false;
      } catch (err) {
        console.warn('Collection delete API error:', err);
        return false;
      }
    }

    const localItems = getLocalData<CollectionItem>(STORAGE_KEYS.COLLECTION, EMPTY_COLLECTION);
    const updated = localItems.filter(item => item.id !== id);
    setLocalData(STORAGE_KEYS.COLLECTION, updated);
    return true;
  },

  async updateCollectionItem(id: number, item: Partial<Omit<CollectionItem, 'id' | 'created_at'>>): Promise<boolean> {
    if (!(await requireAdminForCollectionWrite())) return false;

    if (supabase) {
      try {
        const response = await fetch(`/api/collection/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(item),
        });
        if (response.ok) return true;
        console.warn('Collection update API failed:', await response.text());
        return false;
      } catch (err) {
        console.warn('Collection update API error:', err);
        return false;
      }
    }

    const localItems = getLocalData<CollectionItem>(STORAGE_KEYS.COLLECTION, EMPTY_COLLECTION);
    const updated = localItems.map(existing => {
      if (existing.id === id) {
        logLocalCollectionPatch(existing, item);
        return { ...existing, ...item };
      }
      return existing;
    });
    setLocalData(STORAGE_KEYS.COLLECTION, updated);
    return true;
  }
};
