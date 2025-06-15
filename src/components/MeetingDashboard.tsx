import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Play, FileText, Download, Upload } from 'lucide-react';
import InlineTimer from '@/components/InlineTimer';
import EvaluationForm from '@/components/EvaluationForm';
import ImportAgendaDialog from '@/components/ImportAgendaDialog';

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
  const [activeTimers, setActiveTimers] = useState<Set<string>>(new Set()); // 支持多个计时器
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [timerRecords, setTimerRecords] = useState<Record<string, { actualDuration: number; isOvertime: boolean; overtimeAmount: number }>>({});
  const [evaluations, setEvaluations] = useState<Record<string, { content: string; strengths: string[]; improvements: string[]; }>>({});
  const [meetingData, setMeetingData] = useState(meeting);

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
                导入议程
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
          <div className="lg:col-span-2">
            {/* Active Timers */}
            {Array.from(activeTimers).map(timerId => {
              const agendaItem = meetingData.agenda.find(item => item.id === timerId);
              if (!agendaItem) return null;
              
              return (
                <InlineTimer
                  key={timerId}
                  agendaItem={agendaItem}
                  onComplete={(data) => handleTimerComplete(timerId, data)}
                  onClose={() => handleTimerClose(timerId)}
                />
              );
            })}

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
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <h3 className="font-medium">{item.title}</h3>
                          {item.speaker && (
                            <Badge variant="secondary">{item.speaker}</Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            {formatTime(item.duration)}
                          </span>
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
                            {activeTimers.has(item.id) ? '计时中' : '计时'}
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
                    批量导入议程
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
