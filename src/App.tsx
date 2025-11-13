import { useEffect, useState } from "react";
import { StatisticsScreen } from "./components/StatisticsScreen";
import { SelectContactScreen } from "./components/SelectContactScreen";
import { CategoriesScreen } from "./screens/CategoriesScreen";
import { DossierScreen as DossierScreenDomain } from "./screens/DossierScreen";
import { DossierListScreen } from "./screens/DossierListScreen";
import { FileText, ArrowLeft } from "lucide-react";
import { createStorage } from "./domain";
import type { UUID, Contact as DomainContact } from "./domain";
import { calcCompleteness } from "./domain/services/completeness";
import { Capacitor } from "@capacitor/core";

interface Contact {
  id: string;
  name: string;
  phone: string;
  organization?: string;
}

type Screen = "statistics" | "select" | "dossier" | "categories" | "dossierList";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("statistics");
  const [selectedContactId, setSelectedContactId] = useState<UUID | null>(null);

  // Human-readable title for header
  const displayTitle =
    currentScreen === "dossier" || currentScreen === "dossierList"
      ? "Досье"
      : currentScreen === "categories"
      ? "Категории"
      : currentScreen === "select"
      ? "Выбор контакта"
      : "Статистика";

  const title =
    currentScreen === "dossier" || currentScreen === "dossierList"
      ? "Досье"
      : currentScreen === "categories"
      ? "Категории"
      : currentScreen === "select"
      ? "Выбор контакта"
      : "Социальный капитал";

  // Android аппаратная «Назад»: возвращаемся на главный экран
  useEffect(() => {
    let remove: (() => void) | undefined;
    if (Capacitor.getPlatform() === "android") {
      try {
        const AppPlugin = (window as any)?.Capacitor?.Plugins?.App;
        if (AppPlugin && typeof AppPlugin.addListener === "function") {
          const sub = AppPlugin.addListener("backButton", () => {
            if (currentScreen !== "statistics") setCurrentScreen("statistics");
          });
          remove = () => { try { sub?.remove?.(); } catch {} };
        }
      } catch {}
    }
    return () => { if (remove) remove(); };
  }, [currentScreen]);

  const handleContactSelected = async (contact: Contact) => {
    try { localStorage.setItem("sc:stagedContact", JSON.stringify(contact)); } catch {}
    setSelectedContactId(contact.id as UUID);
    setCurrentScreen("dossier");
    (async () => {
      try {
        const storage = await createStorage();
        const nameParts = (contact.name || "").trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ");
        const now = new Date().toISOString();
        const domainContact: DomainContact = {
          id: contact.id,
          firstName,
          lastName,
          phones: contact.phone ? [contact.phone] : [],
          emails: [],
          organization: contact.organization,
          position: undefined,
          birthday: undefined,
          photoUri: undefined,
          notes: undefined,
          tags: [],
          createdAt: now,
          updatedAt: now,
          lastInteractionAt: undefined,
        };
        await storage.contacts.upsert(domainContact);
        const existingScores = await storage.scores.get(contact.id as UUID);
        if (!existingScores) {
          await storage.scores.upsert({
            contactId: contact.id as UUID,
            completeness: calcCompleteness(domainContact),
            warmth: 0,
            valueScore: 3,
          });
        }
      } catch {}
    })();
  };

  return (
    <div className="min-h-screen w-full bg-muted/30">
      <div className="w-full min-h-screen bg-background flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-background border-b-2 px-4 py-3">
          <div className="flex items-center gap-3">
            {currentScreen !== "statistics" ? (
              <button
                onClick={() => setCurrentScreen("statistics")}
                className="flex flex-col items-center justify-center px-2 py-1 rounded-md hover:bg-accent"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-[10px] leading-tight">Назад</span>
              </button>
            ) : (
              <div className="w-10" />
            )}
            <h1 className="flex-1 text-center whitespace-nowrap overflow-hidden text-ellipsis">{displayTitle}</h1>
            <div className="w-10" />
          </div>
        </div>

        {/* Screen Content */}
        <div className="flex-1 overflow-y-auto bg-background">
          {currentScreen === "statistics" && (
            <StatisticsScreen
              onNavigate={(scr) => setCurrentScreen(scr as Screen)}
              hasContact={!!selectedContactId}
            />
          )}
          {currentScreen === "select" && (
            <SelectContactScreen onContactSelected={handleContactSelected} onBack={() => setCurrentScreen("statistics")} />
          )}
          {currentScreen === "dossier" && selectedContactId && (
            <DossierScreenDomain contactId={selectedContactId} />
          )}
          {currentScreen === "dossier" && !selectedContactId && (
            <div className="flex items-center justify-center h-full p-6 text-center">
              <div className="space-y-2">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3>Досье не выбрано</h3>
                <p className="text-muted-foreground text-sm">Откройте экран «Выбор контакта» и выберите контакт.</p>
              </div>
            </div>
          )}
          {currentScreen === "dossierList" && (
            <DossierListScreen onSelect={(id) => { setSelectedContactId(id as any); setCurrentScreen("dossier"); }} />
          )}
          {currentScreen === "categories" && <CategoriesScreen />}
        </div>
      </div>
    </div>
  );
}
