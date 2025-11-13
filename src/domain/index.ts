import type { Storage } from './storage';
import type { UUID, Contact, SocialProfile, Interaction, Reminder, Scores } from './types';

// Default factory returns web IndexedDB implementation.
export async function createStorage(): Promise<Storage> {
  const { createDexieStorage } = await import('../infra/dexie/storage');
  return createDexieStorage();
}

export type { Storage };
export type { UUID, Contact, SocialProfile, Interaction, Reminder, Scores } from './types';

