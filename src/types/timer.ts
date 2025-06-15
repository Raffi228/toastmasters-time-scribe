
export interface TimerRules {
  green: number;
  yellow: number;
  red?: number;
  white?: number;
}

export type AgendaType = 'speech' | 'longEval' | 'shortEval' | 'shareHost' | 'other';

export interface TimerConfig {
  type: AgendaType;
  duration: number;
  customRules?: TimerRules;
}

export const PRESET_RULES: Record<AgendaType, TimerRules> = {
  speech: { green: 120, yellow: 60, red: 0, white: -30 }, // 备稿演讲：绿剩2'，黄剩1'
  longEval: { green: 120, yellow: 60, red: 0, white: -30 }, // 长评估：同备稿
  shortEval: { green: 60, yellow: 30, red: 0, white: -30 }, // 即兴/短评估：绿剩1'，黄剩30"
  shareHost: { green: 300, yellow: 120, red: 0, white: -30 }, // 分享/主持：绿剩5'，黄剩2'
  other: { green: 0, yellow: 30, red: 0, white: -30 } // 其他：绿剩0（合格），黄剩30"
};

export const getTypeFromTitle = (title: string, duration: number): AgendaType => {
  const titleLower = title.toLowerCase();
  const durationMinutes = duration / 60;
  
  // 更精确的类型识别
  
  // 备稿演讲 - 明确包含"备稿"关键词或符合备稿时长特征
  if (titleLower.includes('备稿') || 
      titleLower.includes('prepared speech') ||
      (titleLower.includes('技术出海') || titleLower.includes('民主的背后') || titleLower.includes('存钱的意义'))) {
    return 'speech';
  }
  
  // 即兴演讲 - 优先识别即兴，包括即兴主题
  if (titleLower.includes('即兴') || 
      titleLower.includes('table topics') || 
      titleLower.includes('impromptu') ||
      titleLower.includes('桌话题') ||
      titleLower.includes('临时发言') ||
      titleLower.includes('tiktok refugee') ||
      (titleLower.includes('即兴主题') || titleLower.includes('即兴演讲环节'))) {
    return 'shortEval';
  }
  
  // 评估环节 - 根据时长和关键词区分长短评估
  if (titleLower.includes('评估') || 
      titleLower.includes('点评') || 
      titleLower.includes('evaluation')) {
    // 即兴评估通常较长
    if (titleLower.includes('即兴评估')) {
      return 'longEval';
    }
    // 个体评估通常较短
    if (titleLower.includes('个体评估')) {
      return 'shortEval';
    }
    // 总评报告通常较长
    if (titleLower.includes('总评')) {
      return 'longEval';
    }
    return durationMinutes > 3 ? 'longEval' : 'shortEval';
  }
  
  // 官员报告
  if (titleLower.includes('时间官') || 
      titleLower.includes('语法官') || 
      titleLower.includes('哼哈官') ||
      titleLower.includes('报告')) {
    return 'shortEval';
  }
  
  // 分享/主持类 - 较长的主持或分享环节
  if (titleLower.includes('分享') || 
      titleLower.includes('主持') || 
      titleLower.includes('介绍') || 
      titleLower.includes('开场') ||
      titleLower.includes('致辞') ||
      titleLower.includes('暖场') ||
      titleLower.includes('科技微分享') ||
      titleLower.includes('host') ||
      titleLower.includes('sharing') ||
      titleLower.includes('presentation')) {
    return 'shareHost';
  }
  
  // 演讲类 - 包含演讲但不是备稿的
  if (titleLower.includes('演讲') || titleLower.includes('speech')) {
    // 根据时长判断是否为备稿演讲
    if (durationMinutes >= 5 && durationMinutes <= 8) {
      return 'speech'; // 5-8分钟通常是备稿演讲
    }
    return 'shortEval'; // 其他时长的演讲归为即兴类
  }
  
  // 明确的休息或非计时环节
  if (titleLower.includes('休息') || 
      titleLower.includes('break') || 
      titleLower.includes('中场') ||
      titleLower.includes('来宾介绍') || 
      titleLower.includes('合影') ||
      titleLower.includes('颁奖') || 
      titleLower.includes('投票') ||
      titleLower.includes('茶歇') || 
      titleLower.includes('networking') ||
      titleLower.includes('入会介绍') ||
      titleLower.includes('通告环节') ||
      titleLower.includes('闭会')) {
    return 'other';
  }
  
  // 根据时长推测类型
  if (durationMinutes >= 5 && durationMinutes <= 8) {
    return 'speech'; // 5-8分钟可能是备稿演讲
  } else if (durationMinutes >= 15) {
    return 'shareHost'; // 15分钟以上可能是分享或主持
  } else if (durationMinutes <= 3) {
    return 'shortEval'; // 3分钟以下通常是短评估或即兴
  }
  
  // 默认为其他
  return 'other';
};
