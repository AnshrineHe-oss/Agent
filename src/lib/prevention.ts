// 长期预防建议（针对复发性 / 慢性倾向场景）
// 输入：部位 + 症状 + 慢性病 + 人群 + 是否复发性 + 复发频次
// 输出：长期生活建议 / 触发因素规避 / 复诊标准

export interface PreventionTips {
  /** 板块标题 */
  title: string;
  /** 复发频次描述 */
  recurrenceLabel: string;
  /** 长期生活建议（3-5 条） */
  longTermTips: string[];
  /** 每日习惯建议 */
  dailyHabits: string[];
  /** 触发因素规避 */
  triggerAvoidance: string[];
  /** 复诊 / 检查建议 */
  followUpCheck: string[];
  /** 提示横幅文案 */
  bannerHint: string;
}

interface PreventionInput {
  partId: string;
  symptomIds: string[];
  chronicDiseases: string[];
  population: string;
  recurrence: { isRecurrence: boolean; count: number; windowDays: number };
}

/**
 * 生成长期预防建议
 */
export function buildPreventionTips(input: PreventionInput): PreventionTips {
  const { partId, symptomIds, chronicDiseases, population, recurrence } = input;
  const has = (id: string) => symptomIds.includes(id);
  const isChild = population === 'children' || population === 'infant';
  const isElder = population === 'elder';
  const isPregnant = population === 'pregnant';
  const chronic = chronicDiseases.map((s) => s.trim()).filter(Boolean);

  const recurrenceLabel = recurrence.isRecurrence
    ? `近 ${recurrence.windowDays} 天内已出现 ${recurrence.count} 次类似情况`
    : '本次为近期首次出现';

  const tips = pickTips(partId, symptomIds, has);
  const habits = pickDailyHabits(partId, has, isChild, isElder, isPregnant);
  const triggers = pickTriggers(partId, has, chronic);
  const followUp = pickFollowUp(partId, has, chronic, population, recurrence);

  // 拼接 banner
  let bannerHint: string;
  if (recurrence.isRecurrence && recurrence.count >= 2) {
    bannerHint =
      '⚠️ 本次为复发性情况，建议您认真参考以下"长期预防"建议，必要时前往医院完善检查。';
  } else if (chronic.length > 0) {
    bannerHint = '💡 您有相关慢性基础病，长期管理是减少发作的关键。';
  } else {
    bannerHint = '📌 良好的生活方式可显著降低复发风险。';
  }

  return {
    title: recurrence.isRecurrence ? '🔁 长期预防与复发管理' : '🛡️ 长期预防建议',
    recurrenceLabel,
    longTermTips: tips,
    dailyHabits: habits,
    triggerAvoidance: triggers,
    followUpCheck: followUp,
    bannerHint,
  };
}

function pickTips(partId: string, symptomIds: string[], has: (id: string) => string[] | boolean): string[] {
  const all: string[] = [];
  switch (partId) {
    case 'head': {
      all.push('规律作息，每天 7-8 小时睡眠，避免熬夜诱发偏头痛');
      all.push('工作用电脑 1 小时休息 5-10 分钟，远眺放松眼周肌群');
      all.push('秋冬季节外出佩戴口罩，避免冷空气直接刺激鼻咽');
      if (symptomIds.includes('head_ache') || symptomIds.includes('migraine')) {
        all.push('建立头痛日记：记录时间、强度、饮食与情绪，便于医生评估');
      }
      if (symptomIds.includes('tooth_ache')) {
        all.push('每年 1-2 次口腔检查，及时处理龋齿、牙结石');
      }
      if (symptomIds.includes('throat_ache') || symptomIds.includes('pharyngitis')) {
        all.push('少食辛辣、过烫、过硬食物，戒烟限酒');
      }
      break;
    }
    case 'neck_back': {
      all.push('避免久坐，每 45 分钟起身活动 3-5 分钟');
      all.push('睡眠时颈椎枕高度适宜，腰部加小枕支撑生理曲度');
      all.push('运动前充分热身，避免突然发力');
      all.push('控制体重，体重指数（BMI）保持在 18.5-23.9');
      break;
    }
    case 'chest_lung': {
      all.push('流感季接种流感疫苗，每年 1 剂');
      all.push('雾霾天减少户外，外出佩戴 N95/KN95 口罩');
      all.push('戒烟是预防慢性咳嗽最有效的方式');
      all.push('保持室内湿度 40-60%，避免干燥诱发咳嗽');
      if (symptomIds.includes('wheeze') || symptomIds.includes('asthma')) {
        all.push('家中常备支气管扩张剂，避免接触花粉、宠物毛、冷空气');
      }
      break;
    }
    case 'stomach': {
      all.push('三餐规律，避免暴饮暴食，睡前 2 小时不进食');
      all.push('少食辛辣、油炸、腌制、酒精、咖啡、浓茶');
      all.push('保持情绪稳定，情绪压力是胃肠不适重要诱因');
      all.push('慎用阿司匹林、布洛芬等伤胃药物');
      if (symptomIds.includes('acid_reflux')) {
        all.push('睡姿可适当抬高床头 15-20cm，减少夜间反流');
      }
      if (symptomIds.includes('constipation') || symptomIds.includes('diarrhea')) {
        all.push('每日饮水 1500-2000ml，膳食纤维摄入 25-30g');
      }
      break;
    }
    case 'skin': {
      all.push('保持皮肤清洁与保湿，沐浴后 3 分钟内涂抹润肤霜');
      all.push('洗衣液、沐浴露选用无香料低敏配方');
      all.push('新化妆品先小面积试用 24 小时再大面积使用');
      if (symptomIds.includes('hives') || symptomIds.includes('itch')) {
        all.push('记录每次发作前的饮食、接触物，建立个人过敏档案');
      }
      break;
    }
    case 'joint_limb': {
      all.push('每周 3-5 次中等强度有氧运动（快走、游泳、骑车）');
      all.push('运动前后各拉伸 10 分钟，强化关节周围肌群');
      all.push('控制体重，减少下肢关节负担');
      all.push('选择缓冲好的运动鞋，避免过硬场地跑步');
      if (symptomIds.includes('sprain')) {
        all.push('运动易扭伤部位可佩戴护具，强度循序渐进');
      }
      break;
    }
    case 'urinary': {
      all.push('每日饮水 1500-2000ml，不憋尿');
      all.push('性生活后及时排尿，减少泌尿系感染机会');
      all.push('女性便后从前向后擦拭，避免肠道细菌上行');
      break;
    }
    case 'systemic': {
      all.push('每年 1 次全身体检：血常规、肝肾功能、血糖血脂');
      all.push('保持规律作息，11 点前入睡');
      all.push('每周中等强度运动 150 分钟以上');
      if (symptomIds.includes('fever_mild') || symptomIds.includes('fever_mid')) {
        all.push('流感季前 1 个月接种流感疫苗');
      }
      if (symptomIds.includes('insomnia')) {
        all.push('建立睡前仪式：固定时间上床，睡前 1 小时远离手机');
      }
      break;
    }
  }
  return all.length > 0 ? all.slice(0, 6) : ['保持健康生活方式，规律作息与饮食'];
}

