import { useState } from "react";
import { StatisticsScreen } from "./components/StatisticsScreen";
import { SelectContactScreen } from "./components/SelectContactScreen";
import { DossierScreen } from "./components/DossierScreen";
import { CategoriesScreen } from "./components/CategoriesScreen";
import { UserPlus, FileText, FolderTree, ArrowLeft } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  phone: string;
  organization?: string;
}

type Screen = "statistics" | "select" | "dossier" | "categories";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("statistics");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const handleContactSelected = (contact: Contact) => {
    setSelectedContact(contact);
    setCurrentScreen("dossier");
  };

  const navigationItems = [
    { id: "select" as Screen, label: "Выбор контакта", icon: UserPlus },
    { id: "dossier" as Screen, label: "Досье", icon: FileText },
    { id: "categories" as Screen, label: "Категории", icon: FolderTree },
  ];

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
            <h1 className="flex-1 text-center whitespace-nowrap overflow-hidden text-ellipsis">
              Анализ контактов
            </h1>
            <div className="w-10" />
          </div>
        </div>

        {/* Screen Content */}
        <div className="flex-1 overflow-y-auto bg-background">
          {currentScreen === "statistics" && (
            <StatisticsScreen
              onNavigate={(scr) => setCurrentScreen(scr as Screen)}
              hasContact={!!selectedContact}
            />
          )}
          {currentScreen === "select" && (
            <SelectContactScreen onContactSelected={handleContactSelected} onBack={() => setCurrentScreen("statistics")} />
          )}
          {currentScreen === "dossier" && selectedContact && (
            <DossierScreen contact={selectedContact} />
          )}
          {currentScreen === "dossier" && !selectedContact && (
            <div className="flex items-center justify-center h-full p-6 text-center">
              <div className="space-y-2">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3>Досье не выбрано</h3>
                <p className="text-muted-foreground text-sm">
                  Выберите контакт на экране выбора, чтобы перейти к досье.
                </p>
              </div>
            </div>
          )}
          {currentScreen === "categories" && <CategoriesScreen />}
        </div>
      </div>
    </div>
  );
}

