// 居家轻症问诊 - 研判规则引擎（v2：集成档案 + 详细药物 + 症状预测）
// 规则依据：通用家庭医学常识 + 常见轻症居家处理原则
// ⚠️ 严格遵守硬性合规红线：仅做引导，不开处方药

import type { BodyPart, SymptomItem } from './medical-data';
import type { UserProfile } from './profile';
import { recommendDrugs, type DrugRecommendation } from './drug-database';
import { predict, type Prediction } from './prediction';

export interface TriageInput {
  partId: string;
  symptomIds: string[];
  durationHours: number;
  painLevel: number;
  trigger: string;
  population: string; // general | pregnant | children | elder | chronic
  medicalHistory?: string;
  accompany?: string[];
}

// ── 板块类型（联合） ──
export interface TextSection {
  type: 'text';
  key: string;
  title: string;
  icon: string;
  content: string[];
}

export interface DrugSection {
  type: 'drugs';
  key: string;
  title: string;
  icon: string;
  drugs: DrugRecommendation[];
  warning?: string[];
}

export interface PredictionSection {
  type: 'prediction';
  key: string;
  title: string;
  icon: string;
  prediction: Prediction;
}

export interface LifestyleSection {
  type: 'lifestyle';
  key: string;
  title: string;
  icon: string;
  dos: string[];
  avoids: string[];
  notes: string[];
}

export type PlanSection = TextSection | DrugSection | PredictionSection | LifestyleSection;

export interface TriageResult {
  level: 'home' | 'caution' | 'urgent';
  levelLabel: string;
  alertTitle: string;
  alertDesc: string;
  summary: string;
  riskFactors: string[];
  sections: PlanSection[];
  specialPopulationTip?: string;
  profileApplied: boolean; // 是否应用了档案数据
}

// ──────── 规则判定 ────────

const RED_FLAG_SYMPTOMS = new Set([
  'eye_blur',
  'throat_swell',
  'nose_bleed',
  'lumbar_sciatica',
  'joint_swell',
  'cough_blood',
  'chest_tight',
  'chest_pain',
  'wheeze',
  'vomit_blood',
  'blood_stool',
  'rash_whole',
  'swollen_face',
  'urine_blood',
  'fever_high',
  'fever_continue',
  'deform_swell',
  'weight_loss',
]);

const HIGH_RISK_PART_POPULATION: Record<string, string[]> = {
  head: ['pregnant', 'children', 'elder', 'chronic'],
  chest_lung: ['pregnant', 'children', 'elder', 'chronic'],
  stomach: ['pregnant', 'children', 'elder', 'chronic'],
  urinary: ['pregnant', 'children', 'elder', 'chronic'],
  systemic: ['pregnant', 'children', 'elder', 'chronic'],
};

