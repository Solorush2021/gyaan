'use client';

import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useI18n } from '@/lib/hooks/use-i18n';
import { useSettingsStore } from '@/lib/store/settings';
import { CHROME_EASE } from '@/lib/edit/transitions';
import type { InsertPaletteItem } from '@/lib/edit/scene-editor-surface';
import { cn } from '@/lib/utils';
import { InsertButton } from './InsertButton';

interface Props {
  readonly items: readonly InsertPaletteItem[];
}

/**
 * Persistent floating insert toolbar — sits centered above the slide
 * canvas, ~12px from the top of the studio frame. Replaces the inline
 * insert slot in CommandBar so the global stage controls (back, undo
 * /redo, title, settings, Pro, Download) aren't visually mixed with
 * content-insertion affordances ("text box / image / shape ..." live
 * with the content, not with stage controls).
 *
 * Collapses to a small chevron handle at the same anchor position;
 * the collapsed flag persists in `settings.editInsertToolbarCollapsed`.
 */
export function FloatingInsertToolbar({ items }: Props) {
  const { t } = useI18n();
  const collapsed = useSettingsStore((s) => s.editInsertToolbarCollapsed);
  const setCollapsed = useSettingsStore((s) => s.setEditInsertToolbarCollapsed);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none absolute top-3 left-1/2 z-30 -translate-x-1/2">
      <AnimatePresence initial={false} mode="wait">
        {collapsed ? (
          <motion.button
            key="collapsed"
            type="button"
            onClick={() => setCollapsed(false)}
            aria-label={t('edit.insert.expandToolbar')}
            title={t('edit.insert.expandToolbar')}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: CHROME_EASE }}
            className={cn(
              'pointer-events-auto inline-flex h-7 w-9 items-center justify-center rounded-b-lg rounded-t-none',
              'bg-card border border-border border-t-0',
              'shadow-sm text-muted-foreground',
              'hover:text-primary',
              'transition-colors',
            )}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </motion.button>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: CHROME_EASE }}
            className={cn(
              'pointer-events-auto flex items-center gap-1 px-1.5 py-1',
              'bg-card border border-border',
              'rounded-2xl shadow-md',
            )}
          >
            {items.map((item) => (
              <InsertButton key={item.id} item={item} />
            ))}
            <span className="mx-1 h-5 w-px bg-border" />
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label={t('edit.insert.collapseToolbar')}
              title={t('edit.insert.collapseToolbar')}
              className={cn(
                'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                'text-muted-foreground hover:text-foreground',
                'hover:bg-accent',
                'transition-colors',
              )}
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
