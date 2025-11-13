import { useEffect, useMemo, useState } from 'react';
import { categoriesStorageDexie } from '../infra/dexie/categories-db';
import type { Category, Subcategory } from '../domain/types-categories';
import type { UUID, Contact } from '../domain/types';
import { seedDefaultCategories } from '../domain/seed/seedCategories';
import { getUnsortedContactIds, listContactsForRefine } from '../domain/services/categories';
import { BlackCountBadge } from '../components/common/BlackCountBadge';
import { HelpHint } from '../components/common/HelpHint';
import { CATEGORY_HINTS } from '../content/category-hints';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Plus, ArrowLeft, HelpCircle } from 'lucide-react';
import { AssignContactsDialog } from '../components/categories/AssignContactsDialog';
import { AssignContactsToSubcatDialog } from '../components/categories/AssignContactsToSubcatDialog';
import { AssignCategoryDialog } from '../components/categories/AssignCategoryDialog';
import { CreateSubcategoryDialog } from '../components/categories/CreateSubcategoryDialog';
import { createStorage } from '../domain';
import { ContactListItem } from '../components/common/ContactListItem';

type View = { kind: 'list' } | { kind: 'detail'; id: UUID } | { kind: 'toSort' };

export function CategoriesScreen() {
  const [loaded, setLoaded] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [view, setView] = useState<View>({ kind: 'list' });
  const [unsortedCount, setUnsortedCount] = useState(0);

  useEffect(()=>{(async()=>{
    await seedDefaultCategories(categoriesStorageDexie);
    await refreshAll();
    setLoaded(true);
  })();},[]);

  async function refreshAll(){
    const list = await categoriesStorageDexie.categories.listAll();
    setCategories(list);
    const map: Record<string, number> = {};
    for (const c of list) {
      map[c.id] = await categoriesStorageDexie.contactCategories.countByCategory(c.id);
    }
    setCounts(map);
    const unsorted = await getUnsortedContactIds(categoriesStorageDexie);
    setUnsortedCount(unsorted.length);
  }

  if (!loaded) return <div className="p-4">Загрузка…</div>;

  if (view.kind === 'list') return <CategoriesList categories={categories} counts={counts} unsortedCount={unsortedCount} onOpenDetail={(id)=>setView({kind:'detail', id})} onOpenToSort={()=>setView({kind:'toSort'})} />;
  if (view.kind === 'toSort') return <ToSortScreen onBack={()=>{ setView({kind:'list'}); refreshAll(); }} />;
  return <CategoryDetailScreen categoryId={view.id} onBack={()=>{ setView({kind:'list'}); refreshAll(); }} />;
}

function Row({ title, count, hint, onClick }:{ title:string; count:number; hint?:string; onClick?:()=>void }){
  return (
    <button onClick={onClick} className="w-full p-3 border-2 rounded flex items-center justify-between hover:bg-accent">
      <div className="flex items-center gap-2">
        <div className="text-base font-medium">{title}</div>
        {hint ? <HelpHint text={hint} /> : null}
      </div>
      <BlackCountBadge value={count} />
    </button>
  );
}

function CategoriesList({ categories, counts, unsortedCount, onOpenDetail, onOpenToSort }:{ categories:Category[]; counts:Record<string,number>; unsortedCount:number; onOpenDetail:(id:UUID)=>void; onOpenToSort:()=>void; }){
  return (
    <div className="p-4 space-y-3">
      <Row title="Нужно разобрать" count={unsortedCount} hint={CATEGORY_HINTS['Нужно разобрать']} onClick={onOpenToSort} />
      {categories.map(c => (
        <Row key={c.id} title={c.name} count={counts[c.id] ?? 0} hint={CATEGORY_HINTS[c.name]} onClick={()=>onOpenDetail(c.id)} />
      ))}
    </div>
  );
}

