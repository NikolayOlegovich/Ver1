import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { ValueStars } from '../common/ValueStars';
import type { Interaction, UUID, Reminder } from '../../domain/types';
import { createStorage } from '../../domain';

export function AddInteractionDialog({ open, onOpenChange, contactId, onSubmit }: {
  open: boolean; onOpenChange: (v: boolean) => void; contactId: UUID; onSubmit: (i: Interaction) => Promise<void> | void;
}) {
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState<string>(() => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  });
  const [durationValue, setDurationValue] = useState<number>(0);
  const [durationUnit, setDurationUnit] = useState<'min' | 'hour'>('min');

  const [channel, setChannel] = useState<Interaction['channel']>('meeting');
  const [channelNote, setChannelNote] = useState('');
  const [summary, setSummary] = useState('');
  const [usefulness, setUsefulness] = useState(3);
  const [keepInTouch, setKeepInTouch] = useState(false);
  const [ally, setAlly] = useState(false);
  const [nextStep, setNextStep] = useState('');
  const [nextStepDueDate, setNextStepDueDate] = useState('');
  const [nextStepDueTime, setNextStepDueTime] = useState('');
  const [reminderAfterHours, setReminderAfterHours] = useState('');
  const channelOptions = [
    { id: 'meeting', label: 'OnLine' },
    { id: 'offline', label: 'OffLine' },
    { id: 'call', label: 'Звонок' },
    { id: 'chat', label: 'Чат' },
    { id: 'email', label: 'eMail' },
    { id: 'other', label: 'Другое' },
  ] as const;

  function combineLocalDateTime(d: string, t: string) {
    const time = (t && /^\d{2}:\d{2}$/.test(t)) ? `${t}:00` : '00:00:00';
    const s = `${d}T${time}`;
    return new Date(s);
  }

  const submit = async () => {
    const dt = combineLocalDateTime(date, time);
    const nextStepDueDateTime = nextStepDueDate ? combineLocalDateTime(nextStepDueDate, nextStepDueTime || '00:00') : null;
    const minutes = durationUnit === 'hour' ? Math.round(durationValue * 60) : Math.round(durationValue);
    const i: Interaction = {
      id: crypto.randomUUID(),
      contactId,
      date: dt.toISOString(),
      channel,
      channelNote: channel === 'other' && channelNote.trim() ? channelNote.trim() : undefined,
      durationMinutes: minutes > 0 ? minutes : undefined,
      summary,
      usefulnessInteraction: usefulness,
      keepInTouch,
      allyPotential: ally,
      nextStep: nextStep || undefined,
      nextStepDue: nextStepDueDateTime ? nextStepDueDateTime.toISOString() : undefined,
      nextStepDone: false,
    };
    await onSubmit(i);
    try {
      const storage = await createStorage();
      const existing = await storage.contacts.getById(contactId);
      if (existing) {
        await storage.contacts.upsert({ ...existing, lastInteractionAt: i.date, updatedAt: new Date().toISOString() } as any);
      }
    } catch {}
    const hoursOffset = reminderAfterHours && /^\d{1,4}$/.test(reminderAfterHours)
      ? Number(reminderAfterHours)
      : undefined;
    const shouldCreateReminder = Boolean(nextStepDueDateTime || typeof hoursOffset === 'number');
    if (shouldCreateReminder) {
      try {
        const storage = await createStorage();
        let dueAtIso: string;
        if (nextStepDueDateTime) {
          dueAtIso = nextStepDueDateTime.toISOString();
        } else if (typeof hoursOffset === 'number') {
          const due = new Date(dt.getTime() + hoursOffset * 60 * 60 * 1000);
          dueAtIso = due.toISOString();
        } else {
          dueAtIso = dt.toISOString();
        }
        const reminder: Reminder = {
          id: crypto.randomUUID(),
          contactId,
          title: nextStep || 'Напоминание',
          type: (nextStep ? 'nextStep' : 'followup'),
          dueAt: dueAtIso,
          done: false,
        };
        await storage.reminders.upsert(reminder);
      } catch {}
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed inset-0 h-[100dvh] w-[100vw] max-w-none grid grid-rows-[auto,1fr,auto] rounded-none border-0 p-0 overflow-x-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>Добавить взаимодействие</DialogTitle>
          <DialogDescription>Укажите дату, время, канал и детали взаимодействия.</DialogDescription>
        </DialogHeader>

        {/* Компактный контент: всё в одной колонке */}
        <div className="flex flex-col gap-4 min-h-0 overflow-y-auto px-4 pb-2 text-sm">
          {/* Дата / время / длительность в одной строке */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Дата</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 rounded-lg text-sm" />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-[110px]">
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Время</label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-10 rounded-lg text-sm" />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Длительность</label>
              <div className="flex gap-2 items-center">
                <Input type="number" min={0} step={1} value={durationValue} onChange={(e)=>setDurationValue(Number(e.target.value))} className="h-10 rounded-lg w-20 text-center text-sm" />
                <select className="border rounded-lg h-10 px-2 text-sm bg-background" value={durationUnit} onChange={(e)=>setDurationUnit(e.target.value as any)}>
                  <option value="min">мин</option>
                  <option value="hour">ч</option>
                </select>
              </div>
            </div>
          </div>

          {/* Каналы взаимодействия: две строки */}
          <div>
            <label className="text-sm mb-2 block text-center font-medium">Каналы взаимодействия</label>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                {channelOptions.slice(0, 3).map((opt) => (
                  <Button
                    key={opt.id}
                    variant={channel === opt.id ? 'default' : 'outline'}
                    className="flex-1 justify-center h-10 rounded-lg text-sm"
                    onClick={()=>setChannel(opt.id as Interaction['channel'])}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                {channelOptions.slice(3).map((opt) => (
                  <Button
                    key={opt.id}
                    variant={channel === opt.id ? 'default' : 'outline'}
                    className="flex-1 justify-center h-10 rounded-lg text-sm"
                    onClick={()=>setChannel(opt.id as Interaction['channel'])}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
            {channel === 'other' && (
              <div className="mt-2">
                <Input placeholder="Уточните канал" value={channelNote} onChange={(e)=>setChannelNote(e.target.value)} className="h-10 rounded-lg text-sm" />
              </div>
            )}
          </div>

          {/* Краткое описание */}
          <div>
            <label className="text-sm mb-1 block">Краткое описание</label>
            <Textarea rows={3} className="min-h-[88px] rounded-lg text-sm" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="О чём было взаимодействие" />
          </div>

          <div className="flex items-end gap-4 overflow-x-auto">
            <div className="flex flex-col gap-1 min-w-[120px] shrink-0">
              <span className="text-sm">Полезность</span>
              <ValueStars value={usefulness} onChange={setUsefulness} />
            </div>
            <label className="inline-flex items-start gap-2 text-xs leading-tight shrink-0">
              <input className="mt-0.5" type="checkbox" checked={keepInTouch} onChange={(e)=>setKeepInTouch(e.target.checked)} />
              <span className="whitespace-pre-line leading-tight">{`Поддерживать\nсвязь`}</span>
            </label>
            <label className="inline-flex items-start gap-2 text-xs leading-tight shrink-0">
              <input className="mt-0.5" type="checkbox" checked={ally} onChange={(e)=>setAlly(e.target.checked)} />
              <span className="whitespace-pre-line leading-tight">{`Потенциальный\nсоюзник`}</span>
            </label>
          </div>

          {/* Следующие шаги + напоминание */}
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-sm mb-1 block">Следующие шаги</label>
              <Textarea rows={3} className="min-h-[88px] rounded-lg text-sm" value={nextStep} onChange={(e)=>setNextStep(e.target.value)} placeholder="Следующий шаг" />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Задать дату и время напоминания</span>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex flex-col gap-1 flex-1 min-w-[180px] max-w-[240px]">
                  <label className="text-xs text-muted-foreground uppercase tracking-wide">Дата</label>
                  <Input type="date" value={nextStepDueDate} onChange={(e)=>setNextStepDueDate(e.target.value)} className="h-10 rounded-lg text-sm w-full" />
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-[140px] max-w-[200px]">
                  <label className="text-xs text-muted-foreground uppercase tracking-wide">Время</label>
                  <Input type="time" value={nextStepDueTime} onChange={(e)=>setNextStepDueTime(e.target.value)} className="h-10 rounded-lg text-sm w-full" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">За</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={9999}
                    step={1}
                    value={reminderAfterHours}
                    onChange={(e)=>{
                      const v = (e.target.value || '').replace(/[^0-9]/g, '').slice(0, 4);
                      setReminderAfterHours(v);
                    }}
                    className="h-10 rounded-lg w-8 text-center text-sm"
                    placeholder="0"
                  />
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">часов</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 flex flex-col px-4 pb-4 pt-2 border-t bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={submit}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
