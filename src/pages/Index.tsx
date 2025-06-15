
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, FileText, Calendar, Plus, Timer, MessageSquare } from 'lucide-react';
import CreateMeetingDialog from '@/components/CreateMeetingDialog';
import MeetingDashboard from '@/components/MeetingDashboard';

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  status: 'upcoming' | 'active' | 'completed';
  agenda: Array<{
    id: string;
    title: string;
    duration: number;
    type: 'speech' | 'evaluation' | 'table-topics' | 'break';
    speaker?: string;
  }>;
}

const Index = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([
    {
      id: '1',
      title: '第158次例会',
      date: '2025-06-15',
      time: '14:00',
      status: 'active',
      agenda: [
        { id: '1', title: '备稿演讲 - 演讲的力量', duration: 420, type: 'speech', speaker: '张三' },
        { id: '2', title: '点评环节', duration: 180, type: 'evaluation' },
        { id: '3', title: '即兴演讲', duration: 120, type: 'table-topics' },
      ]
    },
    {
      id: '2',
      title: '第159次例会',
      date: '2025-06-22',
      time: '14:00',
      status: 'upcoming',
      agenda: []
    }
  ]);

  const [currentView, setCurrentView] = useState<'home' | 'meeting'>('home');
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleCreateMeeting = (meetingData: Omit<Meeting, 'id' | 'status'>) => {
    const newMeeting: Meeting = {
      ...meetingData,
      id: Date.now().toString(),
      status: 'upcoming'
    };
    setMeetings([...meetings, newMeeting]);
  };

  const handleEnterMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setCurrentView('meeting');
  };

  const getStatusColor = (status: Meeting['status']) => {
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

  const getStatusText = (status: Meeting['status']) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">时间官助手</h1>
                <p className="text-sm text-gray-600">头马俱乐部时间管理与点评记录工具</p>
              </div>
            </div>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              新建会议
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">本月会议</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">+1 较上月</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">计时记录</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">26</div>
              <p className="text-xs text-muted-foreground">总计时次数</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">点评记录</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground">点评份数</p>
            </CardContent>
          </Card>
        </div>

        {/* Meetings List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">会议列表</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meetings.map((meeting) => (
              <Card key={meeting.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{meeting.title}</CardTitle>
                    <Badge className={`${getStatusColor(meeting.status)} text-white`}>
                      {getStatusText(meeting.status)}
                    </Badge>
                  </div>
                  <CardDescription>
                    {meeting.date} {meeting.time}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      {meeting.agenda.length} 个议程项目
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      预计时长: {Math.round(meeting.agenda.reduce((sum, item) => sum + item.duration, 0) / 60)} 分钟
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => handleEnterMeeting(meeting)}
                      variant={meeting.status === 'active' ? 'default' : 'outline'}
                    >
                      {meeting.status === 'active' ? '进入会议' : '查看会议'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <CreateMeetingDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreateMeeting={handleCreateMeeting}
      />
    </div>
  );
};

export default Index;
