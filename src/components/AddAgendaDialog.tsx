
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';

interface AgendaItem {
  title: string;
  duration: number;
  type: 'speech' | 'evaluation' | 'table-topics' | 'break';
  speaker?: string;
}

interface AddAgendaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: AgendaItem) => void;
}

const AddAgendaDialog: React.FC<AddAgendaDialogProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<AgendaItem['type']>('speech');
  const [duration, setDuration] = useState(7);
  const [speaker, setSpeaker] = useState('');

  const typeTemplates = {
    speech: { title: '备稿演讲', duration: 7 },
    evaluation: { title: '点评环节', duration: 3 },
    'table-topics': { title: '即兴演讲', duration: 2 },
    break: { title: '休息时间', duration: 5 }
  };

  const handleTypeChange = (newType: AgendaItem['type']) => {
    setType(newType);
    const template = typeTemplates[newType];
    if (!title || title === typeTemplates[type].title) {
      setTitle(template.title);
    }
    setDuration(template.duration);
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    
    onAdd({
      title: title.trim(),
      type,
      duration: duration * 60, // 转换为秒
      speaker: speaker.trim() || undefined
    });
    
    // 重置表单
    setTitle('');
    setType('speech');
    setDuration(7);
    setSpeaker('');
    onClose();
  };

  const handleClose = () => {
    setTitle('');
    setType('speech');
    setDuration(7);
    setSpeaker('');
    onClose();
  };

  // 当类型改变时自动设置默认值
  React.useEffect(() => {
    const template = typeTemplates[type];
    setTitle(template.title);
    setDuration(template.duration);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>添加议程项目</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="type">项目类型</Label>
            <Select value={type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="speech">备稿演讲</SelectItem>
                <SelectItem value="evaluation">点评环节</SelectItem>
                <SelectItem value="table-topics">即兴演讲</SelectItem>
                <SelectItem value="break">休息时间</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">项目标题</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入议程标题"
            />
          </div>
          
          <div>
            <Label htmlFor="duration">时长 (分钟)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              min="1"
              max="60"
            />
          </div>

          <div>
            <Label htmlFor="speaker">演讲者 (可选)</Label>
            <Input
              id="speaker"
              value={speaker}
              onChange={(e) => setSpeaker(e.target.value)}
              placeholder="请输入演讲者姓名"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={handleClose}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={!title.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              添加
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddAgendaDialog;
