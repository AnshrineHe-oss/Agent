// 用药时间表生成 + ICS 日历导出 + 纯文本复制
// 目标：用户点击"下载日历"可一键导入系统日历（iOS/安卓/Outlook）自动提醒

import type { MedicationEntry } from './history';

export interface ScheduleSlot {
  /** HH:mm 24h */
  time: string;
  /** 药品名 */
  drugName: string;
  /** 药品类别 */
  category: string;
  /** 单次剂量 */
  perDose: string;
  /** 备注 */
  note?: string;
}

export interface DaySchedule {
  /** 时段标签（晨 / 午 / 晚 / 睡前） */
  label: string;
  /** HH:mm */
  time: string;
  /** 药物列表 */
  drugs: { name: string; perDose: string; category: string; note?: string }[];
}

/**
 * 把 24h 字符串转为分钟数
 */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((s) => parseInt(s, 10));
  return h * 60 + (m || 0);
}

/**
 * 把分钟数格式化为 HH:mm
 */
function fromMinutes(min: number): string {
  const total = ((min % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * 时段标签
 */
function slotLabel(time: string): string {
  const m = toMinutes(time);
  if (m < 11 * 60) return '晨起';
  if (m < 14 * 60) return '午餐前';
  if (m < 17 * 60) return '下午';
  if (m < 19 * 60) return '晚餐前';
  if (m < 22 * 60) return '晚餐后';
  return '睡前';
}

/**
 * 生成一天 4 段的时间表
 * 规则：
 *   - 4 段：08:00 / 13:00 / 18:00 / 22:00
 *   - 3 段：08:00 / 14:00 / 20:00
 *   - 2 段：08:00 / 20:00
 *   - 1 段：10:00
 */
export function generateSchedule(meds: MedicationEntry[]): DaySchedule[] {
  const applicable = meds.filter((m) => m.isApplicable);
  if (applicable.length === 0) return [];

  // 把每个药品的 schedule 槽位收集到一张图里
  const slotMap = new Map<string, { name: string; perDose: string; category: string; note?: string }[]>();
  for (const m of applicable) {
    for (const t of m.schedule) {
      if (!slotMap.has(t)) slotMap.set(t, []);
      slotMap.get(t)!.push({
        name: m.name,
        perDose: m.perDose,
        category: m.category,
        note: m.notes,
      });
    }
  }
  if (slotMap.size === 0) return [];

  // 按时段合并排序
  const sortedTimes = Array.from(slotMap.keys()).sort((a, b) => toMinutes(a) - toMinutes(b));
  // 限 6 段以内
  const limited = sortedTimes.slice(0, 6);
  return limited.map((time) => ({
    label: slotLabel(time),
    time,
    drugs: slotMap.get(time) || [],
  }));
}

/**
 * 把所有 slot 摊平（用于 ICS VEVENT）
 */
export function flattenSlots(schedule: DaySchedule[]): ScheduleSlot[] {
  return schedule.flatMap((s) =>
    s.drugs.map((d) => ({
      time: s.time,
      drugName: d.name,
      category: d.category,
      perDose: d.perDose,
      note: d.note,
    })),
  );
}

/**
 * 把药物按频次自动分配 4 个默认时间槽
 * 1 次 → [08:00]
 * 2 次 → [08:00, 20:00]
 * 3 次 → [08:00, 14:00, 20:00]
 * 4 次 → [08:00, 12:00, 18:00, 22:00]
 * 否则保留原 schedule
 */
export function defaultScheduleForDrug(frequency: string): string[] {
  const f = frequency.toLowerCase();
  let count = 1;
  const m = f.match(/(\d+)\s*次/);
  if (m) count = parseInt(m[1], 10);
  if (f.includes('每日') && f.includes('2')) count = 2;
  if (f.includes('每日') && f.includes('3')) count = 3;
  if (f.includes('每日') && f.includes('4')) count = 4;
  if (f.includes('q6') || f.includes('q4')) {
    count = f.includes('q4') ? 6 : 4;
  }
  switch (count) {
    case 1:
      return ['08:00'];
    case 2:
      return ['08:00', '20:00'];
    case 3:
      return ['08:00', '14:00', '20:00'];
    case 4:
      return ['08:00', '12:00', '18:00', '22:00'];
    case 5:
      return ['08:00', '11:00', '15:00', '19:00', '22:00'];
    case 6:
      return ['08:00', '12:00', '16:00', '20:00', '00:00', '04:00'];
    default:
      return ['08:00'];
  }
}

/**
 * 生成 ICS 日历文件内容
 * RRULE: 每日重复，持续 durationDays 天
 */
export function buildIcsContent(meds: MedicationEntry[], startDate: Date = new Date()): string {
  const applicable = meds.filter((m) => m.isApplicable);
  if (applicable.length === 0) {
    return 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//HomeTriage//Empty//ZH\r\nEND:VCALENDAR\r\n';
  }

  const lines: string[] = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//HomeTriage//MedicationSchedule//ZH');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  lines.push('X-WR-CALNAME:居家用药时间表');
  lines.push('X-WR-TIMEZONE:Asia/Shanghai');

  const startYmd = startDate;
  const dtstamp = formatIcsDate(new Date());

  let eventIndex = 0;
  for (const m of applicable) {
    const durationDays = Math.max(1, Math.min(m.durationDays || 7, 30));
    for (const t of m.schedule) {
      const [hh, mm] = t.split(':').map((s) => parseInt(s, 10));
      const start = new Date(startYmd);
      start.setHours(hh, mm || 0, 0, 0);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 15);

      const summary = `💊 服药 - ${m.name} ${m.perDose}`;
      const desc = [
        `药品：${m.name}`,
        `类别：${m.category}`,
        `单次：${m.perDose}`,
        `频次：${m.frequency}`,
        m.notes ? `备注：${m.notes}` : '',
        m.avoid.length ? `禁忌：${m.avoid.join('；')}` : '',
        '---',
        '⚠️ 本提醒由居家轻症问诊应用生成，仅供参考。具体用药请遵医嘱或阅读药品说明书。',
      ]
        .filter(Boolean)
        .join('\\n');

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:med_${eventIndex++}_${Date.now()}@home-triage`);
      lines.push(`DTSTAMP:${dtstamp}`);
      lines.push(`DTSTART:${formatIcsDate(start)}`);
      lines.push(`DTEND:${formatIcsDate(end)}`);
      lines.push(`SUMMARY:${escapeIcs(summary)}`);
      lines.push(`DESCRIPTION:${escapeIcs(desc)}`);
      lines.push(`RRULE:FREQ=DAILY;COUNT=${durationDays}`);
      lines.push('BEGIN:VALARM');
      lines.push('ACTION:DISPLAY');
      lines.push(`DESCRIPTION:${escapeIcs('该吃药啦：' + m.name + ' ' + m.perDose)}`);
      lines.push('TRIGGER:-PT5M');
      lines.push('END:VALARM');
      lines.push('END:VEVENT');
    }
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

/**
 * ICS 日期格式：YYYYMMDDTHHMMSS
 */
function formatIcsDate(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    'T' +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

/**
 * 浏览器端下载 ICS 文件
 */
export function downloadIcs(content: string, filename: string = 'medication-schedule.ics'): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // 释放
  setTimeout(() => window.URL.revokeObjectURL(url), 100);
}

/**
 * 生成纯文本时间表（可复制到便签 / 微信）
 */
export function buildPlainTextSchedule(meds: MedicationEntry[]): string {
  const applicable = meds.filter((m) => m.isApplicable);
  if (applicable.length === 0) return '（当前方案无可用药品）';

  const schedule = generateSchedule(applicable);
  const lines: string[] = [];
  lines.push('💊 用药时间表');
  lines.push('—————————————');
  for (const slot of schedule) {
    lines.push(`【${slot.label} ${slot.time}】`);
    for (const d of slot.drugs) {
      lines.push(`  • ${d.name}  ${d.perDose}  (${d.category})`);
    }
    lines.push('');
  }
  lines.push('—— 服药期间禁忌 ——');
  const allAvoid = Array.from(
    new Set(applicable.flatMap((m) => m.avoid).filter(Boolean)),
  );
  if (allAvoid.length === 0) {
    lines.push('  无特殊禁忌');
  } else {
    for (const a of allAvoid) lines.push(`  ⛔ ${a}`);
  }
  return lines.join('\n');
}

/**
 * 浏览器端复制到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (err) {
    console.warn('[schedule] 复制失败', err);
    return false;
  }
}
