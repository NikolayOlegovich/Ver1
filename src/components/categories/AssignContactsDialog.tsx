import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { createStorage } from '../../domain';
import type { Contact, UUID } from '../../domain/types';
import { ContactListItem } from '../common/ContactListItem';

export function AssignContactsDialog({ open, onOpenChange, onSubmit, title }:{ open:boolean; onOpenChange:(v:boolean)=>void; onSubmit:(ids:UUID[])=>Promise<void>|void; title:string; }){
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Contact[]>([]);
  const [picked, setPicked] = useState<Record<string, boolean>>({});

  useEffect(()=>{(async()=>{
    setLoading(true);
    try{
      const store = await createStorage();
      const res = await store.contacts.searchByNameOrg(query, 100);
      setResults(res);
    } finally{ setLoading(false);} 
  })();},[query, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid grid-rows-[auto,auto,1fr,auto] h-[85vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Выберите контакты (поиск по имени/организации)</DialogDescription>
        </DialogHeader>
        <Input placeholder="Поиск" value={query} onChange={(e)=>setQuery(e.target.value)} />
        <div className="min-h-0 overflow-y-auto border-2 rounded p-2 space-y-2">
          {loading && <div className="text-sm text-muted-foreground">Загрузка…</div>}
          {!loading && results.map(c => (
            <ContactListItem key={c.id} contact={c} selected={!!picked[c.id]} onToggle={(v)=>setPicked(p=>({...p,[c.id]:v}))} />
          ))}
          {!loading && !results.length && <div className="text-sm text-muted-foreground">Ничего не найдено</div>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={()=>onOpenChange(false)}>Отмена</Button>
          <Button onClick={async ()=>{ const ids=Object.entries(picked).filter(([,v])=>v).map(([k])=>k as UUID); await onSubmit(ids); onOpenChange(false); }}>Добавить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

