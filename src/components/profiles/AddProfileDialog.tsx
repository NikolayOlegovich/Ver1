import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import type { Contact } from '../../domain/types';
import { scrapePublicProfile } from '../../infra/scraper/publicProfileScraper';
import { ProfileDiff } from './ProfileDiff';

type SourceKey = 'website' | 'linkedin' | 'facebook' | 'telegram' | 'github' | 'other';

export function AddProfileDialog({ open, onOpenChange, onApplyDiff, current }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onApplyDiff: (fields: Partial<Contact>, url: string, source: string) => Promise<void> | void;
  current: Partial<Contact>;
}) {
  const [urls, setUrls] = useState<Partial<Record<SourceKey, string>>>({});
  const [pickedSource, setPickedSource] = useState<SourceKey | null>(null);
  const [pickedUrl, setPickedUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diffRows, setDiffRows] = useState<any[] | null>(null);

  const setUrlValue = (key: SourceKey, value: string) => {
    setUrls((u) => ({ ...u, [key]: value }));
  };

  const firstNonEmpty = (): [SourceKey, string] | null => {
    const order: SourceKey[] = ['website', 'linkedin', 'facebook', 'telegram', 'github', 'other'];
    for (const k of order) {
      const v = (urls[k] || '').trim();
      if (v) return [k, v];
    }
    return null;
  };

  const check = async () => {
    try {
      setLoading(true); setError(null);
      const pair = firstNonEmpty();
      if (!pair) return;
      const [src, url] = pair;
      const scraped = await scrapePublicProfile(url);
      setPickedSource(src); setPickedUrl(url);
      const rows = [
        { key: 'organization', label: 'Организация', current: current.organization, found: scraped.fields.organization },
        { key: 'position', label: 'Должность', current: current.position, found: scraped.fields.position },
        { key: 'photoUri', label: 'Фото', current: current.photoUri, found: scraped.avatarUrl },
      ];
      setDiffRows(rows);
    } catch (e: any) {
      setError(e?.message || 'Не удалось загрузить страницу. Возможно, необходим прокси.');
    } finally { setLoading(false); }
  };

  const applyPicked = async (picked: Partial<Contact>) => {
    await onApplyDiff(picked, pickedUrl, pickedSource || 'website');
    onOpenChange(false);
  };

  const canCheck = Object.values(urls).some((v) => (v || '').trim().length > 0) && !loading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed inset-0 h-[100dvh] w-[100vw] max-w-none grid grid-rows-[auto,1fr,auto] rounded-none border-0 p-0 overflow-x-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>Связать профиль (URL)</DialogTitle>
          <DialogDescription>Заполните URL напротив нужного источника. Проверка возьмёт первый непустой.</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto px-4 pb-2 space-y-2">
          {!diffRows ? (
            <>
              <Row label="Веб‑сайт">
                <Input value={urls.website || ''} onChange={(e)=>setUrlValue('website', e.target.value)} placeholder="https://example.com" />
              </Row>
              <Row label="LinkedIn">
                <Input value={urls.linkedin || ''} onChange={(e)=>setUrlValue('linkedin', e.target.value)} placeholder="https://www.linkedin.com/in/..." />
              </Row>
              <Row label="Facebook">
                <Input value={urls.facebook || ''} onChange={(e)=>setUrlValue('facebook', e.target.value)} placeholder="https://facebook.com/..." />
              </Row>
              <Row label="Telegram">
                <Input value={urls.telegram || ''} onChange={(e)=>setUrlValue('telegram', e.target.value)} placeholder="https://t.me/..." />
              </Row>
              <Row label="GitHub">
                <Input value={urls.github || ''} onChange={(e)=>setUrlValue('github', e.target.value)} placeholder="https://github.com/..." />
              </Row>
              <Row label="Другое">
                <Input value={urls.other || ''} onChange={(e)=>setUrlValue('other', e.target.value)} placeholder="Любой URL" />
              </Row>
              {error && <div className="text-destructive text-sm">{error}</div>}
            </>
          ) : (
            <ProfileDiff rows={diffRows} onApply={applyPicked} onCancel={()=>setDiffRows(null)} />
          )}
        </div>

        <DialogFooter className="gap-2 flex flex-col px-4 pb-4 pt-2 border-t bg-background">
          {!diffRows ? (
            <>
              <Button variant="outline" onClick={()=>onOpenChange(false)}>Отмена</Button>
              <Button onClick={check} disabled={!canCheck}>{loading ? 'Проверка…' : 'Проверить'}</Button>
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px,1fr] items-center gap-3">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div>{children}</div>
    </div>
  );
}
