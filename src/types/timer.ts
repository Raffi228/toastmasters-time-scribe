
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
  
  // 备稿演讲
  if (titleLower.includes('备稿') || titleLower.includes('演讲')) {
    return 'speech';
  }
  
  // 长评估（评估且时长>3分钟）
  if ((titleLower.includes('评估') || titleLower.includes('点评')) && durationMinutes > 3) {
    return 'longEval';
  }
  
  // 即兴/短评估
  if (titleLower.includes('即兴') || titleLower.includes('table topics') || 
      (titleLower.includes('评估') && durationMinutes <= 3)) {
    return 'shortEval';
  }
  
  // 分享/主持
  if (titleLower.includes('分享') || titleLower.includes('主持') || 
      titleLower.includes('介绍') || titleLower.includes('开场')) {
    return 'shareHost';
  }
  
  // 其他
  return 'other';
};
