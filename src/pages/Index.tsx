
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, FileText, Calendar, Plus, Timer, MessageSquare } from 'lucide-react';
import CreateMeetingDialog from '@/components/CreateMeetingDialog';
import MeetingDashboard from '@/components/MeetingDashboard';
import LanguageSwitch from '@/components/LanguageSwitch';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMeetings } from '@/hooks/useMeetings';
import { toast } from 'sonner';

const Index = () => {
  const { t } = useLanguage();
  const { meetings, loading, createMeeting } = useMeetings();
  
  const [currentView, setCurrentView] = useState<'home' | 'meeting'>('home');
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleCreateMeeting = async (meetingData: {
    title: string;
    date: string;
    time: string;
    agenda: any[];
  }) => {
    try {
      const meetingId = await createMeeting(meetingData);
      setIsCreateDialogOpen(false);
      
      if (meetingId) {
        toast.success('会议创建成功！');
        // 如果成功创建，可以自动跳转到会议
        setTimeout(() => {
          if (meetings.length > 0) {
            const latestMeeting = meetings[meetings.length - 1];
            if (latestMeeting) {
              handleEnterMeeting(latestMeeting);
            }
          }
        }, 500);
      }
    } catch (error) {
      console.error('创建会议失败:', error);
      toast.error('会议创建失败，请重试');
    }
  };

  const handleQuickStart = async (agenda: any[]) => {
    // 快速开始时直接跳转到会议页面
    toast.success('正在启动快速计时模式...');
    setTimeout(() => {
      if (meetings.length > 0) {
        const latestMeeting = meetings[meetings.length - 1];
        if (latestMeeting) {
          handleEnterMeeting(latestMeeting);
        }
      }
    }, 1000);
  };

  const handleEnterMeeting = (meeting: any) => {
    setSelectedMeeting(meeting);
    setCurrentView('meeting');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'upcoming':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '进行中';
      case 'upcoming':
        return '即将开始';
      case 'completed':
        return '已结束';
      default:
        return '未知';
    }
  };

  if (currentView === 'meeting' && selectedMeeting) {
    return (
      <MeetingDashboard 
        meeting={selectedMeeting} 
        onBack={() => setCurrentView('home')} 
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('app.title')}</h1>
                <p className="text-sm text-gray-600">{t('app.subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitch />
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('button.newMeeting')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards - 响应式网格布局 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.monthlyMeetings')}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{meetings.length}</div>
              <p className="text-xs text-muted-foreground">{t('stats.monthlyMeetings.change')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.timerRecords')}</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">26</div>
              <p className="text-xs text-muted-foreground">{t('stats.timerRecords.total')}</p>
            </CardContent>
          </Card>
          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.evaluationRecords')}</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground">{t('stats.evaluationRecords.count')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Meetings List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{t('meetings.title')}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {meetings.map((meeting) => (
              <Card key={meeting.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{meeting.title}</CardTitle>
                    <Badge className={`${getStatusColor(meeting.status)} text-white`}>
                      {t(`status.${meeting.status}`) || getStatusText(meeting.status)}
                    </Badge>
                  </div>
                  <CardDescription>
                    {meeting.date} {meeting.time}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">
                        {meeting.agenda.length} {t('meetings.agendaItems')}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">
                        {t('meetings.estimatedDuration')}: {Math.round(meeting.agenda.reduce((sum, item) => sum + item.duration, 0) / 60)} {t('meetings.minutes')}
                      </span>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => handleEnterMeeting(meeting)}
                      variant={meeting.status === 'active' ? 'default' : 'outline'}
                    >
                      {meeting.status === 'active' ? t('button.enterMeeting') : t('button.viewMeeting')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {meetings.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无会议</h3>
              <p className="text-gray-600 mb-4">创建您的第一个会议开始使用</p>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                创建会议
              </Button>
            </div>
          )}
        </div>
      </main>

          <CreateMeetingDialog
            isOpen={isCreateDialogOpen}
            onClose={() => setIsCreateDialogOpen(false)}
            onCreateMeeting={handleCreateMeeting}
            onQuickStart={handleQuickStart}
          />
    </div>
  );
};

export default Index;
