'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Play, Pause, X, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/hooks/use-i18n';
import type { DiscussionAction } from '@/lib/types/action';

interface ProactiveCardProps {
  action: DiscussionAction;
  mode: 'playback' | 'paused' | 'autonomous';
  /** Ref to the anchor element the card points to (avatar, etc.) */
  anchorRef: React.RefObject<HTMLElement | null>;
  /** Where the card prefers to align relative to the anchor */
  align?: 'left' | 'right';
  /** Portal target — defaults to document.body. Pass the fullscreen container
   *  when in presentation mode so the card stays visible inside the top-layer. */
  portalContainer?: HTMLElement | null;
  agentName?: string;
  agentAvatar?: string;
  agentColor?: string;
  onSkip: () => void;
  onListen: () => void;
  onTogglePause: () => void;
}

const CARD_WIDTH = 420; // wide visual-novel style bubble
const VIEWPORT_PAD = 16;

/**
 * Proactive discussion card — visual-novel speech bubble.
 *
 * Big mascot portrait on the left, large readable dialogue on the right,
 * and oversized tappable action buttons. Renders via React Portal so it
 * stays above fullscreen / stacking contexts.
 */
export const ProactiveCard = ({
  action,
  mode,
  anchorRef,
  align = 'right',
  portalContainer,
  agentName,
  agentAvatar,
  agentColor,
  onSkip,
  onListen,
  onTogglePause,
}: ProactiveCardProps) => {
  const { t } = useI18n();
  const [progress, setProgress] = useState(100);
  const skippedRef = useRef(false);
  const isPaused = mode === 'paused';

  // Computed position state
  const [pos, setPos] = useState<{
    left: number;
    bottom: number;
    tailOffset: number;
  } | null>(null);

  const updatePosition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const anchorCenterX = rect.left + rect.width / 2;
    const anchorTop = rect.top;

    // Center card on anchor, clamped to viewport
    let cardLeft = anchorCenterX - CARD_WIDTH / 2;
    cardLeft = Math.max(
      VIEWPORT_PAD,
      Math.min(window.innerWidth - CARD_WIDTH - VIEWPORT_PAD, cardLeft),
    );
    const tailOffset = Math.max(24, Math.min(CARD_WIDTH - 24, anchorCenterX - cardLeft));
    const bottom = window.innerHeight - anchorTop + 16; // gap above anchor

    setPos({ left: cardLeft, bottom, tailOffset });
  }, [anchorRef]);

  // Continuously track anchor position via rAF to handle CSS transitions, sidebar collapse, etc.
  useEffect(() => {
    let rafId: number;
    const tick = () => {
      updatePosition();
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [updatePosition]);

  // Auto-skip countdown. Slower than before (8s) so users actually have time
  // to read the larger dialogue and tap a button.
  useEffect(() => {
    if (mode !== 'playback') return;

    const duration = 8000;
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - step;
        if (newProgress <= 0) {
          clearInterval(timer);
          return 0;
        }
        return newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [mode]);

  useEffect(() => {
    if (progress <= 0 && !skippedRef.current && mode === 'playback') {
      skippedRef.current = true;
      onSkip();
    }
  }, [progress, onSkip, mode]);

  if (!pos) return null;

  const accent = agentColor || '#7c3aed';

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className="fixed z-[9999] pointer-events-auto"
      style={{
        left: pos.left,
        bottom: pos.bottom,
        width: CARD_WIDTH,
        ...(align === 'left'
          ? { transformOrigin: 'bottom left' }
          : { transformOrigin: 'bottom right' }),
      }}
    >
      <div className="relative">
        {/* Close button — larger, easier to hit */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSkip();
          }}
          className="absolute -top-3 -right-3 w-9 h-9 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:scale-110 active:scale-95 transition-all z-20"
          title={t('proactiveCard.skip')}
          aria-label={t('proactiveCard.skip')}
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Triangle tail pointing down at the anchor */}
        <div
          className="absolute -bottom-2 w-5 h-5 bg-white dark:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700 z-10"
          style={{
            left: `${pos.tailOffset}px`,
            transform: 'translateX(-50%) rotate(45deg)',
          }}
        />

        {/* Card body — visual-novel layout: mascot portrait | dialogue + actions */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-3xl shadow-[0_12px_48px_rgba(0,0,0,0.18)] border border-gray-200/80 dark:border-gray-700 flex relative overflow-hidden">
          {/* Progress bar — slim accent ribbon along the top */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-100/60 dark:bg-gray-700/60">
            <div
              className={`h-full transition-all duration-[50ms] ease-linear rounded-r-full ${
                isPaused
                  ? 'bg-gray-300 dark:bg-gray-600'
                  : 'bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* ── Mascot portrait (left) ── */}
          <div
            className="relative w-28 shrink-0 overflow-hidden flex items-end justify-center pt-3"
            style={{
              background: `linear-gradient(180deg, ${accent}22 0%, ${accent}08 100%)`,
            }}
          >
            {/* small "discussion" badge above portrait */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-10">
              <span
                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-sm"
                style={{
                  color: accent,
                  backgroundColor: `${accent}1f`,
                }}
              >
                <Sparkles className="w-2.5 h-2.5" />
                {t('proactiveCard.discussion')}
              </span>
            </div>
            {agentAvatar ? (
              <img
                src={agentAvatar}
                alt={agentName || ''}
                className="w-24 h-24 rounded-2xl object-cover ring-2 ring-white/80 dark:ring-gray-700/80 shadow-md mb-1"
                style={{ borderColor: `${accent}40`, borderWidth: 1.5 }}
              />
            ) : (
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold mb-1"
                style={{ backgroundColor: `${accent}25`, color: accent }}
              >
                {agentName?.charAt(0) || '?'}
              </div>
            )}
          </div>

          {/* ── Dialogue + actions (right) ── */}
          <div className="flex-1 min-w-0 flex flex-col justify-between p-4 pl-3.5">
            {/* Speaker name + countdown */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              {agentName && (
                <span className="text-base font-bold text-gray-800 dark:text-gray-100 truncate">
                  {agentName}
                </span>
              )}
              <span
                className={`text-xs font-bold tabular-nums shrink-0 px-1.5 py-0.5 rounded ${
                  isPaused
                    ? 'text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-700'
                    : 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30'
                }`}
              >
                {Math.max(0, Math.ceil((progress / 100) * 8))}s
              </span>
            </div>

            {/* Dialogue line — big & readable */}
            <p className="text-[15px] leading-relaxed font-medium text-gray-700 dark:text-gray-200 mb-3 line-clamp-4">
              {action.topic}
            </p>

            {/* Big tappable actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onListen();
                }}
                className="flex-1 h-11 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 dark:from-violet-500 dark:to-fuchsia-500 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.97] shadow-md shadow-violet-200/50 dark:shadow-violet-900/40"
              >
                <Play className="w-4 h-4 fill-current" />
                {t('proactiveCard.join')}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePause();
                }}
                className={`h-11 w-11 rounded-xl border-2 flex items-center justify-center transition-all active:scale-90 ${
                  isPaused
                    ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-violet-300 dark:border-violet-700 hover:bg-violet-100 dark:hover:bg-violet-900/50'
                    : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border-gray-200 dark:border-gray-600'
                }`}
                title={isPaused ? t('proactiveCard.resume') : t('proactiveCard.pause')}
                aria-label={isPaused ? t('proactiveCard.resume') : t('proactiveCard.pause')}
              >
                {isPaused ? (
                  <Play className="w-4 h-4 fill-current" />
                ) : (
                  <Pause className="w-4 h-4 fill-current" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return createPortal(card, portalContainer || document.body);
};
