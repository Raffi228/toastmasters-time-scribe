
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, FileText, Users, Plus, Upload, Download } from 'lucide-react';

interface MeetingSummaryProps {
  agenda: Array<{
    id: string;
    title: string;
    duration: number;
    type: string;
    speaker?: string;
  }>;
  timerRecords: Record<string, { actualDuration: number; isOvertime: boolean; overtimeAmount: number }>;
  evaluations: Record<string, any>;
  fillerWordRecords: Record<string, any>;
  activeTimers: Set<string>;
  onAddAgenda: () => void;
  onImportAgenda: () => void;
  onExportReport: () => void;
}

const MeetingSummary: React.FC<MeetingSummaryProps> = ({
  agenda,
  timerRecords,
  evaluations,
  fillerWordRecords,
  activeTimers,
  onAddAgenda,
  onImportAgenda,
  onExportReport
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalFillerWords = Object.values(fillerWordRecords).reduce(
    (sum: number, record: any) => sum + (record.totalCount || 0), 0
  );

  return (
    <div className="space-y-6">
      {/* Time Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Time Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Planned Total Duration</span>
              <span className="font-medium">
                {formatTime(agenda.reduce((sum, item) => sum + item.duration, 0))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Recorded Items</span>
              <span className="font-medium">
                {Object.keys(timerRecords).length}/{agenda.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Overtime Items</span>
              <span className="font-medium text-red-600">
                {Object.values(timerRecords).filter(record => record.isOvertime).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active Timers</span>
              <span className="font-medium text-blue-600">
                {activeTimers.size}
              </span>
            </div>
            {Object.keys(timerRecords).length > 0 && (
              <div className="mt-4 pt-3 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Actual Duration Statistics</h4>
                <div className="text-sm text-gray-600">
                  Total Actual Duration: {formatTime(Object.values(timerRecords).reduce((sum, record) => sum + record.actualDuration, 0))}
                </div>
                <div className="text-sm text-gray-600">
                  Total Overtime: {formatTime(Object.values(timerRecords).reduce((sum, record) => sum + record.overtimeAmount, 0))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 哼哈词统计 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Users className="h-5 w-5 mr-2" />
            哼哈词统计
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">已记录演讲者</span>
              <span className="font-medium">
                {Object.keys(fillerWordRecords).length}/{agenda.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">总哼哈词数量</span>
              <span className="font-medium text-orange-600">
                {totalFillerWords}
              </span>
            </div>
            {Object.keys(fillerWordRecords).length > 0 && (
              <div className="text-sm text-gray-600">
                平均每人: {Math.round(totalFillerWords / Object.keys(fillerWordRecords).length)} 个
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Evaluation Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evaluation Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Completed Evaluations</span>
              <span className="font-medium">
                {Object.keys(evaluations).length}/{agenda.length}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Completion Rate: {Math.round((Object.keys(evaluations).length / agenda.length) * 100)}%
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button className="w-full" variant="outline" onClick={onAddAgenda}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Agenda Item
            </Button>
            <Button className="w-full" variant="outline" onClick={onImportAgenda}>
              <Upload className="h-4 w-4 mr-2" />
              Smart Import Agenda
            </Button>
            <Button className="w-full" variant="outline" onClick={onExportReport}>
              <Download className="h-4 w-4 mr-2" />
              Export Meeting Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MeetingSummary;