function CategoryDetailScreen({ categoryId, onBack }:{ categoryId: UUID; onBack: ()=>void }){
  const [cat, setCat] = useState<Category | null>(null);
  const [subcats, setSubcats] = useState<Subcategory[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [openAddContacts, setOpenAddContacts] = useState(false);
  const [openCreateSub, setOpenCreateSub] = useState(false);
  const [addToSubId, setAddToSubId] = useState<UUID | null>(null);
  const [refineIds, setRefineIds] = useState<UUID[]>([]);

  useEffect(()=>{(async()=>{
    const c = await categoriesStorageDexie.categories.getById(categoryId);
    setCat(c);
    const totalCount = await categoriesStorageDexie.contactCategories.countByCategory(categoryId);
    setTotal(totalCount);
    const subs = await categoriesStorageDexie.subcategories.listByCategory(categoryId);
    setSubcats(subs);
    const map: Record<string, number> = {};
    for (const s of subs) map[s.id] = await categoriesStorageDexie.contactSubcategories.countBySubcategory(s.id);
    setCounts(map);
    setRefineIds(await listContactsForRefine(categoriesStorageDexie, categoryId));
  })();},[categoryId, openAddContacts, openCreateSub, addToSubId]);

  if (!cat) return <div className="p-4">Загрузка…</div>;
  const canCreateSub = cat.type === 'org' || cat.type === 'interest';

  const isSimple = cat.type === 'simple' || (subcats.length === 0 && !canCreateSub);

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent"><ArrowLeft className="w-4 h-4" />Назад</button>
        <div className="text-center flex-1">
          <div className="font-semibold">{cat.name}</div>
          <div className="text-sm text-muted-foreground">Всего: {total}</div>
        </div>
        <div className="w-16 text-right">
          {canCreateSub && <Button variant="ghost" onClick={()=>setOpenCreateSub(true)}><Plus className="w-4 h-4 mr-1"/>Добавить</Button>}
        </div>
      </div>

      {isSimple ? (
        <SimpleCategoryList categoryId={categoryId} onAddContacts={()=>setOpenAddContacts(true)} />
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {subcats.map(s => {
            const cnt = counts[s.id] ?? 0;
            const percent = total ? Math.round((cnt / total) * 100) : 0;
            return (
              <div key={s.id} className="flex items-center justify-between p-3 border-2 rounded">
                <div className="flex-1 text-center">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{percent}%</div>
                </div>
                <div className="flex items-center gap-2">
                  <BlackCountBadge value={cnt} />
                  <Button variant="ghost" onClick={()=>setAddToSubId(s.id)}><Plus className="w-4 h-4"/></Button>
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-between p-3 border-2 rounded">
            <div className="flex items-center gap-2">
              <div className="font-medium">Определить более точно</div>
              <HelpCircle className="w-4 h-4 text-muted-foreground" />
            </div>
            <BlackCountBadge value={refineIds.length} />
          </div>
        </div>
      )}

      <AssignContactsDialog open={openAddContacts} onOpenChange={setOpenAddContacts} title="Добавить контакты в категорию" onSubmit={async (ids)=>{ for (const id of ids) await categoriesStorageDexie.contactCategories.add(id, categoryId); }} />
      <CreateSubcategoryDialog open={openCreateSub} onOpenChange={setOpenCreateSub} categoryId={categoryId} />
      {addToSubId && <AssignContactsToSubcatDialog open={!!addToSubId} onOpenChange={()=>setAddToSubId(null)} subcategoryId={addToSubId} />}
    </div>
  );
}

function SimpleCategoryList({ categoryId, onAddContacts }:{ categoryId: UUID; onAddContacts: ()=>void }){
  const [contactIds, setContactIds] = useState<UUID[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(()=>{(async()=>{
    setContactIds(await categoriesStorageDexie.contactCategories.listContactsByCategory(categoryId, { limit: 10000 }));
  })();},[categoryId, onAddContacts]);

  useEffect(()=>{(async()=>{
    const store = await createStorage();
    const list: Contact[] = [];
    for (const id of contactIds) {
      const c = await store.contacts.getById(id);
      if (c) list.push(c);
    }
    setContacts(list);
  })();},[contactIds]);

  return (
    <div className="space-y-2">
      <Button onClick={onAddContacts} className="w-full" variant="outline"><Plus className="w-4 h-4 mr-1"/>Добавить контакты</Button>
      <div className="space-y-2">
        {contacts.map(c => (<ContactListItem key={c.id} contact={c} />))}
        {!contacts.length && <div className="text-sm text-muted-foreground">Пусто</div>}
      </div>
    </div>
  );
}

function ToSortScreen({ onBack }:{ onBack: ()=>void }){
  const [ids, setIds] = useState<UUID[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [assignFor, setAssignFor] = useState<UUID | null>(null);
  const [query, setQuery] = useState('');

  useEffect(()=>{(async()=>{ setIds(await getUnsortedContactIds(categoriesStorageDexie)); })();},[]);
  useEffect(()=>{(async()=>{
    const store = await createStorage();
    const list: Contact[] = [];
    for (const id of ids) { const c = await store.contacts.getById(id); if (c) list.push(c); }
    setContacts(list);
  })();},[ids]);

  const filtered = useMemo(()=>contacts.filter(c => (`${c.firstName} ${c.lastName}`.toLowerCase().includes(query.toLowerCase()) || (c.organization??'').toLowerCase().includes(query.toLowerCase()))),[contacts,query]);

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent"><ArrowLeft className="w-4 h-4" />Назад</button>
        <div className="text-center flex-1 font-semibold">Нужно разобрать</div>
        <div className="w-16" />
      </div>

      <input className="border-2 rounded px-3 py-2 w-full" placeholder="Поиск" value={query} onChange={(e)=>setQuery(e.target.value)} />
      <div className="space-y-2">
        {filtered.map(c => (
          <div key={c.id} className="flex items-center justify-between gap-2">
            <div className="flex-1"><ContactListItem contact={c} /></div>
            <Button variant="ghost" onClick={()=>setAssignFor(c.id)}>Назначить</Button>
          </div>
        ))}
        {!filtered.length && <div className="text-sm text-muted-foreground">Пусто</div>}
      </div>

      {assignFor && <AssignCategoryDialog open={!!assignFor} onOpenChange={()=>setAssignFor(null)} contactId={assignFor} />}
    </div>
  );
}

