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
  const [nextStepDue, setNextStepDue] = useState('');
  const [createReminder, setCreateReminder] = useState(false);
  const [reminderAfterHours, setReminderAfterHours] = useState('');

  function combineLocalDateTime(d: string, t: string) {
    const time = (t && /^\d{2}:\d{2}$/.test(t)) ? `${t}:00` : '00:00:00';
    const s = `${d}T${time}`;
    return new Date(s);
  }

  const submit = async () => {
    const dt = combineLocalDateTime(date, time);
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
      nextStepDue: nextStepDue ? new Date(nextStepDue).toISOString() : undefined,
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
    if (createReminder) {
      try {
        const storage = await createStorage();
        let dueAtIso: string;
        if (nextStepDue) {
          dueAtIso = new Date(nextStepDue).toISOString();
        } else if (reminderAfterHours && /^\d{1,4}$/.test(reminderAfterHours)) {
          const hours = Number(reminderAfterHours);
          const due = new Date(dt.getTime() + hours * 60 * 60 * 1000);
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

        {/* Контент: верх — две колонки, ниже — вертикальные блоки */}
        <div className="grid gap-6 min-h-0 overflow-y-auto px-4 pb-2 grid-cols-2">
          {/* Левая колонка: дата / время / длительность */}
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-sm">Дата</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 rounded-xl" />
            </div>
            <div>
              <label className="text-sm">Время</label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-12 rounded-xl" />
            </div>
            <div>
              <label className="text-sm">Длительность</label>
              <div className="flex gap-3 items-center">
                <Input type="number" min={0} step={1} value={durationValue} onChange={(e)=>setDurationValue(Number(e.target.value))} className="h-12 rounded-xl w-24" />
                <select className="border rounded-xl h-12 px-3" value={durationUnit} onChange={(e)=>setDurationUnit(e.target.value as any)}>
                  <option value="min">мин</option>
                  <option value="hour">ч</option>
                </select>
              </div>
            </div>
          </div>

          {/* Правая колонка: каналы */}
          <div>
            <label className="text-sm mb-2 block text-center">Каналы взаимодействия</label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { id: 'meeting', label: 'Встреча' },
                { id: 'call', label: 'Звонок' },
                { id: 'chat', label: 'Чат' },
                { id: 'email', label: 'Email' },
                { id: 'other', label: 'Другое' },
              ] as const).map((opt) => (
                <Button
                  key={opt.id}
                  variant={channel === opt.id ? 'default' : 'outline'}
                  className="w-full justify-center h-12 rounded-xl"
                  onClick={()=>setChannel(opt.id as Interaction['channel'])}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            {channel === 'other' && (
              <div className="mt-2">
                <Input placeholder="Уточните канал" value={channelNote} onChange={(e)=>setChannelNote(e.target.value)} />
              </div>
            )}
          </div>

          {/* Ниже — одиночные вертикальные блоки без колонок */}
          <div className="col-span-2">
            <label className="text-sm mb-1 block">Краткое описание</label>
            <Textarea rows={4} className="min-h-24 rounded-xl" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="О чём было взаимодействие" />
          </div>

          <div className="col-span-2 flex flex-col gap-2">
            <span className="text-sm">Полезность</span>
            <ValueStars value={usefulness} onChange={setUsefulness} />
            <div className="flex flex-col gap-2 mt-2">
              <label className="flex items-center gap-2"><input type="checkbox" checked={keepInTouch} onChange={(e)=>setKeepInTouch(e.target.checked)} /> Поддерживать связь</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={ally} onChange={(e)=>setAlly(e.target.checked)} /> Потенциальный союзник</label>
            </div>
          </div>

          {/* Следующие шаги слева; справа — дата напоминания, чекбокс и "За N часов" */}
          <div className="col-span-2 grid grid-cols-2 gap-4 items-start">
            <div>
              <label className="text-sm mb-1 block">Следующие шаги</label>
              <Textarea rows={4} className="min-h-24 rounded-xl" value={nextStep} onChange={(e)=>setNextStep(e.target.value)} placeholder="Следующий шаг" />
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-sm mb-1 block">Дата напоминания</label>
                <Input type="date" value={nextStepDue} onChange={(e)=>setNextStepDue(e.target.value)} className="h-12 rounded-xl w-[180px] sm:w-[220px]" />
              </div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={createReminder} onChange={(e)=>setCreateReminder(e.target.checked)} /> Создать напоминание</label>
              <div className="flex items-center gap-2">
                <span className="text-sm">За</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="\\d*"
                  value={reminderAfterHours}
                  onChange={(e)=>{
                    const v = (e.target.value || '').replace(/[^0-9]/g, '').slice(0, 4);
                    setReminderAfterHours(v);
                  }}
                  className="h-12 rounded-xl w-20 text-center"
                  placeholder="0"
                />
                <span className="text-sm">часов</span>
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
