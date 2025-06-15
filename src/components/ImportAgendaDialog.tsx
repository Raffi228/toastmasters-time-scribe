
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
    console.log('Parsing duration:', durationStr);
    
    const patterns = [
      /(\d+)-(\d+)分钟?/,        // 5-7分钟
      /(\d+)-(\d+)'/,            // 5-7'
      /(\d+)分钟?/,              // 8分钟
      /(\d+)'/,                  // 8'
      /(\d+):(\d+)/,             // 5:30
      /(\d+)秒/,                 // 30秒
      /^(\d+)$/                  // 纯数字
    ];

    for (const pattern of patterns) {
      const match = durationStr.match(pattern);
      if (match) {
        console.log('Pattern matched:', pattern, match);
        
        if (pattern.source.includes('-')) {
          // 范围时长，取中间值
          const min = parseInt(match[1]);
          const max = parseInt(match[2]);
          const result = Math.round((min + max) / 2) * 60;
          console.log('Range duration result:', result);
          return result;
        } else if (pattern.source.includes(':')) {
          // 分:秒格式
          const mins = parseInt(match[1]);
          const secs = parseInt(match[2]);
          const result = mins * 60 + secs;
          console.log('Minutes:seconds result:', result);
          return result;
        } else if (pattern.source.includes('秒')) {
          // 秒数
          const result = parseInt(match[1]);
          console.log('Seconds result:', result);
          return result;
        } else {
          // 分钟数（包括 8' 格式）
          const result = parseInt(match[1]) * 60;
          console.log('Minutes result:', result);
          return result;
        }
      }
    }

    console.log('No pattern matched, using default 180');
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
            titleLower.includes('茶歇') || titleLower.includes('networking') ||
            titleLower.includes('开场/致辞') || titleLower.includes('上半场') ||
            titleLower.includes('下半场')) {
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
      
      // 跳过表头和分割线以及章节标题
      if (line.includes('时间') && line.includes('项目') && line.includes('时长')) continue;
      if (line.includes('---') || line.includes('===')) continue;
      if (line.match(/^(开场\/致辞|上半场|下半场|会议\/三官介绍|科技微分享环节|即兴演讲环节|备稿环节|来宾发言、合影、休息|即兴&备稿评估环节|会议总体评估环节|颁奖及结束环节)$/)) continue;

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

        console.log('Parsed item:', { title, durationStr, duration, type, speaker });

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

  const exampleText = `时间	项目	时长	姓名	等级
19:00	开场致辞	3'	张主席	DTM
19:05	暖场环节	8'	李小明	CC
19:15	会议介绍	2'	王主持	CL
19:20	备稿演讲：《科技改变生活》	5-7'	陈演讲者	CC
19:28	即兴演讲环节	20'	刘主持人	ACB
19:50	备稿演讲：《团队协作的力量》	5-7'	赵发言人	CC
19:58	个体评估1	2-3'	孙评估员	ACB
20:02	个体评估2	2-3'	周点评人	CC
20:08	即兴评估	5-7'	吴评估师	DTM
20:16	语法官报告	2'	郑语法官	CL
20:19	总评报告	3'	何总评官	DTM`;

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
