import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import {
  User,
  Phone,
  Building,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Link2,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

interface Contact {
  id: string;
  name: string;
  phone: string;
  organization?: string;
}

interface ProfileData {
  key: string;
  label: string;
  value: string;
}

interface PublicProfile {
  source: string;
  profileUrl: string;
  photo?: string;
  data: ProfileData[];
}

interface DossierScreenProps {
  contact: Contact;
}

const mockProfiles: PublicProfile[] = [
  {
    source: "LinkedIn",
    profileUrl: "https://linkedin.com/in/sarahjohnson",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    data: [
      { key: "city", label: "Город", value: "Сан-Франциско, Калифорния" },
      { key: "profession", label: "Профессия", value: "Старший инженер-программист" },
      { key: "workplace", label: "Место работы", value: "Tech Corp" },
      { key: "experience", label: "Опыт", value: "8 лет" },
      { key: "education", label: "Образование", value: "Стэнфордский университет" },
    ],
  },
  {
    source: "Facebook",
    profileUrl: "https://facebook.com/sarah.johnson",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    data: [
      { key: "city", label: "Город", value: "Сан-Франциско, Калифорния" },
      { key: "birthdate", label: "Дата рождения", value: "15 марта 1990" },
      { key: "hometown", label: "Родной город", value: "Бостон, Массачусетс" },
      { key: "relationship", label: "Отношения", value: "Не замужем" },
    ],
  },
  {
    source: "Twitter/X",
    profileUrl: "https://twitter.com/sarahjdev",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    data: [
      { key: "bio", label: "Биография", value: "Инженер-программист | Энтузиаст технологий | Любитель кофе" },
      { key: "location", label: "Местоположение", value: "Район залива Сан-Франциско" },
      { key: "website", label: "Веб-сайт", value: "sarahjohnson.dev" },
      { key: "followers", label: "Подписчики", value: "2,453" },
    ],
  },
];

export function DossierScreen({ contact }: DossierScreenProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["LinkedIn"]);
  const [linkingProfile, setLinkingProfile] = useState<PublicProfile | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const toggleSection = (source: string) => {
    setExpandedSections((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  };

  const handleLinkProfile = (profile: PublicProfile) => {
    setLinkingProfile(profile);
    setSelectedFields([]);
  };

  const handleImportFields = () => {
    // Mock import functionality
    console.log("Importing fields:", selectedFields);
    setLinkingProfile(null);
    setSelectedFields([]);
  };

  const toggleField = (key: string) => {
    setSelectedFields((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <>
      <div className="p-6 space-y-6 pb-20">
        {/* Contact Header */}
        <Card className="p-6 border-2">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-10 h-10 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="mb-1">{contact.name}</h2>
                <p className="text-muted-foreground text-sm">Контактная информация</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{contact.phone}</span>
                </div>
                {contact.organization && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span>{contact.organization}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Public Profiles */}
        <div className="space-y-4">
          <h3>Публичные профили</h3>

          {mockProfiles.map((profile) => (
            <Card key={profile.source} className="border-2 overflow-hidden">
              <Collapsible
                open={expandedSections.includes(profile.source)}
                onOpenChange={() => toggleSection(profile.source)}
              >
                <CollapsibleTrigger asChild>
                  <button className="w-full p-4 flex items-center justify-between hover:bg-accent transition-colors">
                    <span className="font-medium">{profile.source}</span>
                    {expandedSections.includes(profile.source) ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <Separator />
                  <div className="p-4 space-y-4">
                    <div className="flex gap-4">
                      {/* Left: Profile Data */}
                      <div className="flex-1 space-y-3">
                        {profile.data.map((item) => (
                          <div key={item.key} className="space-y-1">
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">
                              {item.label}
                            </div>
                            <div className="text-sm">{item.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Right: Profile Photo */}
                      {profile.photo && (
                        <div className="flex-shrink-0">
                          <img
                            src={profile.photo}
                            alt={profile.source}
                            className="w-24 h-24 rounded-lg object-cover border-2"
                          />
                        </div>
                      )}
                    </div>

                    {/* Profile Link */}
                    <a
                      href={profile.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Посмотреть оригинальный профиль
                    </a>

                    {/* Link Profile Button */}
                    <Button
                      onClick={() => handleLinkProfile(profile)}
                      className="w-full"
                      variant="default"
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      Связать профиль с контактом
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      </div>

      {/* Link Profile Modal */}
      <Dialog open={!!linkingProfile} onOpenChange={() => setLinkingProfile(null)}>
        <DialogContent className="w-full max-w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>Связать профиль {linkingProfile?.source}</DialogTitle>
            <DialogDescription>
              Выберите поля, которые хотите импортировать в контакт
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[400px]">
            <div className="space-y-4 pr-4">

              <div className="space-y-3">
                {linkingProfile?.data.map((item) => (
                  <div key={item.key} className="flex items-start gap-3 p-3 border-2 rounded-lg">
                    <Checkbox
                      id={item.key}
                      checked={selectedFields.includes(item.key)}
                      onCheckedChange={() => toggleField(item.key)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 space-y-1">
                      <Label htmlFor={item.key} className="cursor-pointer">
                        {item.label}
                      </Label>
                      <div className="text-sm text-muted-foreground">{item.value}</div>
                    </div>
                  </div>
                ))}

                <div className="flex items-start gap-3 p-3 border-2 rounded-lg">
                  <Checkbox
                    id="profile-url"
                    checked={selectedFields.includes("profile-url")}
                    onCheckedChange={() => toggleField("profile-url")}
                    className="mt-0.5"
                  />
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="profile-url" className="cursor-pointer">
                      URL социального профиля
                    </Label>
                    <div className="text-sm text-muted-foreground break-all">
                      {linkingProfile?.profileUrl}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setLinkingProfile(null)}>
              Отмена
            </Button>
            <Button onClick={handleImportFields} disabled={selectedFields.length === 0}>
              Импортировать выбранные поля ({selectedFields.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
