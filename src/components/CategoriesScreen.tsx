import { useState } from "react";
import { Card } from "./ui/card";
import {
  HelpCircle,
  ArrowLeft,
  Plus,
  UserPlus,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import {
  UncategorizedContactsList,
  Tag2RefinementScreen,
} from "./UncategorizedContactsComponents";

interface Category {
  id: string;
  name: string;
  count: number;
  description: string;
}

interface Tag2Data {
  name: string;
  count: number;
  color: string;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  categories: string[];
}

const categories: Category[] = [
  {
    id: "family",
    name: "Семья",
    count: 12,
    description: "Самые близкие родственники.",
  },
  {
    id: "friends",
    name: "Друзья",
    count: 28,
    description: "Самые близкие друзья.",
  },
  {
    id: "close",
    name: "Близкие",
    count: 15,
    description:
      "Те, кого вы считаете важными для вас, кому готовы помогать и кто может помочь вам; это могут быть как родственники, так и друзья (не входящие в круг самых близких).",
  },
  {
    id: "seniors",
    name: "Старшие товарищи",
    count: 24,
    description:
      "Те, к кому вы обратитесь за помощью или советом.",
  },
  {
    id: "colleagues",
    name: "Коллеги",
    count: 87,
    description: "С кем вы работаете сейчас.",
  },
  {
    id: "former",
    name: "Работал раньше",
    count: 43,
    description: "С кем вы работали раньше.",
  },
  {
    id: "interests",
    name: "По интересам",
    count: 31,
    description:
      "Контакты по группам интересов (данные #Tag вы задаете сами).",
  },
  {
    id: "acquaintances",
    name: "Знакомые",
    count: 19,
    description:
      "Контакты, про которые вы знаете, но они не входят в сферу ближайших интересов.",
  },
];

const tag2DataByFamilyCategory: Tag2Data[] = [
  { name: "Родители", count: 5, color: "hsl(var(--chart-1))" },
  { name: "Дети", count: 3, color: "hsl(var(--chart-2))" },
  {
    name: "Братья и сёстры",
    count: 4,
    color: "hsl(var(--chart-3))",
  },
  {
    name: "Другие родственники",
    count: 8,
    color: "hsl(var(--chart-4))",
  },
];

const tag2DataByFriendsCategory: Tag2Data[] = [
  { name: "С детства", count: 8, color: "hsl(var(--chart-1))" },
  { name: "По учёбе", count: 12, color: "hsl(var(--chart-2))" },
  {
    name: "Общие интересы",
    count: 8,
    color: "hsl(var(--chart-3))",
  },
];

const tag2DataByCloseCategory: Tag2Data[] = [
  {
    name: "Наставники",
    count: 4,
    color: "hsl(var(--chart-1))",
  },
  {
    name: "Близкие друзья",
    count: 6,
    color: "hsl(var(--chart-2))",
  },
  {
    name: "Доверенные лица",
    count: 5,
    color: "hsl(var(--chart-3))",
  },
];

const tag2DataByAcquaintancesCategory: Tag2Data[] = [
  { name: "Соседи", count: 5, color: "hsl(var(--chart-1))" },
  {
    name: "По общению",
    count: 8,
    color: "hsl(var(--chart-2))",
  },
  {
    name: "Разовые контакты",
    count: 6,
    color: "hsl(var(--chart-3))",
  },
];

const tag2DataBySeniorsCategory: Tag2Data[] = [
  {
    name: "По бизнесу/работе",
    count: 10,
    color: "hsl(var(--chart-1))",
  },
  { name: "Карьере", count: 8, color: "hsl(var(--chart-2))" },
  {
    name: "По личностному росту",
    count: 4,
    color: "hsl(var(--chart-3))",
  },
  { name: "Прочее", count: 2, color: "hsl(var(--chart-4))" },
];

const tag2DataByColleaguesCategory: Tag2Data[] = [
  {
    name: "Руководители",
    count: 12,
    color: "hsl(var(--chart-1))",
  },
  {
    name: "Свой круг",
    count: 35,
    color: "hsl(var(--chart-2))",
  },
  {
    name: "Параллель",
    count: 28,
    color: "hsl(var(--chart-3))",
  },
  {
    name: "Подчиненные",
    count: 12,
    color: "hsl(var(--chart-4))",
  },
];

const tag2DataByFormerCategory: Tag2Data[] = [
  {
    name: "Tech Corp",
    count: 15,
    color: "hsl(var(--chart-1))",
  },
  {
    name: "StartupXYZ",
    count: 12,
    color: "hsl(var(--chart-2))",
  },
  {
    name: "Consulting Inc",
    count: 8,
    color: "hsl(var(--chart-3))",
  },
  {
    name: "Design Studio",
    count: 8,
    color: "hsl(var(--chart-4))",
  },
];

const tag2DataByInterestsCategory: Tag2Data[] = [
  { name: "Рыбалка", count: 12, color: "hsl(var(--chart-1))" },
  { name: "Спорт", count: 10, color: "hsl(var(--chart-2))" },
  {
    name: "Фотография",
    count: 6,
    color: "hsl(var(--chart-3))",
  },
  { name: "Музыка", count: 3, color: "hsl(var(--chart-5))" },
];

const mockPhoneBookContacts: Contact[] = [
  {
    id: "1",
    name: "Алексей Иванов",
    phone: "+7 (495) 123-4567",
    categories: [],
  },
  {
    id: "2",
    name: "Мария Петрова",
    phone: "+7 (495) 234-5678",
    categories: ["family"],
  },
  {
    id: "3",
    name: "Дмитрий Сидоров",
    phone: "+7 (495) 345-6789",
    categories: ["colleagues"],
  },
  {
    id: "4",
    name: "Елена Смирнова",
    phone: "+7 (495) 456-7890",
    categories: ["friends"],
  },
  {
    id: "5",
    name: "Иван Козлов",
    phone: "+7 (495) 567-8901",
    categories: [],
  },
  {
    id: "6",
    name: "Ольга Новикова",
    phone: "+7 (495) 678-9012",
    categories: ["colleagues", "former"],
  },
];

export function CategoriesScreen() {
  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);
  const [selectedTag2, setSelectedTag2] =
    useState<Tag2Data | null>(null);
  const [showAddContactDialog, setShowAddContactDialog] =
    useState(false);
  const [showAddCategoryDialog, setShowAddCategoryDialog] =
    useState(false);
  const [selectedContactsToAdd, setSelectedContactsToAdd] =
    useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addContactToTag2, setAddContactToTag2] = useState<
    string | null
  >(null);
  const [
    showUncategorizedContacts,
    setShowUncategorizedContacts,
  ] = useState(false);
  const [
    selectedContactToRecategorize,
    setSelectedContactToRecategorize,
  ] = useState<Contact | null>(null);
  const [
    selectedCategoriesToAssign,
    setSelectedCategoriesToAssign,
  ] = useState<string[]>([]);
  const [showTag1Modal, setShowTag1Modal] = useState(false);
  const [
    selectedTag1ForRefinement,
    setSelectedTag1ForRefinement,
  ] = useState<string | null>(null);
  const [showTag2Refinement, setShowTag2Refinement] =
    useState(false);

  const leftCategories = categories.slice(0, 4);
  const rightCategories = categories.slice(4);

  const handleAddContacts = () => {
    console.log(
      "Adding contacts:",
      selectedContactsToAdd,
      "to tag2:",
      addContactToTag2,
    );
    setShowAddContactDialog(false);
    setSelectedContactsToAdd([]);
    setSearchQuery("");
    setAddContactToTag2(null);
  };

  const handleRecategorizeContact = () => {
    console.log(
      "Moving contact",
      selectedContactToRecategorize?.id,
      "to categories:",
      selectedCategoriesToAssign,
    );
    setSelectedContactToRecategorize(null);
    setSelectedCategoriesToAssign([]);
  };

  const toggleCategoryForContact = (categoryId: string) => {
    setSelectedCategoriesToAssign((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const handleAddCategory = () => {
    console.log("Adding new category:", newCategoryName);
    setShowAddCategoryDialog(false);
    setNewCategoryName("");
  };

  const toggleContactSelection = (contactId: string) => {
    setSelectedContactsToAdd((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId],
    );
  };

  const filteredContacts = mockPhoneBookContacts.filter(
    (contact) =>
      contact.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery),
  );

  const renderDetailView = () => {
    if (!selectedCategory) return null;

    let tag2Data: Tag2Data[] = [];

    if (selectedCategory.id === "family") {
      tag2Data = tag2DataByFamilyCategory;
    } else if (selectedCategory.id === "friends") {
      tag2Data = tag2DataByFriendsCategory;
    } else if (selectedCategory.id === "close") {
      tag2Data = tag2DataByCloseCategory;
    } else if (selectedCategory.id === "acquaintances") {
      tag2Data = tag2DataByAcquaintancesCategory;
    } else if (selectedCategory.id === "seniors") {
      tag2Data = tag2DataBySeniorsCategory;
    } else if (selectedCategory.id === "colleagues") {
      tag2Data = tag2DataByColleaguesCategory;
    } else if (selectedCategory.id === "former") {
      tag2Data = tag2DataByFormerCategory;
    } else if (selectedCategory.id === "interests") {
      tag2Data = tag2DataByInterestsCategory;
    }

    // Add "Определить точнее" as the last item
    const tag2DataWithSpecify = [
      ...tag2Data,
      {
        name: "Определить точнее",
        count: 0,
        color: "hsl(var(--chart-5))",
      },
    ];

    return (
      <>
        {/* Header */}
        <div className="border-b-2 px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedCategory(null);
              setSelectedTag2(null);
            }}
            className="flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 text-center">
            <h2>{selectedCategory.name}</h2>
            <p className="text-sm text-muted-foreground">
              {selectedCategory.count} контактов
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddCategoryDialog(true)}
            className="flex-shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить подкатегорию
          </Button>
        </div>

        {/* Content */}
        {showUncategorizedContacts ? (
          <UncategorizedContactsView
            onBack={() => setShowUncategorizedContacts(false)}
            onSelectContact={(contact) =>
              setSelectedContactToRecategorize(contact)
            }
          />
        ) : selectedTag2 ? (
          <Tag2DetailView
            tag2={selectedTag2}
            onBack={() => setSelectedTag2(null)}
            onAddContacts={() => setShowAddContactDialog(true)}
          />
        ) : selectedCategory.id === "uncategorized" ? (
          <UncategorizedTag2AssignmentView
            category={selectedCategory}
          />
        ) : (
          <SubcategoryListView
            data={tag2DataWithSpecify}
            categoryCount={selectedCategory.count}
            onSelectTag2={(tag2) => setSelectedTag2(tag2)}
            onAddContactsToTag2={(tag2Name) => {
              setAddContactToTag2(tag2Name);
              setShowAddContactDialog(true);
            }}
          />
        )}
      </>
    );
  };

  if (selectedCategory) {
    return (
      <div className="h-full flex flex-col">
        {renderDetailView()}

        {/* Dialogs */}
        {/* Add Contacts Dialog */}
        <Dialog
          open={showAddContactDialog}
          onOpenChange={setShowAddContactDialog}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {addContactToTag2
                  ? `Добавить в "${addContactToTag2}"`
                  : "Добавить контакты"}
              </DialogTitle>
              <DialogDescription>
                Выберите контакты для добавления
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Input
                placeholder="Поиск контактов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-2"
              />

              <ScrollArea className="h-[300px] border-2 rounded-lg p-3">
                <div className="space-y-2">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center gap-3 p-2 hover:bg-accent rounded cursor-pointer"
                      onClick={() => {
                        setSelectedContactsToAdd((prev) =>
                          prev.includes(contact.id)
                            ? prev.filter(
                                (id) => id !== contact.id,
                              )
                            : [...prev, contact.id],
                        );
                      }}
                    >
                      <Checkbox
                        checked={selectedContactsToAdd.includes(
                          contact.id,
                        )}
                        onCheckedChange={() => {}}
                      />
                      <div className="flex-1">
                        <div className="text-sm">
                          {contact.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {contact.phone}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAddContactDialog(false)}
              >
                Отмена
              </Button>
              <Button
                onClick={handleAddContacts}
                disabled={selectedContactsToAdd.length === 0}
              >
                Добавить ({selectedContactsToAdd.length})
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Category Dialog */}
        <Dialog
          open={showAddCategoryDialog}
          onOpenChange={setShowAddCategoryDialog}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Добавить подкатегорию</DialogTitle>
              <DialogDescription>
                Введите название новой подкатегории
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Input
                placeholder="Название новой подкатегории..."
                value={newCategoryName}
                onChange={(e) =>
                  setNewCategoryName(e.target.value)
                }
                className="border-2"
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAddCategoryDialog(false)}
              >
                Отмена
              </Button>
              <Button
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
              >
                Добавить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Recategorize Contact Dialog */}
        <Dialog
          open={!!selectedContactToRecategorize}
          onOpenChange={() =>
            setSelectedContactToRecategorize(null)
          }
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Назначить категории</DialogTitle>
              <DialogDescription>
                Выберите категории для{" "}
                {selectedContactToRecategorize?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-2 pr-4">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-start gap-3 p-3 border-2 rounded-lg"
                    >
                      <Checkbox
                        id={`cat-${category.id}`}
                        checked={selectedCategoriesToAssign.includes(
                          category.id,
                        )}
                        onCheckedChange={() =>
                          toggleCategoryForContact(category.id)
                        }
                        className="mt-1"
                      />
                      <Label
                        htmlFor={`cat-${category.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div>{category.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {category.description}
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() =>
                  setSelectedContactToRecategorize(null)
                }
              >
                Отмена
              </Button>
              <Button
                onClick={handleRecategorizeContact}
                disabled={
                  selectedCategoriesToAssign.length === 0
                }
              >
                Применить ({selectedCategoriesToAssign.length})
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Calculate total contacts
  const totalContacts = categories.reduce(
    (sum, cat) => sum + cat.count,
    0,
  );

  return (
    <div className="p-6 space-y-6">
      {/* Category Grid */}
      <div className="grid grid-cols-2 gap-4 auto-rows-fr">
        {categories.map((category, index) => {
          const percentage =
            totalContacts > 0
              ? Math.round(
                  (category.count / totalContacts) * 100,
                )
              : 0;

          return (
            <Card
              key={category.id}
              className="p-3 border-2 cursor-pointer hover:bg-accent/50 transition-colors h-full"
              onClick={() => {
                if (category.id === "uncategorized") {
                  setShowUncategorizedContacts(true);
                }
                setSelectedCategory(category);
              }}
            >
              <div className="flex items-start justify-between gap-3 h-full">
                {/* Left: Category name with help icon (ending at midpoint) */}
                <div className="flex items-start gap-1.5 flex-1 max-w-[50%]">
                  <span className="break-words leading-tight text-left">
                    {category.name}
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help flex-shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="max-w-xs"
                      >
                        <p className="text-sm">
                          {category.description}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Right: Count badge and percentage */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div className="w-8 h-8 bg-foreground text-background flex items-center justify-center rounded">
                    <span className="text-sm">
                      {category.count}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {percentage}%
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Uncategorized Contacts Summary Block */}
      <Card
        className="p-6 border-2 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setShowUncategorizedContacts(true)}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3>Без категорий</h3>
            <p className="text-sm text-muted-foreground">
              Контакты, которые ещё не распределены по
              категориям
            </p>
          </div>
          <div className="w-12 h-12 bg-foreground text-background flex items-center justify-center rounded flex-shrink-0">
            <span className="text-lg">42</span>
          </div>
        </div>
      </Card>

      {/* Uncategorized Contacts List View */}
      {showUncategorizedContacts && !selectedCategory && (
        <UncategorizedContactsList
          contacts={mockPhoneBookContacts.filter(
            (c) => c.categories.length === 0,
          )}
          onBack={() => setShowUncategorizedContacts(false)}
          onSelectContact={(contact) => {
            setSelectedContactToRecategorize(contact);
            setShowUncategorizedContacts(false);
            setShowTag1Modal(true);
          }}
        />
      )}

      {/* Tag1 Category Selection Modal */}
      <Dialog
        open={showTag1Modal}
        onOpenChange={setShowTag1Modal}
      >
        <DialogContent className="sm:max-w-md h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Выбрать категорию</DialogTitle>
            <DialogDescription>
              Выберите категорию для{" "}
              {selectedContactToRecategorize?.name}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="grid grid-cols-2 gap-4 auto-rows-fr pr-4">
              {categories.map((category) => {
                const percentage =
                  totalContacts > 0
                    ? Math.round(
                        (category.count / totalContacts) * 100,
                      )
                    : 0;

                return (
                  <Card
                    key={category.id}
                    className={`p-3 border-2 cursor-pointer transition-colors h-full ${
                      selectedCategoriesToAssign.includes(
                        category.id,
                      )
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-accent/50"
                    }`}
                    onClick={() => {
                      setSelectedCategoriesToAssign([
                        category.id,
                      ]);
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 h-full">
                      {/* Left: Category name with help icon (ending at midpoint) */}
                      <div className="flex items-start gap-1.5 flex-1 max-w-[50%]">
                        <span className="break-words leading-tight text-left">
                          {category.name}
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle
                                className={`w-4 h-4 cursor-help flex-shrink-0 ${
                                  selectedCategoriesToAssign.includes(
                                    category.id,
                                  )
                                    ? "text-primary-foreground/70"
                                    : "text-muted-foreground"
                                }`}
                              />
                            </TooltipTrigger>
                            <TooltipContent
                              side="right"
                              className="max-w-xs"
                            >
                              <p className="text-sm">
                                {category.description}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      {/* Right: Count badge and percentage */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <div
                          className={`w-8 h-8 flex items-center justify-center rounded ${
                            selectedCategoriesToAssign.includes(
                              category.id,
                            )
                              ? "bg-primary-foreground text-primary"
                              : "bg-foreground text-background"
                          }`}
                        >
                          <span className="text-sm">
                            {category.count}
                          </span>
                        </div>
                        <div
                          className={`text-sm ${
                            selectedCategoriesToAssign.includes(
                              category.id,
                            )
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {percentage}%
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowTag1Modal(false);
                setSelectedCategoriesToAssign([]);
              }}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              onClick={() => {
                if (selectedCategoriesToAssign.length > 0) {
                  setSelectedTag1ForRefinement(
                    selectedCategoriesToAssign[0],
                  );
                  setShowTag1Modal(false);
                  setShowTag2Refinement(true);
                }
              }}
              disabled={selectedCategoriesToAssign.length === 0}
              variant="outline"
              className="flex-1"
            >
              Уточнить
            </Button>
            <Button
              onClick={() => {
                console.log(
                  "Adding contact to category:",
                  selectedCategoriesToAssign,
                );
                setShowTag1Modal(false);
                setSelectedCategoriesToAssign([]);
                setSelectedContactToRecategorize(null);
              }}
              disabled={selectedCategoriesToAssign.length === 0}
              className="flex-1"
            >
              Добавить в категорию
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tag2 Refinement Screen */}
      {showTag2Refinement &&
        selectedTag1ForRefinement &&
        (() => {
          const category = categories.find(
            (c) => c.id === selectedTag1ForRefinement,
          );
          let tag2Data: Tag2Data[] = [];

          if (selectedTag1ForRefinement === "family") {
            tag2Data = tag2DataByFamilyCategory;
          } else if (selectedTag1ForRefinement === "friends") {
            tag2Data = tag2DataByFriendsCategory;
          } else if (selectedTag1ForRefinement === "close") {
            tag2Data = tag2DataByCloseCategory;
          } else if (
            selectedTag1ForRefinement === "acquaintances"
          ) {
            tag2Data = tag2DataByAcquaintancesCategory;
          } else if (selectedTag1ForRefinement === "seniors") {
            tag2Data = tag2DataBySeniorsCategory;
          } else if (
            selectedTag1ForRefinement === "colleagues"
          ) {
            tag2Data = tag2DataByColleaguesCategory;
          } else if (selectedTag1ForRefinement === "former") {
            tag2Data = tag2DataByFormerCategory;
          } else if (
            selectedTag1ForRefinement === "interests"
          ) {
            tag2Data = tag2DataByInterestsCategory;
          }

          return (
            <Tag2RefinementScreen
              categoryId={selectedTag1ForRefinement}
              category={category}
              contact={selectedContactToRecategorize}
              tag2Data={tag2Data}
              onBack={() => {
                setShowTag2Refinement(false);
                setShowTag1Modal(true);
              }}
              onConfirm={(selectedTag2s) => {
                console.log(
                  "Adding contact with Tag1:",
                  selectedTag1ForRefinement,
                  "Tag2:",
                  selectedTag2s,
                );
                setShowTag2Refinement(false);
                setSelectedTag1ForRefinement(null);
                setSelectedContactToRecategorize(null);
                setSelectedCategoriesToAssign([]);
              }}
            />
          );
        })()}
    </div>
  );
}

