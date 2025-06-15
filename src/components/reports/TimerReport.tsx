
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, TrendingDown, Target } from 'lucide-react';

interface TimerReportProps {
  agenda: Array<{
    id: string;
    title: string;
    duration: number;
    type: 'speech' | 'evaluation' | 'table-topics' | 'break';
    speaker?: string;
  }>;
  timerRecords: Record<string, {
    actualDuration: number;
    isOvertime: boolean;
    overtimeAmount: number;
  }>;
}

const TimerReport: React.FC<TimerReportProps> = ({ agenda, timerRecords }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeAnalysis = () => {
    const recordedItems = Object.keys(timerRecords);
    const totalItems = agenda.length;
    const ontimeItems = recordedItems.filter(id => !timerRecords[id].isOvertime).length;
    const overtimeItems = recordedItems.filter(id => timerRecords[id].isOvertime).length;
    const undertimeItems = recordedItems.filter(id => {
      const item = agenda.find(a => a.id === id);
      if (!item) return false;
      const usage = timerRecords[id].actualDuration / item.duration;
      return usage < 0.8; // 少于80%算时间不足
    }).length;

    return {
      totalItems,
      recordedItems: recordedItems.length,
      ontimeRate: recordedItems.length > 0 ? Math.round((ontimeItems / recordedItems.length) * 100) : 0,
      overtimeRate: recordedItems.length > 0 ? Math.round((overtimeItems / recordedItems.length) * 100) : 0,
      undertimeRate: recordedItems.length > 0 ? Math.round((undertimeItems / recordedItems.length) * 100) : 0,
      ontimeItems,
      overtimeItems,
      undertimeItems
    };
  };

  const getStructureAnalysis = () => {
    return agenda.map(item => {
      const record = timerRecords[item.id];
      if (!record) return null;

      const usage = record.actualDuration / item.duration;
      let analysis = '';
      let suggestion = '';

      if (usage < 0.8) {
        analysis = '时间利用不足';
        suggestion = '可以增加内容深度或增强互动';
      } else if (usage > 1.1) {
        analysis = '时间超出较多';
        suggestion = '建议精简内容，突出重点';
      } else if (record.isOvertime) {
        analysis = '轻微超时';
        suggestion = '时间把控需要加强';
      } else {
        analysis = '时间控制良好';
        suggestion = '继续保持';
      }

      return {
        ...item,
        record,
        usage,
        analysis,
        suggestion
      };
    }).filter(Boolean);
  };

  const analysis = getTimeAnalysis();
  const structureAnalysis = getStructureAnalysis();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          时间官报告
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 全场用时情况分析 */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center">
            <Target className="h-4 w-4 mr-2" />
            全场用时情况分析
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div>上台人次: {analysis.recordedItems}人</div>
              <div>准时率: <span className="font-semibold text-green-600">{analysis.ontimeRate}%</span></div>
            </div>
            <div className="space-y-2">
              <div>用时不足: <span className="font-semibold text-blue-600">{analysis.undertimeRate}%</span></div>
              <div>超时率: <span className="font-semibold text-red-600">{analysis.overtimeRate}%</span></div>
            </div>
          </div>
        </div>

        {/* 演讲用时结构分析 */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            演讲用时结构分析
          </h4>
          <div className="space-y-3">
            {structureAnalysis.map((item, index) => (
              <div key={item.id} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{item.title}</span>
                    {item.speaker && <Badge variant="secondary">{item.speaker}</Badge>}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatTime(item.record.actualDuration)} / {formatTime(item.duration)}
                  </div>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-2">分析:</span>
                    <Badge variant={
                      item.usage < 0.8 ? "secondary" : 
                      item.record.isOvertime ? "destructive" : "default"
                    }>
                      {item.analysis}
                    </Badge>
                  </div>
                  <div className="text-gray-600">
                    <span className="mr-2">建议:</span>
                    {item.suggestion}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 演讲用时建议 */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center">
            <TrendingDown className="h-4 w-4 mr-2" />
            演讲用时建议
          </h4>
          <div className="text-sm text-gray-700 space-y-2">
            <p>• 开头部分建议占用时的10%，用于抓住听众注意力</p>
            <p>• 主体部分建议占用时的75%，内容分配要均匀</p>
            <p>• 结尾部分建议占用时的10-15%，要有力总结</p>
            <p>• 可以通过练习测量语速，使用计时工具提升时间感知能力</p>
            <p>• 建议多担任时间官角色，增强对时间的敏感度</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimerReport;
