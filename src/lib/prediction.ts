// 症状预测引擎
// 基于部位 + 症状组合 + 人群，预测接下来可能的发展路径

export interface Prediction {
  earlySigns: string[]; // 早期可能出现的伴随症状
  progression: { stage: string; description: string; daysRange: string }[]; // 病程发展时间线
  estimatedRecovery: string; // 预计康复时间
  redFlags: string[]; // 警示信号
  returnAdvice: string; // 何时复诊
  lifestyleDo: string[]; // 建议
  lifestyleAvoid: string[]; // 避免
  precautionByGroup: string[]; // 特殊人群特别提示
}

interface PredictionContext {
  partId: string;
  symptomIds: string[];
  population: string;
  painLevel: number;
  durationHours: number;
}

// 病程预测模板（按部位 + 症状组合）
const PREDICTION_TEMPLATES: Record<string, Partial<Prediction>> = {
  // 上呼吸道（普通感冒）
  'head_throat_ache': {
    earlySigns: [
      '接下 1-2 天可能开始打喷嚏、流清鼻涕',
      '可能伴随轻度乏力、肌肉酸痛',
      '可能轻度畏寒、低热（37.3-37.8°C）',
    ],
    progression: [
      { stage: '第 1-2 天', description: '咽痛为主，可能伴鼻塞、头痛', daysRange: '24-48h' },
      { stage: '第 3-4 天', description: '鼻涕可能由清变稠，咳嗽开始出现', daysRange: '48-96h' },
      { stage: '第 5-7 天', description: '症状逐步缓解，咳嗽可能持续到 10-14 天', daysRange: '5-7d' },
      { stage: '第 7-10 天', description: '基本康复', daysRange: '7-10d' },
    ],
    estimatedRecovery: '5-10 天（咳嗽可残留 1-2 周）',
    redFlags: [
      '体温 > 39°C 持续 24 小时不退',
      '出现呼吸急促、胸闷胸痛',
      '吞咽困难无法进食进水',
      '扁桃体化脓、颈部淋巴结肿大明显',
      '症状 7 天后反而加重',
    ],
    returnAdvice: '7 天后症状无明显改善或加重即复诊；出现任一警示信号立即就医',
  },
  'head_head_ache': {
    earlySigns: [
      '可能伴随颈部僵硬感',
      '光线敏感或怕吵',
      '可能轻度恶心',
    ],
    progression: [
      { stage: '当下', description: '头痛明显，影响日常', daysRange: '0-24h' },
      { stage: '24-48h', description: '正确休息和用药后应缓解', daysRange: '1-2d' },
      { stage: '3-5 天', description: '反复发作需排查偏头痛或紧张性头痛', daysRange: '3-5d' },
    ],
    estimatedRecovery: '单纯紧张性头痛 1-3 天；偏头痛 4-72 小时/次',
    redFlags: [
      '突发"一生中最严重的头痛"',
      '伴喷射性呕吐、意识模糊',
      '伴发热 > 38.5°C + 颈项强直',
      '头痛 + 视物模糊 + 言语不清',
      '外伤后头痛',
    ],
    returnAdvice: '超过 3 天不缓解或 1 个月内发作 > 4 次需就医神经内科',
  },
  'head_ear_pain': {
    earlySigns: [
      '可能耳内有堵塞感、听力轻微下降',
      '婴幼儿可能表现为抓耳、哭闹加剧、拒食',
    ],
    progression: [
      { stage: '24-48h', description: '疼痛持续，体温可能轻度上升', daysRange: '1-2d' },
      { stage: '2-3 天', description: '若为中耳炎，可能自行破裂流脓（反而减压）', daysRange: '2-3d' },
      { stage: '5-7 天', description: '若规范用药 3 天仍无改善需耳鼻喉就诊', daysRange: '5-7d' },
    ],
    estimatedRecovery: '急性中耳炎规范治疗 7-10 天',
    redFlags: [
      '耳后红肿、压痛明显（警惕乳突炎）',
      '高热不退 + 剧烈头痛',
      '外耳道流脓带血',
      '伴眩晕、恶心呕吐',
      '婴幼儿持续哭闹拒食 > 24 小时',
    ],
    returnAdvice: '48 小时不缓解或高热不退即去耳鼻喉科',
  },
  'chest_cough_dry': {
    earlySigns: [
      '接下 1-3 天可能转有痰咳嗽（白痰→黄痰）',
      '咽部干燥、痒感',
      '可能胸骨后不适',
    ],
    progression: [
      { stage: '1-3 天', description: '干咳明显，夜间加重', daysRange: '1-3d' },
      { stage: '4-7 天', description: '逐渐有痰，咳嗽量增多', daysRange: '4-7d' },
      { stage: '1-2 周', description: '咳嗽逐步减少', daysRange: '7-14d' },
      { stage: '2-3 周', description: '部分人残留"感染后咳嗽"', daysRange: '14-21d' },
    ],
    estimatedRecovery: '急性 1-2 周；如 3 周未愈需排查哮喘/感染后咳嗽',
    redFlags: [
      '痰中带血或咯血',
      '呼吸困难、气促',
      '持续高热 > 3 天',
      '胸痛剧烈',
      '咳嗽伴喘息明显',
    ],
    returnAdvice: '2 周不愈或出现警示信号立即就医',
  },
  'chest_cough_phlegm': {
    earlySigns: [
      '痰量增多、颜色由白转黄转绿（不一定代表细菌感染）',
      '晨起咳嗽加重（夜间痰液积聚）',
    ],
    progression: [
      { stage: '3-5 天', description: '急性支气管炎高峰期，咳痰明显', daysRange: '3-5d' },
      { stage: '5-10 天', description: '痰液稀释、易咳出', daysRange: '5-10d' },
      { stage: '10-14 天', description: '逐渐恢复', daysRange: '10-14d' },
    ],
    estimatedRecovery: '急性支气管炎 10-14 天',
    redFlags: [
      '痰色持续黄绿伴臭味（警惕细菌性肺炎）',
      '发热 > 38.5°C 持续不退',
      '胸痛、呼吸困难',
      '咳痰带血',
    ],
    returnAdvice: '用药 3 天无改善或出现警示信号立即就医',
  },
  'stomach_diarrhea': {
    earlySigns: [
      '可能出现脐周阵发性腹痛',
      '可能伴轻度恶心、食欲下降',
      '可能轻度低热',
    ],
    progression: [
      { stage: '0-24h', description: '腹泻次数最多，注意防脱水', daysRange: '0-24h' },
      { stage: '24-48h', description: '次数减少，粪便逐渐成形', daysRange: '1-2d' },
      { stage: '3-5 天', description: '基本恢复，食欲恢复', daysRange: '3-5d' },
    ],
    estimatedRecovery: '急性胃肠炎 3-7 天',
    redFlags: [
      '大便带血或黑便',
      '持续高热不退',
      '严重腹痛固定在某处',
      '口渴、尿少、皮肤干燥（脱水信号）',
      '婴幼儿 > 8 小时无尿',
    ],
    returnAdvice: '48 小时不缓解或脱水、便血立即就医',
  },
  'stomach_acid_reflux': {
    earlySigns: [
      '餐后 1-2 小时烧心加重',
      '夜间平卧时反酸明显',
      '可能伴嗳气、上腹胀',
    ],
    progression: [
      { stage: '0-7 天', description: '症状典型，用药 + 生活方式调整可缓解', daysRange: '0-7d' },
      { stage: '1-2 周', description: '症状应明显改善', daysRange: '7-14d' },
      { stage: '2-4 周', description: '如反复需排查幽门螺杆菌、胃镜', daysRange: '14-28d' },
    ],
    estimatedRecovery: '轻度反流 1-2 周可缓解',
    redFlags: [
      '吞咽困难、吞咽痛',
      '消瘦、贫血',
      '呕血或黑便',
      '症状反复 > 4 周不缓解',
    ],
    returnAdvice: '用药 2 周无改善需消化内科就诊；出现警示信号立即就医',
  },
  'skin_itch_hives': {
    earlySigns: [
      '皮疹可能扩大或新发',
      '可能伴轻度眼睑/口唇水肿',
      '夜间瘙痒加重',
    ],
    progression: [
      { stage: '0-24h', description: '急性荨麻疹高峰期', daysRange: '0-24h' },
      { stage: '1-3 天', description: '风团逐渐减少', daysRange: '1-3d' },
      { stage: '1-2 周', description: '大部分急性荨麻疹缓解', daysRange: '7-14d' },
    ],
    estimatedRecovery: '急性荨麻疹 1-2 周；慢性荨麻疹 > 6 周',
    redFlags: [
      '⚠️ 喉头水肿（声音嘶哑、呼吸困难）→ 立即急诊',
      '⚠️ 全身大面积风团 + 血压下降、面色苍白 → 休克前兆',
      '伴发热、关节痛',
      '口腔、生殖器黏膜同时受累',
    ],
    returnAdvice: '出现喉头水肿/呼吸困难立即拨打 120；3 天不缓解就医皮肤科',
  },
  'joint_ankle_sprain': {
    earlySigns: [
      '0-24 小时肿胀达到高峰',
      '可能出现皮下淤青（24-48h 后）',
      '活动时疼痛明显',
    ],
    progression: [
      { stage: '0-24h', description: '急性期：RICE（休息/冷敷/加压/抬高）', daysRange: '0-24h' },
      { stage: '24-72h', description: '肿胀开始消退，可改热敷', daysRange: '1-3d' },
      { stage: '3-7 天', description: '轻度扭伤明显缓解', daysRange: '3-7d' },
      { stage: '2-4 周', description: '完全康复', daysRange: '14-28d' },
    ],
    estimatedRecovery: '轻度 1-2 周；中度 3-4 周；重度 4-8 周',
    redFlags: [
      '受伤时有骨擦音、明显畸形（警惕骨折）',
      '足部不能承重、麻木',
      '肿胀持续加重、剧痛',
      '皮肤苍白、发凉（血管神经损伤）',
    ],
    returnAdvice: '不能承重、明显畸形立即骨科；3 天不缓解或反复肿胀就医',
  },
  'systemic_fever_mild': {
    earlySigns: [
      '体温可能继续上升 0.5-1°C',
      '可能伴随头痛、肌肉酸痛',
      '食欲下降、乏力',
    ],
    progression: [
      { stage: '0-24h', description: '低热期，正确处理可控制', daysRange: '0-24h' },
      { stage: '1-3 天', description: '体温波动，逐步正常', daysRange: '1-3d' },
      { stage: '3-5 天', description: '基本退热', daysRange: '3-5d' },
    ],
    estimatedRecovery: '普通低热 1-3 天',
    redFlags: [
      '体温 > 39°C 持续不退',
      '伴皮疹、颈部僵硬',
      '持续 > 3 天不退',
      '精神差、嗜睡、抽搐',
      '小婴儿 < 3 月龄发热',
    ],
    returnAdvice: '3 天不退或 < 3 月龄婴儿/老人发热立即就医',
  },
};

