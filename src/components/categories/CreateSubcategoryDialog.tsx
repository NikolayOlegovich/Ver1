import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import type { UUID } from '../../domain/types-categories';
import { categoriesStorageDexie } from '../../infra/dexie/categories-db';

export function CreateSubcategoryDialog({ open, onOpenChange, categoryId }:{ open:boolean; onOpenChange:(v:boolean)=>void; categoryId: UUID }){
  const [name, setName] = useState('');
  const [error, setError] = useState<string|null>(null);
  const [existing, setExisting] = useState<string[]>([]);

  useEffect(()=>{(async()=>{
    if (!open) return;
    const list = await categoriesStorageDexie.subcategories.listByCategory(categoryId);
    setExisting(list.map(s=>s.name.toLowerCase().trim()))
  })();},[open, categoryId]);

  const validate = (s: string) => {
    const v = s.trim().toLowerCase();
    if (!v) return 'Введите название';
    if (existing.includes(v)) return 'Уже существует';
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Добавить подкатегорию</DialogTitle>
          <DialogDescription>Введите уникальное название</DialogDescription>
        </DialogHeader>
        <Input value={name} onChange={(e)=>{ setName(e.target.value); setError(null); }} placeholder="Название" />
        {error && <div className="text-sm text-destructive">{error}</div>}
        <DialogFooter>
          <Button variant="outline" onClick={()=>onOpenChange(false)}>Отмена</Button>
          <Button onClick={async()=>{
            const err = validate(name);
            if (err) { setError(err); return; }
            const now = new Date().toISOString();
            await categoriesStorageDexie.subcategories.upsert({ id: crypto.randomUUID(), categoryId, name: name.trim(), order: undefined, createdAt: now, updatedAt: now });
            onOpenChange(false);
            setName('');
          }}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

