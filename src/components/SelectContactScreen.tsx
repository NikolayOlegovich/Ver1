import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Search, User, Building, Phone } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
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

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery) ||
    (contact.organization?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false),
  );

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
        setError("Плагин контактов недоступен в браузере. Запустите на Android/iOS (Capacitor).");
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
          if (!id && !name && !phone) return null;
          return { id: String(id || name || phone), name, phone, organization } as Contact;
        })
        .filter(Boolean) as Contact[];

      setContacts(normalized);
    } catch (err: any) {
      const message = err?.message || "Не удалось получить контакты. Проверьте разрешения.";
      setError(message);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (selectedContact) {
      onContactSelected(selectedContact);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  return (
    <div className="w-full">
      <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open && onBack) onBack(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Выбор контакта</DialogTitle>
            <DialogDescription>Найдите контакт по имени, телефону или организации</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по контактам…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-2"
              />
            </div>

            <ScrollArea className="w-full h-[300px] border-2 rounded-lg">
              <div className="p-2 space-y-1">
                {loading && <div className="p-3 text-sm text-muted-foreground">Загрузка контактов…</div>}
                {error && !loading && <div className="p-3 text-sm text-destructive">{error}</div>}
                {!loading && !error && filteredContacts.length === 0 && (
                  <div className="p-3 text-sm text-muted-foreground">Ничего не найдено</div>
                )}
                {!loading && !error &&
                  filteredContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
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
            </ScrollArea>
          </div>

          <DialogFooter className="gap-2 flex flex-col">
            <Button onClick={handleContinue} disabled={!selectedContact} className="w-full" size="lg">
              Продолжить
            </Button>
            <Button variant="outline" onClick={() => { setIsModalOpen(false); if (onBack) onBack(); }} className="w-full" size="lg">
              Назад
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