// 根据 partId+symptom 查找预测模板
function lookupPredictionTemplate(partId: string, symptomIds: string[]): Partial<Prediction> | undefined {
  for (const [key, pred] of Object.entries(PREDICTION_TEMPLATES)) {
    const [kPart, ...kSymptoms] = key.split('_');
    const partPrefixMap: Record<string, string> = {
      head: 'head',
      chest_lung: 'chest',
      stomach: 'stomach',
      skin: 'skin',
      joint_limb: 'joint',
      systemic: 'systemic',
    };
    const mapPart = partPrefixMap[partId] ?? partId;
    if (kPart === mapPart) {
      // 找到该部位下的所有症状模板，挑首个匹配的
      const intersect = kSymptoms.some((s) => symptomIds.includes(s));
      if (intersect) return pred;
    }
  }
  return undefined;
}

const DEFAULT_PREDICTION: Prediction = {
  earlySigns: ['未来 1-2 天症状可能小幅波动属正常'],
  progression: [
    { stage: '当下', description: '症状明显，遵循方案护理', daysRange: '0-24h' },
    { stage: '24-72h', description: '逐步改善', daysRange: '1-3d' },
    { stage: '3-7 天', description: '大部分轻症 1 周内缓解', daysRange: '3-7d' },
  ],
  estimatedRecovery: '轻症 3-7 天',
  redFlags: [
    '体温持续 > 39°C',
    '症状快速加重',
    '出现新发严重症状',
  ],
  returnAdvice: '3-5 天不缓解或出现警示信号即复诊',
  lifestyleDo: ['充足休息', '清淡饮食', '充足饮水', '保持情绪平稳'],
  lifestyleAvoid: ['吸烟饮酒', '过度劳累', '剧烈运动'],
  precautionByGroup: [],
};

