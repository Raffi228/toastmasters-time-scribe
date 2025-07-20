
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// 数据类型定义
export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  status: 'upcoming' | 'active' | 'completed';
  agenda: AgendaItem[];
}

export interface AgendaItem {
  id: string;
  title: string;
  duration: number;
  type: 'speech' | 'evaluation' | 'table-topics' | 'break';
  speaker?: string;
  scheduledTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  orderIndex: number;
}

export const useMeetings = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      
      // 获取会议列表
      const { data: meetingsData, error: meetingsError } = await supabase
        .from('meetings')
        .select('*')
        .order('date', { ascending: false });

      if (meetingsError) throw meetingsError;

      // 获取每个会议的议程项目
      const meetingsWithAgenda = await Promise.all(
        (meetingsData || []).map(async (meeting) => {
          const { data: agendaData, error: agendaError } = await supabase
            .from('agenda_items')
            .select('*')
            .eq('meeting_id', meeting.id)
            .order('order_index', { ascending: true });

          if (agendaError) {
            console.error('获取议程出错:', agendaError);
            return {
              id: meeting.id,
              title: meeting.title,
              date: meeting.date,
              time: meeting.time,
              status: (meeting.status || 'upcoming') as Meeting['status'],
              agenda: []
            };
          }

          const agenda: AgendaItem[] = (agendaData || []).map(item => ({
            id: item.id,
            title: item.title,
            duration: item.duration,
            type: item.type as AgendaItem['type'],
            speaker: item.speaker,
            scheduledTime: item.scheduled_time,
            actualStartTime: item.actual_start_time,
            actualEndTime: item.actual_end_time,
            orderIndex: item.order_index
          }));

          return {
            id: meeting.id,
            title: meeting.title,
            date: meeting.date,
            time: meeting.time,
            status: (meeting.status || 'upcoming') as Meeting['status'],
            agenda
          };
        })
      );

      setMeetings(meetingsWithAgenda);
      setError(null);
    } catch (err) {
      console.error('获取会议列表出错:', err);
      setError(err instanceof Error ? err.message : '获取会议列表失败');
    } finally {
      setLoading(false);
    }
  };

  const createMeeting = async (meetingData: {
    title: string;
    date: string;
    time: string;
    agenda: Omit<AgendaItem, 'id' | 'orderIndex'>[];
  }) => {
    try {
      // 创建会议
      const { data: meetingRecord, error: meetingError } = await supabase
        .from('meetings')
        .insert({
          title: meetingData.title,
          date: meetingData.date,
          time: meetingData.time,
          status: 'upcoming'
        })
        .select()
        .single();

      if (meetingError) throw meetingError;

      // 创建议程项目
      if (meetingData.agenda.length > 0) {
        const agendaItems = meetingData.agenda.map((item, index) => ({
          meeting_id: meetingRecord.id,
          title: item.title,
          duration: item.duration,
          type: item.type,
          speaker: item.speaker,
          scheduled_time: item.scheduledTime,
          order_index: index
        }));

        const { error: agendaError } = await supabase
          .from('agenda_items')
          .insert(agendaItems);

        if (agendaError) throw agendaError;
      }

      // 重新获取会议列表
      await fetchMeetings();
      
      return meetingRecord.id;
    } catch (err) {
      console.error('创建会议出错:', err);
      throw err;
    }
  };

  const updateMeetingStatus = async (meetingId: string, status: Meeting['status']) => {
    try {
      const { error } = await supabase
        .from('meetings')
        .update({ status })
        .eq('id', meetingId);

      if (error) throw error;
      
      await fetchMeetings();
    } catch (err) {
      console.error('更新会议状态出错:', err);
      throw err;
    }
  };

  const recordTimer = async (agendaItemId: string, timerData: {
    actualDuration: number;
    isOvertime: boolean;
    overtimeAmount: number;
    startedAt: string;
    endedAt: string;
  }) => {
    try {
      const { error } = await supabase
        .from('timer_records')
        .insert({
          agenda_item_id: agendaItemId,
          actual_duration: timerData.actualDuration,
          is_overtime: timerData.isOvertime,
          overtime_amount: timerData.overtimeAmount,
          started_at: timerData.startedAt,
          ended_at: timerData.endedAt
        });

      if (error) throw error;
    } catch (err) {
      console.error('记录计时数据出错:', err);
      throw err;
    }
  };

  const saveFillerWordRecord = async (agendaItemId: string, record: {
    speaker: string;
    fillerWords: Record<string, number>;
    totalCount: number;
    notes: string;
  }) => {
    try {
      const { error } = await supabase
        .from('filler_word_records')
        .upsert({
          agenda_item_id: agendaItemId,
          speaker: record.speaker,
          filler_words: record.fillerWords,
          total_count: record.totalCount,
          notes: record.notes
        }, {
          onConflict: 'agenda_item_id'
        });

      if (error) throw error;
    } catch (err) {
      console.error('保存哼哈词记录出错:', err);
      throw err;
    }
  };

  // 添加实时监听
  useEffect(() => {
    fetchMeetings();

    // 设置实时监听
    const meetingsChannel = supabase
      .channel('meetings-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'meetings' },
        () => fetchMeetings()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'agenda_items' },
        () => fetchMeetings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(meetingsChannel);
    };
  }, []);

  return {
    meetings,
    loading,
    error,
    createMeeting,
    updateMeetingStatus,
    recordTimer,
    saveFillerWordRecord,
    refetch: fetchMeetings
  };
};
