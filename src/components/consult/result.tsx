'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, Clock, RotateCcw, ChevronRight, AlertOctagon, Pill, X } from 'lucide-react';
import type { TriageResult, PlanSection, TextSection, DrugSection, PredictionSection, LifestyleSection } from '@/lib/triage-engine';
import type { DrugRecommendation, DrugEntry } from '@/lib/drug-database';
import { cn } from '@/lib/utils';

interface ResultProps {
  result: TriageResult;
  onRestart: () => void;
  engine: 'coze-bot' | 'local-rules';
}

const ALERT_STYLES = {
  urgent: {
    wrap: 'bg-red-50 border-red-300 text-red-800',
    icon: <AlertTriangle className="h-6 w-6" />,
  },
  caution: {
    wrap: 'bg-amber-50 border-amber-300 text-amber-800',
    icon: <Clock className="h-6 w-6" />,
  },
  home: {
    wrap: 'bg-emerald-50 border-emerald-300 text-emerald-800',
    icon: <CheckCircle2 className="h-6 w-6" />,
  },
};

const LEVEL_BADGE = {
  urgent: 'bg-red-600 text-white',
  caution: 'bg-amber-500 text-white',
  home: 'bg-emerald-600 text-white',
};

export function ResultView({ result, onRestart, engine }: ResultProps) {
  const style = ALERT_STYLES[result.level];

  return (
    <div className="space-y-6">
      {/* 顶部警示/安心横幅 */}
      <div
        className={cn(
          'rounded-2xl border-2 p-5 sm:p-6 shadow-sm',
          style.wrap,
        )}
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">{style.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  'text-xs font-semibold px-2 py-0.5 rounded-full',
                  LEVEL_BADGE[result.level],
                )}
              >
                {result.levelLabel}
              </span>
              {engine === 'coze-bot' && (
                <span className="text-[10px] text-slate-500 border border-slate-300 rounded px-1.5 py-0.5">
                  Coze Bot 增强
                </span>
              )}
              {result.profileApplied && (
                <span className="text-[10px] text-[#3B82C4] border border-[#3B82C4] rounded px-1.5 py-0.5">
                  ✓ 已应用健康档案
                </span>
              )}
            </div>
            <h2 className="mt-2 text-lg sm:text-xl font-semibold">
              {result.alertTitle}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed opacity-90">
              {result.alertDesc}
            </p>
            {result.riskFactors.length > 0 && (
              <div className="mt-3 text-xs">
                <span className="font-semibold">识别到的影响因素：</span>
                <ul className="mt-1 list-disc list-inside space-y-0.5 opacity-90">
                  {result.riskFactors.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 病情总结 */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-500 mb-2">📋 病情总结</h3>
        <p className="text-sm text-[#1F2937] leading-relaxed">{result.summary}</p>
      </div>

      {/* 多类型板块 */}
      <div className="grid grid-cols-1 gap-4">
        {result.sections.map((section, idx) => (
          <SectionCard key={section.key} section={section} index={idx} total={result.sections.length} />
        ))}
      </div>

      {/* 特殊人群提示 */}
      {result.specialPopulationTip && (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
          <h3 className="text-sm font-semibold text-amber-800 mb-1.5">
            ⚠️ 特殊人群风险提示
          </h3>
          <p className="text-sm text-amber-700 leading-relaxed">
            {result.specialPopulationTip}
          </p>
        </div>
      )}

      {/* 合规声明 */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h4 className="text-xs font-semibold text-slate-600 mb-1.5">合规声明</h4>
        <p className="text-xs text-slate-500 leading-relaxed">
          本服务仅提供居家轻症的引导性参考，不能替代医生的面诊与处方。
          严格不推荐任何处方药、抗生素、激素类药物；如出现高危症状、病情加重或持续未缓解，请及时前往医院就诊。
          任何用药请仔细阅读说明书并咨询药师或医生。
        </p>
      </div>

      {/* 重新开始 */}
      <div className="flex justify-center pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onRestart}
          className="h-11 px-6 rounded-xl"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          重新问诊
        </Button>
      </div>
    </div>
  );
}

// ──────── 板块容器 ────────

function SectionCard({ section, index, total }: { section: PlanSection; index: number; total: number }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E6F0F8] text-lg shrink-0">
          {section.icon}
        </div>
        <div>
          <div className="text-xs text-slate-400 font-medium">
            板块 {index + 1} / {total}
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-[#1F2937]">
            {section.title}
          </h3>
        </div>
      </div>
      {section.type === 'text' && <TextBlock section={section} />}
      {section.type === 'drugs' && <DrugBlock section={section} />}
      {section.type === 'prediction' && <PredictionBlock section={section} />}
      {section.type === 'lifestyle' && <LifestyleBlock section={section} />}
    </div>
  );
}

// ──────── Text 板块 ────────

function TextBlock({ section }: { section: TextSection }) {
  return (
    <ul className="space-y-2 text-sm text-slate-700 leading-relaxed">
      {section.content.map((line, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="mt-2 inline-block h-1 w-1 rounded-full bg-[#3B82C4] shrink-0" />
          <span className="flex-1 whitespace-pre-wrap">{line}</span>
        </li>
      ))}
    </ul>
  );
}

// ──────── 药物板块（结构化） ────────

function DrugBlock({ section }: { section: DrugSection }) {
  return (
    <div className="space-y-3">
      {section.drugs.map((rec) => (
        <DrugCard key={rec.drug.id} rec={rec} />
      ))}
      {section.warning && section.warning.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 space-y-1">
          {section.warning.map((w, i) => (
            <p key={i}>{w}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function DrugCard({ rec }: { rec: DrugRecommendation }) {
  const { drug, appliesToYou, appliesReason } = rec;
  return (
    <div
      className={cn(
        'rounded-xl border-2 p-4 transition',
        appliesToYou ? 'border-slate-200 bg-white' : 'border-red-200 bg-red-50/40',
      )}
    >
      {/* 标题行 */}
      <div className="flex items-start gap-2 mb-2.5">
        <Pill className="h-5 w-5 text-[#3B82C4] shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h4 className="text-base font-semibold text-[#1F2937]">{drug.genericName}</h4>
            <span className="text-xs text-slate-500">{drug.category}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{drug.indication}</p>
        </div>
        {!appliesToYou && (
          <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
            <X className="h-3 w-3" />
            不适用
          </span>
        )}
      </div>

      {/* 适用/不适用提示 */}
      <p className={cn('text-xs mb-3 px-2 py-1.5 rounded-md', appliesToYou ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>
        {appliesReason}
      </p>

      {/* 成人剂量 */}
      {drug.adultDose && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
          <DoseItem label="单次" value={drug.adultDose.perDose} />
          <DoseItem label="频次" value={drug.adultDose.frequency} />
          <DoseItem label="24h 最大" value={drug.adultDose.maxDaily} />
        </div>
      )}

      {/* 儿童剂量 */}
      {drug.childrenDose && (
        <div className="rounded-lg bg-blue-50/50 p-2.5 mb-2 text-xs text-slate-700">
          <span className="font-semibold text-[#3B82C4]">儿童剂量</span>
          {drug.childrenDose.ageRange && <span className="ml-1 text-slate-500">（{drug.childrenDose.ageRange}）</span>}
          <div className="mt-1 grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            {drug.childrenDose.byWeight && <div><span className="text-slate-400">按体重：</span>{drug.childrenDose.byWeight}</div>}
            <div><span className="text-slate-400">单次：</span>{drug.childrenDose.perDose}</div>
            <div><span className="text-slate-400">频次：</span>{drug.childrenDose.frequency}</div>
          </div>
        </div>
      )}

      {/* 老人调整 */}
      {drug.elderlyDose && (
        <div className="text-xs text-slate-600 mb-2">
          <span className="font-semibold">老人：</span>{drug.elderlyDose}
        </div>
      )}

      {/* 关键信息网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs">
        <InfoLine label="疗程" content={drug.duration} />
        <InfoLine label="用法" content={drug.route} />
        <InfoLine label="常见品牌" content={drug.brandExamples.join(' / ') || '通用名'} />
        <InfoLine label="储存" content={drug.storage} />
      </div>

      {/* 禁忌（醒目） */}
      {drug.avoid.length > 0 && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50/60 p-2.5">
          <div className="text-xs font-semibold text-red-700 mb-1">⛔ 服药期间禁忌</div>
          <ul className="text-xs text-red-800 space-y-0.5">
            {drug.avoid.map((a, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="mt-1 inline-block h-0.5 w-0.5 rounded-full bg-red-700 shrink-0" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 副作用 */}
      {drug.sideEffects.length > 0 && (
        <details className="mt-2 text-xs text-slate-600">
          <summary className="cursor-pointer text-slate-500 hover:text-slate-700">副作用（点击展开）</summary>
          <ul className="mt-1.5 list-disc list-inside space-y-0.5 pl-1">
            {drug.sideEffects.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </details>
      )}

      {/* 药物相互作用 */}
      {drug.interactions.length > 0 && (
        <details className="mt-1 text-xs text-slate-600">
          <summary className="cursor-pointer text-slate-500 hover:text-slate-700">⚠️ 药物相互作用（点击展开）</summary>
          <ul className="mt-1.5 list-disc list-inside space-y-0.5 pl-1">
            {drug.interactions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </details>
      )}

      {/* 孕期/哺乳 */}
      <PregnancyNote drug={drug} />

      {/* 慢性病注意 */}
      {drug.chronicCaution.length > 0 && (
        <div className="mt-2 text-xs">
          <span className="font-semibold text-amber-700">慢性病注意：</span>
          <span className="text-slate-600">{drug.chronicCaution.join('；')}</span>
        </div>
      )}

      {/* 特别警示 */}
      {drug.warning && (
        <p className="mt-2 text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-1.5 rounded">
          {drug.warning}
        </p>
      )}
    </div>
  );
}

function DoseItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 px-2.5 py-1.5">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="text-xs font-semibold text-[#1F2937]">{value}</div>
    </div>
  );
}

function InfoLine({ label, content }: { label: string; content: string }) {
  return (
    <div>
      <span className="text-slate-400">{label}：</span>
      <span className="text-slate-700">{content}</span>
    </div>
  );
}

function PregnancyNote({ drug }: { drug: DrugEntry }) {
  if (drug.pregnancy === 'safe' && drug.lactation === 'safe') return null;
  const flags = [
    drug.pregnancy !== 'safe' && `孕期：${drug.pregnancy === 'avoid' ? '⚠️ 禁用' : '⚠️ 慎用，咨询医生'}`,
    drug.lactation !== 'safe' && `哺乳：${drug.lactation === 'avoid' ? '⚠️ 禁用' : '⚠️ 慎用，咨询医生'}`,
  ].filter(Boolean) as string[];
  if (flags.length === 0) return null;
  return (
    <div className="mt-2 rounded-md border border-amber-200 bg-amber-50/50 px-2.5 py-1.5 text-xs text-amber-800">
      {flags.join('；')}
      {drug.pregnancyNote && <span className="ml-1 text-amber-700">（{drug.pregnancyNote.replace(/^⚠️\s*/, '')}）</span>}
    </div>
  );
}

// ──────── 预测板块 ────────

function PredictionBlock({ section }: { section: PredictionSection }) {
  const { prediction } = section;
  return (
    <div className="space-y-4">
      {/* 预计康复期 */}
      <div className="rounded-lg bg-gradient-to-r from-[#E6F0F8] to-blue-50/40 p-3.5">
        <div className="text-xs text-slate-500 mb-0.5">⏱️ 预计康复期</div>
        <div className="text-base font-semibold text-[#1F2937]">{prediction.estimatedRecovery}</div>
      </div>

      {/* 早期信号 */}
      {prediction.earlySigns.length > 0 && (
        <SubSection title="📍 接下来可能出现的早期信号" items={prediction.earlySigns} color="amber" />
      )}

      {/* 病程发展时间线 */}
      {prediction.progression.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-[#1F2937] mb-2 flex items-center gap-1">
            <ChevronRight className="h-4 w-4 text-[#3B82C4]" />
            病程发展时间线
          </h4>
          <div className="relative pl-5 space-y-3">
            <div className="absolute left-1.5 top-1 bottom-1 w-0.5 bg-gradient-to-b from-[#3B82C4] to-emerald-300" />
            {prediction.progression.map((p, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-3.5 top-1.5 h-3 w-3 rounded-full bg-white border-2 border-[#3B82C4]" />
                <div className="text-xs font-semibold text-[#3B82C4]">{p.stage}</div>
                <div className="text-xs text-slate-600 leading-relaxed">{p.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 警示信号 */}
      {prediction.redFlags.length > 0 && (
        <div className="rounded-lg border-2 border-red-300 bg-red-50 p-3.5">
          <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-1">
            <AlertOctagon className="h-4 w-4" />
            警示信号：出现以下任一立即就医
          </h4>
          <ul className="text-xs text-red-800 space-y-1">
            {prediction.redFlags.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="mt-1 inline-block h-0.5 w-0.5 rounded-full bg-red-700 shrink-0" />
                <span className="font-medium">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 复诊建议 */}
      <div className="rounded-lg bg-blue-50/40 border border-blue-100 p-3 text-xs text-slate-700">
        <span className="font-semibold text-[#3B82C4]">📅 复诊标准：</span>
        {prediction.returnAdvice}
      </div>
    </div>
  );
}

function SubSection({ title, items, color }: { title: string; items: string[]; color: 'amber' | 'red' | 'emerald' }) {
  const colorMap = {
    amber: { wrap: 'border-amber-200 bg-amber-50/50', text: 'text-amber-800' },
    red: { wrap: 'border-red-200 bg-red-50/50', text: 'text-red-800' },
    emerald: { wrap: 'border-emerald-200 bg-emerald-50/50', text: 'text-emerald-800' },
  };
  const c = colorMap[color];
  return (
    <div className={cn('rounded-lg border p-3', c.wrap)}>
      <h4 className={cn('text-sm font-semibold mb-1.5', c.text)}>{title}</h4>
      <ul className="text-xs text-slate-700 space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <span className="mt-1 inline-block h-0.5 w-0.5 rounded-full bg-slate-500 shrink-0" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ──────── 生活方式板块 ────────

function LifestyleBlock({ section }: { section: LifestyleSection }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* 建议 */}
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
        <h4 className="text-sm font-semibold text-emerald-800 mb-2">✅ 建议这样做</h4>
        <ul className="text-xs text-slate-700 space-y-1">
          {section.dos.map((d, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="mt-1 inline-block h-0.5 w-0.5 rounded-full bg-emerald-700 shrink-0" />
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </div>
      {/* 避免 */}
      <div className="rounded-lg border border-red-200 bg-red-50/50 p-3">
        <h4 className="text-sm font-semibold text-red-800 mb-2">⛔ 避免</h4>
        <ul className="text-xs text-slate-700 space-y-1">
          {section.avoids.map((a, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="mt-1 inline-block h-0.5 w-0.5 rounded-full bg-red-700 shrink-0" />
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </div>
      {/* 特别提示 */}
      {section.notes.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
          <h4 className="text-sm font-semibold text-amber-800 mb-2">⚠️ 特别提示</h4>
          <ul className="text-xs text-slate-700 space-y-1">
            {section.notes.map((n, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="mt-1 inline-block h-0.5 w-0.5 rounded-full bg-amber-700 shrink-0" />
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 flex items-center">
          保持良好生活习惯即可
        </div>
      )}
    </div>
  );
}
