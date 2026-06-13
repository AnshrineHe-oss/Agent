'use client';

import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import {
  DURATION_OPTIONS,
  TRIGGER_OPTIONS,
  ACCOMPANY_OPTIONS,
  POPULATION_OPTIONS,
} from '@/lib/medical-data';
import { cn } from '@/lib/utils';

export interface Step3Data {
  durationHours: number;
  painLevel: number;
  trigger: string;
  accompany: string[];
  population: string;
  medicalHistory: string;
}

interface Step3Props {
  data: Step3Data;
  onChange: (data: Step3Data) => void;
}

const PAIN_EMOJI = ['😌', '🙂', '😐', '😕', '😟', '😣', '😖', '😫', '😩', '😭', '🤯'];

export function Step3Detail({ data, onChange }: Step3Props) {
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<Step3Data>) => {
    onChange({ ...data, ...patch });
    setError(null);
  };

  const toggleAccompany = (item: string) => {
    const next = data.accompany.includes(item)
      ? data.accompany.filter((x) => x !== item)
      : [...data.accompany, item];
    update({ accompany: next });
  };

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-[#1F2937]">
          再补充 6 项关键信息，让方案更准确
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          请逐项填写，有助于我们判断病情严重程度与人群适配。
        </p>
      </div>

      {/* 1. 发病时长 */}
      <Field label="① 发病时长" required>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ durationHours: opt.hours })}
              className={cn(
                'rounded-xl border-2 px-3 py-2.5 text-left transition-all',
                data.durationHours === opt.hours
                  ? 'border-[#3B82C4] bg-[#E6F0F8] shadow-sm'
                  : 'border-slate-200 hover:border-slate-300',
              )}
            >
              <div className="text-sm font-medium text-[#1F2937]">{opt.label}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{opt.hint}</div>
            </button>
          ))}
        </div>
      </Field>

      {/* 2. 痛感程度 */}
      <Field label="② 痛感程度" required>
        <div className="rounded-xl border-2 border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-slate-700">
              痛感 <span className="text-2xl ml-1">{PAIN_EMOJI[data.painLevel]}</span>{' '}
              <span className="text-[#3B82C4] ml-1">{data.painLevel}/10</span>
            </div>
            <div className="text-xs text-slate-400">0 = 无痛，10 = 难以忍受</div>
          </div>
          <Slider
            value={[data.painLevel]}
            min={0}
            max={10}
            step={1}
            onValueChange={(v) => update({ painLevel: v[0] ?? 0 })}
            className="w-full"
          />
          <div className="flex justify-between mt-1.5 text-[10px] text-slate-400">
            <span>无痛</span>
            <span>轻度</span>
            <span>中度</span>
            <span>重度</span>
            <span>剧痛</span>
          </div>
        </div>
      </Field>

      {/* 3. 诱发原因 */}
      <Field label="③ 可能的诱发原因" required>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TRIGGER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ trigger: opt.value })}
              className={cn(
                'rounded-xl border-2 px-3 py-2.5 text-sm text-left transition-all',
                data.trigger === opt.value
                  ? 'border-[#3B82C4] bg-[#E6F0F8] text-[#1F2937] font-medium'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Field>

      {/* 4. 伴随症状 */}
      <Field label="④ 伴随症状" hint="可多选；如没有可勾选「无明显伴随」">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ACCOMPANY_OPTIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggleAccompany(item)}
              className={cn(
                'rounded-xl border-2 px-3 py-2 text-sm text-left transition-all',
                data.accompany.includes(item)
                  ? 'border-[#3B82C4] bg-[#E6F0F8] text-[#1F2937] font-medium'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700',
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </Field>

      {/* 5. 既往病史 */}
      <Field label="⑤ 既往病史 / 长期用药" hint="如无可留空">
        <textarea
          value={data.medicalHistory}
          onChange={(e) => update({ medicalHistory: e.target.value })}
          placeholder="例：高血压 3 年，服用 XX 降压药；无药物过敏史……"
          rows={3}
          className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm text-[#1F2937] placeholder:text-slate-400 focus:outline-none focus:border-[#3B82C4] focus:ring-2 focus:ring-[#3B82C4]/20"
        />
      </Field>

      {/* 6. 特殊人群 */}
      <Field label="⑥ 您属于哪类人群" required>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {POPULATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ population: opt.value })}
              className={cn(
                'rounded-xl border-2 px-3 py-2.5 text-sm text-left transition-all flex items-center gap-2',
                data.population === opt.value
                  ? opt.risk
                    ? 'border-amber-400 bg-amber-50 text-[#1F2937] font-medium'
                    : 'border-[#3B82C4] bg-[#E6F0F8] text-[#1F2937] font-medium'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700',
              )}
            >
              <span className="flex-1">{opt.label}</span>
              {opt.risk && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                  特殊
                </span>
              )}
            </button>
          ))}
        </div>
      </Field>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  required,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <label className="text-sm font-semibold text-[#1F2937]">{label}</label>
        {required && <span className="text-xs text-red-500">*必填</span>}
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
