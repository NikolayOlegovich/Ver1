import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import type { UUID, Category, Subcategory } from '../../domain/types-categories';
import { categoriesStorageDexie } from '../../infra/dexie/categories-db';
import { addContactsToCategory, addContactsToSubcategory } from '../../domain/services/categories';

export function AssignCategoryDialog({ open, onOpenChange, contactId }:{ open:boolean; onOpenChange:(v:boolean)=>void; contactId: UUID }){
  const [cats, setCats] = useState<Category[]>([]);
  const [subcats, setSubcats] = useState<Record<string, Subcategory[]>>({});
  const [pickedCats, setPickedCats] = useState<Record<string, boolean>>({});
  const [pickedSub, setPickedSub] = useState<Record<string, boolean>>({});

  useEffect(()=>{(async()=>{
    const store = categoriesStorageDexie;
    const all = await store.categories.listAll();
    setCats(all);
    const map: Record<string, Subcategory[]> = {};
    for (const c of all) {
      map[c.id] = await store.subcategories.listByCategory(c.id);
    }
    setSubcats(map);
  })();},[open]);

  const canAddSub = (cid: string) => (subcats[cid]?.length ?? 0) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Назначить категорию</DialogTitle>
          <DialogDescription>Выберите базовые категории и при необходимости подкатегории</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {cats.map(cat => (
            <div key={cat.id} className="border rounded p-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!pickedCats[cat.id]} onChange={(e)=>setPickedCats(p=>({...p,[cat.id]:e.target.checked}))} />
                <span className="font-medium">{cat.name}</span>
              </label>
              {pickedCats[cat.id] && canAddSub(cat.id) && (
                <div className="pl-6 mt-2 space-y-1">
                  {subcats[cat.id]?.map(sc => (
                    <label key={sc.id} className="flex items-center gap-2">
                      <input type="checkbox" checked={!!pickedSub[sc.id]} onChange={(e)=>setPickedSub(p=>({...p,[sc.id]:e.target.checked}))} />
                      <span>{sc.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={()=>onOpenChange(false)}>Отмена</Button>
          <Button onClick={async ()=>{
            const store = categoriesStorageDexie;
            const catIds = Object.entries(pickedCats).filter(([,v])=>v).map(([k])=>k as UUID);
            if (catIds.length) await addContactsToCategory(store, [contactId], catIds[0]);
            const subIds = Object.entries(pickedSub).filter(([,v])=>v).map(([k])=>k as UUID);
            for (const sid of subIds) await addContactsToSubcategory(store, [contactId], sid);
            onOpenChange(false);
          }}>Назначить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

