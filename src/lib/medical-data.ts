// 居家轻症问诊 - 部位大类与症状库
// 数据来源：依据《家庭医学常识》《中华医学会全科分会》常见轻症分类整理
// 仅供轻症引导参考，不可替代医生面诊

export interface BodyPart {
  id: string;
  name: string;
  shortName: string;
  emoji: string;
  description: string;
  symptoms: SymptomItem[];
}

export interface SymptomItem {
  id: string;
  name: string;
  redFlag: boolean; // 是否属于"禁止居家"的高危关键词
  description?: string;
}

// 8 大身体部位 / 疾病大类
export const BODY_PARTS: BodyPart[] = [
  {
    id: 'head',
    name: '头部五官类',
    shortName: '头部',
    emoji: '🧠',
    description: '头痛、牙痛、眼睛、耳朵、咽喉等头部与五官不适',
    symptoms: [
      { id: 'head_ache', name: '头痛', redFlag: false },
      { id: 'head_migraine', name: '偏头痛（单侧搏动性）', redFlag: false },
      { id: 'head_dizziness', name: '头晕/眩晕', redFlag: false },
      { id: 'tooth_ache', name: '牙痛', redFlag: false },
      { id: 'eye_red', name: '眼睛红/痒/分泌物多', redFlag: false },
      { id: 'eye_blur', name: '视力模糊/突然下降', redFlag: true },
      { id: 'ear_pain', name: '耳痛', redFlag: false },
      { id: 'ear_tinnitus', name: '耳鸣', redFlag: false },
      { id: 'throat_ache', name: '咽喉痛/吞咽痛', redFlag: false },
      { id: 'throat_swell', name: '扁桃体肿大化脓', redFlag: true },
      { id: 'nose_block', name: '鼻塞/流涕', redFlag: false },
      { id: 'nose_bleed', name: '鼻出血不止', redFlag: true },
    ],
  },
  {
    id: 'neck_back',
    name: '颈肩腰背类',
    shortName: '颈肩腰背',
    emoji: '🦴',
    description: '颈椎、肩部、腰部、背部肌肉骨骼不适',
    symptoms: [
      { id: 'neck_stiff', name: '颈部僵硬/酸痛', redFlag: false },
      { id: 'shoulder_ache', name: '肩部酸痛', redFlag: false },
      { id: 'back_ache', name: '腰背酸痛', redFlag: false },
      { id: 'lumbar_sciatica', name: '腰腿放射性痛', redFlag: true },
      { id: 'muscle_spasm', name: '肌肉抽筋/痉挛', redFlag: false },
      { id: 'joint_swell', name: '关节红肿热痛', redFlag: true },
      { id: 'body_ache', name: '全身肌肉酸痛', redFlag: false },
    ],
  },
  {
    id: 'chest_lung',
    name: '胸肺呼吸类',
    shortName: '胸肺呼吸',
    emoji: '🫁',
    description: '咳嗽、咳痰、胸闷、气短等呼吸系统不适',
    symptoms: [
      { id: 'cough_dry', name: '干咳无痰', redFlag: false },
      { id: 'cough_phlegm', name: '咳嗽有痰', redFlag: false },
      { id: 'cough_blood', name: '咳中带血', redFlag: true },
      { id: 'chest_tight', name: '胸闷/气短', redFlag: true },
      { id: 'chest_pain', name: '胸痛', redFlag: true },
      { id: 'wheeze', name: '喘鸣/呼吸有嘶嘶声', redFlag: true },
      { id: 'sore_throat_cough', name: '感冒伴咳嗽', redFlag: false },
    ],
  },
  {
    id: 'stomach',
    name: '胃肠消化类',
    shortName: '胃肠',
    emoji: '🥗',
    description: '胃痛、腹胀、腹泻、便秘等消化系统不适',
    symptoms: [
      { id: 'stomach_ache', name: '胃痛/上腹痛', redFlag: false },
      { id: 'abdominal_pain', name: '腹痛（肚脐周围）', redFlag: false },
      { id: 'acid_reflux', name: '反酸/烧心', redFlag: false },
      { id: 'nausea', name: '恶心/呕吐', redFlag: false },
      { id: 'vomit_blood', name: '呕血/咖啡样呕吐物', redFlag: true },
      { id: 'diarrhea', name: '腹泻（水样便）', redFlag: false },
      { id: 'constipation', name: '便秘', redFlag: false },
      { id: 'blood_stool', name: '便血/黑便', redFlag: true },
      { id: 'bloating', name: '腹胀/嗳气', redFlag: false },
    ],
  },
  {
    id: 'skin',
    name: '皮肤外露类',
    shortName: '皮肤',
    emoji: '🩹',
    description: '皮疹、瘙痒、过敏、蚊虫叮咬、轻度烫伤等',
    symptoms: [
      { id: 'rash_local', name: '局部皮疹/红疹', redFlag: false },
      { id: 'rash_whole', name: '全身大面积皮疹', redFlag: true },
      { id: 'itch', name: '皮肤瘙痒', redFlag: false },
      { id: 'hives', name: '风团/荨麻疹', redFlag: false },
      { id: 'burn_mild', name: '轻度烫伤（一度/浅二度）', redFlag: false },
      { id: 'insect_bite', name: '蚊虫叮咬', redFlag: false },
      { id: 'eczema', name: '湿疹反复', redFlag: false },
      { id: 'swollen_face', name: '面部/口唇肿胀', redFlag: true },
    ],
  },
  {
    id: 'joint_limb',
    name: '关节四肢类',
    shortName: '关节四肢',
    emoji: '🦵',
    description: '关节痛、肌肉痛、扭伤、跌打损伤等',
    symptoms: [
      { id: 'knee_ache', name: '膝关节痛', redFlag: false },
      { id: 'wrist_ache', name: '手腕/手肘痛', redFlag: false },
      { id: 'ankle_sprain', name: '脚踝扭伤', redFlag: false },
      { id: 'minor_trauma', name: '轻度撞伤/擦伤', redFlag: false },
      { id: 'deform_swell', name: '肢体明显变形/肿胀', redFlag: true },
      { id: 'numbness', name: '手脚麻木', redFlag: false },
    ],
  },
  {
    id: 'urinary',
    name: '泌尿生殖类',
    shortName: '泌尿',
    emoji: '💧',
    description: '小便异常、妇科常见轻症等',
    symptoms: [
      { id: 'urine_freq', name: '尿频/尿急', redFlag: false },
      { id: 'urine_pain', name: '排尿疼痛/灼热', redFlag: false },
      { id: 'urine_blood', name: '尿血/茶色尿', redFlag: true },
      { id: 'menstrual_ache', name: '痛经', redFlag: false },
      { id: 'vaginal_itch', name: '外阴瘙痒', redFlag: false },
      { id: 'vaginal_discharge', name: '白带异常（量大/异味）', redFlag: false },
    ],
  },
  {
    id: 'systemic',
    name: '全身症状类',
    shortName: '全身',
    emoji: '🌡️',
    description: '发热、乏力、失眠、过敏等全身性不适',
    symptoms: [
      { id: 'fever_mild', name: '低热（37.3-38°C）', redFlag: false },
      { id: 'fever_mid', name: '中等发热（38.1-39°C）', redFlag: false },
      { id: 'fever_high', name: '高热（≥39.1°C）', redFlag: true },
      { id: 'fever_continue', name: '持续发热超过 3 天', redFlag: true },
      { id: 'fatigue', name: '疲倦乏力', redFlag: false },
      { id: 'insomnia', name: '入睡困难/失眠', redFlag: false },
      { id: 'allergy_sneeze', name: '过敏性打喷嚏', redFlag: false },
      { id: 'weight_loss', name: '近期不明原因体重下降', redFlag: true },
    ],
  },
];

