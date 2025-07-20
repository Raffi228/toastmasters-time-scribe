
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Target, TrendingUp, Download } from 'lucide-react';


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

  // 热力图数据
  const heatmapData = structureAnalysis.map((item, index) => ({
    id: item.id,
    name: item.speaker || `演讲者${index + 1}`,
    title: item.title.length > 10 ? item.title.substring(0, 10) + '...' : item.title,
    planned: Math.round(item.duration / 60),
    actual: Math.round(item.record.actualDuration / 60),
    usage: item.usage,
    status: item.usage > 1.1 ? 'overtime' : item.usage < 0.8 ? 'undertime' : 'ontime'
  }));

  // 导出热力图
  const exportHeatmap = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;
    
    // 背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 标题
    ctx.fillStyle = '#000000';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('时间官报告热力图', canvas.width / 2, 40);
    
    // 绘制热力图
    const cellWidth = 120;
    const cellHeight = 60;
    const startX = 50;
    const startY = 80;
    const cols = Math.ceil(Math.sqrt(heatmapData.length));
    
    heatmapData.forEach((item, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = startX + col * (cellWidth + 10);
      const y = startY + row * (cellHeight + 10);
      
      // 根据用时情况设置颜色
      if (item.status === 'overtime') {
        ctx.fillStyle = '#ef4444'; // 红色
      } else if (item.status === 'undertime') {
        ctx.fillStyle = '#3b82f6'; // 蓝色
      } else {
        ctx.fillStyle = '#22c55e'; // 绿色
      }
      
      ctx.fillRect(x, y, cellWidth, cellHeight);
      
      // 文字
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.name, x + cellWidth / 2, y + 20);
      ctx.fillText(`${item.actual}/${item.planned}分钟`, x + cellWidth / 2, y + 35);
      ctx.fillText(`${Math.round(item.usage * 100)}%`, x + cellWidth / 2, y + 50);
    });
    
    // 图例
    const legendY = startY + Math.ceil(heatmapData.length / cols) * (cellHeight + 10) + 30;
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(startX, legendY, 20, 20);
    ctx.fillStyle = '#000000';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('准时 (80%-110%)', startX + 30, legendY + 15);
    
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(startX + 150, legendY, 20, 20);
    ctx.fillText('用时不足 (<80%)', startX + 180, legendY + 15);
    
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(startX + 300, legendY, 20, 20);
    ctx.fillText('超时 (>110%)', startX + 330, legendY + 15);
    
    // 下载
    const link = document.createElement('a');
    link.download = '时间官报告热力图.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            时间官报告
          </CardTitle>
          <Button onClick={exportHeatmap} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            导出热力图
          </Button>
        </div>
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

        {/* 用时情况热力图 */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            用时情况热力图
          </h4>
          {heatmapData.length > 0 ? (
            <div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {heatmapData.map((item, index) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      item.status === 'overtime' 
                        ? 'bg-red-100 border-red-300 text-red-800' 
                        : item.status === 'undertime'
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'bg-green-100 border-green-300 text-green-800'
                    }`}
                  >
                    <div className="font-semibold text-sm mb-1">{item.name}</div>
                    <div className="text-xs text-gray-600 mb-2">{item.title}</div>
                    <div className="text-lg font-bold">{item.actual}/{item.planned}分钟</div>
                    <div className="text-sm">
                      {Math.round(item.usage * 100)}%
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 图例 */}
              <div className="flex justify-center gap-6 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                  <span>准时 (80%-110%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                  <span>用时不足 (&lt;80%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                  <span>超时 (&gt;110%)</span>
                </div>
              </div>
            </div>
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
