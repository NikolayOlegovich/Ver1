import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Mail, Building2, CalendarDays, Link2, Plus, Trash2 } from 'lucide-react';
import type { UUID, Contact, SocialProfile, Interaction, Reminder, Scores } from '../domain/types';
import { createStorage } from '../domain';
import { ValueStars } from '../components/common/ValueStars';
import { AddInteractionDialog } from '../components/interactions/AddInteractionDialog';
import { AddProfileDialog } from '../components/profiles/AddProfileDialog';
import { calcCompleteness } from '../domain/services/completeness';
import { applyInteractionWarmth } from '../domain/services/warmth';

export function DossierScreen({ contactId }: { contactId: UUID }) {
  const [loaded, setLoaded] = useState(false);
  const [contact, setContact] = useState<Contact | null>(null);
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [scores, setScores] = useState<Scores | null>(null);
  const [showAddInteraction, setShowAddInteraction] = useState(false);
  const [showAddProfile, setShowAddProfile] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const storage = await createStorage();
        let c = await storage.contacts.getById(contactId);

        // Fallback: если не нашли контакт (гонка при первом открытии) — собрать из stagedContact
        if (!c) {
          try {
            const raw = localStorage.getItem('sc:stagedContact');
            if (raw) {
              const staged = JSON.parse(raw) as { id: string; name: string; phone: string; organization?: string };
              if (staged && staged.id === contactId) {
                const parts = (staged.name || '').trim().split(/\s+/);
                const firstName = parts[0] || '';
                const lastName = parts.slice(1).join(' ');
                const now = new Date().toISOString();
                const built: Contact = {
                  id: contactId,
                  firstName,
                  lastName,
                  phones: staged.phone ? [staged.phone] : [],
                  emails: [],
                  organization: staged.organization,
                  position: undefined,
                  birthday: undefined,
                  photoUri: undefined,
                  notes: undefined,
                  tags: [],
                  createdAt: now,
                  updatedAt: now,
                  lastInteractionAt: undefined,
                };
                await storage.contacts.upsert(built);
                const existingScores = await storage.scores.get(contactId);
                if (!existingScores) {
                  await storage.scores.upsert({
                    contactId,
                    completeness: calcCompleteness(built),
                    warmth: 0,
                    valueScore: 3,
                  });
                }
                c = built;
              }
            }
          } catch {
            // ignore JSON/LS errors
          }
        }

        setContact(c);
        setProfiles(await storage.profiles.listByContact(contactId));
        setInteractions(await storage.interactions.listByContact(contactId, { limit: 20 }));
        setReminders(await storage.reminders.listByContact(contactId));
        setScores(await storage.scores.get(contactId));
      } finally {
        setLoaded(true);
      }
    })();
  }, [contactId]);

  const completeness = useMemo(() => (contact ? calcCompleteness(contact) : 0), [contact]);

  if (!loaded) return <div className="p-6">Загрузка…</div>;
  if (!contact) return <div className="p-6">Контакт не найден</div>;

  const mailHref = contact.emails?.[0] ? `mailto:${contact.emails[0]}` : undefined;

  const onApplyProfileDiff = async (fields: Partial<Contact>, url: string, source: string) => {
    const storage = await createStorage();
    const updated: Contact = { ...contact!, ...fields, updatedAt: new Date().toISOString() };
    await storage.contacts.upsert(updated);
    await storage.profiles.upsert({ id: crypto.randomUUID(), contactId, source: source as any, url, fieldsJson: JSON.stringify(fields), addedAt: new Date().toISOString() });
    await storage.scores.upsert({ contactId, completeness: calcCompleteness(updated), warmth: scores?.warmth ?? 0, valueScore: scores?.valueScore ?? 3 });
    setContact(updated);
    setProfiles(await storage.profiles.listByContact(contactId));
  };

  const onAddInteraction = async (i: Interaction) => {
    const storage = await createStorage();
    await storage.interactions.create(i);
    const warmth = applyInteractionWarmth(scores?.warmth ?? 0, i, new Date().toISOString());
    await storage.scores.upsert({ contactId, completeness, warmth, valueScore: scores?.valueScore ?? 3 });
    const existing = await storage.contacts.getById(contactId);
    if (existing) {
      const upd: Contact = { ...existing, lastInteractionAt: i.date, updatedAt: new Date().toISOString() };
      await storage.contacts.upsert(upd);
      setContact(upd);
    }
    setInteractions(await storage.interactions.listByContact(contactId, { limit: 20 }));
    setScores(await storage.scores.get(contactId));
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <Card className="p-4 border-2">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">{contact.firstName} {contact.lastName}</h2>
            {contact.organization && (
              <div className="text-sm text-muted-foreground flex items-center gap-2"><Building2 className="w-4 h-4" />{contact.organization}{contact.position ? `, ${contact.position}` : ''}</div>
            )}
            <div className="mt-2 flex items-center gap-2">
              <span className="px-2 py-1 border rounded text-sm">Теплота: {scores?.warmth ?? 0}</span>
              <span className="px-2 py-1 border rounded text-sm">Ценность:</span>
              <ValueStars value={scores?.valueScore ?? 3} onChange={async (v)=>{ const storage = await createStorage(); const s={ contactId, completeness, warmth: scores?.warmth ?? 0, valueScore: v }; await storage.scores.upsert(s); setScores(s); }} />
              <span className="px-2 py-1 border rounded text-sm">Полнота: {completeness}%</span>
            </div>
          </div>
          <div className="flex gap-2">
            {mailHref && <a href={mailHref}><Button variant="outline"><Mail className="w-4 h-4 mr-2"/>Написать</Button></a>}
          </div>
        </div>
      </Card>

      {/* Профиль */}
      <Card className="p-4 border-2 space-y-2">
        <h3>Профиль</h3>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          {contact.phones?.length ? <div>Телефон: <span className="underline">{contact.phones[0]}</span></div> : null}
          {contact.emails?.length ? <div>Email: <a className="underline" href={mailHref}>{contact.emails[0]}</a></div> : null}
          {contact.birthday ? <div className="flex items-center gap-2"><CalendarDays className="w-4 h-4"/>День рождения: {contact.birthday}</div> : null}
          {contact.tags?.length ? <div>Теги: {contact.tags.join(', ')}</div> : <div>Теги: нет</div>}
        </div>
      </Card>

      {/* Источники */}
      <Card className="p-4 border-2 space-y-2">
        <div className="flex items-center justify-between">
          <h3>Источники</h3>
          <Button variant="ghost" onClick={()=>setShowAddProfile(true)}><Plus className="w-4 h-4 mr-1"/>Связать профиль</Button>
        </div>
        <div className="space-y-2 text-sm">
          {profiles.map(p => (
            <div key={p.id} className="flex items-center justify-between p-2 border rounded">
              <a href={p.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary underline"><Link2 className="w-4 h-4"/>{p.source}</a>
              <div className="flex items-center gap-2">
                <div className="text-muted-foreground">{p.lastCheckedAt ? new Date(p.lastCheckedAt).toLocaleDateString() : '—'}</div>
                <button className="p-1 rounded hover:bg-accent" onClick={async ()=>{ const s = await createStorage(); await s.profiles.remove(p.id); setProfiles(await s.profiles.listByContact(contactId)); }} aria-label="remove-profile">
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
          {!profiles.length && <div className="text-muted-foreground">Пока нет привязанных профилей</div>}
        </div>
      </Card>

      {/* История/Действия */}
      <Card className="p-4 border-2 space-y-2">
        <div className="flex items-center justify-between">
          <h3>История/Действия</h3>
          <Button variant="ghost" onClick={()=>setShowAddInteraction(true)}><Plus className="w-4 h-4 mr-1"/>Добавить взаимодействие</Button>
        </div>
        <div className="space-y-2 text-sm">
          {interactions.map(i => (
            <div key={i.id} className="p-2 border rounded">
              <div className="flex items-center justify-between"><span>{new Date(i.date).toLocaleString()}</span><span className="text-muted-foreground">{i.channel}</span></div>
              {i.summary && <div>{i.summary}</div>}
              {i.nextStep && <div className="text-muted-foreground">Следующий шаг: {i.nextStep}{i.nextStepDue ? ` до ${new Date(i.nextStepDue).toLocaleDateString()}` : ''}</div>}
            </div>
          ))}
          {!interactions.length && <div className="text-muted-foreground">История пока пуста</div>}
        </div>
      </Card>

      <AddInteractionDialog open={showAddInteraction} onOpenChange={setShowAddInteraction} contactId={contactId} onSubmit={onAddInteraction} />
      <AddProfileDialog open={showAddProfile} onOpenChange={setShowAddProfile} current={contact} onApplyDiff={onApplyProfileDiff} />
    </div>
  );
}

