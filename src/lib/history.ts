// 问诊历史记录管理（纯本地存储）
// 字段：id / 时间戳 / 部位 / 症状 / 档案快照 / 研判 / 方案

import type { UserProfile } from './profile';

export type TriageLevel = 'home' | 'caution' | 'urgent';

export interface MedicationEntry {
  /** 药品通用名或类别 */
  name: string;
  /** 药品类别（如 "解热镇痛"） */
  category: string;
  /** 单次剂量 */
  perDose: string;
  /** 服用频次（如 每日 3 次） */
  frequency: string;
  /** 24h 最大剂量 */
  maxDaily: string;
  /** 适用人群（成人 / 儿童 / 老人 / 通用） */
  forPopulation: string;
  /** 服药期间禁忌（食物 / 行为 / 药物） */
  avoid: string[];
  /** 是否适用于本档案（false=被过滤） */
  isApplicable: boolean;
  /** 不适用原因（被过滤时显示） */
  notApplicableReason?: string;
  /** 提醒用药时间（HH:mm） */
  schedule: string[];
  /** 疗程（天） */
  durationDays: number;
  /** 备注 */
  notes?: string;
}

export interface ConsultRecord {
  /** 唯一 id */
  id: string;
  /** 问诊时间戳（毫秒） */
  timestamp: number;
  /** ISO 日期字符串（便于展示） */
  consultDate: string;
  /** 部位 id */
  partId: string;
  /** 部位名称 */
  partName: string;
  /** 症状 id 列表 */
  symptomIds: string[];
  /** 症状名称列表 */
  symptomNames: string[];
  /** 人群标签 */
  population: string;
  /** 研判等级 */
  level: TriageLevel;
  /** 病情一句话总结 */
  summary: string;
  /** 风险因素 */
  riskFactors: string[];
  /** 档案快照（避免档案修改后历史失真） */
  profileSnapshot: {
    nickname: string;
    age: string;
    gender: string;
    chronicDiseases: string[];
    allergies: string[];
    currentMedications: string;
    isPregnant: boolean;
    isLactating: boolean;
  };
  /** 用药方案 */
  medications: MedicationEntry[];
  /** 预计康复期（天） */
  recoveryDays: string;
  /** 警示信号（来自预测） */
  warningSigns: string[];
}

const STORAGE_KEY = 'home-triage:history:v1';
const MAX_RECORDS = 50; // 仅保留最近 50 条

/**
 * 读取所有历史问诊记录（按时间倒序）
 */
export function loadHistory(): ConsultRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ConsultRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => b.timestamp - a.timestamp);
  } catch (err) {
    console.warn('[history] 读取历史失败', err);
    return [];
  }
}

/**
 * 追加一条问诊记录
 */
export function appendRecord(record: Omit<ConsultRecord, 'id' | 'timestamp' | 'consultDate'>): ConsultRecord {
  const full: ConsultRecord = {
    ...record,
    id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    consultDate: new Date().toISOString(),
  };
  const all = loadHistory();
  all.unshift(full);
  // 限制总数
  const trimmed = all.slice(0, MAX_RECORDS);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('[history] 保存失败', err);
  }
  return full;
}

/**
 * 删除一条记录
 */
export function deleteRecord(id: string): void {
  const all = loadHistory().filter((r) => r.id !== id);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.warn('[history] 删除失败', err);
  }
}

/**
 * 清空所有历史
 */
export function clearHistory(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[history] 清空失败', err);
  }
}

/**
 * 格式化时间戳为友好文本（如 "今天 14:30" / "昨天 09:12" / "2024-12-01 14:30"）
 */
export function formatConsultTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();
  if (isYesterday) {
    return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * 检测当前症状组合是否在过去 30 / 90 天出现过
 * 命中阈值：相同 partId + 重叠症状 >= 1
 */
export interface RecurrenceResult {
  isRecurrence: boolean;
  count: number;
  lastTimestamp: number | null;
  windowDays: number;
  /** 友好描述：上次出现距今多少天 */
  daysAgoText: string;
  /** 命中的历史记录 */
  records: ConsultRecord[];
}

export function detectRecurrence(
  partId: string,
  symptomIds: string[],
  history: ConsultRecord[] = loadHistory(),
): RecurrenceResult {
  const now = Date.now();
  const day30 = 30 * 24 * 60 * 60 * 1000;
  const day90 = 90 * 24 * 60 * 60 * 1000;
  const matches = history.filter(
    (r) =>
      r.partId === partId &&
      r.symptomIds.some((id) => symptomIds.includes(id)),
  );
  if (matches.length === 0) {
    return {
      isRecurrence: false,
      count: 0,
      lastTimestamp: null,
      windowDays: 0,
      daysAgoText: '',
      records: [],
    };
  }
  const last = matches[0];
  const lastTimestamp = last.timestamp;
  const elapsed = now - lastTimestamp;
  const daysAgo = Math.max(1, Math.round(elapsed / (24 * 60 * 60 * 1000)));
  const daysAgoText = daysAgo === 0 ? '今天' : `${daysAgo} 天前`;
  if (elapsed <= day30) {
    return {
      isRecurrence: true,
      count: matches.length,
      lastTimestamp,
      windowDays: 30,
      daysAgoText,
      records: matches,
    };
  }
  if (elapsed <= day90) {
    return {
      isRecurrence: true,
      count: matches.length,
      lastTimestamp,
      windowDays: 90,
      daysAgoText,
      records: matches,
    };
  }
  return {
    isRecurrence: false,
    count: matches.length,
    lastTimestamp,
    windowDays: 0,
    daysAgoText,
    records: matches,
  };
}

/**
 * 加载历史的简短别名（语义化）
 */
export function listRecords(): ConsultRecord[] {
  return loadHistory();
}

/**
 * 生成当前档案快照（避免档案修改影响历史展示）
 */
export function snapshotProfile(profile: UserProfile | null): ConsultRecord['profileSnapshot'] {
  return {
    nickname: profile?.nickname ?? '',
    age: profile?.age ?? '',
    gender: profile?.gender ?? '',
    chronicDiseases: [...(profile?.chronicDiseases ?? [])],
    allergies: [...(profile?.allergies ?? [])],
    currentMedications: profile?.currentMedications ?? '',
    isPregnant: profile?.isPregnant ?? false,
    isLactating: profile?.isLactating ?? false,
  };
}
