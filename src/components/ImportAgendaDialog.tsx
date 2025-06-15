
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getTypeFromTitle } from '@/types/timer';

interface AgendaItem {
  id: string;
  title: string;
  duration: number;
  type: 'speech' | 'evaluation' | 'table-topics' | 'break';
  speaker?: string;
}

interface ImportAgendaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (agenda: Omit<AgendaItem, 'id'>[]) => void;
}

const ImportAgendaDialog: React.FC<ImportAgendaDialogProps> = ({ isOpen, onClose, onImport }) => {
  const [importText, setImportText] = useState('');
  const { toast } = useToast();

  const parseDuration = (durationStr: string): number => {
    if (!durationStr || durationStr.trim() === '') return 180;
    
    const cleanStr = durationStr.replace(/\s+/g, '').replace(/['']/g, '');
    
    // 处理多个时长的情况，如 "2'+2'+2'"
    if (cleanStr.includes('+')) {
      const parts = cleanStr.split('+');
      let total = 0;
      for (const part of parts) {
        total += parseSingleDuration(part);
      }
      return total;
    }
    
    return parseSingleDuration(cleanStr);
  };

  const parseSingleDuration = (durationStr: string): number => {
    const patterns = [
      /(\d+)-(\d+)分钟?/,
      /(\d+)-(\d+)'/,
      /(\d+)分钟?/,
      /(\d+):(\d+)/,
      /(\d+)'/,
      /(\d+)秒/,
      /^(\d+)$/
    ];

    for (const pattern of patterns) {
      const match = durationStr.match(pattern);
      if (match) {
        if (pattern.source.includes('-')) {
          const min = parseInt(match[1]);
          const max = parseInt(match[2]);
          return Math.round((min + max) / 2) * 60;
        } else if (pattern.source.includes(':')) {
          const mins = parseInt(match[1]);
          const secs = parseInt(match[2]);
          return mins * 60 + secs;
        } else if (pattern.source.includes('秒')) {
          return parseInt(match[1]);
        } else {
          return parseInt(match[1]) * 60;
        }
      }
    }

    return 180; // 默认3分钟
  };

  const determineType = (title: string, duration: number): 'speech' | 'evaluation' | 'table-topics' | 'break' => {
    const timerType = getTypeFromTitle(title, duration);
    
    switch (timerType) {
      case 'speech':
        return 'speech';
      case 'longEval':
      case 'shortEval':
        return 'evaluation';
      case 'shareHost':
        return 'table-topics';
      case 'other':
      default:
        const titleLower = title.toLowerCase();
        // 明确的休息或非计时环节
        if (titleLower.includes('休息') || titleLower.includes('break') || 
            titleLower.includes('中场') || titleLower.includes('暖场') ||
            titleLower.includes('来宾介绍') || titleLower.includes('合影') ||
            titleLower.includes('颁奖') || titleLower.includes('投票') ||
            titleLower.includes('茶歇') || titleLower.includes('networking')) {
          return 'break';
        }
        
        // 根据时长推测
        const durationMinutes = duration / 60;
        if (durationMinutes >= 5 && durationMinutes <= 8) {
          return 'speech';
        } else if (durationMinutes <= 3) {
          return 'evaluation';
        } else {
          return 'table-topics';
        }
    }
  };

  const parseImportText = (text: string): Omit<AgendaItem, 'id'>[] => {
    const lines = text.trim().split('\n');
    const agenda: Omit<AgendaItem, 'id'>[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      
      // 跳过表头和分割线
      if (line.includes('时间') && line.includes('项目') && line.includes('时长')) continue;
      if (line.includes('---') || line.includes('===')) continue;
      if (line.includes('开场/致辞') || line.includes('上半场') || line.includes('下半场')) continue;

      let parts: string[] = [];
      
      // 优先按制表符分割（从表格复制的数据）
      if (line.includes('\t')) {
        parts = line.split(/\t+/).map(part => part.trim()).filter(part => part);
      } 
      // 按多个空格分割
      else if (line.match(/\s{2,}/)) {
        parts = line.split(/\s{2,}/).map(part => part.trim()).filter(part => part);
      }
      // 尝试智能解析：时间 项目 时长 姓名格式
      else {
        const match = line.match(/^(\d{1,2}[:：]\d{2})\s+(.+?)\s+([0-9\-'分钟秒:+]+)\s+(.+?)(?:\s+([A-Z0-9]+))?$/);
        if (match) {
          const [, time, title, duration, speaker, level] = match;
          parts = [time, title, duration, speaker, level].filter(part => part);
        } else {
          // 简单按空格分割作为备选
          parts = line.split(/\s+/).map(part => part.trim()).filter(part => part);
        }
      }

      // 至少需要项目名称和时长
      if (parts.length >= 2) {
        let title = '';
        let durationStr = '';
        let speaker = '';
        
        // 根据parts数量判断格式
        if (parts.length >= 4) {
          // 完整格式：时间 项目 时长 姓名 [等级]
          title = parts[1];
          durationStr = parts[2];
          speaker = parts[3];
        } else if (parts.length === 3) {
          // 可能是：项目 时长 姓名 或 时间 项目 时长
          if (parts[0].match(/^\d{1,2}[:：]\d{2}/)) {
            // 时间 项目 时长
            title = parts[1];
            durationStr = parts[2];
          } else {
            // 项目 时长 姓名
            title = parts[0];
            durationStr = parts[1];
            speaker = parts[2];
          }
        } else {
          // 项目 时长
          title = parts[0];
          durationStr = parts[1];
        }

        // 清理姓名中的括号和等级信息
        if (speaker) {
          speaker = speaker.replace(/[\(\（].*?[\)\）]/g, '').trim();
          speaker = speaker.replace(/\s+[A-Z0-9]+$/, '').trim();
        }

        const duration = parseDuration(durationStr);
        const type = determineType(title, duration);

        agenda.push({
          title,
          duration,
          type,
          speaker: speaker || undefined
        });
      }
    }

    return agenda;
  };

  const handleImport = () => {
    try {
      const parsedAgenda = parseImportText(importText);
      if (parsedAgenda.length === 0) {
        toast({
          title: "导入失败",
          description: "请确认数据格式正确。支持表格复制格式：时间 项目 时长 姓名",
          variant: "destructive"
        });
        return;
      }

      onImport(parsedAgenda);
      setImportText('');
      onClose();
      
      toast({
        title: "导入成功",
        description: `成功导入 ${parsedAgenda.length} 个议程项目，已自动推荐计时类型`
      });
    } catch (error) {
      toast({
        title: "导入失败",
        description: "数据格式错误，请检查后重试",
        variant: "destructive"
      });
    }
  };

  const exampleText = `时间	项目	时长	姓名	教育头衔
19:05	暖场环节	8'	Sherry.Zhang（自律嘉宾）	
19:15	会议开场	1'	Sophy(聚联)	LD1
19:33	AI与工作--AI画图进化史	5-7'	许闻怡（聚联）	DTM
19：41	即兴主题《TikTok Refugee》	25'	胡茶（聚联）	EC3
20:08	备稿1：《技术出海新篇章》	5-7'	Janson(聚联）	PM4
20:43	即兴评估	5-7'	Weiping（聚联）	DTM
20:51	个体评估1	2-3'	佳霖（自律）	PM2`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>智能导入议程</DialogTitle>
          <DialogDescription>
            支持从表格复制粘贴，自动识别时间、项目、时长、演讲者信息
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              支持格式：
            </label>
            <div className="bg-blue-50 p-3 rounded text-xs text-blue-800">
              • 表格复制格式：时间 → 项目 → 时长 → 姓名 → 等级<br/>
              • 自动识别多段时长：如 "2'+2'+2'" → 6分钟<br/>
              • 智能类型识别：备稿演讲、即兴演讲、评估、分享等<br/>
              • 自动清理姓名中的括号和等级信息
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              示例数据：
            </label>
            <div className="bg-gray-50 p-3 rounded text-sm font-mono whitespace-pre text-xs">
              {exampleText}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              粘贴议程数据：
            </label>
            <Textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="直接从表格复制粘贴议程数据..."
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button onClick={handleImport} disabled={!importText.trim()}>
              智能导入议程
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportAgendaDialog;
