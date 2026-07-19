'use client';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { InsertPaletteItem } from '@/lib/edit/scene-editor-surface';

/**
 * Single insert-palette button. Reused by both the (legacy) CommandBar
 * insert slot and the FloatingInsertToolbar that lives above the
 * canvas now.
 *
 * When the item declares `popoverContent`, the button doubles as a
 * popover trigger — and PopoverTrigger's `asChild` Slot is chained
 * directly onto the real `<button>` so wrapping a `<Tooltip>`
 * (provider, not DOM) doesn't drop the popover trigger handler.
 */
export function InsertButton({ item }: { readonly item: InsertPaletteItem }) {
  const button = (
    <button
      type="button"
      disabled={item.disabled}
      onClick={item.popoverContent ? undefined : item.onInvoke}
      className={`group flex h-9 items-center gap-1.5 rounded-xl px-3 transition-colors disabled:pointer-events-none disabled:opacity-40 ${
        item.active
          ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}
    >
      <span className="flex h-4 w-4 items-center justify-center [&>svg]:h-4 [&>svg]:w-4">
        {item.icon}
      </span>
      <span className="text-xs font-medium">{item.label}</span>
    </button>
  );

  const triggerWithTooltip = (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      {item.tooltip && <TooltipContent>{item.tooltip}</TooltipContent>}
    </Tooltip>
  );

  if (!item.popoverContent) return triggerWithTooltip;

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>{button}</PopoverTrigger>
        </TooltipTrigger>
        {item.tooltip && <TooltipContent>{item.tooltip}</TooltipContent>}
      </Tooltip>
      <PopoverContent side="bottom" align="center" className="w-80 p-3">
        {item.popoverContent()}
      </PopoverContent>
    </Popover>
  );
}
