export type UUID = string;

export type Channel = 'meeting' | 'call' | 'chat' | 'email' | 'other';
export type Source = 'linkedin' | 'facebook' | 'telegram' | 'github' | 'website' | 'other';
export type ReminderType = 'birthday' | 'followup' | 'nextStep';

export interface Contact {
  id: UUID;
  firstName: string;
  lastName: string;
  middleName?: string;
  phones: string[];
  emails: string[];
  organization?: string;
  position?: string;
  birthday?: string; // ISO
  photoUri?: string; // local file uri or base64
  notes?: string;
  tags: string[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
  lastInteractionAt?: string; // ISO
}

export interface SocialProfile {
  id: UUID;
  contactId: UUID;
  source: Source;
  url: string;
  fieldsJson: string; // cached JSON of scraped public fields
  addedAt: string;
  lastCheckedAt?: string;
}

export interface Interaction {
  id: UUID;
  contactId: UUID;
  date: string; // ISO
  channel: Channel;
  channelNote?: string; // уточнение канала при выборе "other"
  durationMinutes?: number; // длительность взаимодействия в минутах
  summary?: string;
  usefulnessInteraction?: number; // 1..5
  keepInTouch?: boolean;
  allyPotential?: boolean;
  nextStep?: string;
  nextStepDue?: string; // ISO
  nextStepDone?: boolean; // default false
}

export interface Reminder {
  id: UUID;
  contactId?: UUID;
  title: string;
  type: ReminderType;
  dueAt: string; // ISO
  done: boolean;
}

export interface Scores {
  contactId: UUID;
  completeness: number; // 0..100
  warmth: number; // 0..100
  valueScore: number; // 1..5 (manual rating of contact value)
}
