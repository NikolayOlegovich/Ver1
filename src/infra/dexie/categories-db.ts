// IndexedDB implementation for categories-related storage (no Dexie runtime)
import type { CategoriesStorage, CategoryRepo, SubcategoryRepo, ContactCategoryRepo, ContactSubcategoryRepo } from '../../domain/storage-categories';
import type { UUID, Category, Subcategory, ContactCategory, ContactSubcategory } from '../../domain/types-categories';

const DB_NAME = 'social-capital-db-v1';
const DB_VERSION = 2; // bump if new object stores added

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      // Ensure existing stores from other modules are respected
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

      // Categories domain
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('subcategories')) {
        const os = db.createObjectStore('subcategories', { keyPath: 'id' });
        os.createIndex('categoryId', 'categoryId');
      }
      if (!db.objectStoreNames.contains('contactCategories')) {
        const os = db.createObjectStore('contactCategories', { keyPath: 'id' });
        os.createIndex('categoryId', 'categoryId');
        os.createIndex('contactId', 'contactId');
        os.createIndex('contactId_categoryId', ['contactId', 'categoryId']);
      }
      if (!db.objectStoreNames.contains('contactSubcategories')) {
        const os = db.createObjectStore('contactSubcategories', { keyPath: 'id' });
        os.createIndex('subcategoryId', 'subcategoryId');
        os.createIndex('contactId', 'contactId');
        os.createIndex('contactId_subcategoryId', ['contactId', 'subcategoryId']);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(stores: string[], mode: IDBTransactionMode, fn: (db: IDBDatabase, t: IDBTransaction) => Promise<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(stores, mode);
    fn(db, t).then(resolve).catch(reject);
  });
}

const categoriesRepo: CategoryRepo = {
  async listAll() {
    return tx(['categories'], 'readonly', async (_db, t) => new Promise<Category[]>((res, rej) => {
      const rq = t.objectStore('categories').getAll();
      rq.onsuccess = () => res((rq.result as Category[]) ?? []);
      rq.onerror = () => rej(rq.error);
    }));
  },
  async getById(id) {
    return tx(['categories'], 'readonly', async (_db, t) => new Promise<Category | null>((res, rej) => {
      const rq = t.objectStore('categories').get(id);
      rq.onsuccess = () => res((rq.result as Category) ?? null);
      rq.onerror = () => rej(rq.error);
    }));
  },
  async upsert(c) {
    c.updatedAt = c.updatedAt || new Date().toISOString();
    return tx(['categories'], 'readwrite', async (_db, t) => new Promise<void>((res, rej) => {
      const rq = t.objectStore('categories').put(c);
      rq.onsuccess = () => res();
      rq.onerror = () => rej(rq.error);
    }));
  },
  async remove(id) {
    return tx(['categories'], 'readwrite', async (_db, t) => new Promise<void>((res, rej) => {
      const rq = t.objectStore('categories').delete(id);
      rq.onsuccess = () => res();
      rq.onerror = () => rej(rq.error);
    }));
  }
};

const subcategoriesRepo: SubcategoryRepo = {
  async listByCategory(categoryId) {
    return tx(['subcategories'], 'readonly', async (_db, t) => new Promise<Subcategory[]>((res, rej) => {
      const idx = t.objectStore('subcategories').index('categoryId');
      const rq = idx.getAll(IDBKeyRange.only(categoryId));
      rq.onsuccess = () => res((rq.result as Subcategory[]) ?? []);
      rq.onerror = () => rej(rq.error);
    }));
  },
  async upsert(s) {
    s.updatedAt = s.updatedAt || new Date().toISOString();
    return tx(['subcategories'], 'readwrite', async (_db, t) => new Promise<void>((res, rej) => {
      const rq = t.objectStore('subcategories').put(s);
      rq.onsuccess = () => res();
      rq.onerror = () => rej(rq.error);
    }));
  },
  async remove(id) {
    // Also remove related ContactSubcategory links
    await tx(['contactSubcategories'], 'readwrite', async (_db, t) => new Promise<void>((res, rej) => {
      const idx = t.objectStore('contactSubcategories').index('subcategoryId');
      const rq = idx.openCursor(IDBKeyRange.only(id));
      rq.onsuccess = () => {
        const cur = rq.result as IDBCursorWithValue | null;
        if (!cur) { res(); return; }
        cur.delete();
        cur.continue();
      };
      rq.onerror = () => rej(rq.error);
    }));
    return tx(['subcategories'], 'readwrite', async (_db, t) => new Promise<void>((res, rej) => {
      const rq = t.objectStore('subcategories').delete(id);
      rq.onsuccess = () => res();
      rq.onerror = () => rej(rq.error);
    }));
  }
};

