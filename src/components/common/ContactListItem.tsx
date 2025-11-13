import { Building2 } from 'lucide-react';
import type { Contact } from '../../domain/types';

export function ContactListItem({ contact, selected, onToggle }: { contact: Contact; selected?: boolean; onToggle?: (v: boolean) => void }) {
  const name = `${contact.firstName ?? ''} ${contact.lastName ?? ''}`.trim() || 'Без имени';
  return (
    <label className="flex items-center gap-3 p-3 rounded border-2 cursor-pointer select-none">
      {onToggle ? <input type="checkbox" className="mt-0.5" checked={!!selected} onChange={(e)=>onToggle?.(e.target.checked)} /> : null}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{name}</div>
        {contact.organization && (
          <div className="text-sm text-muted-foreground flex items-center gap-1 truncate">
            <Building2 className="w-3 h-3" /> {contact.organization}
          </div>
        )}
      </div>
    </label>
  );
}