// 6 项关键信息
export interface DetailInfo {
  duration: string; // 发病时长
  durationHours: number; // 用于规则判断
  painLevel: number; // 痛感 0-10
  trigger: string; // 诱发原因
  accompany: string[]; // 伴随症状（多选）
  medicalHistory: string; // 既往病史/用药
  population: string; // 特殊人群
}

export const DURATION_OPTIONS = [
  { value: 'lt_2h', label: '2 小时内', hours: 1, hint: '刚刚出现' },
  { value: '2_24h', label: '2-24 小时内', hours: 12, hint: '今天开始' },
  { value: '1_3d', label: '1-3 天', hours: 48, hint: '近几天' },
  { value: '4_7d', label: '4-7 天', hours: 120, hint: '近一周' },
  { value: 'gt_7d', label: '7 天以上', hours: 240, hint: '超过一周' },
];

export const TRIGGER_OPTIONS = [
  { value: 'unknown', label: '原因不明' },
  { value: 'cold', label: '受凉/淋雨' },
  { value: 'diet', label: '饮食不当（辛辣/生冷/不洁）' },
  { value: 'overwork', label: '劳累/熬夜' },
  { value: 'mood', label: '情绪波动/压力' },
  { value: 'sports', label: '运动/体力活动' },
  { value: 'trauma', label: '外伤/扭伤' },
  { value: 'allergy', label: '接触过敏原（食物/花粉/宠物）' },
  { value: 'infection', label: '周围有人感冒/感染' },
];

export const ACCOMPANY_OPTIONS = [
  '发热',
  '畏寒',
  '出汗',
  '恶心/呕吐',
  '腹泻',
  '头晕',
  '心慌',
  '气短',
  '食欲下降',
  '睡眠差',
  '无明显伴随',
];

export const POPULATION_OPTIONS = [
  { value: 'general', label: '普通成人', risk: false },
  { value: 'pregnant', label: '孕妇/哺乳期', risk: true },
  { value: 'children', label: '12 岁以下儿童', risk: true },
  { value: 'elder', label: '65 岁以上老人', risk: true },
  { value: 'chronic', label: '慢性病患者（糖尿病/高血压/心脏病等）', risk: true },
];
