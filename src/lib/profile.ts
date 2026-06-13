// 个人档案（健康小档案）管理
// ⚠️ 隐私原则：纯 localStorage 存储，不上传服务器
// 用户可随时查看、修改、清除

import type { Step3Data } from '@/components/consult/step3-detail';

export interface UserProfile {
  // 基础信息
  nickname: string;
  age: string; // 字符串便于存留空
  gender: '' | 'male' | 'female';

  // 长期健康状况
  chronicDiseases: string[]; // 高血压/糖尿病/冠心病/哮喘/慢阻肺/胃溃疡/...
  allergies: string[]; // 青霉素/磺胺/海鲜/花粉/...
  currentMedications: string; // 长期用药（自由文本）

  // 特殊生理状态
  isPregnant: boolean;
  isLactating: boolean;
  hasChildUnder12: boolean; // 家里有 12 岁以下儿童（关心孩子）
  hasElder: boolean; // 家里有 65 岁以上老人

  // 偏好
  defaultPopulation: string; // 每次进入步骤 3 的默认人群

  updatedAt: string; // ISO 时间戳
}

export const DEFAULT_PROFILE: UserProfile = {
  nickname: '',
  age: '',
  gender: '',
  chronicDiseases: [],
  allergies: [],
  currentMedications: '',
  isPregnant: false,
  isLactating: false,
  hasChildUnder12: false,
  hasElder: false,
  defaultPopulation: 'general',
  updatedAt: new Date().toISOString(),
};

// 常见慢性病（用于下拉选择）
export const CHRONIC_OPTIONS = [
  '高血压',
  '糖尿病',
  '冠心病/心绞痛',
  '脑卒中/脑血管病',
  '哮喘',
  '慢性支气管炎/慢阻肺',
  '胃溃疡/胃食管反流',
  '慢性肝炎/脂肪肝',
  '慢性肾病',
  '甲状腺疾病',
  '类风湿/关节炎',
  '骨质疏松',
  '肿瘤/癌症',
  '抑郁症/焦虑症',
];

// 常见过敏（用于下拉选择）
export const ALLERGY_OPTIONS = [
  '青霉素类抗生素',
  '磺胺类药物',
  '阿司匹林',
  '布洛芬',
  '海鲜',
  '坚果/花生',
  '芒果/菠萝',
  '蛋类',
  '乳制品',
  '花粉',
  '尘螨',
  '宠物毛发',
  '乳胶',
];

const STORAGE_KEY = 'triage_user_profile_v1';

export function loadProfile(): UserProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  const next: UserProfile = { ...profile, updatedAt: new Date().toISOString() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (e) {
    console.error('[profile] 保存失败', e);
  }
}

export function clearProfile(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('[profile] 清除失败', e);
  }
}

// 根据 profile 推导 step3 的默认值
export function applyProfileToStep3(profile: UserProfile): Partial<Step3Data> {
  // 推导人群类型
  let population = profile.defaultPopulation;
  if (population === 'general') {
    // 根据生理状态自动推荐人群
    if (profile.isPregnant || profile.isLactating) population = 'pregnant';
    else if (profile.hasChildUnder12) population = 'children';
    else if (profile.hasElder) population = 'elder';
    else if (profile.chronicDiseases.length > 0) population = 'chronic';
  }

  // 拼接既往病史文本
  const history = [
    profile.chronicDiseases.length > 0 ? `慢性病：${profile.chronicDiseases.join('、')}` : '',
    profile.allergies.length > 0 ? `过敏史：${profile.allergies.join('、')}` : '',
    profile.currentMedications ? `长期用药：${profile.currentMedications}` : '',
    profile.age ? `年龄：${profile.age}` : '',
    profile.gender ? `性别：${profile.gender === 'male' ? '男' : '女'}` : '',
  ]
    .filter(Boolean)
    .join('；');

  return {
    population,
    medicalHistory: history,
  };
}
