
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Target, BarChart3 } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

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

  // 图表数据
  const chartData = structureAnalysis.map(item => ({
    name: item.speaker || item.title.substring(0, 8) + '...',
    实际用时: Math.round(item.record.actualDuration / 60 * 10) / 10,
    计划用时: Math.round(item.duration / 60 * 10) / 10,
    usage: item.usage
  }));

  const chartConfig = {
    实际用时: {
      label: "实际用时 (分钟)",
      color: "hsl(var(--chart-1))",
    },
    计划用时: {
      label: "计划用时 (分钟)", 
      color: "hsl(var(--chart-2))",
    },
  };

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

        {/* 用时情况统计图表 */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            用时情况统计图表
          </h4>
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="计划用时" fill="var(--color-计划用时)" />
                <Bar dataKey="实际用时" fill="var(--color-实际用时)">
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.usage > 1.1 ? "hsl(var(--destructive))" : 
                            entry.usage < 0.8 ? "hsl(var(--muted-foreground))" : 
                            "var(--color-实际用时)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>暂无计时数据</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimerReport;
