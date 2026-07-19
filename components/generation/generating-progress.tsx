'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, Circle } from 'lucide-react';
import { useI18n } from '@/lib/hooks/use-i18n';
import { cn } from '@/lib/utils';
import { designTokens } from '@/lib/ui/design-tokens';

interface GeneratingProgressProps {
  outlineReady: boolean; // Is outline generation complete?
  firstPageReady: boolean; // Is first page generated?
  statusMessage: string;
  error?: string | null;
}

// Status item component - declared outside main component
function StatusItem({
  completed,
  inProgress,
  hasError,
  label,
}: {
  completed: boolean;
  inProgress: boolean;
  hasError: boolean;
  label: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3.5 py-4 transition-all duration-300",
        completed && "opacity-95",
        inProgress && "scale-[1.01] bg-primary/5 px-3 rounded-lg border border-primary/10",
        hasError && "bg-destructive/5 px-3 rounded-lg border border-destructive/10"
      )}
    >
      <div className="flex-shrink-0">
        {hasError ? (
          <XCircle className="size-5 text-destructive animate-pulse" />
        ) : completed ? (
          <CheckCircle2 className="size-5 text-primary" />
        ) : inProgress ? (
          <Loader2 className="size-5 text-primary animate-spin" />
        ) : (
          <Circle className="size-5 text-muted-foreground/60" />
        )}
      </div>
      <span
        className={cn(
          "text-sm tracking-tight transition-colors",
          hasError
            ? "text-destructive font-medium"
            : completed
              ? "text-foreground/80 font-medium"
              : inProgress
                ? "text-primary font-semibold"
                : "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </div>
  );
}

export function GeneratingProgress({
  outlineReady,
  firstPageReady,
  statusMessage,
  error,
}: GeneratingProgressProps) {
  const { t } = useI18n();
  const [dots, setDots] = useState('');

  // Animated dots for loading state
  useEffect(() => {
    if (!error && !firstPageReady) {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [error, firstPageReady]);

  return (
    <div className="space-y-6">
      <Card className={cn("overflow-hidden border-none shadow-premium", designTokens.layouts.glassCard.base)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-foreground">
            {error ? (
              <>
                <XCircle className="size-5 text-destructive" />
                {t('generation.generationFailed')}
              </>
            ) : firstPageReady ? (
              <>
                <CheckCircle2 className="size-5 text-primary animate-bounce" />
                {t('generation.openingClassroom')}
              </>
            ) : (
              <>
                <Loader2 className="size-5 text-primary animate-spin" />
                {t('generation.generatingCourse')}
                <span className="text-primary tracking-widest font-bold w-6 inline-block">{dots}</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Two milestone status items */}
          <div className="divide-y divide-border/40">
            <StatusItem
              completed={outlineReady}
              inProgress={!outlineReady && !error}
              hasError={!outlineReady && !!error}
              label={
                outlineReady ? t('generation.outlineReady') : t('generation.generatingOutlines')
              }
            />
            <StatusItem
              completed={firstPageReady}
              inProgress={outlineReady && !firstPageReady && !error}
              hasError={outlineReady && !firstPageReady && !!error}
              label={
                firstPageReady
                  ? t('generation.firstPageReady')
                  : t('generation.generatingFirstPage')
              }
            />
          </div>

          {/* Status message */}
          {statusMessage && !error && (
            <div className="pt-3 border-t border-border/40">
              <p className="text-xs font-medium text-muted-foreground/80 leading-relaxed bg-muted/30 p-2.5 rounded-md border border-border/20">
                {statusMessage}
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg shadow-sm">
              <p className="text-sm font-medium text-destructive/95 leading-normal">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

