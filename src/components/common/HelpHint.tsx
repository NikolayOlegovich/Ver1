import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export function HelpHint({ text }: { text: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="p-1 rounded hover:bg-accent" aria-label="hint">
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-[260px] text-sm leading-snug">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

