import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Search, User, Building, Phone } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Contacts } from "@capacitor-community/contacts";

interface Contact {
  id: string;
  name: string;
  phone: string;
  organization?: string;
}

interface SelectContactScreenProps {
  onContactSelected: (contact: Contact) => void;
  onBack?: () => void;
}

export function SelectContactScreen({ onContactSelected, onBack }: SelectContactScreenProps) {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery) ||
    (contact.organization?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false),
  );
  const visibleContacts = filteredContacts.slice(0, visibleCount);

  const ensurePermissions = async () => {
    try {
      const platform = Capacitor.getPlatform();
      const anyContacts: any = Contacts as any;
      if ((platform === "android" || platform === "ios") && typeof anyContacts.requestPermissions === "function") {
        await anyContacts.requestPermissions();
      }
    } catch {
      // ignore
    }
  };

  const loadContactsFromDevice = async () => {
    setLoading(true);
    setError(null);
    try {
      const platform = Capacitor.getPlatform();
      if (platform === "web") {
        setError("Чтение контактов доступно только на Android/iOS (Capacitor).");
        setContacts([]);
        return;
      }

      await ensurePermissions();

      const result: any = await Contacts.getContacts({
        projection: { name: true, phones: true, organization: true },
      } as any);

      const raw = Array.isArray(result) ? result : result?.contacts ?? [];

      const normalized: Contact[] = raw
        .map((c: any) => {
          const id = c?.contactId || c?.identifier || c?.id || "";
          const nameParts = [c?.name?.display, c?.displayName, c?.name?.given, c?.name?.family]
            .filter(Boolean)
            .map((s: string) => String(s));
          const name = (nameParts[0] || "Без имени").trim();
          const phone = c?.phones?.[0]?.number || c?.phoneNumbers?.[0]?.number || "";
          const organization = c?.organization?.company || c?.organization?.name || undefined;
          if (!id && !name && !phone) return null as any;
          return { id: String(id || name || phone), name, phone, organization } as Contact;
        })
        .filter(Boolean) as Contact[];

      setContacts(normalized);
    } catch (err: any) {
      const message = err?.message || "Не удалось загрузить контакты. Повторите попытку.";
      setError(message);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    if (selectedContact) {
      await onContactSelected(selectedContact);
      setIsModalOpen(false);
      setSearchQuery("");
      setSelectedContact(null);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      loadContactsFromDevice();
    } else {
      setSearchQuery("");
      setSelectedContact(null);
    }
  }, [isModalOpen]);

  // Reset lazy window on search or data change
  useEffect(() => {
    setVisibleCount(5);
  }, [searchQuery, contacts.length]);

  const handleScroll = (e: any) => {
    const el = e.currentTarget as HTMLDivElement;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
      setVisibleCount((n) => Math.min(n + 5, filteredContacts.length));
    }
  };

  return (
    <div className="w-full">
      <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); }}>
        <DialogContent className="fixed inset-0 top-0 bottom-0 h-[100dvh] w-[100vw] max-w-none grid grid-rows-[auto,1fr,auto] rounded-none border-0 p-0 overflow-x-hidden">
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle>Выбор контакта</DialogTitle>
            <DialogDescription>Найдите контакт по имени, телефону или организации</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 min-h-0 px-4">
            <div className="relative flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по контактам"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-2"
              />
            </div>

            <div className="w-full overflow-y-auto border-2 rounded-lg overscroll-contain" style={{ maxHeight: 420 }} onScroll={handleScroll}>
              <div className="p-2 space-y-1">
                {loading && <div className="p-3 text-sm text-muted-foreground">Загрузка контактов…</div>}
                {error && !loading && <div className="p-3 text-sm text-destructive">{error}</div>}
                {!loading && !error && filteredContacts.length === 0 && (
                  <div className="p-3 text-sm text-muted-foreground">Ничего не найдено</div>
                )}
                {!loading && !error &&
                  visibleContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-colors min-h-[84px] ${
                        selectedContact?.id === contact.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card hover:bg-accent border-transparent"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{contact.name}</div>
                          {contact.phone && (
                            <div className="text-sm opacity-80 flex items-center gap-1 mt-0.5 break-all"><Phone className="w-3 h-3" />
                              {contact.phone}
                            </div>
                          )}
                          {contact.organization && (
                            <div className="text-sm opacity-80 flex items-center gap-1 mt-0.5 break-words"><Building className="w-3 h-3" />
                              {contact.organization}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

          </div>

          <DialogFooter className="gap-2 flex flex-col px-4 pb-4 pt-2 border-t bg-background">
            <Button onClick={handleContinue} disabled={!selectedContact} className="w-full" size="lg">Продолжить</Button>
            <Button variant="outline" onClick={() => { setIsModalOpen(false); if (onBack) onBack(); }} className="w-full" size="lg">Назад</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
