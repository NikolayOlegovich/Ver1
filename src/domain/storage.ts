import type { UUID, Contact, SocialProfile, Interaction, Reminder, Scores } from './types';

export interface ContactRepo {
  getById(id: UUID): Promise<Contact | null>;
  upsert(contact: Contact): Promise<void>;
  searchByNameOrg(query: string, limit?: number): Promise<Contact[]>;
}

export interface SocialProfileRepo {
  listByContact(contactId: UUID): Promise<SocialProfile[]>;
  upsert(profile: SocialProfile): Promise<void>;
  remove(id: UUID): Promise<void>;
}

export interface InteractionRepo {
  listByContact(contactId: UUID, opts?: { limit?: number; offset?: number }): Promise<Interaction[]>;
  create(interaction: Interaction): Promise<void>;
  update(interaction: Interaction): Promise<void>;
}

export interface ReminderRepo {
  listByContact(contactId: UUID): Promise<Reminder[]>;
  upsert(reminder: Reminder): Promise<void>;
  markDone(id: UUID): Promise<void>;
}

export interface ScoresRepo {
  get(contactId: UUID): Promise<Scores | null>;
  upsert(s: Scores): Promise<void>;
}

export interface Storage {
  contacts: ContactRepo;
  profiles: SocialProfileRepo;
  interactions: InteractionRepo;
  reminders: ReminderRepo;
  scores: ScoresRepo;
}

