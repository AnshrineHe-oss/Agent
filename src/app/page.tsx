'use client';

import { useState, useCallback } from 'react';
import { Stepper } from '@/components/consult/stepper';
import { Step1Part } from '@/components/consult/step1-part';
import { Step2Symptom } from '@/components/consult/step2-symptom';
import { Step3Detail, type Step3Data } from '@/components/consult/step3-detail';
import { ConsultFooter } from '@/components/consult/footer';
import { ResultView } from '@/components/consult/result';
import { Stethoscope, ShieldCheck } from 'lucide-react';
import type { TriageResult } from '@/lib/triage-engine';

const STEPS = [
  { id: 1, title: '选部位', subtitle: '身体哪里不舒服' },
  { id: 2, title: '勾症状', subtitle: '都有哪些具体表现' },
  { id: 3, title: '补信息', subtitle: '6 项关键信息' },
];

const DEFAULT_STEP3: Step3Data = {
  durationHours: 0,
  painLevel: 0,
  trigger: '',
  accompany: [],
  population: '',
  medicalHistory: '',
};

type Phase = 'form' | 'loading' | 'result';

export default function Home() {
  const [step, setStep] = useState(1);
  const [phase, setPhase] = useState<Phase>('form');

  const [partId, setPartId] = useState<string | null>(null);
  const [symptomIds, setSymptomIds] = useState<string[]>([]);
  const [step3, setStep3] = useState<Step3Data>(DEFAULT_STEP3);

  const [result, setResult] = useState<TriageResult | null>(null);
  const [engine, setEngine] = useState<'coze-bot' | 'local-rules'>('local-rules');

  const [skipMessage, setSkipMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ─── 验证每一步是否可前进 ───
  const canGoNext = useCallback((): { ok: boolean; reason?: string } => {
    if (step === 1) {
      if (!partId) return { ok: false, reason: '请先选择不适部位' };
      return { ok: true };
    }
    if (step === 2) {
      if (symptomIds.length === 0) return { ok: false, reason: '请至少选择 1 个症状' };
      return { ok: true };
    }
    if (step === 3) {
      if (step3.durationHours <= 0) return { ok: false, reason: '请选择发病时长' };
      if (step3.painLevel < 0) return { ok: false, reason: '请拖动滑块选择痛感' };
      if (!step3.trigger) return { ok: false, reason: '请选择诱发原因' };
      if (!step3.population) return { ok: false, reason: '请选择所属人群' };
      return { ok: true };
    }
    return { ok: true };
  }, [step, partId, symptomIds, step3]);

  const handleNext = useCallback(async () => {
    const check = canGoNext();
    if (!check.ok) {
      setSkipMessage(check.reason ?? '请按当前步骤完成填写');
      setTimeout(() => setSkipMessage(null), 3500);
      return;
    }

    if (step < 3) {
      setStep((s) => s + 1);
      // 滚动到顶部
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 步骤3完成 -> 提交问诊
    setPhase('loading');
    setError(null);
    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partId,
          symptomIds,
          durationHours: step3.durationHours,
          painLevel: step3.painLevel,
          trigger: step3.trigger,
          population: step3.population,
          medicalHistory: step3.medicalHistory,
          accompany: step3.accompany,
        }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: TriageResult;
        meta?: { engine?: 'coze-bot' | 'local-rules' };
        error?: string;
      };
      if (!json.success || !json.data) {
        throw new Error(json.error ?? '问诊服务返回异常');
      }
      setResult(json.data);
      if (json.meta?.engine) setEngine(json.meta.engine);
      setPhase('result');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError(e instanceof Error ? e.message : '提交失败，请稍后重试');
      setPhase('form');
    }
  }, [canGoNext, step, partId, symptomIds, step3]);

  const handlePrev = useCallback(() => {
    if (step > 1) {
      setStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);

  const handleRestart = useCallback(() => {
    setStep(1);
    setPhase('form');
    setPartId(null);
    setSymptomIds([]);
    setStep3(DEFAULT_STEP3);
    setResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const toggleSymptom = useCallback((id: string) => {
    setSymptomIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      {/* 顶部 Banner */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#3B82C4] to-[#5C9BD4] text-white shadow-sm">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-[#1F2937]">
                居家轻症引导问诊
              </h1>
              <p className="text-[11px] text-slate-500">
                三步梳理病情 · 给出居家护理参考
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>合规引导 · 不开处方</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8">
        {phase === 'form' && (
          <>
            {/* 步骤指示器 */}
            <div className="mb-8 sm:mb-10">
              <Stepper current={step} steps={STEPS} />
            </div>

            {/* 当前步骤内容 */}
            <div key={step} className="step-fade-in">
              {step === 1 && (
                <Step1Part
                  selected={partId}
                  onSelect={(id) => {
                    if (partId !== id) {
                      setSymptomIds([]); // 切换部位时清空症状
                    }
                    setPartId(id);
                  }}
                />
              )}
              {step === 2 && partId && (
                <Step2Symptom
                  partId={partId}
                  selected={symptomIds}
                  onToggle={toggleSymptom}
                  onClear={() => setSymptomIds([])}
                />
              )}
              {step === 3 && (
                <Step3Detail data={step3} onChange={setStep3} />
              )}
            </div>

            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-10">
              <ConsultFooter
                onPrev={handlePrev}
                onNext={handleNext}
                canPrev={step > 1}
                canNext={true}
                nextLabel={step === 3 ? '生成居家方案' : '下一步'}
                showSkip={Boolean(skipMessage)}
                skipMessage={skipMessage ?? undefined}
              />
            </div>
          </>
        )}

        {phase === 'loading' && (
          <div className="py-24 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#E6F0F8] mb-4">
              <div className="h-6 w-6 rounded-full border-2 border-[#3B82C4] border-t-transparent animate-spin" />
            </div>
            <p className="text-sm text-slate-600">正在为您研判病情并生成居家方案…</p>
          </div>
        )}

        {phase === 'result' && result && (
          <div className="step-fade-in">
            <ResultView result={result} onRestart={handleRestart} engine={engine} />
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-5 text-xs text-slate-500 leading-relaxed">
          <p className="font-medium text-slate-600 mb-1">⚠️ 免责声明</p>
          <p>
            本服务为居家轻症的引导性参考工具，所有建议均不能替代执业医师的诊断与处方。
            严格不推荐任何处方药、抗生素、激素类药物。
            如出现高危症状（高热、剧痛、呼吸困难、意识改变、持续加重等），请立即前往医院或拨打 120。
          </p>
        </div>
      </footer>
    </div>
  );
}