const contactCategoriesRepo: ContactCategoryRepo = {
  async listByContact(contactId) {
    return tx(['contactCategories'], 'readonly', async (_db, t) => new Promise<ContactCategory[]>((res, rej) => {
      const idx = t.objectStore('contactCategories').index('contactId');
      const rq = idx.getAll(IDBKeyRange.only(contactId));
      rq.onsuccess = () => res((rq.result as ContactCategory[]) ?? []);
      rq.onerror = () => rej(rq.error);
    }));
  },
  async listContactsByCategory(categoryId, opts) {
    const limit = opts?.limit ?? 1000;
    const offset = opts?.offset ?? 0;
    return tx(['contactCategories'], 'readonly', async (_db, t) => new Promise<UUID[]>((res, rej) => {
      const idx = t.objectStore('contactCategories').index('categoryId');
      const rq = idx.openCursor(IDBKeyRange.only(categoryId));
      const out: UUID[] = [];
      const seen = new Set<string>();
      let skipped = 0;
      rq.onsuccess = () => {
        const cur = rq.result as IDBCursorWithValue | null;
        if (!cur) { res(out); return; }
        const val = cur.value as ContactCategory;
        if (!seen.has(val.contactId)) {
          if (skipped < offset) { skipped++; }
          else if (out.length < limit) { out.push(val.contactId); }
          seen.add(val.contactId);
        }
        if (out.length >= limit) { res(out); return; }
        cur.continue();
      };
      rq.onerror = () => rej(rq.error);
    }));
  },
  async add(contactId, categoryId) {
    // Avoid duplicates using composite index
    const exists = await tx(['contactCategories'], 'readonly', async (_db, t) => new Promise<boolean>((res, rej) => {
      const idx = t.objectStore('contactCategories').index('contactId_categoryId');
      const rq = idx.get([contactId, categoryId]);
      rq.onsuccess = () => res(!!rq.result);
      rq.onerror = () => rej(rq.error);
    }));
    if (exists) return;
    return tx(['contactCategories'], 'readwrite', async (_db, t) => new Promise<void>((res, rej) => {
      const rec: ContactCategory = { id: crypto.randomUUID(), contactId, categoryId, createdAt: new Date().toISOString() };
      const rq = t.objectStore('contactCategories').add(rec);
      rq.onsuccess = () => res();
      rq.onerror = () => rej(rq.error);
    }));
  },
  async remove(contactId, categoryId) {
    // find by composite index and delete
    return tx(['contactCategories'], 'readwrite', async (_db, t) => new Promise<void>((res, rej) => {
      const idx = t.objectStore('contactCategories').index('contactId_categoryId');
      const rq = idx.openCursor(IDBKeyRange.only([contactId, categoryId]));
      rq.onsuccess = () => {
        const cur = rq.result as IDBCursorWithValue | null;
        if (!cur) { res(); return; }
        cur.delete();
        cur.continue();
      };
      rq.onerror = () => rej(rq.error);
    }));
  },
  async countByCategory(categoryId) {
    return tx(['contactCategories'], 'readonly', async (_db, t) => new Promise<number>((res, rej) => {
      const idx = t.objectStore('contactCategories').index('categoryId');
      const rq = idx.count(IDBKeyRange.only(categoryId));
      rq.onsuccess = () => res((rq.result as number) ?? 0);
      rq.onerror = () => rej(rq.error);
    }));
  }
};

