
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

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
    // 移除所有空格
    const cleanStr = durationStr.replace(/\s+/g, '');
    
    // 匹配各种时长格式
    const patterns = [
      // "5-7分钟", "1-2分钟", "6-8分钟"
      /(\d+)-(\d+)分钟?/,
      // "5-7'", "1-2'"
      /(\d+)-(\d+)'/,
      // "25分钟", "8分钟"
      /(\d+)分钟?/,
      // "7:00", "05:30"
      /(\d+):(\d+)/,
      // "25'", "8'"
      /(\d+)'/,
      // "420秒"
      /(\d+)秒/,
      // 纯数字 "25", "8"
      /^(\d+)$/
    ];

    for (const pattern of patterns) {
      const match = cleanStr.match(pattern);
      if (match) {
        if (pattern.source.includes('-')) {
          // 范围格式，取中间值
          const min = parseInt(match[1]);
          const max = parseInt(match[2]);
          return Math.round((min + max) / 2) * 60;
        } else if (pattern.source.includes(':')) {
          // 分:秒格式
          const mins = parseInt(match[1]);
          const secs = parseInt(match[2]);
          return mins * 60 + secs;
        } else if (pattern.source.includes('秒')) {
          // 秒格式
          return parseInt(match[1]);
        } else {
          // 分钟格式或纯数字
          return parseInt(match[1]) * 60;
        }
      }
    }

    // 默认3分钟
    return 180;
  };

  const determineType = (title: string): 'speech' | 'evaluation' | 'table-topics' | 'break' => {
    const titleLower = title.toLowerCase();
    
    // 点评相关关键词
    if (titleLower.includes('点评') || titleLower.includes('evaluation') || 
        titleLower.includes('个体评估') || titleLower.includes('即兴评估') ||
        titleLower.includes('总评')) {
      return 'evaluation';
    }
    
    // 即兴演讲相关关键词
    if (titleLower.includes('即兴') || titleLower.includes('table topics') || 
        titleLower.includes('即兴演讲') || titleLower.includes('即兴主题')) {
      return 'table-topics';
    }
    
    // 休息相关关键词
    if (titleLower.includes('休息') || titleLower.includes('break') || 
        titleLower.includes('中场') || titleLower.includes('暖场') ||
        titleLower.includes('来宾介绍') || titleLower.includes('合影') ||
        titleLower.includes('颁奖') || titleLower.includes('投票')) {
      return 'break';
    }
    
    // 默认为演讲
    return 'speech';
  };

  const parseImportText = (text: string): Omit<AgendaItem, 'id'>[] => {
    const lines = text.trim().split('\n');
    const agenda: Omit<AgendaItem, 'id'>[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      // 尝试多种分隔符：制表符、多个空格、单个空格
      let parts: string[] = [];
      
      // 首先尝试制表符分隔
      if (line.includes('\t')) {
        parts = line.split(/\t+/).map(part => part.trim()).filter(part => part);
      } 
      // 然后尝试多个空格分隔
      else if (line.match(/\s{2,}/)) {
        parts = line.split(/\s{2,}/).map(part => part.trim()).filter(part => part);
      }
      // 最后尝试单个空格分隔，但需要更智能的解析
      else {
        // 使用正则匹配常见的模式
        const match = line.match(/^(.+?)\s+([0-9\-'分钟秒:]+)\s*(.*)$/);
        if (match) {
          parts = [match[1].trim(), match[2].trim(), match[3].trim()].filter(part => part);
        } else {
          // 简单空格分隔作为备选
          parts = line.split(/\s+/).map(part => part.trim()).filter(part => part);
        }
      }

      if (parts.length >= 2) {
        const title = parts[0];
        const durationStr = parts[1];
        let speaker = '';
        
        // 处理演讲者信息
        if (parts.length > 2) {
          speaker = parts.slice(2).join(' ');
          // 清理演讲者名称中的括号等信息
          speaker = speaker.replace(/[\(\（].*?[\)\）]/g, '').trim();
        }

        const duration = parseDuration(durationStr);
        const type = determineType(title);

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
        description: `成功导入 ${parsedAgenda.length} 个议程项目`
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
          <DialogTitle>批量导入议程</DialogTitle>
          <DialogDescription>
            支持多种格式：制表符分隔、多空格分隔、或智能单空格分隔
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
              导入议程
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportAgendaDialog;
