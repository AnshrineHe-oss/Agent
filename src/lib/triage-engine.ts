// 居家轻症问诊 - 研判规则引擎
// 规则依据：通用家庭医学常识 + 常见轻症居家处理原则
// ⚠️ 严格遵守硬性合规红线：仅做引导，不开处方药

import type { BodyPart, SymptomItem } from './medical-data';

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

export interface PlanSection {
  key: string;
  title: string;
  icon: string;
  content: string[];
}

export interface TriageResult {
  level: 'home' | 'caution' | 'urgent'; // 可居家 / 注意观察 / 立即就医
  levelLabel: string;
  alertTitle: string;
  alertDesc: string;
  summary: string;
  riskFactors: string[]; // 命中规则
  sections: PlanSection[];
  specialPopulationTip?: string;
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

export function analyzeTriage(input: TriageInput, allParts: BodyPart[]): TriageResult {
  const part = allParts.find((p) => p.id === input.partId);
  const riskFactors: string[] = [];

  // 1) 红旗症状（高危关键词）
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

  // 5) 特殊人群在高风险部位
  if (input.partId in HIGH_RISK_PART_POPULATION) {
    const sensitive = HIGH_RISK_PART_POPULATION[input.partId];
    if (sensitive.includes(input.population)) {
      riskFactors.push(`特殊人群（${popLabel(input.population)}）出现 ${part?.name ?? ''} 不适`);
    }
  }

  // 6) 儿童发热判断
  if (input.population === 'children' && input.symptomIds.includes('fever_mid')) {
    riskFactors.push('儿童中等度发热建议线下就医明确病因');
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
  const levelLabel = level === 'urgent' ? '建议立即线下就医' : level === 'caution' ? '建议居家观察并及时就医' : '可先居家护理观察';
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
  const durationLabel = humanDuration(input.durationHours);
  const painLabel =
    input.painLevel === 0
      ? '无明显痛感'
      : `痛感 ${input.painLevel}/10`;
  const summary = [
    `部位：${part?.name ?? '-'}`,
    `症状：${symptomNames || '-'}`,
    `发病：${durationLabel}`,
    `痛感：${painLabel}`,
    `诱因：${triggerLabel(input.trigger)}`,
    `人群：${popLabel(input.population)}`,
  ].join('；');

  const sections = buildPlanSections(input, part, level);
  const specialPopulationTip = buildPopulationTip(input.population);

  return {
    level,
    levelLabel,
    alertTitle,
    alertDesc,
    summary,
    riskFactors,
    sections,
    specialPopulationTip,
  };
}

// ──────── 板块生成 ────────

function buildPlanSections(input: TriageInput, part: BodyPart | undefined, level: TriageResult['level']): PlanSection[] {
  const sections: PlanSection[] = [];
  const homeAdvice = buildHomeAdvice(input, part);
  const otc = buildOTCAdvice(input, part);
  const rest = buildRestAdvice(input, part);
  const diet = buildDietAdvice(input, part);
  const observe = buildObserveAdvice(level, input);
  const escalation = buildEscalationAdvice(level);

  sections.push({
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
    ],
  });

  sections.push({
    key: 'home',
    title: '居家护理建议',
    icon: '🏠',
    content: homeAdvice,
  });

  sections.push({
    key: 'otc',
    title: 'OTC 非处方药参考',
    icon: '💊',
    content: otc,
  });

  sections.push({
    key: 'rest',
    title: '休息与作息',
    icon: '🛏️',
    content: rest,
  });

  sections.push({
    key: 'diet',
    title: '饮食与生活调理',
    icon: '🥬',
    content: diet,
  });

  sections.push({
    key: 'observe',
    title: '观察指标与就医建议',
    icon: '🔍',
    content: [...observe, ...escalation],
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
      if (input.symptomIds.includes('ankle_sprain')) {
        advice.push('遵循 PRICE 原则：Protection 保护 / Rest 休息 / Ice 冰敷 / Compression 加压 / Elevation 抬高。');
      }
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

function buildOTCAdvice(input: TriageInput, part?: BodyPart): string[] {
  // 合规红线：仅推荐 OTC 常见药品大类，不含具体品牌/剂量
  // 处方药、抗生素、激素一律不推荐
  const advice: string[] = [];
  const isPregnant = input.population === 'pregnant';
  const isChildren = input.population === 'children';
  const isChronic = input.population === 'chronic';

  switch (input.partId) {
    case 'head':
      if (input.symptomIds.includes('head_ache') || input.symptomIds.includes('head_migraine')) {
        advice.push('解热镇痛类：对乙酰氨基酚或布洛芬（成人按说明书剂量）。');
        if (isPregnant) advice.push('⚠️ 孕妇避免布洛芬，优先对乙酰氨基酚，孕晚期禁用。');
        if (isChildren) advice.push('⚠️ 儿童需使用儿童剂型，按体重计算剂量，避免使用成人阿司匹林。');
      }
      if (input.symptomIds.includes('throat_ache')) {
        advice.push('含片类：西瓜霜含片 / 银黄含片 / 薄荷喉片。');
      }
      if (input.symptomIds.includes('nose_block')) {
        advice.push('鼻腔减充血剂：羟甲唑啉鼻喷剂，连续使用不超过 7 天。');
      }
      if (input.symptomIds.includes('eye_red')) {
        advice.push('可使用人工泪液缓解干涩；细菌性结膜炎需就医。');
      }
      break;
    case 'chest_lung':
      if (input.symptomIds.includes('cough_dry')) {
        advice.push('右美沙芬或喷托维林等中枢性镇咳药。');
      }
      if (input.symptomIds.includes('cough_phlegm')) {
        advice.push('盐酸溴己新或氨溴索等祛痰药。');
      }
      if (input.symptomIds.includes('sore_throat_cough')) {
        advice.push('复方感冒药（含对乙酰氨基酚+伪麻黄碱+右美沙芬等）。');
      }
      if (isPregnant) advice.push('⚠️ 孕妇使用任何止咳祛痰药前请先咨询医生。');
      break;
    case 'stomach':
      if (input.symptomIds.includes('stomach_ache') || input.symptomIds.includes('acid_reflux')) {
        advice.push('抗酸/抑酸：铝碳酸镁咀嚼片、复方氢氧化铝。');
        advice.push('胃黏膜保护：硫糖铝混悬液。');
        if (isPregnant) advice.push('⚠️ 孕妇胃痛持续需就医，避免自行长期服用抗酸药。');
      }
      if (input.symptomIds.includes('diarrhea')) {
        advice.push('口服补液盐 III（首选），蒙脱石散辅助收敛。');
        advice.push('⚠️ 儿童和老人脱水风险高，请及时补充电解质。');
      }
      if (input.symptomIds.includes('constipation')) {
        advice.push('开塞露（短期使用）或乳果糖口服液。');
      }
      break;
    case 'skin':
      if (input.symptomIds.includes('itch') || input.symptomIds.includes('hives')) {
        advice.push('外用：炉甘石洗剂 / 弱效糖皮质激素软膏（短期小面积）。');
        advice.push('口服抗组胺：氯雷他定 / 西替利嗪。');
        if (isPregnant) advice.push('⚠️ 孕妇优先外用炉甘石洗剂，避免口服抗组胺。');
        if (isChildren) advice.push('⚠️ 儿童需使用儿童剂型糖浆或滴剂。');
      }
      if (input.symptomIds.includes('burn_mild')) {
        advice.push('烫伤膏：京万红软膏 / 湿润烧伤膏（外用）。');
      }
      break;
    case 'joint_limb':
      if (input.painLevel >= 4 && input.painLevel < 8) {
        advice.push('外用 NSAIDs：洛索洛芬贴剂 / 扶他林乳胶剂。');
        advice.push('口服：对乙酰氨基酚或布洛芬（短期）。');
      }
      if (isChronic) advice.push('⚠️ 长期慢性病用药者服用 NSAIDs 请咨询医生，警惕相互作用。');
      break;
    case 'urinary':
      if (input.symptomIds.includes('urine_freq') || input.symptomIds.includes('urine_pain')) {
        advice.push('可多饮水观察 1-2 天，症状不缓解需就医做尿检。');
      }
      if (input.symptomIds.includes('menstrual_ache')) {
        advice.push('布洛芬或萘普生（痛经专用，月经来潮前 1 天开始服用）。');
      }
      break;
    case 'systemic':
      if (input.symptomIds.includes('fever_mild') || input.symptomIds.includes('fever_mid')) {
        advice.push('对乙酰氨基酚或布洛芬（按说明书剂量使用）。');
        if (isChildren) advice.push('⚠️ 儿童禁用阿司匹林！使用儿童退烧糖浆按体重给药。');
        if (isPregnant) advice.push('⚠️ 孕妇首选对乙酰氨基酚，避免布洛芬。');
      }
      if (input.symptomIds.includes('allergy_sneeze')) {
        advice.push('氯雷他定 / 西替利嗪（每日 1 次）。');
      }
      break;
  }
  if (advice.length === 0) {
    advice.push('目前症状未提示需用 OTC 药物，以生活方式调整为主。');
  }
  // 通用合规提示
  advice.push('⚠️ 以上仅为药品大类参考，具体品牌与剂量请咨询药师或医生后购买。');
  advice.push('⚠️ 严格不推荐抗生素、激素、处方药；如需请医生面诊。');
  return advice;
}

function buildRestAdvice(input: TriageInput, part?: BodyPart): string[] {
  const advice: string[] = [];
  if (input.painLevel >= 5 || input.symptomIds.includes('fever_mild') || input.symptomIds.includes('fever_mid')) {
    advice.push('保证每日 8 小时以上睡眠，避免剧烈运动与重体力劳动。');
  }
  if (input.partId === 'neck_back') {
    advice.push('睡眠时使用合适高度的枕头，床垫不宜过软。');
    advice.push('避免久坐、弯腰搬重物，必要时佩戴腰围支撑。');
  }
  if (input.partId === 'eye_red' || input.symptomIds.includes('head_ache')) {
    advice.push('减少连续用眼，每 30 分钟远眺 5 分钟。');
  }
  advice.push('保持规律作息，22:30 前入睡，避免熬夜。');
  return advice;
}

function buildDietAdvice(input: TriageInput, part?: BodyPart): string[] {
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

function buildPopulationTip(population: string): string | undefined {
  switch (population) {
    case 'pregnant':
      return '您处于孕期/哺乳期，很多药物需谨慎使用，请优先咨询产科医生或药师，居家处理仅作临时缓解。';
    case 'children':
      return '儿童生理特点与成人不同，剂量与禁忌差异较大，居家处理建议同时咨询儿科医生。';
    case 'elder':
      return '老年人往往合并慢性病，症状可能不典型但病情进展快，建议有变化时尽早就医。';
    case 'chronic':
      return '您有慢性病基础，服药较多，使用任何 OTC 药物前请先咨询医生避免药物相互作用。';
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
