'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepperProps {
  current: number; // 1-based
  steps: { id: number; title: string; subtitle: string }[];
  className?: string;
}

export function Stepper({ current, steps, className }: StepperProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-start">
        {steps.map((step, idx) => {
          const isCompleted = current > step.id;
          const isCurrent = current === step.id;
          return (
            <div key={step.id} className="flex items-start flex-1 last:flex-none">
              <div className="flex flex-col items-center min-w-[80px]">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300',
                    isCompleted &&
                      'bg-[#3B82C4] text-white shadow-sm',
                    isCurrent &&
                      'bg-white text-[#3B82C4] ring-2 ring-[#3B82C4] shadow-md ring-offset-2 ring-offset-[#E6F0F8]',
                    !isCompleted && !isCurrent && 'bg-slate-100 text-slate-400',
                  )}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : step.id}
                </div>
                <div className="mt-2 text-center">
                  <div
                    className={cn(
                      'text-sm font-medium',
                      isCurrent ? 'text-[#1F2937]' : 'text-slate-500',
                    )}
                  >
                    {step.title}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400 max-w-[120px]">
                    {step.subtitle}
                  </div>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex-1 mt-5 mx-1 sm:mx-2">
                  <div
                    className={cn(
                      'h-0.5 rounded-full transition-colors duration-300',
                      isCompleted ? 'bg-[#3B82C4]' : 'bg-slate-200',
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
