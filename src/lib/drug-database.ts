// 详细 OTC 药物数据库
// 数据来源：《中国非处方药目录》、《国家基本药物目录》、《临床用药须知》
// 严格仅收录 OTC 药品大类（含具体通用名与剂量参考）
// 严禁收录：抗生素、激素、注射剂、管制类药物

export type PregnancySafety = 'safe' | 'caution' | 'avoid' | 'consult';

export interface DrugDose {
  perDose: string; // 单次剂量
  frequency: string; // 频次
  maxDaily: string; // 24h 最大量
}

export interface DrugEntry {
  id: string; // 内部 id
  category: string; // 解热镇痛 / 抗组胺 / ...
  genericName: string; // 通用名
  brandExamples: string[]; // 常见品牌（仅供参考）
  indication: string; // 适应症
  adultDose?: DrugDose; // 成人
  childrenDose?: DrugDose & { ageRange?: string; byWeight?: string };
  elderlyDose?: string; // 老人调整
  duration: string; // 建议疗程
  route: string; // 口服/外用/含服
  avoid: string[]; // 禁忌食物/行为
  sideEffects: string[]; // 常见副作用
  interactions: string[]; // 药物相互作用
  pregnancy: PregnancySafety; // 孕期安全
  pregnancyNote?: string;
  lactation: PregnancySafety;
  chronicCaution: string[]; // 慢性病注意
  storage: string; // 储存
  warning?: string; // 特别警示
}

