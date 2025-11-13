import type { UUID, Category, Subcategory, ContactCategory, ContactSubcategory, CategoryStats, SubcategoryStats } from './types-categories';

export interface CategoryRepo {
  listAll(): Promise<Category[]>;
  getById(id: UUID): Promise<Category | null>;
  upsert(c: Category): Promise<void>;
  remove(id: UUID): Promise<void>;
}

export interface SubcategoryRepo {
  listByCategory(categoryId: UUID): Promise<Subcategory[]>;
  upsert(s: Subcategory): Promise<void>;
  remove(id: UUID): Promise<void>;
}

export interface ContactCategoryRepo {
  listByContact(contactId: UUID): Promise<ContactCategory[]>;
  listContactsByCategory(categoryId: UUID, opts?: { limit?: number; offset?: number }): Promise<UUID[]>;
  add(contactId: UUID, categoryId: UUID): Promise<void>;
  remove(contactId: UUID, categoryId: UUID): Promise<void>;
  countByCategory(categoryId: UUID): Promise<number>;
}

export interface ContactSubcategoryRepo {
  listByContact(contactId: UUID): Promise<ContactSubcategory[]>;
  listContactsBySubcategory(subcategoryId: UUID, opts?: { limit?: number; offset?: number }): Promise<UUID[]>;
  add(contactId: UUID, subcategoryId: UUID): Promise<void>;
  remove(contactId: UUID, subcategoryId: UUID): Promise<void>;
  countBySubcategory(subcategoryId: UUID): Promise<number>;
}

export interface CategoriesStorage {
  categories: CategoryRepo;
  subcategories: SubcategoryRepo;
  contactCategories: ContactCategoryRepo;
  contactSubcategories: ContactSubcategoryRepo;
}