// 人群特定生活建议
const POPULATION_LIFESTYLE: Record<string, { do: string[]; avoid: string[]; note: string[] }> = {
  pregnant: {
    do: [
      '孕期内任何用药请先咨询产科医生',
      '保持左侧卧位休息',
      '多饮水，少食多餐',
    ],
    avoid: [
      '⚠️ 严格避免：布洛芬（孕晚期）、利巴韦林、四环素、链霉素、维 A 酸',
      '避免进食生冷、未熟透食物',
      '避免剧烈运动、提重物',
    ],
    note: [
      '⚠️ 孕期出现阴道出血、剧烈腹痛、胎动异常立即急诊',
      '⚠️ 孕晚期任何发热都建议产科就诊',
    ],
  },
  children: {
    do: [
      '儿童退烧首选对乙酰氨基酚（≥2 月龄）或布洛芬（≥6 月龄）',
      '保持室内凉爽通风',
      '多饮水、奶、稀粥',
    ],
    avoid: [
      '⚠️ 18 岁以下儿童禁用阿司匹林（防瑞氏综合征）',
      '⚠️ 2 岁以下慎用复方感冒药',
      '避免捂汗',
    ],
    note: [
      '⚠️ 3 月龄以下婴儿发热立即就医',
      '⚠️ 儿童持续哭闹、嗜睡、抽搐、拒食立即急诊',
    ],
  },
  elder: {
    do: [
      '多卧床休息',
      '饮食软烂易消化',
      '按时服用慢性病药物',
    ],
    avoid: [
      '避免擅自加用安眠药、镇静药',
      '避免长时间独处（防跌倒）',
    ],
    note: [
      '⚠️ 老人出现嗜睡、意识模糊、跌倒立即就医',
      '⚠️ 用药前确认无药物相互作用（建议药师咨询）',
    ],
  },
  chronic: {
    do: [
      '⚠️ 切勿自行停用慢性病药物（降压/降糖/抗凝等）',
      '监测原有慢性病指标（血压/血糖/体温）',
    ],
    avoid: [
      '⚠️ 服用感冒药前查看成分，避免与慢性病药物重复',
      '高血压慎用含伪麻黄碱的复方感冒药',
    ],
    note: [
      '⚠️ 慢性病控制不佳时优先就诊相应专科',
    ],
  },
  general: {
    do: ['充足休息', '多饮水', '清淡饮食', '保持心情愉快'],
    avoid: ['吸烟饮酒', '过度劳累', '高糖高油饮食'],
    note: [],
  },
};

