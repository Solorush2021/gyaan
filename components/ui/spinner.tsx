import React from 'react';
import { cn } from '@/lib/utils';

export interface SpinnerProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
}

export function Spinner({ className, size = '1.5em', ...props }: SpinnerProps) {
  return (
    <div className={cn("relative inline-flex items-center justify-center shrink-0", className)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className="animate-spin text-current"
        {...props}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          className="opacity-15"
          stroke="currentColor"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          strokeLinecap="round"
          className="opacity-85"
          stroke="currentColor"
        />
      </svg>
    </div>
  );
}
