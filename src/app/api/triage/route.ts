import { NextRequest, NextResponse } from 'next/server';
import { runTriage, isCozeBotConfigured } from '@/lib/coze-bot';
import { BODY_PARTS } from '@/lib/medical-data';
import type { TriageInput } from '@/lib/triage-engine';
import type { UserProfile } from '@/lib/profile';

export const runtime = 'nodejs';

interface RequestBody {
  partId?: string;
  symptomIds?: string[];
  durationHours?: number;
  painLevel?: number;
  trigger?: string;
  population?: string;
  medicalHistory?: string;
  accompany?: string[];
  profile?: UserProfile;
}

function validate(body: RequestBody): string | null {
  if (!body.partId) return '请先选择不适部位';
  const part = BODY_PARTS.find((p) => p.id === body.partId);
  if (!part) return '无效的部位选择';
  if (!body.symptomIds || body.symptomIds.length === 0) {
    return '请至少选择 1 个症状';
  }
  const validSymptomIds = new Set(part.symptoms.map((s) => s.id));
  for (const id of body.symptomIds) {
    if (!validSymptomIds.has(id)) return '包含无效的症状选择';
  }
  if (typeof body.durationHours !== 'number' || body.durationHours < 0) {
    return '请填写发病时长';
  }
  if (typeof body.painLevel !== 'number' || body.painLevel < 0 || body.painLevel > 10) {
    return '请正确填写痛感（0-10）';
  }
  if (!body.trigger) return '请选择诱发原因';
  if (!body.population) return '请选择人群类型';
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestBody;
    const error = validate(body);
    if (error) {
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    const input: TriageInput = {
      partId: body.partId!,
      symptomIds: body.symptomIds!,
      durationHours: body.durationHours!,
      painLevel: body.painLevel!,
      trigger: body.trigger!,
      population: body.population!,
      medicalHistory: body.medicalHistory,
      accompany: body.accompany,
    };

    const result = await runTriage(input, body.profile ?? null);

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        engine: isCozeBotConfigured() ? 'coze-bot' : 'local-rules',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[triage-api]', err);
    return NextResponse.json(
      { success: false, error: '问诊服务暂时不可用，请稍后再试' },
      { status: 500 },
    );
  }
}
