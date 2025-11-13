import type { CategoriesStorage } from '../storage-categories';
import type { Category, Subcategory } from '../types-categories';

export async function seedDefaultCategories(store: CategoriesStorage): Promise<void> {
  const now = new Date().toISOString();
  const names: Array<{ name: string; type: Category['type']; subcats?: string[] }> = [
    { name: 'Семья', type: 'simple' },
    { name: 'Друзья', type: 'simple' },
    { name: 'Близкие', type: 'simple' },
    { name: 'Знакомые', type: 'simple' },
    { name: 'Старшие товарищи', type: 'fixed', subcats: ['По бизнесу', 'По карьере', 'Личностный рост', 'Прочее'] },
    { name: 'Коллеги', type: 'fixed', subcats: ['Руководители', 'Свой круг', 'Параллель', 'Подчинённые'] },
    { name: 'Работал раньше', type: 'org' },
    { name: 'По интересам', type: 'interest' },
  ];

  const existing = await store.categories.listAll();
  const byName = new Map(existing.map(c => [c.name, c] as const));

  for (const def of names) {
    let cat = byName.get(def.name);
    if (!cat) {
      cat = { id: crypto.randomUUID(), name: def.name, type: def.type, createdAt: now, updatedAt: now };
      await store.categories.upsert(cat);
    }
    if (def.subcats && def.subcats.length) {
      const current = await store.subcategories.listByCategory(cat.id);
      const existingSet = new Set(current.map(s => s.name));
      for (const sname of def.subcats) {
        if (!existingSet.has(sname)) {
          const s: Subcategory = { id: crypto.randomUUID(), categoryId: cat.id, name: sname, order: undefined, createdAt: now, updatedAt: now };
          await store.subcategories.upsert(s);
        }
      }
    }
  }
}

