
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Upload, GripVertical, Trash } from 'lucide-react';
import ImportAgendaDialog from './ImportAgendaDialog';

interface AgendaItem {
  id: string;
  title: string;
  duration: number;
  type: 'speech' | 'evaluation' | 'table-topics' | 'break';
  speaker?: string;
}

interface CreateMeetingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateMeeting: (meeting: {
    title: string;
    date: string;
    time: string;
    agenda: AgendaItem[];
  }) => void;
}

const CreateMeetingDialog: React.FC<CreateMeetingDialogProps> = ({
  isOpen,
  onClose,
  onCreateMeeting,
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const agendaTemplates = {
    speech: { title: '备稿演讲', duration: 420, type: 'speech' as const },
    evaluation: { title: '点评环节', duration: 180, type: 'evaluation' as const },
    'table-topics': { title: '即兴演讲', duration: 120, type: 'table-topics' as const },
    break: { title: '休息时间', duration: 300, type: 'break' as const },
  };

  const addAgendaItem = (templateKey: keyof typeof agendaTemplates) => {
    const template = agendaTemplates[templateKey];
    const newItem: AgendaItem = {
      id: Date.now().toString(),
      ...template,
    };
    setAgenda([...agenda, newItem]);
  };

  const removeAgendaItem = (id: string) => {
    setAgenda(agenda.filter(item => item.id !== id));
  };

  const clearAllAgenda = () => {
    setAgenda([]);
  };

  const updateAgendaItem = (id: string, updates: Partial<AgendaItem>) => {
    setAgenda(agenda.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const handleImport = (importedAgenda: Omit<AgendaItem, 'id'>[]) => {
    const agendaWithIds = importedAgenda.map(item => ({
      ...item,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    }));
    setAgenda([...agenda, ...agendaWithIds]);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedItemIndex === null) return;

    const newAgenda = [...agenda];
    const draggedItem = newAgenda[draggedItemIndex];
    newAgenda.splice(draggedItemIndex, 1);
    newAgenda.splice(dropIndex, 0, draggedItem);
    
    setAgenda(newAgenda);
    setDraggedItemIndex(null);
  };

  const handleSubmit = () => {
    if (!title || !date || !time) return;
    
    onCreateMeeting({
      title,
      date,
      time,
      agenda,
    });
    
    // Reset form
    setTitle('');
    setDate('');
    setTime('');
    setAgenda([]);
    onClose();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `${minutes}分钟`;
    }
    return `${minutes}分${remainingSeconds}秒`;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>创建新会议</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">会议标题</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：第158次例会"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">会议日期</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="time">会议时间</Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Agenda */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label>会议议程</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsImportDialogOpen(true)}
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    批量导入
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addAgendaItem('speech')}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    演讲
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addAgendaItem('evaluation')}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    点评
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addAgendaItem('table-topics')}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    即兴
                  </Button>
                </div>
              </div>

              {agenda.length > 0 && (
                <div className="flex justify-end mb-3">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={clearAllAgenda}
                  >
                    <Trash className="h-3 w-3 mr-1" />
                    清空所有
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                {agenda.map((item, index) => (
                  <Card 
                    key={item.id}
                    className="cursor-move"
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-gray-400" />
                          <CardTitle className="text-sm">议程项目 {index + 1}</CardTitle>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAgendaItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label>项目标题</Label>
                        <Input
                          value={item.title}
                          onChange={(e) => updateAgendaItem(item.id, { title: e.target.value })}
                          placeholder="议程项目标题"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>类型</Label>
                          <Select
                            value={item.type}
                            onValueChange={(value) => updateAgendaItem(item.id, { type: value as AgendaItem['type'] })}
                          >
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
                          <Label>时长 ({formatDuration(item.duration)})</Label>
                          <Input
                            type="number"
                            value={Math.floor(item.duration / 60)}
                            onChange={(e) => updateAgendaItem(item.id, { duration: parseInt(e.target.value) * 60 })}
                            placeholder="分钟"
                          />
                        </div>
                      </div>

                      {item.type === 'speech' && (
                        <div>
                          <Label>演讲者</Label>
                          <Input
                            value={item.speaker || ''}
                            onChange={(e) => updateAgendaItem(item.id, { speaker: e.target.value })}
                            placeholder="演讲者姓名"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {agenda.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-2">暂无议程项目</p>
                  <p className="text-sm">点击上方按钮添加议程项目或批量导入</p>
                </div>
              )}
            </div>

            {/* Summary */}
            {agenda.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  会议预计时长: {Math.round(agenda.reduce((sum, item) => sum + item.duration, 0) / 60)} 分钟
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={onClose}>
                取消
              </Button>
              <Button onClick={handleSubmit} disabled={!title || !date || !time}>
                创建会议
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ImportAgendaDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImport={handleImport}
      />
    </>
  );
};

export default CreateMeetingDialog;
