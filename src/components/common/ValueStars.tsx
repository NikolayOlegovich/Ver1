import { Star } from "lucide-react";
import { useState } from "react";

export function ValueStars({ value = 0, onChange }: { value?: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const v = hover ?? value ?? 0;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          onClick={() => onChange?.(n)}
          className="p-0.5"
          aria-label={`value-${n}`}
        >
          <Star className={n <= v ? 'text-primary fill-primary w-4 h-4' : 'text-muted-foreground w-4 h-4'} />
        </button>
      ))}
    </div>
  );
}

