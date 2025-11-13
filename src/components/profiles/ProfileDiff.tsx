import { useState } from 'react';
import { Button } from '../ui/button';

export interface DiffRow<T> { key: keyof T; label: string; current?: any; found?: any; }

export function ProfileDiff<T extends Record<string, any>>({ rows, onApply, onCancel }: {
  rows: DiffRow<T>[];
  onApply: (picked: Partial<T>) => void;
  onCancel: () => void;
}) {
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setPicked((p) => ({ ...p, [k]: !p[k] }));
  const apply = () => {
    const out: Partial<T> = {};
    rows.forEach(r => { if (picked[String(r.key)]) (out as any)[r.key] = r.found; });
    onApply(out);
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 text-sm text-muted-foreground">
        <div>Поле</div>
        <div>Текущее</div>
        <div>Найдено</div>
      </div>
      {rows.map(r => (
        <label key={String(r.key)} className="grid grid-cols-3 items-start gap-2 p-2 border rounded">
          <div className="font-medium flex items-center gap-2">
            <input type="checkbox" checked={!!picked[String(r.key)]} onChange={() => toggle(String(r.key))} />
            {r.label}
          </div>
          <div className="text-sm break-words">{r.current ?? '—'}</div>
          <div className="text-sm break-words">{r.found ?? '—'}</div>
        </label>
      ))}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Отмена</Button>
        <Button onClick={apply}>Применить выбранное</Button>
      </div>
    </div>
  );
}

