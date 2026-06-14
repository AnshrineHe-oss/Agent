'use client';

import React, { useEffect, useState } from 'react';
import { X, History as HistoryIcon, Trash2, Calendar, ChevronRight, Eye, AlertCircle } from 'lucide-react';
import { listRecords, deleteRecord, type ConsultRecord } from '@/lib/history';
import { cn } from '@/lib/utils';

interface HistoryViewerProps {
  open: boolean;
  onClose: () => void;
  onView?: (record: ConsultRecord) => void;
  onRecordsChanged?: () => void;
}

const LEVEL_BADGE = {
  urgent: { label: '立即就医', cls: 'bg-red-100 text-red-700 border-red-200' },
  caution: { label: '观察', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  home: { label: '可居家', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

const POPULATION_LABEL: Record<string, string> = {
  general: '普通成人',
  pregnant: '孕妇/哺乳期',
  children: '12 岁以下儿童',
  elder: '65 岁以上老人',
};

function hasSimilarPriorRecord(target: ConsultRecord, priors: ConsultRecord[]): boolean {
  return priors.some(
    (p) =>
      p.partId === target.partId &&
      p.symptomIds.some((id) => target.symptomIds.includes(id)),
  );
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${ymd} ${hm}`;
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return '刚刚';
  if (h < 1) return `${m} 分钟前`;
  if (d < 1) return `${h} 小时前`;
  if (d < 30) return `${d} 天前`;
  return formatDate(ts).split(' ')[0];
}

export function HistoryViewer({ open, onClose, onView, onRecordsChanged }: HistoryViewerProps) {
  const [records, setRecords] = useState<ConsultRecord[]>([]);
  const [mounted, setMounted] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMounted(true);
    setRecords(listRecords());
  }, [open]);

  if (!open) return null;

  const handleDelete = (id: string) => {
    if (!confirm('确定删除这条问诊记录？')) return;
    deleteRecord(id);
    setRecords(listRecords());
    onRecordsChanged?.();
  };

  const handleClearAll = () => {
    if (records.length === 0) return;
    if (confirmClear) {
      for (const r of records) deleteRecord(r.id);
      setRecords([]);
      setConfirmClear(false);
      onRecordsChanged?.();
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full sm:max-w-2xl sm:max-h-[80vh] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E6F0F8]">
              <HistoryIcon className="h-5 w-5 text-[#3B82C4]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#1F2937]">我的问诊记录</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {mounted ? `共 ${records.length} 条记录` : '加载中…'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {records.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className={cn(
                  'text-xs px-2.5 h-8 rounded-lg border transition',
                  confirmClear
                    ? 'border-red-300 bg-red-50 text-red-700'
                    : 'border-slate-200 text-slate-500 hover:border-red-200 hover:text-red-600',
                )}
              >
                {confirmClear ? '再次点击确认清空' : '清空全部'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              aria-label="关闭"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 列表 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {!mounted && <p className="text-sm text-slate-500 text-center py-8">加载中…</p>}
          {mounted && records.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-3">
                <HistoryIcon className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">还没有问诊记录</p>
              <p className="text-xs text-slate-400 mt-1">完成一次问诊后会自动保存到这里</p>
            </div>
          )}
          {mounted && records.length > 0 && (
            <ul className="space-y-2.5">
              {records.map((r, index) => (
                <li
                  key={r.id}
                  className="rounded-xl border border-slate-200 bg-white p-3.5 hover:border-[#3B82C4]/40 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-[#E6F0F8]">
                      <Calendar className="h-5 w-5 text-[#3B82C4]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold text-[#1F2937]">
                          {r.partName}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-semibold px-1.5 py-0.5 rounded-full border',
                            LEVEL_BADGE[r.level].cls,
                          )}
                        >
                          {LEVEL_BADGE[r.level].label}
                        </span>
                        {index < records.length - 1 && hasSimilarPriorRecord(r, records.slice(index + 1)) && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 inline-flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            复发
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {r.summary}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                        <span>{relativeTime(r.timestamp)}</span>
                        <span>·</span>
                        <span>{POPULATION_LABEL[r.population] ?? r.population}</span>
                        {r.medications.length > 0 && (
                          <>
                            <span>·</span>
                            <span>{r.medications.length} 种药</span>
                          </>
                        )}
                      </div>
                      {/* 档案快照 */}
                      {(r.profileSnapshot.allergies.length > 0 || r.profileSnapshot.chronicDiseases.length > 0) && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {r.profileSnapshot.chronicDiseases.map((c) => (
                            <span key={c} className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                              慢病：{c}
                            </span>
                          ))}
                          {r.profileSnapshot.allergies.map((a) => (
                            <span key={a} className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded">
                              过敏：{a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      {onView && (
                        <button
                          type="button"
                          onClick={() => onView(r)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                          title="查看方案"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 底部说明 */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 shrink-0">
          💡 记录仅保存在您当前浏览器的本地存储中，<strong>不上传服务器</strong>。清空浏览器数据将丢失。
        </div>
      </div>
    </div>
  );
}
