'use client';

import { useState, useCallback, useEffect } from 'react';
import { Stepper } from '@/components/consult/stepper';
import { Step1Part } from '@/components/consult/step1-part';
import { Step2Symptom } from '@/components/consult/step2-symptom';
import { Step3Detail, type Step3Data } from '@/components/consult/step3-detail';
import { ConsultFooter } from '@/components/consult/footer';
import { ResultView } from '@/components/consult/result';
import { ProfileEditor } from '@/components/consult/profile-editor';
import { HistoryViewer } from '@/components/consult/history-viewer';
import { Stethoscope, ShieldCheck, UserCircle2, BookOpen, History } from 'lucide-react';
import type { TriageResult } from '@/lib/triage-engine';
import { loadProfile, applyProfileToStep3, type UserProfile } from '@/lib/profile';
import { detectRecurrence, appendRecord, listRecords, type RecurrenceResult } from '@/lib/history';

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

  // 档案相关
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  // 问诊历史
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);

  // 初始化时从 localStorage 读取档案 + 同步历史数量
  useEffect(() => {
    const p = loadProfile();
    setProfile(p);
    setProfileLoaded(true);
    setHistoryCount(listRecords().length);
  }, []);

  // 当首次进入步骤 3 时，自动应用档案
  useEffect(() => {
    if (step === 3 && profile && !step3.population) {
      const preset = applyProfileToStep3(profile);
      setStep3((prev) => ({
        ...prev,
        ...preset,
        // 如果是首次进入且没有已填项，预填 profile
        population: prev.population || preset.population || '',
        medicalHistory: prev.medicalHistory || preset.medicalHistory || '',
      }));
    }
  }, [step, profile, step3.population]);

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
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 步骤3完成 -> 提交问诊
    setPhase('loading');
    setError(null);

    // 客户端预检测复发性
    const recurrence: RecurrenceResult = partId
      ? detectRecurrence(partId, symptomIds)
      : { isRecurrence: false, count: 0, windowDays: 0, lastTimestamp: null, daysAgoText: '', records: [] };

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
          profile, // 一并提交档案
          recurrence, // 客户端预检测的复发性
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
      const data = json.data;
      setResult(data);
      if (json.meta?.engine) setEngine(json.meta.engine);

      // 保存到问诊历史
      try {
        // 症状名（用 summary 里的内容提取）
        const symptomNames = data.summary
          .split('；')
          .find((s) => s.startsWith('症状：'))
          ?.replace('症状：', '')
          .split('、') ?? [];
        const populationLabel =
          data.summary.split('；').find((s) => s.startsWith('人群：'))?.replace('人群：', '') || step3.population;
        const partName = data.summary.split('；')[0]?.replace('部位：', '') || partId!;

        // 预测警示信号（从 prediction section 中取）
        const predictionSection = data.sections.find(
          (s) => s.key === 'prediction' && s.type === 'prediction',
        );
        const warningSigns =
          predictionSection && predictionSection.type === 'prediction'
            ? predictionSection.prediction.redFlags
            : [];

        appendRecord({
          partId: partId!,
          partName,
          symptomIds,
          symptomNames,
          population: step3.population,
          level: data.level,
          summary: data.summary,
          riskFactors: data.riskFactors,
          profileSnapshot: {
            nickname: profile?.nickname ?? '',
            age: profile?.age || '',
            gender: profile?.gender || '',
            chronicDiseases: profile?.chronicDiseases ?? [],
            allergies: profile?.allergies ?? [],
            currentMedications: profile?.currentMedications ?? '',
            isPregnant: profile?.isPregnant ?? false,
            isLactating: profile?.isLactating ?? false,
          },
          medications: data.medications ?? [],
          recoveryDays: '',
          warningSigns,
        });
        setHistoryCount(listRecords().length);
      } catch (saveErr) {
        // 保存失败不影响主流程
        console.error('保存问诊记录失败：', saveErr);
      }

      setPhase('result');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError(e instanceof Error ? e.message : '提交失败，请稍后重试');
      setPhase('form');
    }
  }, [canGoNext, step, partId, symptomIds, step3, profile]);

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

  // 档案是否"实际填写过"
  const profileConfigured =
    profileLoaded &&
    profile !== null &&
    (profile.chronicDiseases.length > 0 ||
      profile.allergies.length > 0 ||
      profile.currentMedications.trim() !== '' ||
      profile.isPregnant ||
      profile.isLactating ||
      profile.hasChildUnder12 ||
      profile.hasElder ||
      profile.age.trim() !== '');

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      {/* 顶部 Banner */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#3B82C4] to-[#5C9BD4] text-white shadow-sm">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-[#1F2937] truncate">
                居家轻症引导问诊
              </h1>
              <p className="text-[11px] text-slate-500 truncate">
                三步梳理病情 · 个性化居家方案
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border text-sm transition ${
                historyCount > 0
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300'
                  : 'border-slate-200 text-slate-600 hover:border-emerald-300'
              }`}
              title="查看历史问诊记录"
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">问诊历史</span>
              {historyCount > 0 && (
                <span className="text-[10px] font-semibold bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">
                  {historyCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setEditorOpen(true)}
              className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border text-sm transition ${
                profileConfigured
                  ? 'border-[#3B82C4] bg-[#E6F0F8] text-[#3B82C4]'
                  : 'border-slate-200 text-slate-600 hover:border-[#3B82C4]'
              }`}
            >
              <UserCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">我的档案</span>
              {profileConfigured && (
                <span className="text-[10px] font-semibold bg-[#3B82C4] text-white px-1.5 py-0.5 rounded-full">
                  已建
                </span>
              )}
            </button>
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>合规引导</span>
            </div>
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

            {/* 档案使用状态条（步骤3 顶部可见） */}
            {step === 3 && profileConfigured && (
              <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-[#3B82C4]/30 bg-[#E6F0F8] px-3.5 py-2.5">
                <div className="flex items-center gap-2 text-sm text-[#1F2937] min-w-0">
                  <BookOpen className="h-4 w-4 text-[#3B82C4] shrink-0" />
                  <span className="truncate">已自动应用您的健康档案，可继续调整</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditorOpen(true)}
                  className="shrink-0 text-xs text-[#3B82C4] hover:underline"
                >
                  修改
                </button>
              </div>
            )}

            {/* 当前步骤内容 */}
            <div key={step} className="step-fade-in">
              {step === 1 && (
                <Step1Part
                  selected={partId}
                  onSelect={(id) => {
                    if (partId !== id) {
                      setSymptomIds([]);
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
            健康档案仅存储在您的浏览器本地，不会上传到服务器。
          </p>
        </div>
      </footer>

      {/* 档案编辑器（抽屉/弹层） */}
      <ProfileEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={(p) => setProfile(p)}
      />

      {/* 问诊历史查看器 */}
      <HistoryViewer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onRecordsChanged={() => setHistoryCount(listRecords().length)}
      />
    </div>
  );
}
