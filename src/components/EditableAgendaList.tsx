
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GripVertical, Trash2, Trash } from 'lucide-react';

interface AgendaItem {
  id: string;
  title: string;
  duration: number;
  type: 'speech' | 'evaluation' | 'table-topics' | 'break';
  speaker?: string;
}

interface EditableAgendaListProps {
  agenda: AgendaItem[];
  onUpdate: (agenda: AgendaItem[]) => void;
}

const EditableAgendaList: React.FC<EditableAgendaListProps> = ({ agenda, onUpdate }) => {
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const removeAgendaItem = (id: string) => {
    onUpdate(agenda.filter(item => item.id !== id));
  };

  const clearAllAgenda = () => {
    onUpdate([]);
  };

  const updateAgendaItem = (id: string, updates: Partial<AgendaItem>) => {
    onUpdate(agenda.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
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
    
    onUpdate(newAgenda);
    setDraggedItemIndex(null);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `${minutes}分钟`;
    }
    return `${minutes}分${remainingSeconds}秒`;
  };

  if (agenda.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="mb-2">暂无议程项目</p>
        <p className="text-sm">添加或导入议程项目</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
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

      {agenda.map((item, index) => (
        <Card 
          key={item.id}
          className="cursor-move hover:shadow-md transition-shadow"
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                <CardTitle className="text-sm">议程项目 {index + 1}</CardTitle>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeAgendaItem(item.id)}
                className="text-red-600 hover:text-red-700"
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

            {(item.type === 'speech' || item.type === 'evaluation' || item.type === 'table-topics') && (
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
  );
};

export default EditableAgendaList;
