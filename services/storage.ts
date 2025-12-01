
import { UpdateFeature } from '../types';
import { LEGACY_UPDATE_DATA } from '../constants';

// Base URL for the API (relative to the site root)
const API_BASE = '/api/updates';

/**
 * Fetch updates from the MongoDB backend.
 * Returns a merged list of stored updates (from the DB) and static updates that have not been deleted.
 */
export const getStoredUpdates = async (): Promise<UpdateFeature[]> => {
  try {
    // 1. Get updates from the backend (MongoDB)
    const response = await fetch(API_BASE, { method: 'GET' });
    const dbUpdates: UpdateFeature[] = response.ok ? await response.json() : [];

    // 2. Get deleted static IDs from localStorage (still used for legacy static removal)
    const deletedIds = getDeletedIds();

    // 3. Filter static updates that are not deleted
    const activeStaticUpdates = LEGACY_UPDATE_DATA.filter(u => !deletedIds.includes(u.id));

    // 4. Merge: backend updates (which may include edited static ones) + remaining static updates
    return [...dbUpdates, ...activeStaticUpdates];
  } catch (error) {
    console.error('Error loading updates from API', error);
    return [];
  }
};

/** Helper to get deleted IDs for static updates (still stored locally) */
const getDeletedIds = (): string[] => {
  try {
    const stored = localStorage.getItem('complex_legacy_deleted_ids');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/** Save a new update to the backend */
export const saveUpdate = async (update: UpdateFeature): Promise<UpdateFeature> => {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });
  if (!response.ok) {
    throw new Error('Failed to save update');
  }
  return (await response.json()) as UpdateFeature;
};

/** Update an existing update on the backend */
export const updateUpdate = async (updatedFeature: UpdateFeature): Promise<UpdateFeature> => {
  const response = await fetch(`${API_BASE}/${updatedFeature.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedFeature),
  });
  if (!response.ok) {
    throw new Error('Failed to update update');
  }
  return (await response.json()) as UpdateFeature;
};

/** Delete an update from the backend */
export const deleteUpdate = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error('Failed to delete update');
  }
  // Also keep local blocklist for static deletions
  const deletedIds = getDeletedIds();
  if (!deletedIds.includes(id)) {
    deletedIds.push(id);
    localStorage.setItem('complex_legacy_deleted_ids', JSON.stringify(deletedIds));
  }
};

/** Convert a File to a Base64 data URL */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
