'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SymptomItem } from '@/lib/medical-data';

interface SymptomCardProps {
  symptom: SymptomItem;
  selected: boolean;
  onToggle: (id: string) => void;
}

export function SymptomCard({ symptom, selected, onToggle }: SymptomCardProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(symptom.id)}
      className={cn(
        'group relative w-full text-left rounded-xl border-2 p-4 transition-all duration-200',
        'hover:border-[#3B82C4] hover:shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-[#3B82C4]/30',
        selected
          ? 'border-[#3B82C4] bg-gradient-to-br from-[#E6F0F8] to-white'
          : 'border-slate-200 bg-white',
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
            selected
              ? 'border-[#3B82C4] bg-[#3B82C4] text-white'
              : 'border-slate-300 bg-white',
          )}
        >
          {selected && <Check className="h-3.5 w-3.5" />}
        </div>
        <span
          className={cn(
            'text-sm font-medium flex-1',
            selected ? 'text-[#1F2937]' : 'text-slate-700',
          )}
        >
          {symptom.name}
        </span>
        {symptom.redFlag && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">
            警示
          </span>
        )}
      </div>
    </button>
  );
}
