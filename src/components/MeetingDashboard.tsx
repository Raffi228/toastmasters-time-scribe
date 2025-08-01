import React, { useState, useEffect } from 'react';
import EvaluationForm from '@/components/EvaluationForm';
import ImportAgendaDialog from '@/components/ImportAgendaDialog';
import AddAgendaDialog from '@/components/AddAgendaDialog';
import TimerReport from '@/components/reports/TimerReport';
import MeetingHeader from '@/components/meeting/MeetingHeader';
import AgendaList from '@/components/meeting/AgendaList';
import MeetingSummary from '@/components/meeting/MeetingSummary';
import FillerWordTracker from '@/components/meeting/FillerWordTracker';
import TimeEditor from '@/components/timer/TimeEditor';
import FillerWordHeatmap from '@/components/reports/FillerWordHeatmap';
import { useMeetings } from '@/hooks/useMeetings';
import { toast } from 'sonner';
import { Volume2 } from 'lucide-react';

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
    scheduledTime?: string;
  }>;
}

interface MeetingDashboardProps {
  meeting: Meeting;
  onBack: () => void;
}

const MeetingDashboard: React.FC<MeetingDashboardProps> = ({ meeting, onBack }) => {
  const { recordTimer, saveFillerWordRecord } = useMeetings();
  const [currentView, setCurrentView] = useState<'dashboard' | 'evaluation' | 'filler-tracker' | 'heatmap'>('dashboard');
  const [selectedAgenda, setSelectedAgenda] = useState<string | null>(null);
  const [activeTimers, setActiveTimers] = useState<Set<string>>(new Set());
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [timerRecords, setTimerRecords] = useState<Record<string, { actualDuration: number; isOvertime: boolean; overtimeAmount: number }>>({});
  const [evaluations, setEvaluations] = useState<Record<string, { content: string; strengths: string[]; improvements: string[]; }>>({});
  const [fillerWordRecords, setFillerWordRecords] = useState<Record<string, any>>({});
  const [meetingData, setMeetingData] = useState(meeting);
  
  // 在组件加载时从localStorage恢复状态
  useEffect(() => {
    const savedTimerRecords = localStorage.getItem(`timerRecords-${meeting.id}`);
    const savedEvaluations = localStorage.getItem(`evaluations-${meeting.id}`);
    const savedFillerWords = localStorage.getItem(`fillerWords-${meeting.id}`);
    
    if (savedTimerRecords) {
      try {
        setTimerRecords(JSON.parse(savedTimerRecords));
      } catch (error) {
        console.error('恢复计时记录失败:', error);
      }
    }
    
    if (savedEvaluations) {
      try {
        setEvaluations(JSON.parse(savedEvaluations));
      } catch (error) {
        console.error('恢复点评记录失败:', error);
      }
    }
    
    if (savedFillerWords) {
      try {
        setFillerWordRecords(JSON.parse(savedFillerWords));
      } catch (error) {
        console.error('恢复哼哈词记录失败:', error);
      }
    }
  }, [meeting.id]);
  
  // 保存状态到localStorage
  useEffect(() => {
    localStorage.setItem(`timerRecords-${meeting.id}`, JSON.stringify(timerRecords));
  }, [timerRecords, meeting.id]);
  
  useEffect(() => {
    localStorage.setItem(`evaluations-${meeting.id}`, JSON.stringify(evaluations));
  }, [evaluations, meeting.id]);
  
  useEffect(() => {
    localStorage.setItem(`fillerWords-${meeting.id}`, JSON.stringify(fillerWordRecords));
  }, [fillerWordRecords, meeting.id]);
  
  // 编辑状态
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'title' | 'speaker' | 'duration' | 'type' | null>(null);
  const [editValue, setEditValue] = useState('');

  // 新增议程项目
  const addNewAgendaItem = (type: 'speech' | 'evaluation' | 'table-topics' | 'break' = 'speech') => {
    const typeTemplates = {
      speech: { title: '新的备稿演讲', duration: 420 },
      evaluation: { title: '新的点评环节', duration: 180 },
      'table-topics': { title: '新的即兴演讲', duration: 120 },
      break: { title: '新的休息时间', duration: 300 }
    };

    const template = typeTemplates[type];
    const newItem = {
      id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: template.title,
      duration: template.duration,
      type: type,
      speaker: ''
    };

    setMeetingData(prev => ({
      ...prev,
      agenda: [...prev.agenda, newItem]
    }));

    // 自动进入编辑模式
    setTimeout(() => {
      startEditing(newItem.id, 'title', newItem.title);
    }, 100);
  };

  const handleAddAgendaItem = (item: { title: string; duration: number; type: 'speech' | 'evaluation' | 'table-topics' | 'break'; speaker?: string }) => {
    const newItem = {
      id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...item
    };

    setMeetingData(prev => ({
      ...prev,
      agenda: [...prev.agenda, newItem]
    }));
  };

  const handleStartTimer = (agendaId: string) => {
    setActiveTimers(prev => new Set([...prev, agendaId]));
  };

  const handleStartEvaluation = (agendaId: string) => {
    setSelectedAgenda(agendaId);
    setCurrentView('evaluation');
  };

  const handleStartFillerTracker = (agendaId: string) => {
    setSelectedAgenda(agendaId);
    setCurrentView('filler-tracker');
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
    
    // 保存计时记录到数据库
    const saveTimerRecord = async () => {
      try {
        const now = new Date().toISOString();
        const startedAt = new Date(Date.now() - data.actualDuration * 1000).toISOString();
        
        await recordTimer(agendaId, {
          actualDuration: data.actualDuration,
          isOvertime: data.isOvertime,
          overtimeAmount: data.overtimeAmount,
          startedAt,
          endedAt: now,
        });
        
        toast.success('计时记录已保存');
      } catch (error) {
        console.error('保存计时记录失败:', error);
        toast.error('保存计时记录失败，但数据已在本地保存');
      }
    };
    saveTimerRecord();
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

  const handleFillerWordSave = async (record: any) => {
    setFillerWordRecords(prev => ({
      ...prev,
      [selectedAgenda!]: record
    }));
    
    // 保存到数据库
    try {
      await saveFillerWordRecord(selectedAgenda!, {
        speaker: record.speaker,
        fillerWords: record.fillerWords,
        totalCount: record.totalCount,
        notes: record.notes
      });
      toast.success('哼哈词记录已保存');
    } catch (error) {
      console.error('保存哼哈词记录失败:', error);
      toast.error('保存哼哈词记录失败，但数据已在本地保存');
    }
    
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
  const startEditing = (itemId: string, field: 'title' | 'speaker' | 'duration' | 'type', currentValue: string | number) => {
    setEditingItem(itemId);
    setEditingField(field);
    if (field === 'duration') {
      // 不需要预处理，直接传递分钟数
      setEditValue(Math.round(Number(currentValue) / 60).toString());
    } else {
      setEditValue(String(currentValue || ''));
    }
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
            const minutes = Math.max(1, Math.min(60, parseInt(editValue) || 1));
            return { ...item, duration: minutes * 60 };
          } else if (editingField === 'type') {
            return { ...item, type: editValue as 'speech' | 'evaluation' | 'table-topics' | 'break' };
          }
        }
        return item;
      })
    }));

    cancelEdit();
  };

  const handleDurationChange = (minutes: number) => {
    if (!editingItem) return;
    
    setMeetingData(prev => ({
      ...prev,
      agenda: prev.agenda.map(item => {
        if (item.id === editingItem) {
          return { ...item, duration: minutes * 60 };
        }
        return item;
      })
    }));
    
    cancelEdit();
  };

  const handleTypeChange = (itemId: string, newType: string) => {
    setMeetingData(prev => ({
      ...prev,
      agenda: prev.agenda.map(item => {
        if (item.id === itemId) {
          return { ...item, type: newType as 'speech' | 'evaluation' | 'table-topics' | 'break' };
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

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'speech': return '备稿演讲';
      case 'evaluation': return '点评环节';
      case 'table-topics': return '即兴演讲';
      case 'break': return '休息时间';
      default: return type;
    }
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
        plannedDuration: Math.floor(item.duration / 60) + ':' + (item.duration % 60).toString().padStart(2, '0'),
        actualDuration: timerRecords[item.id] ? Math.floor(timerRecords[item.id].actualDuration / 60) + ':' + (timerRecords[item.id].actualDuration % 60).toString().padStart(2, '0') : '未记录',
        isOvertime: timerRecords[item.id]?.isOvertime || false,
        overtimeAmount: timerRecords[item.id] ? Math.floor(timerRecords[item.id].overtimeAmount / 60) + ':' + (timerRecords[item.id].overtimeAmount % 60).toString().padStart(2, '0') : '0:00',
        evaluation: evaluations[item.id]?.content || '无点评记录',
        fillerWords: fillerWordRecords[item.id] ? {
          totalCount: fillerWordRecords[item.id].totalCount || 0,
          details: fillerWordRecords[item.id].fillerWords || {},
          notes: fillerWordRecords[item.id].notes || ''
        } : null
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

=== 哼哈词记录 ===
${item.fillerWords ? `
总哼哈词数量: ${item.fillerWords.totalCount}
详细统计: ${JSON.stringify(item.fillerWords.details, null, 2)}
哼哈官备注: ${item.fillerWords.notes || '无'}
` : '未记录哼哈词'}
`).join('\n')}

=== 会议总结 ===
总计时记录: ${Object.keys(timerRecords).length}/${reportData.agenda.length}
总超时项目: ${Object.values(timerRecords).filter(r => r.isOvertime).length}
总哼哈词记录: ${Object.keys(fillerWordRecords).length}/${reportData.agenda.length}
总哼哈词数量: ${Object.values(fillerWordRecords).reduce((sum: number, record: any) => sum + (record.totalCount || 0), 0)}
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

  if (currentView === 'filler-tracker' && currentAgendaItem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
        <MeetingHeader
          meeting={meetingData}
          onBack={() => setCurrentView('dashboard')}
          onImport={() => setIsImportDialogOpen(true)}
          onExport={exportReport}
        />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <FillerWordTracker
            agendaItem={currentAgendaItem}
            onSaveRecord={handleFillerWordSave}
            existingRecord={fillerWordRecords[currentAgendaItem.id]}
          />
        </main>
      </div>
    );
  }

  // 哼哈词热力图视图
  if (currentView === 'heatmap') {
    const heatmapData = Object.entries(fillerWordRecords).map(([agendaId, record]) => {
      const agendaItem = meetingData.agenda.find(item => item.id === agendaId);
      return {
        speaker: record.speaker || agendaItem?.speaker || '未知',
        fillerWords: record.fillerWords || {},
        totalCount: record.totalCount || 0,
        agendaTitle: agendaItem?.title || '未知环节'
      };
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
        <MeetingHeader
          meeting={meetingData}
          onBack={() => setCurrentView('dashboard')}
          onImport={() => setIsImportDialogOpen(true)}
          onExport={exportReport}
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <FillerWordHeatmap data={heatmapData} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      <MeetingHeader
        meeting={meetingData}
        onBack={onBack}
        onImport={() => setIsImportDialogOpen(true)}
        onExport={exportReport}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <AgendaList
              agenda={meetingData.agenda}
              activeTimers={activeTimers}
              timerRecords={timerRecords}
              editingItem={editingItem}
              editingField={editingField}
              editValue={editValue}
              onStartTimer={handleStartTimer}
              onStartEvaluation={handleStartEvaluation}
              onTimerComplete={handleTimerComplete}
              onTimerClose={handleTimerClose}
              onAddAgenda={() => setIsAddDialogOpen(true)}
              onDeleteItem={deleteAgendaItem}
              onStartEditing={startEditing}
              onSaveEdit={saveEdit}
              onCancelEdit={cancelEdit}
              onEditValueChange={setEditValue}
              onTypeChange={handleTypeChange}
              onUpdateAgenda={(newAgenda) => setMeetingData(prev => ({ ...prev, agenda: newAgenda }))}
            />

            {/* 时间编辑器 */}
            {editingField === 'duration' && editingItem && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <h3 className="text-lg font-semibold mb-4">编辑时长</h3>
                  <TimeEditor
                    value={parseInt(editValue) || 1}
                    onChange={handleDurationChange}
                    onCancel={cancelEdit}
                  />
                </div>
              </div>
            )}

            {/* 哼哈词追踪区域 */}
            {meetingData.agenda.length > 0 && (
              <div className="mt-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-3">哼哈官功能</h3>
                  <p className="text-sm text-yellow-700 mb-4">
                    点击下方按钮为演讲者记录哼哈词，帮助他们改善表达质量。
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {meetingData.agenda.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded border border-yellow-200">
                        <div>
                          <div className="font-medium text-sm">{item.title}</div>
                          <div className="text-xs text-gray-600">{item.speaker || '未指定演讲者'}</div>
                          {fillerWordRecords[item.id] && (
                            <div className="text-xs text-yellow-700 mt-1">
                              已记录 {fillerWordRecords[item.id].totalCount || 0} 个哼哈词
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleStartFillerTracker(item.id)}
                          className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
                        >
                          {fillerWordRecords[item.id] ? '编辑记录' : '开始记录'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {Object.keys(timerRecords).length > 0 && (
              <div className="mt-6">
                <TimerReport 
                  agenda={meetingData.agenda}
                  timerRecords={timerRecords}
                />
              </div>
            )}
          </div>

          <div>
            <MeetingSummary
              agenda={meetingData.agenda}
              timerRecords={timerRecords}
              evaluations={evaluations}
              fillerWordRecords={fillerWordRecords}
              activeTimers={activeTimers}
              onAddAgenda={() => setIsAddDialogOpen(true)}
              onImportAgenda={() => setIsImportDialogOpen(true)}
              onExportReport={exportReport}
            />
            {/* 哼哈词热力图按钮 */}
            {Object.keys(fillerWordRecords).length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setCurrentView('heatmap')}
                  className="w-full px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Volume2 className="h-4 w-4" />
                  查看哼哈词热力图
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <ImportAgendaDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImport={handleImportAgenda}
      />

      <AddAgendaDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddAgendaItem}
      />
    </div>
  );
};

export default MeetingDashboard;
