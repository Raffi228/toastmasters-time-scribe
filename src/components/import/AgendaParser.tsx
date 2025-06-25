
import { getTypeFromTitle, type AgendaType } from '@/types/timer';

export interface ParsedAgendaItem {
  title: string;
  duration: number;
  type: 'speech' | 'evaluation' | 'table-topics' | 'break';
  speaker?: string;
  scheduledTime?: string; // 新增：计划开始时间
}

// 将计时器类型映射到议程类型
const mapTimerTypeToAgendaType = (timerType: AgendaType): 'speech' | 'evaluation' | 'table-topics' | 'break' => {
  switch (timerType) {
    case 'speech': return 'speech';
    case 'longEval': 
    case 'shortEval': return 'evaluation';
    case 'shareHost': return 'speech';
    case 'other': return 'break';
    default: return 'break';
  }
};

// 解析时间字符串（支持 HH:MM 和 HH:MM:SS 格式）
const parseTimeString = (timeStr: string): string | undefined => {
  if (!timeStr) return undefined;
  
  // 匹配各种时间格式
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (timeMatch) {
    const hours = timeMatch[1].padStart(2, '0');
    const minutes = timeMatch[2];
    const seconds = timeMatch[3] || '00';
    return `${hours}:${minutes}:${seconds}`;
  }
  
  return undefined;
};

export const parseAgendaText = (text: string): ParsedAgendaItem[] => {
  if (!text.trim()) return [];
  
  const lines = text.split('\n').filter(line => line.trim());
  const items: ParsedAgendaItem[] = [];
  
  // 跳过标题行（如果存在）
  const dataLines = lines.filter(line => {
    const lower = line.toLowerCase();
    return !lower.includes('时间') || !lower.includes('项目') || line.includes('\t') || line.includes('	');
  });
  
  for (const line of dataLines) {
    const parts = line.split(/\t|	/).map(part => part.trim()).filter(part => part);
    
    if (parts.length >= 3) {
      const timeStr = parts[0] || '';
      const title = parts[1] || '';
      const durationStr = parts[2] || '';
      const speaker = parts[3] || '';
      
      // 解析计划时间
      const scheduledTime = parseTimeString(timeStr);
      
      // 解析时长
      let duration = 300; // 默认5分钟
      const durationMatch = durationStr.match(/(\d+)[-'′]?(\d+)?/);
      if (durationMatch) {
        const mins = parseInt(durationMatch[1]);
        duration = mins * 60;
        if (durationMatch[2]) {
          const maxMins = parseInt(durationMatch[2]);
          duration = Math.round((mins + maxMins) / 2) * 60;
        }
      }
      
      // 使用 getTypeFromTitle 智能识别类型
      const detectedType = getTypeFromTitle(title, duration);
      const agendaType = mapTimerTypeToAgendaType(detectedType);
      
      items.push({
        title: title.trim(),
        duration,
        type: agendaType,
        speaker: speaker.trim() || undefined,
        scheduledTime
      });
    }
  }
  
  return items;
};

export const validateAgendaItems = (items: ParsedAgendaItem[]): string[] => {
  const errors: string[] = [];
  
  items.forEach((item, index) => {
    if (!item.title) {
      errors.push(`第 ${index + 1} 项缺少标题`);
    }
    if (item.duration <= 0) {
      errors.push(`第 ${index + 1} 项时长无效`);
    }
  });
  
  return errors;
};
