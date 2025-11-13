// Minimal IndexedDB storage without external deps (Dexie-like responsibilities)
import type { Storage, ContactRepo, SocialProfileRepo, InteractionRepo, ReminderRepo, ScoresRepo } from '../../domain/storage';
import type { UUID, Contact, SocialProfile, Interaction, Reminder, Scores } from '../../domain/types';

const DB_NAME = 'social-capital-db-v1';
const DB_VERSION = 2;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('contacts')) {
        const os = db.createObjectStore('contacts', { keyPath: 'id' });
        os.createIndex('lastName', 'lastName');
        os.createIndex('organization', 'organization');
      }
      if (!db.objectStoreNames.contains('profiles')) {
        const os = db.createObjectStore('profiles', { keyPath: 'id' });
        os.createIndex('contactId', 'contactId');
      }
      if (!db.objectStoreNames.contains('interactions')) {
        const os = db.createObjectStore('interactions', { keyPath: 'id' });
        os.createIndex('contactId_date', ['contactId', 'date']);
        os.createIndex('date', 'date');
      }
      if (!db.objectStoreNames.contains('reminders')) {
        const os = db.createObjectStore('reminders', { keyPath: 'id' });
        os.createIndex('contactId', 'contactId');
        os.createIndex('dueAt', 'dueAt');
      }
      if (!db.objectStoreNames.contains('scores')) {
        db.createObjectStore('scores', { keyPath: 'contactId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T = unknown>(stores: string[], mode: IDBTransactionMode, fn: (db: IDBDatabase, tx: IDBTransaction) => Promise<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(stores, mode);
    fn(db, transaction).then(resolve).catch(reject);
  });
}

const contactsRepo: ContactRepo = {
  async getById(id) {
    return tx(['contacts'], 'readonly', async (_db, t) => new Promise<Contact | null>((res, rej) => {
      const rq = t.objectStore('contacts').get(id);
      rq.onsuccess = () => res((rq.result as Contact) ?? null);
      rq.onerror = () => rej(rq.error);
    }));
  },
  async upsert(contact) {
    contact.updatedAt = contact.updatedAt || new Date().toISOString();
    return tx(['contacts'], 'readwrite', async (_db, t) => new Promise<void>((res, rej) => {
      const rq = t.objectStore('contacts').put(contact);
      rq.onsuccess = () => res();
      rq.onerror = () => rej(rq.error);
    }));
  },
  async searchByNameOrg(query, limit = 20) {
    const q = (query || '').toLowerCase();
    return tx(['contacts'], 'readonly', async (_db, t) => new Promise<Contact[]>((res, rej) => {
      const results: Contact[] = [];
      const rq = t.objectStore('contacts').openCursor();
      rq.onsuccess = () => {
        const cur = rq.result as IDBCursorWithValue | null;
        if (!cur) { res(results); return; }
        const c = cur.value as Contact;
        const hay = `${c.firstName} ${c.lastName} ${c.organization ?? ''}`.toLowerCase();
        if (q === '' || hay.includes(q)) results.push(c);
        if (results.length >= limit) { res(results); return; }
        cur.continue();
      };
      rq.onerror = () => rej(rq.error);
    }));
  }
};

const profilesRepo: SocialProfileRepo = {
  async listByContact(contactId) {
    return tx(['profiles'], 'readonly', async (_db, t) => new Promise<SocialProfile[]>((res, rej) => {
      const idx = t.objectStore('profiles').index('contactId');
      const rq = idx.getAll(IDBKeyRange.only(contactId));
      rq.onsuccess = () => res((rq.result as SocialProfile[]) ?? []);
      rq.onerror = () => rej(rq.error);
    }));
  },
  async upsert(profile) {
    return tx(['profiles'], 'readwrite', async (_db, t) => new Promise<void>((res, rej) => {
      const rq = t.objectStore('profiles').put(profile);
      rq.onsuccess = () => res();
      rq.onerror = () => rej(rq.error);
    }));
  },
  async remove(id) {
    return tx(['profiles'], 'readwrite', async (_db, t) => new Promise<void>((res, rej) => {
      const rq = t.objectStore('profiles').delete(id);
      rq.onsuccess = () => res();
      rq.onerror = () => rej(rq.error);
    }));
  }
};

