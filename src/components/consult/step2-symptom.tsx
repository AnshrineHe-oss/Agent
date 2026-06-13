'use client';

import { SymptomCard } from './symptom-card';
import { BODY_PARTS } from '@/lib/medical-data';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface Step2Props {
  partId: string;
  selected: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
}

export function Step2Symptom({ partId, selected, onToggle, onClear }: Step2Props) {
  const part = BODY_PARTS.find((p) => p.id === partId);
  if (!part) return null;

  const selectedCount = selected.length;
  const normalSymptoms = part.symptoms.filter((s) => !s.redFlag);
  const redFlagSymptoms = part.symptoms.filter((s) => s.redFlag);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-baseline gap-2 flex-wrap">
          <h2 className="text-xl sm:text-2xl font-semibold text-[#1F2937]">
            您的「{part.name}」有哪些具体不适？
          </h2>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          可以<span className="font-medium text-[#3B82C4]">多选</span>，把所有相关症状勾上。标有
          <span className="mx-1 inline-block px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100 text-xs">警示</span>
          的属于高危信号，请如实选择。
        </p>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-[#E6F0F8] px-4 py-2.5 text-sm">
          <span className="text-[#1F2937]">
            已选 <span className="font-semibold text-[#3B82C4]">{selectedCount}</span> 项症状
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-7 px-2 text-slate-500 hover:text-red-600"
          >
            <X className="h-3.5 w-3.5 mr-1" /> 清空
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {normalSymptoms.map((s) => (
          <SymptomCard
            key={s.id}
            symptom={s}
            selected={selected.includes(s.id)}
            onToggle={onToggle}
          />
        ))}
      </div>

      {redFlagSymptoms.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-dashed border-slate-200">
          <p className="text-xs font-medium text-slate-500">⚠️ 高危信号（如实勾选，有助于给出更准确建议）</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {redFlagSymptoms.map((s) => (
              <SymptomCard
                key={s.id}
                symptom={s}
                selected={selected.includes(s.id)}
                onToggle={onToggle}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