interface SubcategoryListViewProps {
  data: Tag2Data[];
  categoryCount: number;
  onSelectTag2: (tag2: Tag2Data) => void;
  onAddContactsToTag2: (tag2Name: string) => void;
}

function SubcategoryListView({
  data,
  categoryCount,
  onSelectTag2,
  onAddContactsToTag2,
}: SubcategoryListViewProps) {
  return (
    <div className="p-6 space-y-3">
      {data.map((tag2, index) => {
        const percentage =
          categoryCount > 0
            ? Math.round((tag2.count / categoryCount) * 100)
            : 0;

        return (
          <Card
            key={index}
            className="p-4 border-2 cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => onSelectTag2(tag2)}
          >
            <div className="flex items-center gap-4">
              {/* Left: Count in black square */}
              <div className="w-10 h-10 bg-foreground text-background flex items-center justify-center rounded flex-shrink-0">
                <span className="text-sm">{tag2.count}</span>
              </div>

              {/* Center: Name and percentage */}
              <div className="flex-1">
                <div>{tag2.name}</div>
                <div className="text-sm text-muted-foreground">
                  {percentage}%
                </div>
              </div>

              {/* Right: Plus icon */}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddContactsToTag2(tag2.name);
                }}
                className="flex-shrink-0"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

interface Tag2DetailViewProps {
  tag2: Tag2Data;
  onBack: () => void;
  onAddContacts: () => void;
}

function Tag2DetailView({
  tag2,
  onBack,
  onAddContacts,
}: Tag2DetailViewProps) {
  const mockContactsInTag = mockPhoneBookContacts.slice(
    0,
    Math.min(tag2.count, 6),
  );

  return (
    <div className="p-6 space-y-4">
      <Button
        onClick={onBack}
        variant="outline"
        size="sm"
        className="mb-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Назад к категориям
      </Button>

      <div className="space-y-2">
        {mockContactsInTag.map((contact) => (
          <Card key={contact.id} className="p-3 border-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-sm">{contact.name}</div>
                <div className="text-xs text-muted-foreground">
                  {contact.phone}
                </div>
                {contact.categories.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {contact.categories.map((cat) => (
                      <Badge
                        key={cat}
                        variant="secondary"
                        className="text-xs"
                      >
                        {
                          categories.find((c) => c.id === cat)
                            ?.name
                        }
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface UncategorizedContactsViewProps {
  onBack: () => void;
  onSelectContact: (contact: Contact) => void;
}

function UncategorizedContactsView({
  onBack,
  onSelectContact,
}: UncategorizedContactsViewProps) {
  const uncategorizedContacts = mockPhoneBookContacts.slice(
    0,
    4,
  );

  return (
    <div className="p-6 space-y-4">
      <Button
        onClick={onBack}
        variant="outline"
        size="sm"
        className="mb-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Назад к категориям
      </Button>

      <Card className="p-6 border-2">
        <div className="mb-4">
          <h3>Определить более точно</h3>
          <p className="text-sm text-muted-foreground">
            Контакты с #Tag1, но без #Tag2. Нажмите на контакт,
            чтобы назначить категории.
          </p>
        </div>

        <div className="space-y-2">
          {uncategorizedContacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => onSelectContact(contact)}
              className="w-full"
            >
              <Card className="p-3 border-2 hover:bg-accent/50 transition-colors text-left">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm">
                      {contact.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {contact.phone}
                    </div>
                    {contact.categories.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {contact.categories.map((cat) => (
                          <Badge
                            key={cat}
                            variant="secondary"
                            className="text-xs"
                          >
                            {
                              categories.find(
                                (c) => c.id === cat,
                              )?.name
                            }
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <ArrowLeft className="w-4 h-4 rotate-180 text-muted-foreground flex-shrink-0 mt-1" />
                </div>
              </Card>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

interface UncategorizedTag2AssignmentViewProps {
  category: Category;
}

interface ContactWithTag1 {
  contact: Contact;
  tag1Category: string;
  availableTag2s: Tag2Data[];
}

function UncategorizedTag2AssignmentView({
  category,
}: UncategorizedTag2AssignmentViewProps) {
  const [selectedTag2sPerContact, setSelectedTag2sPerContact] =
    useState<Record<string, string[]>>({});

  // Mock data: contacts that have Tag1 but no Tag2
  const contactsWithTag1: ContactWithTag1[] = [
    {
      contact: mockPhoneBookContacts[0],
      tag1Category: "seniors",
      availableTag2s: tag2DataBySeniorsCategory,
    },
    {
      contact: mockPhoneBookContacts[2],
      tag1Category: "colleagues",
      availableTag2s: tag2DataByColleaguesCategory,
    },
    {
      contact: mockPhoneBookContacts[5],
      tag1Category: "former",
      availableTag2s: tag2DataByFormerCategory,
    },
    {
      contact: mockPhoneBookContacts[1],
      tag1Category: "interests",
      availableTag2s: tag2DataByInterestsCategory,
    },
  ];

  const toggleTag2ForContact = (
    contactId: string,
    tag2Name: string,
  ) => {
    setSelectedTag2sPerContact((prev) => {
      const current = prev[contactId] || [];
      const updated = current.includes(tag2Name)
        ? current.filter((t) => t !== tag2Name)
        : [...current, tag2Name];
      return { ...prev, [contactId]: updated };
    });
  };

  const handleSaveAll = () => {
    console.log(
      "Saving Tag2 assignments:",
      selectedTag2sPerContact,
    );
    // Here you would save the assignments
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Назначьте подкатегории для каждого контакта
          </p>
        </div>
        <Button onClick={handleSaveAll} size="sm">
          Сохранить все
        </Button>
      </div>

      <div className="space-y-4">
        {contactsWithTag1.map(
          ({ contact, tag1Category, availableTag2s }) => {
            const selectedTags =
              selectedTag2sPerContact[contact.id] || [];
            const categoryInfo = categories.find(
              (c) => c.id === tag1Category,
            );

            return (
              <Card key={contact.id} className="p-4 border-2">
                <div className="space-y-3">
                  {/* Contact Info */}
                  <div>
                    <div className="text-sm">
                      {contact.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {contact.phone}
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs mt-2"
                    >
                      {categoryInfo?.name}
                    </Badge>
                  </div>

                  {/* Tag2 Checkboxes */}
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">
                      Выберите подкатегории:
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {availableTag2s.map((tag2) => (
                        <div
                          key={tag2.name}
                          className="flex items-center gap-2"
                        >
                          <Checkbox
                            id={`${contact.id}-${tag2.name}`}
                            checked={selectedTags.includes(
                              tag2.name,
                            )}
                            onCheckedChange={() =>
                              toggleTag2ForContact(
                                contact.id,
                                tag2.name,
                              )
                            }
                          />
                          <Label
                            htmlFor={`${contact.id}-${tag2.name}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {tag2.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selected Tags Summary */}
                  {selectedTags.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">
                        Выбрано:
                      </p>
                      <div className="flex gap-1 flex-wrap">
                        {selectedTags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          },
        )}
      </div>
    </div>
  );
}