const interactionsRepo: InteractionRepo = {
  async listByContact(contactId, opts) {
    const limit = opts?.limit ?? 20;
    const offset = opts?.offset ?? 0;
    return tx(['interactions'], 'readonly', async (_db, t) => new Promise<Interaction[]>((res, rej) => {
      const out: Interaction[] = [];
      const idx = t.objectStore('interactions').index('contactId_date');
      const rq = idx.openCursor(IDBKeyRange.bound([contactId, ''], [contactId, '\uffff']), 'prev');
      let skipped = 0;
      rq.onsuccess = () => {
        const cur = rq.result as IDBCursorWithValue | null;
        if (!cur) { res(out); return; }
        if (skipped < offset) { skipped++; cur.continue(); return; }
        out.push(cur.value as Interaction);
        if (out.length >= limit) { res(out); return; }
        cur.continue();
      };
      rq.onerror = () => rej(rq.error);
    }));
  },
  async create(interaction) {
    return tx(['interactions'], 'readwrite', async (_db, t) => new Promise<void>((res, rej) => {
      const rq = t.objectStore('interactions').add(interaction);
      rq.onsuccess = () => res();
      rq.onerror = () => rej(rq.error);
    }));
  },
  async update(interaction) {
    return tx(['interactions'], 'readwrite', async (_db, t) => new Promise<void>((res, rej) => {
      const rq = t.objectStore('interactions').put(interaction);
      rq.onsuccess = () => res();
      rq.onerror = () => rej(rq.error);
    }));
  }
};

const remindersRepo: ReminderRepo = {
  async listByContact(contactId) {
    return tx(['reminders'], 'readonly', async (_db, t) => new Promise<Reminder[]>((res, rej) => {
      const idx = t.objectStore('reminders').index('contactId');
      const rq = idx.getAll(IDBKeyRange.only(contactId));
      rq.onsuccess = () => res((rq.result as Reminder[]) ?? []);
      rq.onerror = () => rej(rq.error);
    }));
  },
  async upsert(reminder) {
    return tx(['reminders'], 'readwrite', async (_db, t) => new Promise<void>((res, rej) => {
      const rq = t.objectStore('reminders').put(reminder);
      rq.onsuccess = () => res();
      rq.onerror = () => rej(rq.error);
    }));
  },
  async markDone(id) {
    const r = await tx(['reminders'], 'readonly', async (_db, t) => new Promise<Reminder | null>((res, rej) => {
      const rq = t.objectStore('reminders').get(id);
      rq.onsuccess = () => res((rq.result as Reminder) ?? null);
      rq.onerror = () => rej(rq.error);
    }));
    if (r) { r.done = true; await this.upsert(r); }
  }
};

const scoresRepo: ScoresRepo = {
  async get(contactId) {
    return tx(['scores'], 'readonly', async (_db, t) => new Promise<Scores | null>((res, rej) => {
      const rq = t.objectStore('scores').get(contactId);
      rq.onsuccess = () => res((rq.result as Scores) ?? null);
      rq.onerror = () => rej(rq.error);
    }));
  },
  async upsert(s) {
    return tx(['scores'], 'readwrite', async (_db, t) => new Promise<void>((res, rej) => {
      const rq = t.objectStore('scores').put(s);
      rq.onsuccess = () => res();
      rq.onerror = () => rej(rq.error);
    }));
  }
};

export function createDexieStorage(): Storage {
  return {
    contacts: contactsRepo,
    profiles: profilesRepo,
    interactions: interactionsRepo,
    reminders: remindersRepo,
    scores: scoresRepo,
  };
}