export function analyzeTriage(
  input: TriageInput,
  allParts: BodyPart[],
  profile: UserProfile | null = null,
): TriageResult {
  const part = allParts.find((p) => p.id === input.partId);
  const riskFactors: string[] = [];

  // 1) 红旗症状
  const hitRedFlag = input.symptomIds.find((id) => RED_FLAG_SYMPTOMS.has(id));
  if (hitRedFlag) {
    const s = findSymptom(part, hitRedFlag);
    riskFactors.push(`出现高危症状：${s?.name ?? hitRedFlag}`);
  }

  // 2) 高热
  if (input.symptomIds.includes('fever_high')) {
    riskFactors.push('体温≥39.1°C 属于高热');
  }

  // 3) 持续时间过长
  if (input.durationHours >= 72) {
    riskFactors.push('症状已持续 3 天以上未见好转');
  }

  // 4) 剧痛
  if (input.painLevel >= 8) {
    riskFactors.push(`痛感达到 ${input.painLevel}/10（重度疼痛）`);
  }

  // 5) 特殊人群高风险部位
  if (input.partId in HIGH_RISK_PART_POPULATION) {
    const sensitive = HIGH_RISK_PART_POPULATION[input.partId];
    if (sensitive.includes(input.population)) {
      riskFactors.push(`特殊人群（${popLabel(input.population)}）出现 ${part?.name ?? ''} 不适`);
    }
  }

  // 6) 儿童中等发热
  if (input.population === 'children' && input.symptomIds.includes('fever_mid')) {
    riskFactors.push('儿童中等度发热建议线下就医明确病因');
  }

  // 7) 过敏
  for (const a of profile?.allergies ?? []) {
    // 已在风险因素提示（informational）
  }

  // ── 等级判定 ──
  let level: TriageResult['level'] = 'home';
  if (riskFactors.length >= 2 || hitRedFlag) {
    level = 'urgent';
  } else if (riskFactors.length === 1) {
    level = 'caution';
  }

  // 胸痛/胸闷/呼吸困难直接紧急
  if (
    input.symptomIds.includes('chest_pain') ||
    input.symptomIds.includes('chest_tight') ||
    input.symptomIds.includes('wheeze')
  ) {
    level = 'urgent';
  }

  // 老年人全身症状
  if (input.population === 'elder' && input.partId === 'systemic') {
    level = level === 'home' ? 'caution' : 'urgent';
    if (!riskFactors.some((r) => r.includes('老人'))) {
      riskFactors.push('老年人出现全身症状建议密切观察');
    }
  }

  // ── 警示文案 ──
  const levelLabel =
    level === 'urgent'
      ? '建议立即线下就医'
      : level === 'caution'
        ? '建议居家观察并及时就医'
        : '可先居家护理观察';
  const alertTitle =
    level === 'urgent'
      ? '⚠️ 出现高危信号，请尽快前往医院'
      : level === 'caution'
        ? '需谨慎观察，出现下述情况请立即就医'
        : '✅ 当前属于轻症范畴，可先居家护理';
  const alertDesc =
    level === 'urgent'
      ? '您提交的症状包含需要医生面诊的指征，请勿仅依赖居家处理。建议立即前往就近医院的急诊或相应专科就诊。'
      : level === 'caution'
        ? '建议按下方方案居家观察 24-48 小时，如出现症状加重、持续不退或新发高危表现，请及时就医。'
        : '请按下方方案进行 3-7 天的居家护理，如出现新发高危症状或加重，请及时复诊。';

  // ── 病情总结 ──
  const symptomNames = input.symptomIds
    .map((id) => findSymptom(part, id)?.name)
    .filter(Boolean)
    .join('、');
  const painLabel =
    input.painLevel === 0 ? '无明显痛感' : `痛感 ${input.painLevel}/10`;
  const summary = [
    `部位：${part?.name ?? '-'}`,
    `症状：${symptomNames || '-'}`,
    `发病：${humanDuration(input.durationHours)}`,
    `痛感：${painLabel}`,
    `诱因：${triggerLabel(input.trigger)}`,
    `人群：${popLabel(input.population)}`,
  ].join('；');

  const sections = buildPlanSections(input, part, level, profile);
  const specialPopulationTip = buildPopulationTip(input.population, profile);

  return {
    level,
    levelLabel,
    alertTitle,
    alertDesc,
    summary,
    riskFactors,
    sections,
    specialPopulationTip,
    profileApplied: profile !== null && (profile.chronicDiseases.length > 0 || profile.allergies.length > 0 || profile.isPregnant || profile.isLactating || profile.hasChildUnder12 || profile.hasElder),
  };
}

// ──────── 板块生成 ────────

