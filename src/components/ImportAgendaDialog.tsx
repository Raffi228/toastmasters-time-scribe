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
    const cleanStr = durationStr.replace(/\s+/g, '');
    
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
      const match = cleanStr.match(pattern);
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

    return 180;
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
        if (titleLower.includes('休息') || titleLower.includes('break') || 
            titleLower.includes('中场') || titleLower.includes('暖场') ||
            titleLower.includes('来宾介绍') || titleLower.includes('合影') ||
            titleLower.includes('颁奖') || titleLower.includes('投票')) {
          return 'break';
        }
        return 'speech';
    }
  };

  const parseImportText = (text: string): Omit<AgendaItem, 'id'>[] => {
    const lines = text.trim().split('\n');
    const agenda: Omit<AgendaItem, 'id'>[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      let parts: string[] = [];
      
      if (line.includes('\t')) {
        parts = line.split(/\t+/).map(part => part.trim()).filter(part => part);
      } 
      else if (line.match(/\s{2,}/)) {
        parts = line.split(/\s{2,}/).map(part => part.trim()).filter(part => part);
      }
      else {
        const match = line.match(/^(.+?)\s+([0-9\-'分钟秒:]+)\s*(.*)$/);
        if (match) {
          parts = [match[1].trim(), match[2].trim(), match[3].trim()].filter(part => part);
        } else {
          parts = line.split(/\s+/).map(part => part.trim()).filter(part => part);
        }
      }

      if (parts.length >= 2) {
        const title = parts[0];
        const durationStr = parts[1];
        let speaker = '';
        
        if (parts.length > 2) {
          speaker = parts.slice(2).join(' ');
          speaker = speaker.replace(/[\(\（].*?[\)\）]/g, '').trim();
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
          description: "请确认数据格式正确。支持多种格式：议程名称 时长 演讲者",
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

  const exampleText = `暖场环节 8分钟 Sherry.Zhang
会议开场 1分钟 Sophy
主席联合致辞 6分钟 许闻怡、童大喵、莫婷
备稿演讲 - 技术出海新篇章 5-7分钟 Janson
即兴演讲 - TikTok Refugee 25分钟 胡茶
个体评估 - 备稿1 2-3分钟 佳霖
时间官报告 1-2分钟 大米`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>智能导入议程</DialogTitle>
          <DialogDescription>
            支持多种格式导入，自动推荐计时类型和规则配置
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              智能识别功能：
            </label>
            <div className="bg-blue-50 p-3 rounded text-xs text-blue-800">
              • 自动识别环节类型：备稿演讲、长/短评估、分享主持、其他<br/>
              • 智能推荐计时规则：根据环节类型和时长自动匹配<br/>
              • 支持时长范围：5-7分钟、1-2'、3:30等格式
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              支持的时长格式：
            </label>
            <div className="bg-gray-50 p-3 rounded text-xs text-gray-600">
              • 范围格式：5-7分钟、1-2'<br/>
              • 单一格式：8分钟、25'、3:30<br/>
              • 纯数字：8（自动识别为分钟）
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              数据格式示例：
            </label>
            <div className="bg-gray-50 p-3 rounded text-sm font-mono whitespace-pre">
              {exampleText}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              粘贴数据：
            </label>
            <Textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="在此粘贴议程数据..."
              rows={8}
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
