// Coze 智能体（Bot）调用封装
// 用途：在 Coze 平台配置好居家轻症问诊 Bot 后，可通过本文件调用
// 配置：设置环境变量 COZE_TRIAGE_BOT_ID 与 COZE_WORKLOAD_API_TOKEN
// 若未配置：降级为本地规则引擎，详见 triage-engine.ts

import type { TriageInput, TriageResult } from './triage-engine';
import { analyzeTriage } from './triage-engine';
import { BODY_PARTS } from './medical-data';
import type { UserProfile } from './profile';

const COZE_API_BASE = process.env.COZE_API_BASE_URL || 'https://api.coze.cn';
const BOT_ID = process.env.COZE_TRIAGE_BOT_ID;
const API_TOKEN = process.env.COZE_WORKLOAD_API_TOKEN;

export function isCozeBotConfigured(): boolean {
  return Boolean(BOT_ID && API_TOKEN);
}

export async function runTriage(input: TriageInput, profile: UserProfile | null = null): Promise<TriageResult> {
  // 优先用本地规则引擎快速返回（确保可用性与合规）
  const localResult = analyzeTriage(input, BODY_PARTS, profile);

  // 若配置了 Coze Bot，尝试调用 Coze 做增强（用本地结果兜底）
  if (!isCozeBotConfigured()) {
    return localResult;
  }

  try {
    const botResult = await callCozeBot(input, profile, localResult);
    return botResult;
  } catch (err) {
    console.error('[triage] Coze 调用失败，降级为本地结果', err);
    return localResult;
  }
}

async function callCozeBot(input: TriageInput, profile: UserProfile | null, fallback: TriageResult): Promise<TriageResult> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
  };

  const part = BODY_PARTS.find((p) => p.id === input.partId);
  const symptomNames = input.symptomIds
    .map((id) => part?.symptoms.find((s) => s.id === id)?.name)
    .filter(Boolean)
    .join('、');

  const prompt = [
    '【居家轻症问诊】',
    `部位：${part?.name ?? '-'}`,
    `症状：${symptomNames || '-'}`,
    `发病：${input.durationHours} 小时`,
    `痛感：${input.painLevel}/10`,
    `诱因：${input.trigger}`,
    `人群：${input.population}`,
    `既往：${input.medicalHistory ?? '无'}`,
    profile ? `健康档案：${[
      profile.chronicDiseases.length > 0 ? `慢性病：${profile.chronicDiseases.join('、')}` : '',
      profile.allergies.length > 0 ? `过敏：${profile.allergies.join('、')}` : '',
      profile.isPregnant ? '孕期' : '',
      profile.isLactating ? '哺乳期' : '',
    ].filter(Boolean).join('；') || '无'}` : '',
    '请根据已发布的居家方案规则，给出标准化研判与方案。',
  ].join('\n');

  const response = await fetch(`${COZE_API_BASE}/v3/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      bot_id: BOT_ID,
      user_id: 'triage_visitor',
      stream: false,
      auto_save_history: false,
      additional_messages: [
        {
          role: 'user',
          content: prompt,
          content_type: 'text',
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Coze HTTP ${response.status}`);
  }

  // 同步模式返回 JSON（轮询逻辑已由 Coze 服务端在内部完成）
  const data = (await response.json()) as {
    code?: number;
    msg?: string;
    data?: { messages?: Array<{ type?: string; content?: string }> };
  };

  if (data.code !== 0) {
    throw new Error(`Coze 业务错误：${data.msg ?? 'unknown'}`);
  }

  const textAnswer = data.data?.messages?.find((m) => m.type === 'answer')?.content;
  if (!textAnswer) {
    return fallback;
  }

  // 尝试解析 Bot 输出的 JSON 结构；失败则用本地结果
  try {
    const parsed = JSON.parse(textAnswer) as TriageResult;
    if (parsed.level && parsed.sections) {
      return parsed;
    }
  } catch {
    // 非 JSON 结构，保留本地结果
  }
  return fallback;
}
