
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
  
  // 备稿演讲 - 明确包含"备稿"关键词
  if (titleLower.includes('备稿') || titleLower.includes('prepared speech')) {
    return 'speech';
  }
  
  // 即兴演讲 - 优先识别即兴
  if (titleLower.includes('即兴') || 
      titleLower.includes('table topics') || 
      titleLower.includes('impromptu') ||
      titleLower.includes('桌话题') ||
      titleLower.includes('临时发言')) {
    return 'shortEval';
  }
  
  // 评估环节 - 根据时长区分长短评估
  if (titleLower.includes('评估') || 
      titleLower.includes('点评') || 
      titleLower.includes('evaluation')) {
    return durationMinutes > 3 ? 'longEval' : 'shortEval';
  }
  
  // 分享/主持类 - 较长的主持或分享环节
  if (titleLower.includes('分享') || 
      titleLower.includes('主持') || 
      titleLower.includes('介绍') || 
      titleLower.includes('开场') ||
      titleLower.includes('致辞') ||
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
