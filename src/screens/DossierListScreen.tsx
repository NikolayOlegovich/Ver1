import { useEffect, useMemo, useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { User, Building, Phone } from "lucide-react";
import { createStorage } from "../domain";
import type { Contact, UUID } from "../domain";

export function DossierListScreen({ onSelect }: { onSelect: (id: UUID) => void }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (q: string) => {
    try {
      setLoading(true); setError(null);
      const storage = await createStorage();
      const results = await storage.contacts.searchByNameOrg(q, 500);
      // Sort by updatedAt desc
      results.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
      setItems(results);
    } catch (e: any) {
      setError(e?.message || "Не удалось загрузить список досье");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(""); }, []);
  useEffect(() => { const id = setTimeout(() => load(query), 200); return () => clearTimeout(id); }, [query]);

  return (
    <div className="p-4 space-y-3">
      <Card className="p-3 border-2">
        <div className="relative">
          <Input placeholder="Поиск по имени/организации" value={query} onChange={(e)=>setQuery(e.target.value)} />
        </div>
      </Card>

      <div className="min-h-0 max-h-[calc(100dvh-180px)] overflow-y-auto space-y-2 px-1">
        {loading && <div className="text-sm text-muted-foreground px-2">Загрузка…</div>}
        {error && !loading && <div className="text-sm text-destructive px-2">{error}</div>}
        {!loading && !error && items.length === 0 && (
          <div className="text-sm text-muted-foreground px-2">Пока нет досье</div>
        )}
        {!loading && !error && items.map(c => (
          <button key={c.id} onClick={() => onSelect(c.id)} className="w-full text-left p-3 rounded-lg border-2 transition-colors bg-card hover:bg-accent">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{[c.firstName, c.lastName].filter(Boolean).join(" ") || "Без имени"}</div>
                {c.phones?.[0] && (
                  <div className="text-sm opacity-80 flex items-center gap-1 mt-0.5 break-all"><Phone className="w-3 h-3" />
                    {c.phones[0]}
                  </div>
                )}
                {c.organization && (
                  <div className="text-sm opacity-80 flex items-center gap-1 mt-0.5 break-words"><Building className="w-3 h-3" />
                    {c.organization}
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

