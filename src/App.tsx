import { useState } from "react";
import { StatisticsScreen } from "./components/StatisticsScreen";
import { SelectContactScreen } from "./components/SelectContactScreen";
import { DossierScreen } from "./components/DossierScreen";
import { CategoriesScreen } from "./components/CategoriesScreen";
import { BarChart3, UserPlus, FileText, FolderTree } from "lucide-react";

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
    { id: "statistics" as Screen, label: "Статистика", icon: BarChart3 },
    { id: "select" as Screen, label: "Выбрать контакт", icon: UserPlus },
    { id: "dossier" as Screen, label: "Досье", icon: FileText },
    { id: "categories" as Screen, label: "Категории", icon: FolderTree },
  ];

  return (
    <div className="min-h-screen w-full bg-muted/30">
      {/* App Container (full-width on mobile) */}
      <div className="w-full min-h-screen bg-background flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-background border-b-2 px-6 py-4">
          <h1 className="text-center whitespace-nowrap overflow-hidden text-ellipsis">Управление контактами</h1>
        </div>

        {/* Screen Content */}
        <div className="flex-1 overflow-y-auto bg-background">
          {currentScreen === "statistics" && <StatisticsScreen />}
          {currentScreen === "select" && (
            <SelectContactScreen onContactSelected={handleContactSelected} />
          )}
          {currentScreen === "dossier" && selectedContact && (
            <DossierScreen contact={selectedContact} />
          )}
          {currentScreen === "dossier" && !selectedContact && (
            <div className="flex items-center justify-center h-full p-6 text-center">
              <div className="space-y-2">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3>Досье недоступно</h3>
                <p className="text-muted-foreground text-sm">
                  Чтобы открыть досье, сначала выберите контакт на экране «Выбрать контакт».
                </p>
              </div>
            </div>
          )}
          {currentScreen === "categories" && <CategoriesScreen />}
        </div>

        {/* Bottom Navigation */}
        <div className="bg-background border-t-2 px-2 py-2">
          <div className="grid grid-cols-4 gap-2 w-full">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;
              const isDisabled = item.id === "dossier" && !selectedContact;

              return (
                <button
                  key={item.id}
                  onClick={() => !isDisabled && setCurrentScreen(item.id)}
                  disabled={isDisabled}
                  className={`w-full flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isDisabled
                      ? "text-muted-foreground opacity-50"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[11px] leading-tight truncate w-full text-center">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