// ─────────────────────────── 解热镇痛类 ───────────────────────────
export const DRUGS: DrugEntry[] = [
  {
    id: 'paracetamol',
    category: '解热镇痛（OTC）',
    genericName: '对乙酰氨基酚',
    brandExamples: ['泰诺林', '必理通', '扑热息痛片'],
    indication: '普通感冒发热、头痛、牙痛、痛经、关节痛',
    adultDose: {
      perDose: '0.3-0.5 g（1-2 片）',
      frequency: '每 4-6 小时 1 次',
      maxDaily: '≤ 2 g（8 片以内）',
    },
    childrenDose: {
      ageRange: '2-12 岁',
      byWeight: '10-15 mg/kg/次',
      perDose: '按体重计算',
      frequency: '每 4-6 小时 1 次',
      maxDaily: '≤ 75 mg/kg/日',
    },
    elderlyDose: '老年人剂量无需调整，但需注意肝功能',
    duration: '退热不超过 3 天；镇痛不超过 5 天',
    route: '口服',
    avoid: [
      '服药期间禁止饮酒（含任何含酒精饮料）',
      '避免与含有对乙酰氨基酚的复方感冒药同时使用（防过量）',
      '空腹慎用（建议餐后 30 分钟服用）',
    ],
    sideEffects: [
      '偶见皮疹、荨麻疹等过敏反应',
      '长期大剂量可致肝肾损伤',
      '罕见血小板减少',
    ],
    interactions: [
      '与抗凝药（华法林）合用可能增加出血风险',
      '与巴比妥类、卡马西平等肝药酶诱导剂合用增加肝损伤风险',
    ],
    pregnancy: 'caution',
    pregnancyNote: '孕期可在医生指导下短期使用，孕晚期慎用',
    lactation: 'safe',
    chronicCaution: [
      '肝功能不全者禁用',
      '严重肾功能不全者减量',
      '酗酒者禁用',
    ],
    storage: '密封，阴凉干燥处',
    warning: '⚠️ 超剂量服用可致严重肝损伤甚至肝衰竭，请严格按剂量使用',
  },
  {
    id: 'ibuprofen',
    category: '解热镇痛 / NSAIDs（OTC）',
    genericName: '布洛芬',
    brandExamples: ['美林', '芬必得', '散利痛（复方）'],
    indication: '发热、头痛、牙痛、肌肉痛、关节痛、痛经',
    adultDose: {
      perDose: '0.2-0.4 g（1-2 片）',
      frequency: '每 6-8 小时 1 次',
      maxDaily: '≤ 1.2 g（6 片以内）',
    },
    childrenDose: {
      ageRange: '6 个月-12 岁',
      byWeight: '5-10 mg/kg/次',
      perDose: '按体重计算',
      frequency: '每 6-8 小时 1 次',
      maxDaily: '≤ 40 mg/kg/日',
    },
    elderlyDose: '老年人减量使用，警惕胃肠道反应',
    duration: '退热不超过 3 天；镇痛不超过 5 天',
    route: '口服',
    avoid: [
      '服药期间禁止饮酒',
      '避免空腹服用（建议餐后）',
      '避免与其他 NSAIDs（如阿司匹林、双氯芬酸）合用',
    ],
    sideEffects: [
      '胃部不适、恶心、烧心',
      '长期使用可致胃溃疡、出血',
      '少见头痛、眩晕、皮疹',
    ],
    interactions: [
      '与抗凝药（华法林）合用增加出血风险',
      '与降压药（ACEI/ARB）合用可能减弱降压效果',
      '与糖皮质激素合用增加胃溃疡风险',
    ],
    pregnancy: 'avoid',
    pregnancyNote: '⚠️ 孕妇（尤其孕 30 周后）禁用布洛芬，可致胎儿动脉导管提前关闭',
    lactation: 'safe',
    chronicCaution: [
      '活动期消化性溃疡禁用',
      '严重心、肝、肾功能不全者禁用',
      '哮喘患者部分人群敏感（阿司匹林哮喘）',
    ],
    storage: '密封，避光',
    warning: '⚠️ 儿童退烧首选对乙酰氨基酚；布洛芬用于 ≥6 月龄儿童',
  },
  // ─────────────────────────── 抗组胺类 ───────────────────────────
  {
    id: 'loratadine',
    category: '抗组胺 / 抗过敏（OTC）',
    genericName: '氯雷他定',
    brandExamples: ['开瑞坦', '息斯敏（复方）', '百为乐'],
    indication: '过敏性鼻炎、荨麻疹、皮肤瘙痒、过敏性皮疹',
    adultDose: {
      perDose: '10 mg（1 片）',
      frequency: '每日 1 次',
      maxDaily: '≤ 10 mg',
    },
    childrenDose: {
      ageRange: '2-12 岁',
      byWeight: '体重 > 30 kg: 10 mg/次；< 30 kg: 5 mg/次',
      perDose: '按体重/年龄',
      frequency: '每日 1 次',
      maxDaily: '≤ 10 mg',
    },
    elderlyDose: '老年人无需调整',
    duration: '症状缓解后可持续数日；慢性荨麻疹遵医嘱',
    route: '口服',
    avoid: [
      '服药期间避免驾驶、高空作业（少数人嗜睡）',
      '避免与红霉素、酮康唑等肝药酶抑制剂大量同服',
    ],
    sideEffects: [
      '偶见嗜睡、头痛、口干',
      '罕见心悸、过敏反应',
    ],
    interactions: [
      '与红霉素、克拉霉素合用可能增加血药浓度',
      '与中枢抑制剂（镇静催眠药）合用可能加重嗜睡',
    ],
    pregnancy: 'caution',
    pregnancyNote: '孕期使用前请咨询医生',
    lactation: 'caution',
    chronicCaution: ['严重肝功能不全者减量或不用'],
    storage: '密封，干燥处',
  },
  {
    id: 'cetirizine',
    category: '抗组胺 / 抗过敏（OTC）',
    genericName: '西替利嗪',
    brandExamples: ['仙特明', '赛替利嗪', '适迪'],
    indication: '过敏性鼻炎、荨麻疹、皮肤瘙痒',
    adultDose: {
      perDose: '10 mg（1 片）',
      frequency: '每日 1 次',
      maxDaily: '≤ 10 mg',
    },
    childrenDose: {
      ageRange: '6 岁以上',
      byWeight: '6-12 岁: 5-10 mg/日',
      perDose: '5 mg（半片至 1 片）',
      frequency: '每日 1 次',
      maxDaily: '≤ 10 mg',
    },
    duration: '症状控制后可停药；慢性病遵医嘱',
    route: '口服',
    avoid: [
      '服药期间避免饮酒（加重嗜睡）',
      '避免驾驶、高空作业',
    ],
    sideEffects: ['嗜睡（较氯雷他定多见）、口干、头晕'],
    interactions: ['与中枢抑制剂合用增强镇静'],
    pregnancy: 'avoid',
    pregnancyNote: '⚠️ 孕妇禁用',
    lactation: 'avoid',
    chronicCaution: ['严重肾功能不全者需减量'],
    storage: '密封，避光',
  },
  // ─────────────────────────── 胃药类 ───────────────────────────
  {
    id: 'omeprazole',
    category: '胃酸抑制 / 质子泵抑制剂（部分 OTC）',
    genericName: '奥美拉唑',
    brandExamples: ['洛赛克 OTC', '奥克', '奥美拉唑肠溶胶囊'],
    indication: '反酸、烧心、轻度胃食管反流',
    adultDose: {
      perDose: '20 mg（1 粒）',
      frequency: '每日 1 次',
      maxDaily: '≤ 20 mg',
    },
    duration: '连用不超过 14 天；持续症状需就医',
    route: '口服（餐前空腹，吞服勿咀嚼）',
    avoid: [
      '避免与氯吡格雷同服（影响抗血小板）',
      '长期使用可影响钙/镁/维生素 B12 吸收',
    ],
    sideEffects: ['头痛、腹泻、恶心；长期可致骨质疏松、低镁血症'],
    interactions: [
      '降低氯吡格雷抗血小板效果（心血管事件风险）',
      '影响铁剂、酮康唑吸收',
    ],
    pregnancy: 'consult',
    pregnancyNote: '孕期使用前请咨询医生',
    lactation: 'consult',
    chronicCaution: ['骨质疏松患者长期慎用'],
    storage: '密封，避光',
  },
  {
    id: 'antacid',
    category: '抗酸 / 胃黏膜保护（OTC）',
    genericName: '铝碳酸镁',
    brandExamples: ['达喜', '胃达喜', '铝碳酸镁咀嚼片'],
    indication: '反酸、烧心、胃痛、急性胃炎',
    adultDose: {
      perDose: '0.5-1.0 g（1-2 片）',
      frequency: '餐后 1-2 小时及睡前嚼服',
      maxDaily: '≤ 8 片',
    },
    childrenDose: {
      ageRange: '6 岁以上',
      perDose: '0.5 g（1 片）',
      frequency: '餐后嚼服',
      maxDaily: '≤ 4 片',
    },
    duration: '症状缓解后停药；连用不超过 7 天',
    route: '咀嚼',
    avoid: [
      '避免与四环素、喹诺酮类、铁剂同服（影响吸收）',
      '避免餐前空腹服用',
    ],
    sideEffects: ['偶见便秘或稀便'],
    interactions: ['影响多种口服药物的吸收，需间隔 2 小时服用'],
    pregnancy: 'caution',
    pregnancyNote: '孕早期使用前请咨询医生',
    lactation: 'safe',
    chronicCaution: ['严重肾功能不全者慎用'],
    storage: '密封，干燥',
  },
  {
    id: 'loperamide',
    category: '止泻（OTC）',
    genericName: '蒙脱石散（吸附剂，安全性更高）',
    brandExamples: ['思密达', '必奇', '肯特令'],
    indication: '急慢性腹泻（成人及儿童）',
    adultDose: {
      perDose: '1 袋（3 g）',
      frequency: '每日 3 次',
      maxDaily: '3 袋',
    },
    childrenDose: {
      ageRange: '1 岁以上',
      byWeight: '1 岁: 1 袋/日；2 岁: 1-2 袋/日；3 岁以上: 2-3 袋/日',
      perDose: '分 3 次服用',
      frequency: '两餐间空腹服用',
      maxDaily: '见年龄',
    },
    duration: '急性腹泻不超过 7 天',
    route: '温水冲服',
    avoid: [
      '与其它药物间隔 2 小时服用（吸附作用）',
      '不可与抗菌药同服',
    ],
    sideEffects: ['偶见便秘'],
    interactions: ['同其他药物至少间隔 2 小时'],
    pregnancy: 'safe',
    pregnancyNote: '可使用，但严重腹泻需就医',
    lactation: 'safe',
    chronicCaution: ['需排除感染性腹泻后使用'],
    storage: '密封，干燥',
    warning: '⚠️ 腹泻关键在于防脱水，务必补充口服补液盐（ORS）',
  },
  {
    id: 'ors',
    category: '电解质补充（OTC）',
    genericName: '口服补液盐 III',
    brandExamples: ['博叶', 'ORS III'],
    indication: '腹泻、呕吐、发热出汗引起的轻中度脱水',
    adultDose: {
      perDose: '1 袋冲 250 ml',
      frequency: '随时饮用，按需补充',
      maxDaily: '按脱水程度',
    },
    childrenDose: {
      ageRange: '任何年龄（含婴幼儿）',
      perDose: '按需饮用',
      frequency: '少量多次',
      maxDaily: '按需',
    },
    duration: '腹泻期间持续补充',
    route: '温水冲服',
    avoid: ['不可加糖、果汁或牛奶冲调'],
    sideEffects: ['按说明使用几乎无副作用'],
    interactions: ['无显著相互作用'],
    pregnancy: 'safe',
    lactation: 'safe',
    chronicCaution: [],
    storage: '密封，干燥',
  },
  // ─────────────────────────── 止咳祛痰 ───────────────────────────
  {
    id: 'dextromethorphan',
    category: '镇咳（右美沙芬，OTC）',
    genericName: '氢溴酸右美沙芬',
    brandExamples: ['惠菲宁（复方）', '联邦止咳露（受管制）', '右美沙芬糖浆'],
    indication: '干咳无痰（感冒、咽炎、支气管刺激）',
    adultDose: {
      perDose: '10-20 mg',
      frequency: '每 4 小时 1 次',
      maxDaily: '≤ 120 mg',
    },
    childrenDose: {
      ageRange: '2-12 岁',
      byWeight: '0.5 mg/kg/次',
      perDose: '按体重',
      frequency: '每 4-6 小时 1 次',
      maxDaily: '≤ 60 mg',
    },
    duration: '不超过 7 天',
    route: '口服',
    avoid: [
      '痰多者禁用（抑制咳嗽导致痰液滞留）',
      '服药期间避免饮酒',
      '不可与单胺氧化酶抑制剂（MAOI）合用',
    ],
    sideEffects: ['偶见嗜睡、头晕、便秘'],
    interactions: ['与 MAOI 合用可致严重反应；与中枢抑制剂合用增强镇静'],
    pregnancy: 'caution',
    pregnancyNote: '孕早期慎用',
    lactation: 'caution',
    chronicCaution: ['哮喘患者慎用'],
    storage: '密封，避光',
  },
  {
    id: 'ambroxol',
    category: '祛痰（OTC）',
    genericName: '盐酸氨溴索',
    brandExamples: ['沐舒坦', '贝莱', '安普索'],
    indication: '痰液粘稠不易咳出',
    adultDose: {
      perDose: '30 mg（1 片）/ 10 ml 口服液',
      frequency: '每日 3 次',
      maxDaily: '≤ 90 mg',
    },
    childrenDose: {
      ageRange: '1-12 岁',
      byWeight: '1.2-1.6 mg/kg/日',
      perDose: '按年龄/剂型',
      frequency: '分 2-3 次',
      maxDaily: '按体重',
    },
    duration: '不超过 7-10 天',
    route: '口服',
    avoid: ['不可与中枢性镇咳药（右美沙芬）同时使用'],
    sideEffects: ['偶见胃部不适、过敏反应'],
    interactions: ['与抗生素（阿莫西林、头孢等）合用可增加肺组织浓度'],
    pregnancy: 'caution',
    pregnancyNote: '孕早期慎用',
    lactation: 'safe',
    chronicCaution: [],
    storage: '密封',
  },
  // ─────────────────────────── 外用 ───────────────────────────
  {
    id: 'calamine',
    category: '外用止痒 / 保护剂（OTC）',
    genericName: '炉甘石洗剂',
    brandExamples: ['炉甘石洗剂（通用名）', '信龙'],
    indication: '皮肤瘙痒、湿疹、荨麻疹、蚊虫叮咬、轻度晒伤',
    adultDose: {
      perDose: '适量',
      frequency: '每日 2-3 次',
      maxDaily: '按需',
    },
    childrenDose: {
      ageRange: '婴幼儿可用',
      perDose: '适量',
      frequency: '每日 2-3 次',
      maxDaily: '按需',
    },
    duration: '症状缓解后停用',
    route: '外用（摇匀后涂患处）',
    avoid: [
      '皮肤破溃处禁用',
      '避免接触眼睛和口腔黏膜',
    ],
    sideEffects: ['极少；偶见皮肤干燥'],
    interactions: ['无'],
    pregnancy: 'safe',
    lactation: 'safe',
    chronicCaution: [],
    storage: '密封，避光',
  },
  {
    id: 'burn_ointment',
    category: '外用烫伤（OTC）',
    genericName: '湿润烧伤膏 / 京万红软膏',
    brandExamples: ['京万红', '美宝湿润烧伤膏'],
    indication: '一度、浅二度烫伤',
    adultDose: {
      perDose: '薄涂',
      frequency: '每 4-6 小时 1 次',
      maxDaily: '按需',
    },
    duration: '症状缓解后停用；超过 3 天不愈需就医',
    route: '外用',
    avoid: [
      '烫伤后立即用流动凉水冲 15-20 分钟再涂药',
      '严禁涂抹牙膏、酱油、酒精、紫药水等',
      '二度深、三度烫伤禁用',
    ],
    sideEffects: ['偶见局部刺激'],
    interactions: ['无'],
    pregnancy: 'safe',
    lactation: 'safe',
    chronicCaution: [],
    storage: '密封，避光',
    warning: '⚠️ 大面积烫伤、深二度以上、面部/会阴部烫伤必须立即就医',
  },
  {
    id: 'nsaid_gel',
    category: '外用 NSAIDs（OTC）',
    genericName: '洛索洛芬贴片 / 双氯芬酸乳胶剂',
    brandExamples: ['扶他林', '洛索洛芬贴', '芬必得乳膏'],
    indication: '肌肉关节痛、扭伤、关节炎',
    adultDose: {
      perDose: '贴 1 片 / 涂 2-4 g',
      frequency: '每日 1-2 次',
      maxDaily: '贴片 ≤ 2 片/日；乳胶剂按需',
    },
    duration: '不超过 7 天',
    route: '外用，涂/贴患处',
    avoid: [
      '皮肤破损处禁用',
      '避免接触眼睛黏膜',
      '不可大面积长期使用',
    ],
    sideEffects: ['局部皮肤红疹、瘙痒'],
    interactions: ['外用吸收少，全身相互作用罕见'],
    pregnancy: 'avoid',
    pregnancyNote: '⚠️ 孕晚期禁用',
    lactation: 'caution',
    chronicCaution: ['活动期胃溃疡者慎用'],
    storage: '密封，避光',
  },
  // ─────────────────────────── 鼻腔 ───────────────────────────
  {
    id: 'nasal_saline',
    category: '鼻腔清洁（OTC）',
    genericName: '生理性海水鼻腔喷雾',
    brandExamples: ['诺斯清', '舒德尔玛', '生理盐水鼻喷'],
    indication: '鼻塞、鼻干、鼻炎、感冒',
    adultDose: {
      perDose: '每鼻孔 2-3 喷',
      frequency: '每日 3-5 次',
      maxDaily: '按需',
    },
    childrenDose: {
      ageRange: '婴幼儿可用（专用儿童型）',
      perDose: '每鼻孔 1-2 喷',
      frequency: '每日 3-5 次',
      maxDaily: '按需',
    },
    duration: '长期可使用',
    route: '鼻腔喷雾',
    avoid: ['无明显禁忌'],
    sideEffects: ['极少见'],
    interactions: ['无'],
    pregnancy: 'safe',
    lactation: 'safe',
    chronicCaution: [],
    storage: '室温',
  },
  {
    id: 'oxymetazoline',
    category: '鼻腔减充血（OTC）',
    genericName: '盐酸羟甲唑啉鼻喷剂',
    brandExamples: ['达芬霖', '诺通'],
    indication: '鼻塞（感冒、过敏性鼻炎）',
    adultDose: {
      perDose: '每鼻孔 1-2 喷',
      frequency: '每日 2 次（早、晚）',
      maxDaily: '≤ 4 次/单鼻孔',
    },
    childrenDose: {
      ageRange: '6 岁以上',
      perDose: '每鼻孔 1 喷',
      frequency: '每日 2 次',
      maxDaily: '≤ 2 次',
    },
    duration: '连续使用 ≤ 7 天（防药物性鼻炎）',
    route: '鼻腔喷雾',
    avoid: [
      '不可超过 7 天连续使用',
      '干燥性鼻炎、萎缩性鼻炎禁用',
      '高血压、冠心病、甲亢患者慎用',
    ],
    sideEffects: ['灼热感、干燥，长期使用反致鼻塞'],
    interactions: ['与 MAOI 合用可致血压升高'],
    pregnancy: 'caution',
    lactation: 'caution',
    chronicCaution: ['心血管疾病慎用'],
    storage: '密封',
    warning: '⚠️ 连续使用不超过 7 天，否则可能形成药物依赖性鼻炎',
  },
  // ─────────────────────────── 咽喉 ───────────────────────────
  {
    id: 'throat_lozenge',
    category: '咽喉含片（OTC）',
    genericName: '西瓜霜含片 / 银黄含片 / 薄荷喉片',
    brandExamples: ['桂林西瓜霜含片', '银黄含片', '金嗓子'],
    indication: '咽喉肿痛、咽干',
    adultDose: {
      perDose: '1-2 片',
      frequency: '每 1-2 小时含服 1 次',
      maxDaily: '按说明书',
    },
    childrenDose: {
      ageRange: '5 岁以上',
      perDose: '1 片',
      frequency: '每 2-3 小时',
      maxDaily: '按说明书',
    },
    duration: '不超过 7 天',
    route: '含服',
    avoid: ['忌辛辣刺激食物'],
    sideEffects: ['少见'],
    interactions: ['无'],
    pregnancy: 'safe',
    lactation: 'safe',
    chronicCaution: [],
    storage: '密封',
  },
];