function pickDailyHabits(
  partId: string,
  _has: (id: string) => string[] | boolean,
  isChild: boolean,
  isElder: boolean,
  isPregnant: boolean,
): string[] {
  const base: string[] = ['每日 7-8 小时高质量睡眠', '晨起饮温水 200ml', '每周 3-5 次 30 分钟有氧运动'];
  if (isChild) return ['保证 9-10 小时睡眠', '每日 1 杯牛奶或等量奶制品', '户外活动 1-2 小时（防近视）'];
  if (isElder) return ['晨起慢起 3 步（床上坐 30 秒→床边坐 30 秒→站 30 秒）', '每日 500g 蔬菜 + 200g 水果', '保持适度散步与关节活动'];
  if (isPregnant) return ['左侧卧位睡眠为佳', '每日叶酸 + 钙片补充', '每日步数 6000-8000 步'];
  return base;
}

function pickTriggers(partId: string, _has: (id: string) => string[] | boolean, chronic: string[]): string[] {
  const general = ['戒烟限酒', '避免熬夜与情绪激动', '饮食少油少盐少糖'];
  const partMap: Record<string, string[]> = {
    head: ['避免强光、噪声、长时间用眼', '少食奶酪、巧克力、红酒（偏头痛常见诱因）'],
    neck_back: ['避免长时间低头看手机', '避免弯腰提重物'],
    chest_lung: ['雾霾天减少外出', '远离二手烟、油烟环境'],
    stomach: ['忌空腹喝咖啡浓茶', '忌暴饮暴食与夜宵', '忌生冷与隔夜未加热的食物'],
    skin: ['新护肤品先小面积试用', '避免抓挠，皮肤破溃易感染'],
    joint_limb: ['避免长时间下蹲与跪姿', '运动前充分热身'],
    urinary: ['性生活后及时排尿', '避免久坐憋尿'],
    systemic: ['远离感染源（人群密集场所戴口罩）', '保持情绪平稳'],
  };
  const chronicMap: string[] = [];
  if (chronic.some((c) => c.includes('血压') || c.includes('高血压'))) {
    chronicMap.push('低盐饮食（<5g/日），避免情绪激动与剧烈运动');
  }
  if (chronic.some((c) => c.includes('糖尿病'))) {
    chronicMap.push('控制主食量（每日 250-300g），少食多餐');
  }
  if (chronic.some((c) => c.includes('胃'))) {
    chronicMap.push('避免空腹服药与刺激性食物');
  }
  if (chronic.some((c) => c.includes('哮喘'))) {
    chronicMap.push('远离过敏原（花粉、尘螨、动物皮屑）');
  }
  return [...(partMap[partId] ?? []), ...chronicMap, ...general].slice(0, 6);
}

function pickFollowUp(
  partId: string,
  _has: (id: string) => string[] | boolean,
  chronic: string[],
  population: string,
  recurrence: PreventionInput['recurrence'],
): string[] {
  const items: string[] = [];
  if (recurrence.isRecurrence && recurrence.count >= 3) {
    items.push('一个月内复发 3 次以上，建议前往医院相关专科就诊');
  }
  if (chronic.length > 0) {
    items.push('每 3-6 个月复诊评估慢性病控制情况');
  }
  if (population === 'children') {
    items.push('儿童症状反复或加重，需前往儿科就诊评估');
  }
  if (population === 'elder') {
    items.push('老人症状变化需更及时就医，建议家人陪同');
  }
  if (partId === 'chest_lung' && chronic.some((c) => c.includes('哮喘'))) {
    items.push('哮喘患者建议每年 1 次肺功能检查');
  }
  if (partId === 'stomach' && chronic.some((c) => c.includes('胃'))) {
    items.push('慢性胃病患者建议每年 1 次胃镜');
  }
  if (items.length === 0) {
    items.push('本次症状 1 周内未明显缓解或加重，请前往医院就诊');
    items.push('每年 1 次常规体检可有效预防多种疾病');
  }
  return items;
}
