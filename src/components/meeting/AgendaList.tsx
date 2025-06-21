
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Plus, Play, FileText, Trash2, Edit2, Check, X } from 'lucide-react';
import AdvancedTimer from '@/components/timer/AdvancedTimer';

interface AgendaItem {
  id: string;
  title: string;
  duration: number;
  type: 'speech' | 'evaluation' | 'table-topics' | 'break';
  speaker?: string;
}

interface AgendaListProps {
  agenda: AgendaItem[];
  activeTimers: Set<string>;
  timerRecords: Record<string, { actualDuration: number; isOvertime: boolean; overtimeAmount: number }>;
  editingItem: string | null;
  editingField: 'title' | 'speaker' | 'duration' | 'type' | null;
  editValue: string;
  onStartTimer: (agendaId: string) => void;
  onStartEvaluation: (agendaId: string) => void;
  onTimerComplete: (agendaId: string, data: { actualDuration: number; isOvertime: boolean; overtimeAmount: number }) => void;
  onTimerClose: (agendaId: string) => void;
  onAddAgenda: () => void;
  onDeleteItem: (itemId: string) => void;
  onStartEditing: (itemId: string, field: 'title' | 'speaker' | 'duration' | 'type', currentValue: string | number) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditValueChange: (value: string) => void;
  onTypeChange: (itemId: string, newType: string) => void;
  onUpdateAgenda: (updatedAgenda: AgendaItem[]) => void;
}

const AgendaList: React.FC<AgendaListProps> = ({
  agenda,
  activeTimers,
  timerRecords,
  editingItem,
  editingField,
  editValue,
  onStartTimer,
  onStartEvaluation,
  onTimerComplete,
  onTimerClose,
  onAddAgenda,
  onDeleteItem,
  onStartEditing,
  onSaveEdit,
  onCancelEdit,
  onEditValueChange,
  onTypeChange,
  onUpdateAgenda
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'speech': return '备稿演讲';
      case 'evaluation': return '点评环节';
      case 'table-topics': return '即兴演讲';
      case 'break': return '休息时间';
      default: return type;
    }
  };

  const handleAgendaUpdate = (updatedItem: AgendaItem) => {
    const newAgenda = agenda.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    );
    onUpdateAgenda(newAgenda);
  };

  return (
    <div className="space-y-6">
      {/* Active Advanced Timers */}
      {Array.from(activeTimers).map(timerId => {
        const agendaItem = agenda.find(item => item.id === timerId);
        if (!agendaItem) return null;
        
        return (
          <AdvancedTimer
            key={timerId}
            agendaItem={agendaItem}
            onComplete={(data) => onTimerComplete(timerId, data)}
            onClose={() => onTimerClose(timerId)}
            onUpdate={handleAgendaUpdate}
          />
        );
      })}

      {/* Agenda Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Meeting Agenda
            </CardTitle>
            <Button
              size="sm"
              onClick={onAddAgenda}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Agenda
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agenda.map((item, index) => (
              <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3 flex-1">
                    <Badge variant="outline">#{index + 1}</Badge>
                    
                    {/* Editable Title */}
                    {editingItem === item.id && editingField === 'title' ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editValue}
                          onChange={(e) => onEditValueChange(e.target.value)}
                          className="flex-1"
                          onBlur={onSaveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') onSaveEdit();
                            if (e.key === 'Escape') onCancelEdit();
                          }}
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" onClick={onSaveEdit}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={onCancelEdit}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <h3 
                        className="font-medium cursor-pointer hover:bg-gray-100 px-2 py-1 rounded flex items-center gap-1 flex-1"
                        onClick={() => onStartEditing(item.id, 'title', item.title)}
                      >
                        {item.title}
                        <Edit2 className="h-3 w-3 opacity-50" />
                      </h3>
                    )}

                    {/* Editable Speaker */}
                    {editingItem === item.id && editingField === 'speaker' ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editValue}
                          onChange={(e) => onEditValueChange(e.target.value)}
                          className="w-24"
                          placeholder="Speaker"
                          onBlur={onSaveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') onSaveEdit();
                            if (e.key === 'Escape') onCancelEdit();
                          }}
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" onClick={onSaveEdit}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={onCancelEdit}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : item.speaker ? (
                      <Badge 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-gray-200 flex items-center gap-1"
                        onClick={() => onStartEditing(item.id, 'speaker', item.speaker || '')}
                      >
                        {item.speaker}
                        <Edit2 className="h-3 w-3 opacity-50" />
                      </Badge>
                    ) : (
                      <span 
                        className="text-sm text-gray-500 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded flex items-center gap-1"
                        onClick={() => onStartEditing(item.id, 'speaker', '')}
                      >
                        + Add Speaker
                        <Edit2 className="h-3 w-3 opacity-50" />
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Editable Duration */}
                    {editingItem === item.id && editingField === 'duration' ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={editValue}
                          onChange={(e) => onEditValueChange(e.target.value)}
                          className="w-16"
                          onBlur={onSaveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') onSaveEdit();
                            if (e.key === 'Escape') onCancelEdit();
                          }}
                          autoFocus
                          placeholder="1"
                        />
                        <span className="text-sm text-gray-500">min</span>
                        <Button size="sm" variant="ghost" onClick={onSaveEdit}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={onCancelEdit}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <span 
                        className="text-sm text-gray-500 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded flex items-center gap-1"
                        onClick={() => onStartEditing(item.id, 'duration', item.duration)}
                      >
                        {formatTime(item.duration)}
                        <Edit2 className="h-3 w-3 opacity-50" />
                      </span>
                    )}
                    
                    {timerRecords[item.id] && (
                      <Badge variant={timerRecords[item.id].isOvertime ? "destructive" : "default"}>
                        {timerRecords[item.id].isOvertime ? "Overtime" : "On Time"}
                      </Badge>
                    )}
                    {activeTimers.has(item.id) && (
                      <Badge className="bg-blue-500 text-white animate-pulse">
                        Timing
                      </Badge>
                    )}
                    
                    {/* Delete Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteItem(item.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <span>Type:</span>
                      {/* Editable Type */}
                      {editingItem === item.id && editingField === 'type' ? (
                        <div className="flex items-center gap-2">
                          <Select value={editValue} onValueChange={(value) => onTypeChange(item.id, value)}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="speech">Speech</SelectItem>
                              <SelectItem value="evaluation">Evaluation</SelectItem>
                              <SelectItem value="table-topics">Table Topics</SelectItem>
                              <SelectItem value="break">Break</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="ghost" onClick={onCancelEdit}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <span 
                          className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded flex items-center gap-1"
                          onClick={() => onStartEditing(item.id, 'type', item.type)}
                        >
                          {getTypeDisplayName(item.type)}
                          <Edit2 className="h-3 w-3 opacity-50" />
                        </span>
                      )}
                    </div>
                    {timerRecords[item.id] && (
                      <div>Actual Duration: {formatTime(timerRecords[item.id].actualDuration)}</div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => onStartTimer(item.id)}
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={activeTimers.has(item.id)}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      {activeTimers.has(item.id) ? 'Timing' : 'Smart Timer'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onStartEvaluation(item.id)}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Evaluate
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {agenda.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">No agenda items yet</p>
                <Button
                  variant="outline"
                  onClick={onAddAgenda}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Item
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgendaList;