const contactSubcategoriesRepo: ContactSubcategoryRepo = {
  async listByContact(contactId) {
    return tx(['contactSubcategories'], 'readonly', async (_db, t) => new Promise<ContactSubcategory[]>((res, rej) => {
      const idx = t.objectStore('contactSubcategories').index('contactId');
      const rq = idx.getAll(IDBKeyRange.only(contactId));
      rq.onsuccess = () => res((rq.result as ContactSubcategory[]) ?? []);
      rq.onerror = () => rej(rq.error);
    }));
  },
  async listContactsBySubcategory(subcategoryId, opts) {
    const limit = opts?.limit ?? 1000;
    const offset = opts?.offset ?? 0;
    return tx(['contactSubcategories'], 'readonly', async (_db, t) => new Promise<UUID[]>((res, rej) => {
      const idx = t.objectStore('contactSubcategories').index('subcategoryId');
      const rq = idx.openCursor(IDBKeyRange.only(subcategoryId));
      const out: UUID[] = [];
      const seen = new Set<string>();
      let skipped = 0;
      rq.onsuccess = () => {
        const cur = rq.result as IDBCursorWithValue | null;
        if (!cur) { res(out); return; }
        const val = cur.value as ContactSubcategory;
        if (!seen.has(val.contactId)) {
          if (skipped < offset) { skipped++; }
          else if (out.length < limit) { out.push(val.contactId); }
          seen.add(val.contactId);
        }
        if (out.length >= limit) { res(out); return; }
        cur.continue();
      };
      rq.onerror = () => rej(rq.error);
    }));
  },
  async add(contactId, subcategoryId) {
    const exists = await tx(['contactSubcategories'], 'readonly', async (_db, t) => new Promise<boolean>((res, rej) => {
      const idx = t.objectStore('contactSubcategories').index('contactId_subcategoryId');
      const rq = idx.get([contactId, subcategoryId]);
      rq.onsuccess = () => res(!!rq.result);
      rq.onerror = () => rej(rq.error);
    }));
    if (exists) return;
    return tx(['contactSubcategories'], 'readwrite', async (_db, t) => new Promise<void>((res, rej) => {
      const rec: ContactSubcategory = { id: crypto.randomUUID(), contactId, subcategoryId, createdAt: new Date().toISOString() };
      const rq = t.objectStore('contactSubcategories').add(rec);
      rq.onsuccess = () => res();
      rq.onerror = () => rej(rq.error);
    }));
  },
  async remove(contactId, subcategoryId) {
    return tx(['contactSubcategories'], 'readwrite', async (_db, t) => new Promise<void>((res, rej) => {
      const idx = t.objectStore('contactSubcategories').index('contactId_subcategoryId');
      const rq = idx.openCursor(IDBKeyRange.only([contactId, subcategoryId]));
      rq.onsuccess = () => {
        const cur = rq.result as IDBCursorWithValue | null;
        if (!cur) { res(); return; }
        cur.delete();
        cur.continue();
      };
      rq.onerror = () => rej(rq.error);
    }));
  },
  async countBySubcategory(subcategoryId) {
    return tx(['contactSubcategories'], 'readonly', async (_db, t) => new Promise<number>((res, rej) => {
      const idx = t.objectStore('contactSubcategories').index('subcategoryId');
      const rq = idx.count(IDBKeyRange.only(subcategoryId));
      rq.onsuccess = () => res((rq.result as number) ?? 0);
      rq.onerror = () => rej(rq.error);
    }));
  }
};

export const categoriesStorageDexie: CategoriesStorage = {
  categories: categoriesRepo,
  subcategories: subcategoriesRepo,
  contactCategories: contactCategoriesRepo,
  contactSubcategories: contactSubcategoriesRepo,
};

