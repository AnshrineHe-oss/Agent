'use client';

import { PartCard } from './part-card';
import { BODY_PARTS } from '@/lib/medical-data';

interface Step1Props {
  selected: string | null;
  onSelect: (id: string) => void;
}

export function Step1Part({ selected, onSelect }: Step1Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-[#1F2937]">
          请问您哪里不舒服？
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          请选择最贴近的不适部位或疾病大类，<span className="font-medium text-[#3B82C4]">只能选 1 项</span>。
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {BODY_PARTS.map((part) => (
          <PartCard
            key={part.id}
            part={part}
            selected={selected === part.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
