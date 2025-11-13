import { AssignContactsDialog } from './AssignContactsDialog';
import type { UUID } from '../../domain/types-categories';
import { categoriesStorageDexie } from '../../infra/dexie/categories-db';
import { addContactsToSubcategory } from '../../domain/services/categories';

export function AssignContactsToSubcatDialog({ open, onOpenChange, subcategoryId }:{ open:boolean; onOpenChange:(v:boolean)=>void; subcategoryId: UUID }){
  return (
    <AssignContactsDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Добавить контакты в подкатегорию"
      onSubmit={async (ids)=>{
        await addContactsToSubcategory(categoriesStorageDexie, ids, subcategoryId);
      }}
    />
  );
}

