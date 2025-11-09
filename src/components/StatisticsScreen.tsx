import { useEffect, useMemo, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Contacts } from "@capacitor-community/contacts";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { ChevronDown, ChevronUp, UserPlus, FileText, FolderTree, Users } from "lucide-react";

type CoverageRow = { key: string; label: string; weight: number; percent: number };

interface StatisticsScreenProps {
  onNavigate?: (screen: "statistics" | "select" | "dossier" | "categories") => void;
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
    return { earned, max: MAX_POINTS, fioPts };
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
    let fioEarnedTotal = 0;
    let phone = 0, org = 0, birthday = 0, email = 0, address = 0, website = 0, notes = 0;
    for (const rc of contacts) {
      const c = normalize(rc);
      const { earned, max, fioPts } = pointsFor(c);
      sumPercents += (earned / max) * 100;
      fioEarnedTotal += fioPts;
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
      { key: "fio", label: "ФИО", weight: WEIGHTS.fio, percent: Math.round((fioEarnedTotal / totalContacts) * (100 / WEIGHTS.fio)) },
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
    <div className="p-6 space-y-6">
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
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div
                className="absolute bottom-0 left-0 right-0 wave-anim"
                style={{
                  height: `${qualityPercent}%`,
                  backgroundImage:
                    "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"20\" viewBox=\"0 0 120 20\"><path d=\"M0 10 Q30 0 60 10 T120 10 V20 H0 Z\" fill=\"%23000000\" fill-opacity=\"0.15\"/></svg>')",
                  backgroundRepeat: "repeat-x",
                  backgroundSize: "120px 20px",
                }}
              />
            </div>
          </div>
        </div>
        {error && <p className="text-destructive text-sm mt-3">{error}</p>}
        {loading && !error && <p className="text-muted-foreground text-sm mt-3">Загрузка…</p>}

        {!error && (
          <div className="mt-2">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-sm font-semibold">Качество данных контактов</span>
              <span className="text-sm font-semibold">{qualityPercent}%</span>
            </div>
            <div className="flex items-center justify-center mt-2">
              <button className="p-1 rounded-md hover:bg-accent transition-colors" onClick={() => setExpanded((v) => !v)}>
                {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}

        {expanded && !error && (
          <div className="mt-4 space-y-6">
            <div className="p-4 border rounded-lg">
              <div className="flex flex-col items-center space-y-4">
                <h2 className="text-muted-foreground">Качество данных контактов</h2>
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="none" className="text-muted" />
                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="none" strokeDasharray={`${2 * Math.PI * 88}`} strokeDashoffset={`${2 * Math.PI * 88 * (1 - qualityPercent / 100)}`} className="text-primary transition-all duration-500" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl">{qualityPercent}%</span>
                    <span className="text-sm text-muted-foreground mt-1">средняя полнота данных</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Coverage rows */}
            <div className="grid gap-4 sm:grid-cols-2">
              {coverage.map((row) => (
                <Card key={row.key} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span>{row.label}</span>
                    <span className="text-sm text-muted-foreground">{row.percent}%</span>
                  </div>
                  <Progress value={row.percent} />
                </Card>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Button variant="outline" onClick={() => onNavigate?.("select")}>
          <UserPlus className="w-4 h-4 mr-2" /> Выбрать контакт
        </Button>
        <Button variant="outline" onClick={() => onNavigate?.("dossier")} disabled={!hasContact}>
          <FileText className="w-4 h-4 mr-2" /> Досье
        </Button>
        <Button variant="outline" onClick={() => onNavigate?.("categories")}>
          <FolderTree className="w-4 h-4 mr-2" /> Категории
        </Button>
      </div>
    </div>
  );
}

