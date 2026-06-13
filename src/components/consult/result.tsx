'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, Clock, RotateCcw } from 'lucide-react';
import type { TriageResult } from '@/lib/triage-engine';
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

      {/* 6 个板块 */}
      <div className="grid grid-cols-1 gap-4">
        {result.sections.map((section, idx) => (
          <div
            key={section.key}
            className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E6F0F8] text-lg shrink-0">
                {section.icon}
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">
                  板块 {idx + 1} / {result.sections.length}
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-[#1F2937]">
                  {section.title}
                </h3>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-slate-700 leading-relaxed">
              {section.content.map((line, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2"
                >
                  <span className="mt-2 inline-block h-1 w-1 rounded-full bg-[#3B82C4] shrink-0" />
                  <span className="flex-1 whitespace-pre-wrap">{line}</span>
                </li>
              ))}
            </ul>
          </div>
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