function buildPlanSections(
  input: TriageInput,
  part: BodyPart | undefined,
  level: TriageResult['level'],
  profile: UserProfile | null,
): PlanSection[] {
  const sections: PlanSection[] = [];

  // 1) 病情规整总结
  sections.push({
    type: 'text',
    key: 'summary',
    title: '病情规整总结',
    icon: '📋',
    content: [
      `本次主诉部位：${part?.name ?? '未指定'}`,
      `主要症状：${input.symptomIds.map((id) => findSymptom(part, id)?.name).filter(Boolean).join('、') || '未填写'}`,
      `发病时长：${humanDuration(input.durationHours)}`,
      `痛感程度：${input.painLevel}/10`,
      `诱发因素：${triggerLabel(input.trigger)}`,
      `所属人群：${popLabel(input.population)}`,
      ...(profile && (profile.chronicDiseases.length > 0 || profile.allergies.length > 0)
        ? [`已知健康背景：${[...profile.chronicDiseases, ...profile.allergies.map((a) => `过敏：${a}`)].join('、')}`]
        : []),
    ],
  });

  // 2) 居家护理建议
  sections.push({
    type: 'text',
    key: 'home',
    title: '居家护理建议',
    icon: '🏠',
    content: buildHomeAdvice(input, part),
  });

  // 3) OTC 非处方药参考（结构化卡片）
  if (level !== 'urgent') {
    const drugs = recommendDrugs(input.partId, input.symptomIds, {
      isPregnant: input.population === 'pregnant' || profile?.isPregnant === true,
      isLactating: profile?.isLactating === true,
      age: profile?.age || '',
      chronic: profile?.chronicDiseases ?? [],
      allergies: profile?.allergies ?? [],
      currentMedications: profile?.currentMedications ?? '',
    });

    if (drugs.length > 0) {
      sections.push({
        type: 'drugs',
        key: 'otc',
        title: 'OTC 非处方药参考',
        icon: '💊',
        drugs,
        warning: [
          '⚠️ 严格不推荐抗生素、激素、处方药；如需请医生面诊。',
          '⚠️ 用药前请阅读说明书，确认无过敏或相互作用。',
        ],
      });
    }
  }

  // 4) 休息与作息
  sections.push({
    type: 'text',
    key: 'rest',
    title: '休息与作息',
    icon: '🛏️',
    content: buildRestAdvice(input, part),
  });

  // 5) 饮食与生活调理
  sections.push({
    type: 'text',
    key: 'diet',
    title: '饮食与生活调理',
    icon: '🥬',
    content: buildDietAdvice(input, part),
  });

  // 6) 症状预测与病程发展
  const pred = predict({
    partId: input.partId,
    symptomIds: input.symptomIds,
    population: input.population,
    painLevel: input.painLevel,
    durationHours: input.durationHours,
  });
  sections.push({
    type: 'prediction',
    key: 'prediction',
    title: '症状预测与病程发展',
    icon: '🔮',
    prediction: pred,
  });

  // 7) 生活方式与人群特别提示
  sections.push({
    type: 'lifestyle',
    key: 'lifestyle',
    title: '生活方式建议',
    icon: '✨',
    dos: pred.lifestyleDo,
    avoids: pred.lifestyleAvoid,
    notes: pred.precautionByGroup,
  });

  // 8) 观察指标与就医建议
  sections.push({
    type: 'text',
    key: 'observe',
    title: '观察指标与就医建议',
    icon: '🔍',
    content: [...buildObserveAdvice(level, input), ...buildEscalationAdvice(level)],
  });

  return sections;
}

function buildHomeAdvice(input: TriageInput, part?: BodyPart): string[] {
  const advice: string[] = [];
  switch (input.partId) {
    case 'head':
      advice.push('保持室内安静、光线柔和，避免长时间用眼和电子屏幕。');
      if (input.symptomIds.includes('head_ache') || input.symptomIds.includes('head_migraine')) {
        advice.push('可用温热毛巾敷颈后 10-15 分钟，帮助缓解紧张性头痛。');
      }
      if (input.symptomIds.includes('throat_ache')) {
        advice.push('淡盐水漱口（半杯温水加 1/4 茶匙盐），每日 3-4 次。');
      }
      if (input.symptomIds.includes('nose_block')) {
        advice.push('热蒸汽吸入（杯口热水，低头呼吸 10 分钟），有助缓解鼻塞。');
      }
      break;
    case 'neck_back':
      advice.push('避免长时间保持同一姿势，每小时起身活动 5-10 分钟。');
      advice.push('急性期（前 48 小时）可冷敷患处，每次 15 分钟；之后改热敷。');
      break;
    case 'chest_lung':
      advice.push('保持室内空气流通，湿度维持在 50%-60%。');
      advice.push('避免接触油烟、粉尘、烟雾等刺激物。');
      advice.push('多喝温水，少量多次。');
      break;
    case 'stomach':
      advice.push('采用少量多餐，避免油腻、辛辣、生冷食物。');
      advice.push('注意腹部保暖，可用热水袋热敷（温度不超过 50°C）。');
      if (input.symptomIds.includes('diarrhea')) {
        advice.push('补充淡盐水或口服补液盐，预防脱水。');
      }
      break;
    case 'skin':
      advice.push('保持患处清洁干燥，避免搔抓以防感染。');
      advice.push('穿宽松棉质衣物，减少摩擦刺激。');
      if (input.symptomIds.includes('burn_mild')) {
        advice.push('轻度烫伤立即用流动凉水冲洗 15-20 分钟，不要涂抹牙膏、酱油等。');
      }
      break;
    case 'joint_limb':
      advice.push('急性扭伤 24 小时内冷敷为主，避免按摩与热敷。');
      advice.push('恢复期可做低强度伸展运动，避免过早承重。');
      break;
    case 'urinary':
      advice.push('每日饮水量保持在 1500-2000ml，多次少量饮用。');
      advice.push('注意会阴部清洁，女性便后从前向后擦拭。');
      break;
    case 'systemic':
      if (input.symptomIds.includes('fever_mild') || input.symptomIds.includes('fever_mid')) {
        advice.push('体温 < 38.5°C 可先物理降温：温水擦浴、减少衣物、保持通风。');
        advice.push('每 4 小时测温一次，记录体温变化曲线。');
      }
      if (input.symptomIds.includes('insomnia')) {
        advice.push('睡前 1 小时避免使用电子设备，可做 10 分钟深呼吸或冥想。');
      }
      break;
  }
  if (advice.length === 0) {
    advice.push('注意休息，保持良好作息与情绪。');
  }
  return advice;
}

