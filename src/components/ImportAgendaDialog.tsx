
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

  const parseImportText = (text: string): Omit<AgendaItem, 'id'>[] => {
    const lines = text.trim().split('\n');
    const agenda: Omit<AgendaItem, 'id'>[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      // Split by tab or multiple spaces
      const parts = line.split(/\t+|\s{2,}/).map(part => part.trim()).filter(part => part);
      
      if (parts.length >= 2) {
        const title = parts[0];
        const durationStr = parts[1];
        const speaker = parts.length > 2 ? parts[2] : undefined;

        // Parse duration (support formats like "7分钟", "7:00", "420秒", "420")
        let duration = 0;
        if (durationStr.includes('分钟')) {
          duration = parseInt(durationStr.replace('分钟', '')) * 60;
        } else if (durationStr.includes(':')) {
          const [mins, secs] = durationStr.split(':').map(Number);
          duration = mins * 60 + (secs || 0);
        } else if (durationStr.includes('秒')) {
          duration = parseInt(durationStr.replace('秒', ''));
        } else {
          duration = parseInt(durationStr) || 180; // Default 3 minutes
        }

        // Determine type based on title keywords
        let type: 'speech' | 'evaluation' | 'table-topics' | 'break' = 'speech';
        const titleLower = title.toLowerCase();
        if (titleLower.includes('点评') || titleLower.includes('evaluation')) {
          type = 'evaluation';
        } else if (titleLower.includes('即兴') || titleLower.includes('table topics')) {
          type = 'table-topics';
        } else if (titleLower.includes('休息') || titleLower.includes('break')) {
          type = 'break';
        }

        agenda.push({
          title,
          duration,
          type,
          speaker
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
          description: "请确认数据格式正确。每行应包含：议程项目名称、时长、演讲者（可选）",
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

  const exampleText = `备稿演讲 - 演讲的力量\t7分钟\t张三
点评环节\t3分钟\t李四
即兴演讲\t2分钟
休息时间\t10分钟`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>批量导入议程</DialogTitle>
          <DialogDescription>
            从表格或文本中复制粘贴议程数据，支持制表符或多个空格分隔
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              数据格式示例：
            </label>
            <div className="bg-gray-50 p-3 rounded text-sm font-mono whitespace-pre">
              {exampleText}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              格式：议程项目名称 [制表符/多空格] 时长 [制表符/多空格] 演讲者（可选）
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              粘贴数据：
            </label>
            <Textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="在此粘贴从表格复制的数据..."
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
