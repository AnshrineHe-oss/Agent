'use client';

import { cn } from '@/lib/utils';
import type { BodyPart } from '@/lib/medical-data';

interface PartCardProps {
  part: BodyPart;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function PartCard({ part, selected, onSelect }: PartCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(part.id)}
      className={cn(
        'group relative w-full text-left rounded-2xl border-2 p-5 transition-all duration-200',
        'hover:border-[#3B82C4] hover:shadow-md hover:-translate-y-0.5',
        'focus:outline-none focus:ring-2 focus:ring-[#3B82C4]/30',
        selected
          ? 'border-[#3B82C4] bg-gradient-to-br from-[#E6F0F8] to-white shadow-sm'
          : 'border-slate-200 bg-white',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl transition-colors',
            selected ? 'bg-white shadow-sm' : 'bg-[#F0F6FB]',
          )}
        >
          {part.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#1F2937]">{part.name}</h3>
            {selected && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#3B82C4] text-white">
                已选
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 line-clamp-2">
            {part.description}
          </p>
        </div>
      </div>
    </button>
  );
}