export function predict(ctx: PredictionContext): Prediction {
  const template = lookupPredictionTemplate(ctx.partId, ctx.symptomIds) ?? {};
  const popConfig = POPULATION_LIFESTYLE[ctx.population] ?? POPULATION_LIFESTYLE.general;

  // 痛感+病程可作为风险加项
  const extraRedFlags: string[] = [];
  if (ctx.painLevel >= 8) {
    extraRedFlags.push('痛感达到 8/10 及以上，警惕急症');
  }
  if (ctx.durationHours >= 72 && ctx.population !== 'general') {
    extraRedFlags.push('症状持续 > 3 天未改善需就医');
  }

  return {
    earlySigns: template.earlySigns ?? DEFAULT_PREDICTION.earlySigns,
    progression: template.progression ?? DEFAULT_PREDICTION.progression,
    estimatedRecovery: template.estimatedRecovery ?? DEFAULT_PREDICTION.estimatedRecovery,
    redFlags: Array.from(new Set([...(template.redFlags ?? []), ...extraRedFlags])),
    returnAdvice: template.returnAdvice ?? DEFAULT_PREDICTION.returnAdvice,
    lifestyleDo: popConfig.do,
    lifestyleAvoid: popConfig.avoid,
    precautionByGroup: popConfig.note,
  };
}
