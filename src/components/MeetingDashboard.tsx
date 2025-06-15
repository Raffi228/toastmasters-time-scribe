
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Clock, Play, FileText, Download, Upload, Edit2, Check, X, Trash2 } from 'lucide-react';
import AdvancedTimer from '@/components/timer/AdvancedTimer';
import EvaluationForm from '@/components/EvaluationForm';
import ImportAgendaDialog from '@/components/ImportAgendaDialog';
import TimerReport from '@/components/reports/TimerReport';

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  status: string;
  agenda: Array<{
    id: string;
    title: string;
    duration: number;
    type: 'speech' | 'evaluation' | 'table-topics' | 'break';
    speaker?: string;
  }>;
}

interface MeetingDashboardProps {
  meeting: Meeting;
  onBack: () => void;
}

const MeetingDashboard: React.FC<MeetingDashboardProps> = ({ meeting, onBack }) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'evaluation'>('dashboard');
  const [selectedAgenda, setSelectedAgenda] = useState<string | null>(null);
  const [activeTimers, setActiveTimers] = useState<Set<string>>(new Set());
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [timerRecords, setTimerRecords] = useState<Record<string, { actualDuration: number; isOvertime: boolean; overtimeAmount: number }>>({});
  const [evaluations, setEvaluations] = useState<Record<string, { content: string; strengths: string[]; improvements: string[]; }>>({});
  const [meetingData, setMeetingData] = useState(meeting);
  
  // 编辑状态
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'title' | 'speaker' | 'duration' | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleStartTimer = (agendaId: string) => {
    setActiveTimers(prev => new Set([...prev, agendaId]));
  };

  const handleStartEvaluation = (agendaId: string) => {
    setSelectedAgenda(agendaId);
    setCurrentView('evaluation');
  };

  const handleTimerComplete = (agendaId: string, data: { actualDuration: number; isOvertime: boolean; overtimeAmount: number }) => {
    setTimerRecords(prev => ({
      ...prev,
      [agendaId]: data
    }));
    setActiveTimers(prev => {
      const newSet = new Set(prev);
      newSet.delete(agendaId);
      return newSet;
    });
  };

  const handleTimerClose = (agendaId: string) => {
    setActiveTimers(prev => {
      const newSet = new Set(prev);
      newSet.delete(agendaId);
      return newSet;
    });
  };

  const handleEvaluationSave = (agendaId: string, data: { content: string; strengths: string[]; improvements: string[]; }) => {
    setEvaluations(prev => ({
      ...prev,
      [agendaId]: data
    }));
    setCurrentView('dashboard');
  };

  const handleImportAgenda = (importedAgenda: Array<Omit<Meeting['agenda'][0], 'id'>>) => {
    const newAgenda = importedAgenda.map((item, index) => ({
      ...item,
      id: `imported-${Date.now()}-${index}`
    }));

    setMeetingData(prev => ({
      ...prev,
      agenda: [...prev.agenda, ...newAgenda]
    }));
  };

  // 编辑功能
  const startEditing = (itemId: string, field: 'title' | 'speaker' | 'duration', currentValue: string | number) => {
    setEditingItem(itemId);
    setEditingField(field);
    setEditValue(field === 'duration' ? Math.round(Number(currentValue) / 60).toString() : String(currentValue || ''));
  };

  const saveEdit = () => {
    if (!editingItem || !editingField) return;

    setMeetingData(prev => ({
      ...prev,
      agenda: prev.agenda.map(item => {
        if (item.id === editingItem) {
          if (editingField === 'title') {
            return { ...item, title: editValue };
          } else if (editingField === 'speaker') {
            return { ...item, speaker: editValue };
          } else if (editingField === 'duration') {
            return { ...item, duration: parseInt(editValue) * 60 };
          }
        }
        return item;
      })
    }));

    cancelEdit();
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditingField(null);
    setEditValue('');
  };

  const deleteAgendaItem = (itemId: string) => {
    setMeetingData(prev => ({
      ...prev,
      agenda: prev.agenda.filter(item => item.id !== itemId)
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const exportReport = () => {
    const reportData = {
      meeting: meetingData.title,
      date: meetingData.date,
      time: meetingData.time,
      agenda: meetingData.agenda.map(item => ({
        title: item.title,
        type: item.type,
        speaker: item.speaker,
        plannedDuration: formatTime(item.duration),
        actualDuration: timerRecords[item.id] ? formatTime(timerRecords[item.id].actualDuration) : '未记录',
        isOvertime: timerRecords[item.id]?.isOvertime || false,
        overtimeAmount: timerRecords[item.id] ? formatTime(timerRecords[item.id].overtimeAmount) : '0:00',
        evaluation: evaluations[item.id]?.content || '无点评记录'
      }))
    };

    const reportText = `
头马俱乐部会议记录报告

会议: ${reportData.meeting}
日期: ${reportData.date}
时间: ${reportData.time}

=== 时间管理记录 ===
${reportData.agenda.map(item => `
${item.title} (${item.type === 'speech' ? '演讲' : item.type === 'evaluation' ? '点评' : item.type === 'table-topics' ? '即兴演讲' : '休息'})
${item.speaker ? `演讲者: ${item.speaker}` : ''}
计划时长: ${item.plannedDuration}
实际时长: ${item.actualDuration}
${item.isOvertime ? `超时: ${item.overtimeAmount}` : '按时完成'}
点评记录: ${item.evaluation}
`).join('\n')}
    `.trim();

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meetingData.title}_会议记录_${meetingData.date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentAgendaItem = meetingData.agenda.find(item => item.id === selectedAgenda);

  if (currentView === 'evaluation' && currentAgendaItem) {
    return (
      <EvaluationForm
        agendaItem={currentAgendaItem}
        initialData={evaluations[currentAgendaItem.id]}
        onSave={(data) => handleEvaluationSave(currentAgendaItem.id, data)}
        onBack={() => setCurrentView('dashboard')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{meetingData.title}</h1>
                <p className="text-sm text-gray-600">{meetingData.date} {meetingData.time}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => setIsImportDialogOpen(true)} variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                智能导入议程
              </Button>
              <Button onClick={exportReport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                导出报告
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Agenda List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Advanced Timers */}
            {Array.from(activeTimers).map(timerId => {
              const agendaItem = meetingData.agenda.find(item => item.id === timerId);
              if (!agendaItem) return null;
              
              return (
                <AdvancedTimer
                  key={timerId}
                  agendaItem={agendaItem}
                  onComplete={(data) => handleTimerComplete(timerId, data)}
                  onClose={() => handleTimerClose(timerId)}
                />
              );
            })}

            {/* Agenda Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  会议议程
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {meetingData.agenda.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3 flex-1">
                          <Badge variant="outline">#{index + 1}</Badge>
                          
                          {/* 可编辑标题 */}
                          {editingItem === item.id && editingField === 'title' ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1"
                                onBlur={saveEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit();
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                                autoFocus
                              />
                              <Button size="sm" variant="ghost" onClick={saveEdit}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <h3 
                              className="font-medium cursor-pointer hover:bg-gray-100 px-2 py-1 rounded flex items-center gap-1 flex-1"
                              onClick={() => startEditing(item.id, 'title', item.title)}
                            >
                              {item.title}
                              <Edit2 className="h-3 w-3 opacity-50" />
                            </h3>
                          )}

                          {/* 可编辑演讲者 */}
                          {editingItem === item.id && editingField === 'speaker' ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-24"
                                placeholder="演讲者"
                                onBlur={saveEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit();
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                                autoFocus
                              />
                              <Button size="sm" variant="ghost" onClick={saveEdit}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : item.speaker ? (
                            <Badge 
                              variant="secondary" 
                              className="cursor-pointer hover:bg-gray-200 flex items-center gap-1"
                              onClick={() => startEditing(item.id, 'speaker', item.speaker || '')}
                            >
                              {item.speaker}
                              <Edit2 className="h-3 w-3 opacity-50" />
                            </Badge>
                          ) : (
                            <span 
                              className="text-sm text-gray-500 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded flex items-center gap-1"
                              onClick={() => startEditing(item.id, 'speaker', '')}
                            >
                              + 添加演讲者
                              <Edit2 className="h-3 w-3 opacity-50" />
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {/* 可编辑时长 */}
                          {editingItem === item.id && editingField === 'duration' ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-16"
                                onBlur={saveEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit();
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                                autoFocus
                              />
                              <span className="text-sm text-gray-500">分钟</span>
                              <Button size="sm" variant="ghost" onClick={saveEdit}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span 
                              className="text-sm text-gray-500 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded flex items-center gap-1"
                              onClick={() => startEditing(item.id, 'duration', item.duration)}
                            >
                              {formatTime(item.duration)}
                              <Edit2 className="h-3 w-3 opacity-50" />
                            </span>
                          )}
                          
                          {timerRecords[item.id] && (
                            <Badge variant={timerRecords[item.id].isOvertime ? "destructive" : "default"}>
                              {timerRecords[item.id].isOvertime ? "超时" : "按时"}
                            </Badge>
                          )}
                          {activeTimers.has(item.id) && (
                            <Badge className="bg-blue-500 text-white animate-pulse">
                              计时中
                            </Badge>
                          )}
                          
                          {/* 删除按钮 */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteAgendaItem(item.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>类型: {
                            item.type === 'speech' ? '备稿演讲' :
                            item.type === 'evaluation' ? '点评环节' :
                            item.type === 'table-topics' ? '即兴演讲' : '休息时间'
                          }</div>
                          {timerRecords[item.id] && (
                            <div>实际用时: {formatTime(timerRecords[item.id].actualDuration)}</div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleStartTimer(item.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={activeTimers.has(item.id)}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            {activeTimers.has(item.id) ? '计时中' : '智能计时'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartEvaluation(item.id)}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            点评
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Timer Report */}
            {Object.keys(timerRecords).length > 0 && (
              <TimerReport 
                agenda={meetingData.agenda}
                timerRecords={timerRecords}
              />
            )}
          </div>

          {/* Summary Panel */}
          <div className="space-y-6">
            {/* Time Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">时间统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">计划总时长</span>
                    <span className="font-medium">
                      {formatTime(meetingData.agenda.reduce((sum, item) => sum + item.duration, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">已记录项目</span>
                    <span className="font-medium">
                      {Object.keys(timerRecords).length}/{meetingData.agenda.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">超时项目</span>
                    <span className="font-medium text-red-600">
                      {Object.values(timerRecords).filter(record => record.isOvertime).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">进行中计时器</span>
                    <span className="font-medium text-blue-600">
                      {activeTimers.size}
                    </span>
                  </div>
                  {Object.keys(timerRecords).length > 0 && (
                    <div className="mt-4 pt-3 border-t">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">实际用时统计</h4>
                      <div className="text-sm text-gray-600">
                        总实际用时: {formatTime(Object.values(timerRecords).reduce((sum, record) => sum + record.actualDuration, 0))}
                      </div>
                      <div className="text-sm text-gray-600">
                        总超时: {formatTime(Object.values(timerRecords).reduce((sum, record) => sum + record.overtimeAmount, 0))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Evaluation Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">点评统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">已完成点评</span>
                    <span className="font-medium">
                      {Object.keys(evaluations).length}/{meetingData.agenda.length}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    完成率: {Math.round((Object.keys(evaluations).length / meetingData.agenda.length) * 100)}%
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">快捷操作</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full" variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    智能导入议程
                  </Button>
                  <Button className="w-full" variant="outline" onClick={exportReport}>
                    <Download className="h-4 w-4 mr-2" />
                    导出会议报告
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <ImportAgendaDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImport={handleImportAgenda}
      />
    </div>
  );
};

export default MeetingDashboard;
