import { useEffect, useMemo, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Contacts } from "@capacitor-community/contacts";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { UserPlus, FileText, FolderTree, Users, ChevronDown, ChevronUp } from "lucide-react";

type CoverageRow = { key: string; label: string; weight: number; percent: number };

interface StatisticsScreenProps {
  onNavigate?: (screen: "statistics" | "select" | "dossier" | "categories" | "dossierList") => void;
  hasContact?: boolean;
}

export function StatisticsScreen({ onNavigate, hasContact }: StatisticsScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [expanded, setExpanded] = useState(false);

  const WEIGHTS = { fio: 2, phone: 2, org: 3, birthday: 3, email: 1, address: 1, website: 1, notes: 1 } as const;
  const MAX_POINTS = useMemo(() => Object.values(WEIGHTS).reduce((s, v) => s + v, 0), []);

  const normalize = (c: any) => {
    const first = c?.name?.given || c?.name?.first || c?.firstName || c?.name?.display;
    const last = c?.name?.family || c?.name?.last || c?.lastName;
    const phones = c?.phones || c?.phoneNumbers || [];
    const org = c?.organization?.company || c?.organization?.name || c?.company;
    const birthday = c?.birthday || c?.birthdays?.[0]?.date || c?.bday;
    const emails = c?.emails || [];
    const addresses = c?.addresses || [];
    const websites = c?.urls || c?.websites || [];
    const notes = c?.note || c?.notes || null;
    return { first, last, phones, org, birthday, emails, addresses, websites, notes };
  };

  const pointsFor = (c: ReturnType<typeof normalize>) => {
    let earned = 0;
    const fioPts = c.first && c.last ? WEIGHTS.fio : c.first || c.last ? 1 : 0;
    earned += fioPts;
    if (c.phones?.length) earned += WEIGHTS.phone;
    if (c.org) earned += WEIGHTS.org;
    if (c.birthday) earned += WEIGHTS.birthday;
    if (c.emails?.length) earned += WEIGHTS.email;
    if (c.addresses?.length) earned += WEIGHTS.address;
    if (c.websites?.length) earned += WEIGHTS.website;
    if (c.notes) earned += WEIGHTS.notes;
    return { earned, max: MAX_POINTS };
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const platform = Capacitor.getPlatform();
        if (platform === "web") {
          setError("Чтение контактов доступно только на Android/iOS (Capacitor).");
          setContacts([]);
          return;
        }
        const anyContacts: any = Contacts as any;
        if (typeof anyContacts.requestPermissions === "function") {
          await anyContacts.requestPermissions();
        }
        const result: any = await Contacts.getContacts({
          projection: { name: true, phones: true, organization: true, birthdays: true, emails: true, addresses: true, urls: true, note: true },
        } as any);
        setContacts(Array.isArray(result) ? result : result?.contacts ?? []);
      } catch (e: any) {
        setError(e?.message || "Не удалось получить контакты.");
        setContacts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalContacts = contacts.length;

  const { qualityPercent, coverage } = useMemo(() => {
    if (!totalContacts) {
      const empty: CoverageRow[] = [
        { key: "fio", label: "ФИО", weight: WEIGHTS.fio, percent: 0 },
        { key: "phone", label: "Телефон", weight: WEIGHTS.phone, percent: 0 },
        { key: "org", label: "Организация", weight: WEIGHTS.org, percent: 0 },
        { key: "birthday", label: "День рождения", weight: WEIGHTS.birthday, percent: 0 },
        { key: "email", label: "Email", weight: WEIGHTS.email, percent: 0 },
        { key: "address", label: "Адрес", weight: WEIGHTS.address, percent: 0 },
        { key: "website", label: "Сайт", weight: WEIGHTS.website, percent: 0 },
        { key: "notes", label: "Заметки", weight: WEIGHTS.notes, percent: 0 },
      ];
      return { qualityPercent: 0, coverage: empty };
    }
    let sumPercents = 0;
    let fioFull = 0, phone = 0, org = 0, birthday = 0, email = 0, address = 0, website = 0, notes = 0;
    for (const rc of contacts) {
      const c = normalize(rc);
      const { earned, max } = pointsFor(c);
      sumPercents += (earned / max) * 100;
      if (c.first && c.last) fioFull++;
      if (c.phones?.length) phone++;
      if (c.org) org++;
      if (c.birthday) birthday++;
      if (c.emails?.length) email++;
      if (c.addresses?.length) address++;
      if (c.websites?.length) website++;
      if (c.notes) notes++;
    }
    const qp = Math.round(sumPercents / totalContacts);
    const cov: CoverageRow[] = [
      { key: "fio", label: "ФИО", weight: WEIGHTS.fio, percent: Math.round((fioFull / totalContacts) * 100) },
      { key: "phone", label: "Телефон", weight: WEIGHTS.phone, percent: Math.round((phone / totalContacts) * 100) },
      { key: "org", label: "Организация", weight: WEIGHTS.org, percent: Math.round((org / totalContacts) * 100) },
      { key: "birthday", label: "День рождения", weight: WEIGHTS.birthday, percent: Math.round((birthday / totalContacts) * 100) },
      { key: "email", label: "Email", weight: WEIGHTS.email, percent: Math.round((email / totalContacts) * 100) },
      { key: "address", label: "Адрес", weight: WEIGHTS.address, percent: Math.round((address / totalContacts) * 100) },
      { key: "website", label: "Сайт", weight: WEIGHTS.website, percent: Math.round((website / totalContacts) * 100) },
      { key: "notes", label: "Заметки", weight: WEIGHTS.notes, percent: Math.round((notes / totalContacts) * 100) },
    ];
    return { qualityPercent: qp, coverage: cov };
  }, [contacts, totalContacts]);

  return (
    <div className="p-6 h-full flex flex-col gap-6">
      {/* Summary card */}
      <Card className="p-5 border-2">
        <div className="grid grid-cols-[1fr_auto] items-center">
          <div className="text-center">
            <p className="text-base font-semibold leading-tight">Всего контактов</p>
            <div className="text-3xl font-semibold leading-none mt-1">{totalContacts}</div>
          </div>
          <div className="relative w-16 h-16 -translate-x-2 translate-y-1">
            <div className="absolute inset-0 rounded-full bg-primary/10 overflow-hidden" />
            <Users className="w-7 h-7 text-primary absolute inset-0 m-auto z-10" />
          </div>
        </div>
        {error && <p className="text-destructive text-sm mt-3">{error}</p>}
        {loading && !error && <p className="text-muted-foreground text-sm mt-3">Загрузка…</p>}
        {!error && !loading && (
          <div className="mt-2">
            <div className="text-center text-sm font-semibold">
              Индекс качества контактов <span>{qualityPercent}%</span>
            </div>
            <div className="flex items-center justify-center mt-2">
              <button
                className="p-1 rounded-md hover:bg-accent transition-colors"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}
      </Card>

      {expanded && !error && (
        <div className="space-y-4">
          {/* Donut summary */}
          <Card className="p-5 border-2 text-center">
            <h3 className="text-muted-foreground mb-4">Индекс качества контактов</h3>
            <div className="relative w-48 h-48 mx-auto">
              <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                <circle cx="100" cy="100" r="85" strokeWidth="14" className="text-muted" stroke="currentColor" fill="none" />
                {(() => {
                  const r = 85;
                  const c = 2 * Math.PI * r;
                  const offset = c * (1 - qualityPercent / 100);
                  return (
                    <circle
                      cx="100"
                      cy="100"
                      r={r}
                      strokeWidth="14"
                      className="text-primary"
                      strokeDasharray={c}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                    />
                  );
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-semibold">{qualityPercent}%</span>
                <span className="text-sm text-muted-foreground mt-1">Заполненность</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Процент — среднее по всем контактам устройства. Вес полей: ФИО ({WEIGHTS.fio}), Телефон ({WEIGHTS.phone}), Организация ({WEIGHTS.org}), День рождения ({WEIGHTS.birthday}), Email ({WEIGHTS.email}), Адрес ({WEIGHTS.address}), Сайт ({WEIGHTS.website}), Заметки ({WEIGHTS.notes}).
            </p>
          </Card>

          {/* Coverage by field */}
          <Card className="p-4 border-2">
            <div className="flex items-center justify-between mb-3">
              <h3>Заполняемость по полям</h3>
              <span className="text-sm text-muted-foreground">Вес влияет на оценку</span>
            </div>
            <div className="space-y-3">
              {coverage.map((row) => (
                <div key={row.key}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{row.label}</span>
                      <span className="text-xs text-muted-foreground">вес {row.weight}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{row.percent}%</span>
                  </div>
                  <Progress value={row.percent} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Прогресс за неделю */}
      <div className="flex-1 grid gap-4 grid-rows-2">
      <Card className="p-4 border-2 h-full">
        <h3 className="mb-2">Прогресс за неделю</h3>
        <p className="text-sm text-muted-foreground">
          Поддержание теплоты отношений (плейсхолдер).
        </p>
        <div className="mt-3">
          <Progress value={qualityPercent} />
        </div>
      </Card>

      {/* Предлагаю сделать */}
      <Card className="p-4 border-2 h-full">
        <h3 className="mb-2">Предлагаю сделать</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Поздравить ФИО</li>
          <li>Давно не общались</li>
        </ul>
      </Card>

      </div>

      {/* Actions */}
      <div className="flex items-center justify-around py-2">
        <Button
          variant="ghost"
          onClick={() => onNavigate?.("select")}
          className="flex flex-col items-center gap-1"
        >
          <UserPlus className="w-7 h-7" />
          <span className="text-sm">Выбрать контакт</span>
        </Button>
        <Button
          variant="ghost"
          onClick={() => onNavigate?.("dossierList")}
          className="flex flex-col items-center gap-1"
        >
          <FileText className="w-7 h-7" />
          <span className="text-sm">Досье</span>
        </Button>
        <Button
          variant="ghost"
          onClick={() => onNavigate?.("categories")}
          className="flex flex-col items-center gap-1"
        >
          <FolderTree className="w-7 h-7" />
          <span className="text-sm">Категории</span>
        </Button>
      </div>
    </div>
  );
}





