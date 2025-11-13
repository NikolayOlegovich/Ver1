import type { UUID } from '../types-categories';
import type { CategoriesStorage } from '../storage-categories';
import { createStorage } from '../index';

export async function getUnsortedContactIds(store: CategoriesStorage): Promise<UUID[]> {
  const contactsStore = await createStorage();
  // Fetch many contacts via search with empty query
  const all = await contactsStore.contacts.searchByNameOrg('', 100000);
  const out: UUID[] = [];
  for (const c of all) {
    const cc = await store.contactCategories.listByContact(c.id);
    if (!cc.length) out.push(c.id);
  }
  return out;
}

export async function listContactsForRefine(store: CategoriesStorage, categoryId: UUID): Promise<UUID[]> {
  const subcats = await store.subcategories.listByCategory(categoryId);
  const subIds = new Set(subcats.map(s => s.id));
  const inCategory = await store.contactCategories.listContactsByCategory(categoryId, { limit: 100000 });
  const result: UUID[] = [];
  for (const id of inCategory) {
    const links = await store.contactSubcategories.listByContact(id);
    const hasAny = links.some(l => subIds.has(l.subcategoryId));
    if (!hasAny) result.push(id);
  }
  return result;
}

export async function addContactsToCategory(store: CategoriesStorage, contactIds: UUID[], categoryId: UUID): Promise<void> {
  for (const id of contactIds) {
    await store.contactCategories.add(id, categoryId);
  }
}

export async function addContactsToSubcategory(store: CategoriesStorage, contactIds: UUID[], subcategoryId: UUID): Promise<void> {
  for (const id of contactIds) {
    await store.contactSubcategories.add(id, subcategoryId);
  }
}