function buildRestAdvice(input: TriageInput, _part?: BodyPart): string[] {
  const advice: string[] = [];
  if (input.painLevel >= 5 || input.symptomIds.includes('fever_mild') || input.symptomIds.includes('fever_mid')) {
    advice.push('保证每日 8 小时以上睡眠，避免剧烈运动与重体力劳动。');
  }
  if (input.partId === 'neck_back') {
    advice.push('睡眠时使用合适高度的枕头，床垫不宜过软。');
    advice.push('避免久坐、弯腰搬重物，必要时佩戴腰围支撑。');
  }
  if (input.symptomIds.includes('head_ache') || input.symptomIds.includes('eye_red')) {
    advice.push('减少连续用眼，每 30 分钟远眺 5 分钟。');
  }
  advice.push('保持规律作息，22:30 前入睡，避免熬夜。');
  return advice;
}

function buildDietAdvice(input: TriageInput, _part?: BodyPart): string[] {
  const advice: string[] = [];
  if (input.partId === 'stomach' || input.symptomIds.includes('nausea')) {
    advice.push('饮食清淡：米粥、面条、蒸蛋、软烂蔬菜为主。');
    advice.push('避免：咖啡、浓茶、酒、辛辣、油炸、生冷。');
    advice.push('少食多餐，每餐 7 分饱，餐后 1 小时内不平卧。');
  } else if (input.partId === 'chest_lung' || input.symptomIds.includes('cough_phlegm')) {
    advice.push('多饮温水，每日 1500-2000ml，有助稀释痰液。');
    advice.push('可食用润肺食物：雪梨、银耳、百合、蜂蜜（1 岁以下禁用蜂蜜）。');
    advice.push('忌烟酒、辛辣、过甜过咸。');
  } else if (input.partId === 'skin' || input.symptomIds.includes('hives')) {
    advice.push('回避已知过敏食物：海鲜、芒果、花生、蛋清等高致敏食物。');
    advice.push('饮食清淡，多吃新鲜蔬果，补充维生素 C。');
  } else if (input.partId === 'urinary') {
    advice.push('每日饮水 2000ml 以上，不憋尿。');
    advice.push('少吃辛辣刺激食物，戒酒。');
  } else {
    advice.push('均衡饮食，多摄入新鲜蔬果与优质蛋白（鱼、蛋、瘦肉、豆制品）。');
    advice.push('每日饮水 1500-2000ml，避免含糖饮料。');
  }
  return advice;
}

function buildObserveAdvice(level: TriageResult['level'], input: TriageInput): string[] {
  const advice: string[] = [];
  advice.push('请每日记录以下指标变化：');
  advice.push('• 体温（早晚各 1 次）');
  advice.push('• 痛感变化（0-10 分打分）');
  advice.push('• 食欲与精神状态');
  advice.push('• 新发症状（如皮疹、呼吸困难、持续呕吐等）');
  if (level === 'caution') {
    advice.push('观察 24-48 小时，如无改善或加重请就医。');
  } else if (level === 'home') {
    advice.push('观察 3-7 天，症状应逐步减轻；若未减轻或加重请就医。');
  }
  // 人群特异
  if (input.population === 'pregnant') {
    advice.push('• 胎动变化（孕中后期）');
  }
  if (input.population === 'chronic') {
    advice.push('• 原有慢性病指标（血压/血糖/心率）');
  }
  return advice;
}

