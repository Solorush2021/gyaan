'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { useAudioRecorder } from '@/lib/hooks/use-audio-recorder';
import { useASRAvailable } from '@/lib/hooks/use-asr-available';
import { useI18n } from '@/lib/hooks/use-i18n';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { designTokens } from '@/lib/ui/design-tokens';

interface SpeechButtonProps {
  onTranscription: (text: string) => void;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function SpeechButton({
  onTranscription,
  className,
  disabled,
  size = 'sm',
}: SpeechButtonProps) {
  const { t } = useI18n();

  // Ref to always call the latest onTranscription, avoiding stale closures
  const onTranscriptionRef = useRef(onTranscription);
  useEffect(() => {
    onTranscriptionRef.current = onTranscription;
  }, [onTranscription]);

  const stableOnTranscription = useCallback((text: string) => {
    onTranscriptionRef.current(text);
  }, []);

  const handleError = useCallback((error: string) => {
    toast.error(error);
  }, []);

  const { isRecording, isProcessing, startRecording, stopRecording } = useAudioRecorder({
    onTranscription: stableOnTranscription,
    onError: handleError,
  });

  const active = isRecording || isProcessing;

  // Gate on ASR availability (toggle + provider configured + browser support)
  // so every call site is disabled uniformly when ASR is off/unusable — but
  // never while actively recording/processing, so the user can always click to
  // stop (the recorder has no auto-stop and would otherwise leave the mic open).
  const asrAvailable = useASRAvailable();
  const isDisabled = (disabled || !asrAvailable) && !active;

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else if (!isProcessing) {
      startRecording();
    }
  };

  const isMd = size === 'md';
  const sizeClasses = isMd ? 'h-8 w-8' : 'h-6 w-6';
  const iconSize = isMd ? 'w-4 h-4' : 'w-3.5 h-3.5';
  const barH = isMd ? 14 : 10;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          disabled={isDisabled || isProcessing}
          onClick={handleClick}
          className={cn(
            'relative flex items-center justify-center rounded-lg transition-all duration-200 shrink-0 cursor-pointer border border-transparent',
            sizeClasses,
            active
              ? 'bg-[var(--gyaan-teal)]/90 dark:bg-violet-600/80 text-white shadow-[0_0_12px_rgba(139,92,246,0.45)] dark:shadow-[0_0_12px_rgba(139,92,246,0.3)] border-[var(--gyaan-teal)]/35'
              : 'text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/40 border-border/10',
            isDisabled && 'opacity-40 pointer-events-none',
            className,
          )}
        >
          {/* Breathing ring when recording */}
          {isRecording && (
            <span
              className="absolute inset-[-4px] rounded-[10px] border border-[var(--gyaan-teal)]/40 dark:border-[var(--gyaan-teal)]/25"
              style={{
                animation: 'speech-ring 2s ease-in-out infinite',
              }}
            />
          )}

          {isProcessing ? (
            <Loader2 className={cn(iconSize, 'animate-spin')} />
          ) : isRecording ? (
            /* Mini equalizer bars */
            <span className="flex items-center gap-[2px] relative z-10 h-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="rounded-full bg-white opacity-90"
                  style={{
                    width: isMd ? 2 : 1.5,
                    animation: `speech-bar ${0.35 + (i % 3) * 0.12}s ease-in-out ${i * 0.08}s infinite alternate`,
                    height: 3,
                  }}
                />
              ))}
            </span>
          ) : (
            <Mic className={cn(iconSize, 'relative z-10')} />
          )}

          {/* Injected keyframes */}
          <style jsx>{`
            @keyframes speech-bar {
              0% {
                height: 3px;
              }
              100% {
                height: ${barH}px;
              }
            }
            @keyframes speech-ring {
              0%,
              100% {
                opacity: 0.3;
                transform: scale(1);
              }
              50% {
                opacity: 0.7;
                transform: scale(1.08);
              }
            }
          `}</style>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {isProcessing
          ? t('roundtable.processing')
          : isRecording
            ? t('voice.stopListening')
            : t('voice.startListening')}
      </TooltipContent>
    </Tooltip>
  );
}
