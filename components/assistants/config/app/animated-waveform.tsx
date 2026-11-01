'use client';

import { cn } from '@/lib/utils';

interface AnimatedWaveformProps {
  className?: string;
  barCount?: number;
}

export function AnimatedWaveform({ 
  className, 
  barCount = 5
}: AnimatedWaveformProps) {
  const bars = Array.from({ length: barCount }, (_, i) => i);

  return (
    <div className={cn("flex items-center justify-center gap-1.5 h-20", className)}>
      {bars.map((index) => {
        const delay = index * 0.1;
        const duration = 0.8 + index * 0.1;
        return (
          <div
            key={index}
            className="w-1 bg-primary rounded-full animate-waveform"
            style={{
              height: '100%',
              minHeight: '8px',
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
}