function buildEscalationAdvice(level: TriageResult['level']): string[] {
  const advice: string[] = [];
  if (level === 'urgent') {
    advice.push('🆘 立即拨打 120 或前往最近医院的急诊科。');
    advice.push('出行时请携带本人身份证、医保卡、既往病历与用药记录。');
  } else {
    advice.push('如出现以下任一情况，请立即就医：');
    advice.push('• 持续高热 ≥39°C 超过 24 小时不退');
    advice.push('• 剧烈疼痛超过耐受范围');
    advice.push('• 呼吸困难、胸痛、咯血');
    advice.push('• 意识模糊、抽搐、严重呕吐/腹泻导致脱水');
    advice.push('• 皮疹迅速扩大、面部肿胀、吞咽困难');
  }
  return advice;
}

function buildPopulationTip(population: string, profile: UserProfile | null): string | undefined {
  // 优先使用 profile 的精细化提示
  if (profile) {
    if (profile.isPregnant || population === 'pregnant') {
      return '您处于孕期/哺乳期，很多药物需谨慎使用，请优先咨询产科医生或药师，居家处理仅作临时缓解。';
    }
    if (profile.isLactating && population !== 'pregnant') {
      return '您处于哺乳期，部分药物会经乳汁分泌，用药前请咨询医生。';
    }
    if (profile.hasChildUnder12 || population === 'children') {
      return '儿童生理特点与成人不同，剂量与禁忌差异较大，居家处理建议同时咨询儿科医生。';
    }
    if (profile.hasElder || population === 'elder') {
      return '老年人往往合并慢性病，症状可能不典型但病情进展快，建议有变化时尽早就医。';
    }
    if (profile.chronicDiseases.length > 0 || population === 'chronic') {
      return `您有慢性病基础（${profile.chronicDiseases.join('、')}），服药较多，使用任何 OTC 药物前请先咨询医生避免药物相互作用。`;
    }
  }
  switch (population) {
    case 'pregnant':
      return '您处于孕期/哺乳期，很多药物需谨慎使用，请优先咨询产科医生或药师。';
    case 'children':
      return '儿童生理特点与成人不同，剂量与禁忌差异较大，居家处理建议同时咨询儿科医生。';
    case 'elder':
      return '老年人往往合并慢性病，症状可能不典型但病情进展快，建议有变化时尽早就医。';
    case 'chronic':
      return '您有慢性病基础，服药较多，使用任何 OTC 药物前请先咨询医生。';
    default:
      return undefined;
  }
}

// ──────── 工具函数 ────────

function findSymptom(part: BodyPart | undefined, id: string): SymptomItem | undefined {
  return part?.symptoms.find((s) => s.id === id);
}

function popLabel(p: string): string {
  return POPULATION_LABEL[p as keyof typeof POPULATION_LABEL] ?? p;
}

const POPULATION_LABEL = {
  general: '普通成人',
  pregnant: '孕妇/哺乳期',
  children: '12 岁以下儿童',
  elder: '65 岁以上老人',
  chronic: '慢性病患者',
};

function triggerLabel(t: string): string {
  return TRIGGER_LABEL[t as keyof typeof TRIGGER_LABEL] ?? t;
}

const TRIGGER_LABEL = {
  unknown: '原因不明',
  cold: '受凉/淋雨',
  diet: '饮食不当',
  overwork: '劳累/熬夜',
  mood: '情绪波动',
  sports: '运动/体力活动',
  trauma: '外伤/扭伤',
  allergy: '接触过敏原',
  infection: '周围有感染',
};

function humanDuration(hours: number): string {
  if (hours <= 2) return '2 小时内';
  if (hours <= 24) return '2-24 小时内';
  if (hours <= 72) return '1-3 天';
  if (hours <= 168) return '4-7 天';
  return '7 天以上';
}
