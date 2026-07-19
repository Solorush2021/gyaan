'use client';

import { ArrowLeft } from 'lucide-react';
import { useI18n } from '@/lib/hooks/use-i18n';
import { useRouter } from 'next/navigation';
import type { StageMode } from '@/lib/types/stage';
import { HeaderControls } from './stage/header-controls';

interface HeaderProps {
  readonly currentSceneTitle: string;
  readonly mode?: StageMode;
  readonly canEdit?: boolean;
  readonly onToggleEditMode?: () => void;
}

export function Header({ currentSceneTitle, mode, canEdit, onToggleEditMode }: HeaderProps) {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <>
      <header className="relative overflow-hidden h-20 px-8 flex items-center justify-between z-10 bg-[#0d2a1d] border-b border-[#183d2c] gap-4">
        {/* Background Decorative Highlights */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.07]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="header-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#22c55e" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#header-grid)" />
          </svg>
        </div>
        
        {/* Premium Organic Leaf SVG Accent on the Right */}
        <div className="absolute right-1/4 top-1/2 -translate-y-1/2 pointer-events-none opacity-15 text-emerald-400">
          <svg width="120" height="120" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M10 90 Q 50 50 90 10" />
            <path d="M90 10 Q 70 30 50 50 Q 30 70 10 90" />
            <path d="M90 10 Q 80 5 60 25 Q 40 45 10 90" />
            <path d="M30 70 Q 35 60 45 58" />
            <path d="M45 55 Q 52 42 65 40" />
            <path d="M60 40 Q 70 27 80 25" />
            <path d="M25 75 Q 18 68 12 67" />
            <path d="M38 62 Q 30 52 22 50" />
            <path d="M52 48 Q 42 38 34 36" />
          </svg>
        </div>

        <div className="flex items-center gap-3 min-w-0 flex-1 z-10">
          <button
            onClick={() => router.push('/')}
            className="shrink-0 p-2 rounded-lg text-emerald-200/70 hover:bg-[#153e2b] hover:text-[#fcfbf7] transition-colors"
            title={t('generation.backToHome')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          {/* Title block — hidden when `mode === 'edit'`. Header lives
              inside `PlaybackChromeRoot`, which is unmounted by `Stage`
              once mode flips to 'edit', so in steady state this branch
              is always taken. The guard exists for the ~280ms
              AnimatePresence exit window where the playback chrome
              is still rendering its exit animation while `mode` has
              already flipped — without the guard, this title would
              briefly stack on top of the incoming EditChromeRoot's
              CommandBar title during the cross-fade. */}
          {mode !== 'edit' && (
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-300/60 mb-0.5">
                {t('stage.currentScene')}
              </span>
              <h1
                className="text-xl font-bold text-[#fcfbf7] tracking-tight truncate"
                suppressHydrationWarning
              >
                {currentSceneTitle || t('common.loading')}
              </h1>
            </div>
          )}
        </div>

        <div className="z-10">
          <HeaderControls mode={mode} canEdit={canEdit} onToggleEditMode={onToggleEditMode} />
        </div>
      </header>
    </>
  );
}
