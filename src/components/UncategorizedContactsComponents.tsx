import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { ArrowLeft } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  phone: string;
  categories: string[];
}

interface Tag2Data {
  name: string;
  count: number;
  color: string;
}

interface Category {
  id: string;
  name: string;
  count: number;
  description: string;
}

interface UncategorizedContactsListProps {
  contacts: Contact[];
  onBack: () => void;
  onSelectContact: (contact: Contact) => void;
}

export function UncategorizedContactsList({ contacts, onBack, onSelectContact }: UncategorizedContactsListProps) {
  return (
    <Dialog open={true} onOpenChange={onBack}>
      <DialogContent className="w-full max-w-[calc(100vw-2rem)] h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <DialogTitle>Некатегоризированные контакты</DialogTitle>
              <DialogDescription>Выберите контакт для уточнения</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-2 pr-4">
            {contacts.map((contact) => (
              <button key={contact.id} onClick={() => onSelectContact(contact)} className="w-full">
                <Card className="p-4 border-2 hover:bg-accent/50 transition-colors text-left">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div>{contact.name}</div>
                      <div className="text-sm text-muted-foreground mt-1">{contact.phone}</div>
                    </div>
                    <ArrowLeft className="w-5 h-5 rotate-180 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                </Card>
              </button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface Tag2RefinementScreenProps {
  categoryId: string;
  category: Category | undefined;
  contact: Contact | null;
  tag2Data: Tag2Data[];
  onBack: () => void;
  onConfirm: (selectedTag2s: string[]) => void;
}

export function Tag2RefinementScreen({ category, contact, tag2Data, onBack, onConfirm }: Tag2RefinementScreenProps) {
  const [selectedTag2s, setSelectedTag2s] = useState<string[]>([]);

  const toggleTag2 = (tag2Name: string) => {
    setSelectedTag2s((prev) => (prev.includes(tag2Name) ? prev.filter((t) => t !== tag2Name) : [...prev, tag2Name]));
  };

  return (
    <Dialog open={true} onOpenChange={onBack}>
      <DialogContent className="w-full max-w-[calc(100vw-2rem)] h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <DialogTitle>Уточнение по подкатегории</DialogTitle>
              <DialogDescription>{category?.name}: выберите подходящие теги</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="border-2 rounded-lg p-3 bg-muted/30">
          <div className="text-sm">{contact?.name}</div>
          <div className="text-xs text-muted-foreground">{contact?.phone}</div>
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-2 pr-4">
            {tag2Data.map((tag2) => (
              <div key={tag2.name} className="flex items-center gap-3 p-3 border-2 rounded-lg">
                <Checkbox id={`tag2-${tag2.name}`} checked={selectedTag2s.includes(tag2.name)} onCheckedChange={() => toggleTag2(tag2.name)} />
                <Label htmlFor={`tag2-${tag2.name}`} className="flex-1 cursor-pointer">
                  <div>{tag2.name}</div>
                  <div className="text-xs text-muted-foreground">{tag2.count} контактов</div>
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>

        {selectedTag2s.length > 0 && (
          <div className="border-t-2 pt-3">
            <p className="text-sm text-muted-foreground mb-2">Выбрано:</p>
            <div className="flex gap-1 flex-wrap">
              {selectedTag2s.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onBack}>
            Назад
          </Button>
          <Button onClick={() => onConfirm(selectedTag2s)} disabled={selectedTag2s.length === 0} className="flex-1">
            Подтвердить ({selectedTag2s.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

