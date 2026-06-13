'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Save, Trash2, UserCircle2, Info } from 'lucide-react';
import { loadProfile, saveProfile, clearProfile, DEFAULT_PROFILE, type UserProfile, CHRONIC_OPTIONS, ALLERGY_OPTIONS } from '@/lib/profile';
import { cn } from '@/lib/utils';

interface ProfileEditorProps {
  open: boolean;
  onClose: () => void;
  onSaved: (profile: UserProfile | null) => void;
}

export function ProfileEditor({ open, onClose, onSaved }: ProfileEditorProps) {
  const [draft, setDraft] = useState<UserProfile>(DEFAULT_PROFILE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(loadProfile());
      setHydrated(true);
    }
  }, [open]);

  if (!open) return null;

  function update<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function toggleArrayItem(field: 'chronicDiseases' | 'allergies', item: string) {
    setDraft((prev) => {
      const list = prev[field];
      return {
        ...prev,
        [field]: list.includes(item) ? list.filter((x) => x !== item) : [...list, item],
      };
    });
  }

  function handleSave() {
    saveProfile(draft);
    onSaved(draft);
    onClose();
  }

  function handleClear() {
    if (confirm('确定要清除全部健康档案吗？此操作不可恢复。')) {
      clearProfile();
      onSaved(null);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 sm:px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E6F0F8]">
              <UserCircle2 className="h-5 w-5 text-[#3B82C4]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#1F2937]">我的健康小档案</h2>
              <p className="text-xs text-slate-500">下次问诊自动填充，仅存本地，不上传服务器</p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="px-5 sm:px-6 py-5 space-y-6">
          {!hydrated && (
            <div className="text-sm text-slate-400 text-center py-4">加载中...</div>
          )}

          {hydrated && (
            <>
              {/* 基础信息 */}
              <section>
                <h3 className="text-sm font-semibold text-[#1F2937] mb-3">基础信息</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">昵称（选填）</label>
                    <input
                      type="text"
                      value={draft.nickname}
                      onChange={(e) => update('nickname', e.target.value)}
                      placeholder="如：小明妈妈"
                      className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm focus:border-[#3B82C4] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">年龄（选填）</label>
                    <input
                      type="number"
                      value={draft.age}
                      onChange={(e) => update('age', e.target.value)}
                      placeholder="如：35"
                      min={0}
                      max={120}
                      className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm focus:border-[#3B82C4] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">性别（选填）</label>
                    <select
                      value={draft.gender}
                      onChange={(e) => update('gender', e.target.value as UserProfile['gender'])}
                      className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm bg-white focus:border-[#3B82C4] focus:outline-none"
                    >
                      <option value="">未填写</option>
                      <option value="male">男</option>
                      <option value="female">女</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* 慢性病 */}
              <section>
                <h3 className="text-sm font-semibold text-[#1F2937] mb-2">已确诊的慢性病（可多选）</h3>
                <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                  <Info className="h-3.5 w-3.5" />
                  选中后将自动提醒用药禁忌与风险
                </p>
                <div className="flex flex-wrap gap-2">
                  {CHRONIC_OPTIONS.map((item) => {
                    const active = draft.chronicDiseases.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleArrayItem('chronicDiseases', item)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm border transition',
                          active
                            ? 'bg-[#3B82C4] text-white border-[#3B82C4]'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-[#3B82C4]',
                        )}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 过敏史 */}
              <section>
                <h3 className="text-sm font-semibold text-[#1F2937] mb-2">过敏史（可多选）</h3>
                <div className="flex flex-wrap gap-2">
                  {ALLERGY_OPTIONS.map((item) => {
                    const active = draft.allergies.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleArrayItem('allergies', item)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm border transition',
                          active
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-amber-500',
                        )}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 长期用药 */}
              <section>
                <h3 className="text-sm font-semibold text-[#1F2937] mb-2">长期服用的药物</h3>
                <textarea
                  value={draft.currentMedications}
                  onChange={(e) => update('currentMedications', e.target.value)}
                  placeholder="如：硝苯地平控释片、二甲双胍"
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#3B82C4] focus:outline-none"
                />
                <p className="text-xs text-slate-400 mt-1">填写后系统会提示 OTC 药物与之的潜在相互作用</p>
              </section>

              {/* 特殊生理状态 */}
              <section>
                <h3 className="text-sm font-semibold text-[#1F2937] mb-2">特殊生理状态</h3>
                <div className="space-y-2.5">
                  {[
                    { k: 'isPregnant' as const, label: '当前处于孕期' },
                    { k: 'isLactating' as const, label: '当前处于哺乳期' },
                    { k: 'hasChildUnder12' as const, label: '家中有 12 岁以下儿童（常需为其问诊）' },
                    { k: 'hasElder' as const, label: '家中有 65 岁以上老人（常需为其问诊）' },
                  ].map((opt) => (
                    <label key={opt.k} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft[opt.k]}
                        onChange={(e) => update(opt.k, e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-[#3B82C4] focus:ring-[#3B82C4]"
                      />
                      <span className="text-sm text-slate-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </section>

              {/* 默认人群 */}
              <section>
                <h3 className="text-sm font-semibold text-[#1F2937] mb-2">默认问诊对象</h3>
                <p className="text-xs text-slate-500 mb-3">进入步骤 3 时自动选中的人群</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { v: 'general', l: '普通成人' },
                    { v: 'pregnant', l: '孕妇/哺乳期' },
                    { v: 'children', l: '12 岁以下' },
                    { v: 'elder', l: '65 岁以上' },
                    { v: 'chronic', l: '慢性病患者' },
                  ].map((p) => {
                    const active = draft.defaultPopulation === p.v;
                    return (
                      <button
                        key={p.v}
                        type="button"
                        onClick={() => update('defaultPopulation', p.v)}
                        className={cn(
                          'h-9 rounded-lg text-sm border transition',
                          active
                            ? 'bg-[#3B82C4] text-white border-[#3B82C4]'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-[#3B82C4]',
                        )}
                      >
                        {p.l}
                      </button>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 sm:px-6 py-4 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClear}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            清除档案
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              取消
            </Button>
            <Button type="button" onClick={handleSave} className="rounded-xl bg-[#3B82C4] hover:bg-[#2E6BA8]">
              <Save className="h-4 w-4 mr-1.5" />
              保存档案
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
