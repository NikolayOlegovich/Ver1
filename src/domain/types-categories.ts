export type UUID = string;

export type CategoryType = 'base' | 'fixed' | 'org' | 'interest' | 'simple';

export interface Category {
  id: UUID;
  name: string;
  type: CategoryType;
  createdAt: string;
  updatedAt: string;
}

export interface Subcategory {
  id: UUID;
  categoryId: UUID;
  name: string;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContactCategory {
  id: UUID;
  contactId: UUID;
  categoryId: UUID;
  createdAt: string;
}

export interface ContactSubcategory {
  id: UUID;
  contactId: UUID;
  subcategoryId: UUID;
  createdAt: string;
}

export interface CategoryStats {
  categoryId: UUID;
  contactsCount: number;
}

export interface SubcategoryStats {
  subcategoryId: UUID;
  contactsCount: number;
  percentInCategory: number;
}

