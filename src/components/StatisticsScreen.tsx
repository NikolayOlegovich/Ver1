import { useEffect, useMemo, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Contacts } from "@capacitor-community/contacts";
import { Progress } from "./ui/progress";
import { Card } from "./ui/card";
import { Users } from "lucide-react";

type CoverageRow = {
  key: string;
  label: string;
  weight: number;
  percent: number; // 0..100
};

export function StatisticsScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);

  // Веса полей
  const WEIGHTS = {
    fio: 2,
    phone: 2,
    org: 3,
    birthday: 3,
    email: 1,
    address: 1,
    website: 1,
    notes: 1,
  } as const;

  const MAX_POINTS = useMemo(() => {
    return Object.values(WEIGHTS).reduce((s, v) => s + v, 0);
  }, []);

  const normalize = (c: any) => {
    const first = c?.name?.given || c?.name?.first || c?.firstName;
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
    // ФИО
    const fioPts = c.first && c.last ? WEIGHTS.fio : c.first || c.last ? 1 : 0;
    earned += fioPts;
    // Телефон
    if (c.phones && c.phones.length > 0) earned += WEIGHTS.phone;
    // Организация
    if (c.org) earned += WEIGHTS.org;
    // День рождения
    if (c.birthday) earned += WEIGHTS.birthday;
    // Остальные: email, адрес, сайт, заметки
    if (c.emails && c.emails.length > 0) earned += WEIGHTS.email;
    if (c.addresses && c.addresses.length > 0) earned += WEIGHTS.address;
    if (c.websites && c.websites.length > 0) earned += WEIGHTS.website;
    if (c.notes) earned += WEIGHTS.notes;
    return { earned, max: MAX_POINTS, fioPts };
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const platform = Capacitor.getPlatform();
      if (platform === "web") {
        setError("Статистика доступна на Android/iOS (доступ к контактам).");
        setContacts([]);
        return;
      }
      // Запрос разрешений — на Android/iOS используем requestPermissions
      const anyContacts: any = Contacts as any;
      if (typeof anyContacts.requestPermissions === "function") {
        await anyContacts.requestPermissions();
      }
      const result: any = await Contacts.getContacts({
        projection: {
          name: true,
          phones: true,
          organization: true,
          birthdays: true,
          emails: true,
          addresses: true,
          urls: true,
          note: true,
        },
      } as any);
      const raw = Array.isArray(result) ? result : result?.contacts ?? [];
      setContacts(raw);
    } catch (e: any) {
      setError(e?.message || "Не удалось загрузить контакты.");
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalContacts = contacts.length;

  const { qualityPercent, coverage } = useMemo(() => {
    if (totalContacts === 0) {
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
    let phoneCount = 0;
    let orgCount = 0;
    let birthdayCount = 0;
    let emailCount = 0;
    let addressCount = 0;
    let websiteCount = 0;
    let notesCount = 0;

    for (const rc of contacts) {
      const c = normalize(rc);
      const { earned, max, fioPts } = pointsFor(c);
      sumPercents += (earned / max) * 100;
      fioEarnedTotal += fioPts;
      if (c.phones?.length > 0) phoneCount++;
      if (c.org) orgCount++;
      if (c.birthday) birthdayCount++;
      if (c.emails?.length > 0) emailCount++;
      if (c.addresses?.length > 0) addressCount++;
      if (c.websites?.length > 0) websiteCount++;
      if (c.notes) notesCount++;
    }

    const qualityPercent = Math.round(sumPercents / totalContacts);

    const coverage: CoverageRow[] = [
      {
        key: "fio",
        label: "ФИО",
        weight: WEIGHTS.fio,
        percent: Math.round((fioEarnedTotal / (WEIGHTS.fio * totalContacts)) * 100),
      },
      { key: "phone", label: "Телефон", weight: WEIGHTS.phone, percent: Math.round((phoneCount / totalContacts) * 100) },
      { key: "org", label: "Организация", weight: WEIGHTS.org, percent: Math.round((orgCount / totalContacts) * 100) },
      { key: "birthday", label: "День рождения", weight: WEIGHTS.birthday, percent: Math.round((birthdayCount / totalContacts) * 100) },
      { key: "email", label: "Email", weight: WEIGHTS.email, percent: Math.round((emailCount / totalContacts) * 100) },
      { key: "address", label: "Адрес", weight: WEIGHTS.address, percent: Math.round((addressCount / totalContacts) * 100) },
      { key: "website", label: "Сайт", weight: WEIGHTS.website, percent: Math.round((websiteCount / totalContacts) * 100) },
      { key: "notes", label: "Заметки", weight: WEIGHTS.notes, percent: Math.round((notesCount / totalContacts) * 100) },
    ];

    return { qualityPercent, coverage };
  }, [contacts, totalContacts]);

  return (
    <div className="p-6 space-y-6">
      {/* Total Contacts */}
      <Card className="p-6 border-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">Всего контактов</p>
            <h2>{totalContacts}</h2>
          </div>
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
            <Users className="w-7 h-7 text-primary" />
          </div>
        </div>
        {error && <p className="text-destructive text-sm mt-3">{error}</p>}
        {loading && !error && <p className="text-muted-foreground text-sm mt-3">Загрузка…</p>}
      </Card>

      {/* Quality Score Circle */}
      <Card className="p-8 border-2">
        <div className="flex flex-col items-center space-y-4">
          <h2 className="text-muted-foreground">Индекс качества контактов</h2>
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="none" className="text-muted" />
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${2 * Math.PI * 88 * (1 - qualityPercent / 100)}`}
                className="text-primary transition-all duration-500"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl">{qualityPercent}%</span>
              <span className="text-muted-foreground text-sm mt-1">Заполненность</span>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground max-w-xs">
            Процент — среднее по всем контактам устройства. Вес полей: ФИО (2), Телефон (2), Организация (3), День рождения (3), Email (1), Адрес (1), Сайт (1), Заметки (1).
          </p>
        </div>
      </Card>

      {/* Field Breakdown */}
      <Card className="p-6 border-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3>Заполняемость по полям</h3>
            <span className="text-sm text-muted-foreground">Вес учитывается в общей оценке</span>
          </div>

          <div className="space-y-3">
            {coverage.map((row) => (
              <div key={row.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{row.label}</span>
                    <span className="text-xs text-muted-foreground">вес {row.weight}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{row.percent}%</span>
                </div>
                <Progress value={row.percent} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