// ─────────────────────────── 推荐算法 ───────────────────────────

export interface DrugRecommendation {
  drug: DrugEntry;
  appliesToYou: boolean; // 是否适用于当前用户
  appliesReason: string; // 适用/不适用的原因
}

export function recommendDrugs(
  partId: string,
  symptomIds: string[],
  profile: {
    isPregnant: boolean;
    isLactating: boolean;
    age?: string;
    chronic: string[];
    allergies: string[];
    currentMedications: string;
  },
): DrugRecommendation[] {
  const recommended = new Map<string, DrugRecommendation>();

  // 根据部位/症状匹配药物
  const matchMap: Record<string, string[]> = {
    head_ache: ['paracetamol', 'ibuprofen'],
    head_migraine: ['ibuprofen'],
    head_dizziness: [],
    tooth_ache: ['paracetamol', 'ibuprofen'],
    eye_red: [],
    eye_blur: [],
    ear_pain: ['paracetamol', 'ibuprofen'],
    ear_tinnitus: [],
    throat_ache: ['throat_lozenge', 'paracetamol'],
    throat_swell: [],
    nose_block: ['nasal_saline', 'oxymetazoline'],
    nose_bleed: [],

    neck_stiff: ['nsaid_gel'],
    shoulder_ache: ['nsaid_gel'],
    back_ache: ['nsaid_gel'],
    lumbar_sciatica: [],
    muscle_spasm: ['nsaid_gel'],
    joint_swell: [],
    body_ache: ['paracetamol', 'ibuprofen'],

    cough_dry: ['dextromethorphan'],
    cough_phlegm: ['ambroxol'],
    cough_blood: [],
    chest_tight: [],
    chest_pain: [],
    wheeze: [],
    sore_throat_cough: ['paracetamol', 'throat_lozenge'],

    stomach_ache: ['antacid', 'omeprazole'],
    abdominal_pain: [],
    acid_reflux: ['antacid', 'omeprazole'],
    nausea: [],
    vomit_blood: [],
    diarrhea: ['loperamide', 'ors'],
    constipation: [],
    blood_stool: [],
    bloating: ['antacid'],

    rash_local: ['calamine'],
    rash_whole: [],
    itch: ['calamine', 'loratadine', 'cetirizine'],
    hives: ['loratadine', 'cetirizine', 'calamine'],
    burn_mild: ['burn_ointment'],
    insect_bite: ['calamine'],
    eczema: ['calamine'],
    swollen_face: [],

    knee_ache: ['nsaid_gel', 'ibuprofen'],
    wrist_ache: ['nsaid_gel'],
    ankle_sprain: ['nsaid_gel'],
    minor_trauma: ['nsaid_gel'],
    deform_swell: [],
    numbness: [],

    urine_freq: [],
    urine_pain: [],
    urine_blood: [],
    menstrual_ache: ['ibuprofen', 'paracetamol'],
    vaginal_itch: [],
    vaginal_discharge: [],

    fever_mild: ['paracetamol', 'ibuprofen'],
    fever_mid: ['paracetamol', 'ibuprofen'],
    fever_high: [],
    fever_continue: [],
    fatigue: [],
    insomnia: [],
    allergy_sneeze: ['loratadine', 'cetirizine'],
    weight_loss: [],
  };

  const wantIds = new Set<string>();
  for (const s of symptomIds) {
    const matched = matchMap[s] ?? [];
    matched.forEach((id) => wantIds.add(id));
  }

  // 输出推荐
  for (const id of wantIds) {
    const drug = DRUGS.find((d) => d.id === id);
    if (!drug) continue;
    if (recommended.has(id)) continue;

    let applies = true;
    const reasons: string[] = [];

    // 孕期/哺乳期
    if (profile.isPregnant || profile.isLactating) {
      const flag = profile.isPregnant ? drug.pregnancy : drug.lactation;
      if (flag === 'avoid') {
        applies = false;
        reasons.push(
          profile.isPregnant
            ? '⚠️ 孕妇禁用'
            : '⚠️ 哺乳期禁用',
        );
      } else if (flag === 'caution' || flag === 'consult') {
        reasons.push(
          profile.isPregnant
            ? '⚠️ 孕妇慎用，用前咨询医生'
            : '⚠️ 哺乳期慎用，用前咨询医生',
        );
      }
    }

    // 儿童
    if (profile.age) {
      const age = parseInt(profile.age, 10);
      if (!isNaN(age) && age < 18 && !drug.childrenDose) {
        applies = false;
        reasons.push('⚠️ 儿童剂型未明，请就医');
      }
    }

    // 过敏
    for (const a of profile.allergies) {
      if (
        drug.brandExamples.some((b) => b.includes(a)) ||
        drug.genericName.includes(a) ||
        drug.category.includes(a) ||
        a.includes(drug.genericName)
      ) {
        applies = false;
        reasons.push(`⚠️ 您对 ${a} 过敏`);
      }
    }

    // 慢性病
    for (const c of profile.chronic) {
      for (const caution of drug.chronicCaution) {
        if (caution.includes(c) || c.includes(caution.slice(0, 2))) {
          reasons.push(`⚠️ ${c}患者注意：${caution}`);
        }
      }
    }

    if (applies) {
      reasons.unshift('✅ 当前可参考使用');
    }

    recommended.set(id, {
      drug,
      appliesToYou: applies,
      appliesReason: reasons.join('；'),
    });
  }

  return Array.from(recommended.values());
}
