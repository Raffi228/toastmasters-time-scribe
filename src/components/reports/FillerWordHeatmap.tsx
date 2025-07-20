import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Volume2, TrendingUp, User, BarChart3 } from 'lucide-react';

interface FillerWordData {
  speaker: string;
  fillerWords: Record<string, number>;
  totalCount: number;
  agendaTitle: string;
}

interface FillerWordHeatmapProps {
  data: FillerWordData[];
}

const FillerWordHeatmap: React.FC<FillerWordHeatmapProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Volume2 className="h-5 w-5 mr-2" />
            哼哈词热力图
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            暂无哼哈词记录数据
          </div>
        </CardContent>
      </Card>
    );
  }

  // 收集所有哼哈词类型
  const allFillerWords = Array.from(
    new Set(data.flatMap(item => Object.keys(item.fillerWords)))
  );

  // 计算每个哼哈词的总数和最大值用于热力图
  const wordTotals = allFillerWords.reduce((acc, word) => {
    acc[word] = data.reduce((sum, item) => sum + (item.fillerWords[word] || 0), 0);
    return acc;
  }, {} as Record<string, number>);

  const maxCount = Math.max(...Object.values(wordTotals), 1);
  const maxPersonalCount = Math.max(...data.flatMap(item => Object.values(item.fillerWords)), 1);

  // 获取热力图颜色
  const getHeatmapColor = (count: number, maxValue: number) => {
    if (count === 0) return 'bg-gray-100 text-gray-400';
    const intensity = count / maxValue;
    if (intensity >= 0.8) return 'bg-red-500 text-white';
    if (intensity >= 0.6) return 'bg-red-400 text-white';
    if (intensity >= 0.4) return 'bg-orange-400 text-white';
    if (intensity >= 0.2) return 'bg-yellow-400 text-gray-800';
    return 'bg-yellow-200 text-gray-700';
  };

  // 颜色配置
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ffb347'];
  const CHART_COLORS = {
    primary: '#3b82f6',
    secondary: '#ef4444',
    accent: '#f59e0b',
    success: '#10b981',
    warning: '#f59e0b'
  };

  // 获取最常见的哼哈词（前5个）
  const topFillerWords = Object.entries(wordTotals)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // 计算演讲者统计
  const speakerStats = data.map(item => ({
    speaker: item.speaker,
    agendaTitle: item.agendaTitle,
    totalCount: item.totalCount,
    averagePerMinute: item.totalCount / 5, // 假设平均5分钟演讲
    topWords: Object.entries(item.fillerWords)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
  }));

  return (
    <div className="space-y-6">
      {/* 概览统计 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Volume2 className="h-5 w-5 mr-2" />
            哼哈词热力图分析
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {data.reduce((sum, item) => sum + item.totalCount, 0)}
              </div>
              <div className="text-sm text-blue-700">总哼哈词数</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {allFillerWords.length}
              </div>
              <div className="text-sm text-green-700">哼哈词类型</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {data.length}
              </div>
              <div className="text-sm text-purple-700">参与演讲者</div>
            </div>
          </div>

          {/* 最常见哼哈词排行 */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-3 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              哼哈词排行榜
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              {topFillerWords.map(([word, count], index) => (
                <div key={word} className="text-center p-3 bg-gray-50 rounded-lg">
                  <Badge variant="outline" className="mb-2">
                    #{index + 1}
                  </Badge>
                  <div className="font-medium text-lg">{word}</div>
                  <div className="text-sm text-gray-600">{count} 次</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 简化版数据可视化 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 哼哈词分布条形图 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              哼哈词使用频率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topFillerWords.map(([word, count], index) => {
                const percentage = (count / maxCount) * 100;
                return (
                  <div key={word} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{word}</span>
                      <span className="text-gray-600">{count} 次</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          index === 0 ? 'bg-red-500' : 
                          index === 1 ? 'bg-orange-500' : 
                          index === 2 ? 'bg-yellow-500' : 
                          index === 3 ? 'bg-blue-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 演讲者统计卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              演讲者排行
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {speakerStats
                .sort((a, b) => b.totalCount - a.totalCount)
                .map((stat, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <div className="font-medium">{stat.speaker || '未知'}</div>
                        <div className="text-xs text-gray-500">{stat.agendaTitle}</div>
                      </div>
                    </div>
                    <Badge variant={stat.totalCount > 10 ? "destructive" : stat.totalCount > 5 ? "secondary" : "default"}>
                      {stat.totalCount}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 演讲者热力图 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            演讲者哼哈词热力图
          </CardTitle>
          <div className="text-sm text-gray-600">
            颜色越深表示哼哈词使用频率越高
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2 font-medium">演讲者/环节</th>
                  {allFillerWords.map(word => (
                    <th key={word} className="text-center p-2 font-medium min-w-[60px]">
                      {word}
                    </th>
                  ))}
                  <th className="text-center p-2 font-medium">总计</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-2">
                      <div className="font-medium">{item.speaker || '未知'}</div>
                      <div className="text-sm text-gray-500">{item.agendaTitle}</div>
                    </td>
                    {allFillerWords.map(word => {
                      const count = item.fillerWords[word] || 0;
                      return (
                        <td key={word} className="p-1 text-center">
                          <div 
                            className={`inline-flex items-center justify-center w-10 h-8 rounded text-sm font-medium ${getHeatmapColor(count, maxPersonalCount)}`}
                          >
                            {count || ''}
                          </div>
                        </td>
                      );
                    })}
                    <td className="p-2 text-center">
                      <Badge 
                        variant={item.totalCount > 10 ? "destructive" : item.totalCount > 5 ? "secondary" : "default"}
                      >
                        {item.totalCount}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 演讲者详细统计 */}
      <Card>
        <CardHeader>
          <CardTitle>演讲者详细分析</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {speakerStats.map((stat, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gray-50">
                <div className="font-medium text-lg mb-2">{stat.speaker || '未知演讲者'}</div>
                <div className="text-sm text-gray-600 mb-3">{stat.agendaTitle}</div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">总哼哈词:</span>
                    <Badge variant={stat.totalCount > 10 ? "destructive" : "default"}>
                      {stat.totalCount}
                    </Badge>
                  </div>
                  
                  <div className="text-sm">
                    <div className="font-medium mb-1">常用哼哈词:</div>
                    <div className="flex flex-wrap gap-1">
                      {stat.topWords.map(([word, count]) => (
                        <Badge key={word} variant="outline" className="text-xs">
                          {word}({count})
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 改进建议 */}
      <Card>
        <CardHeader>
          <CardTitle>改进建议</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">🎯 个人改进建议</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 练习停顿而非使用哼哈词</li>
                <li>• 提前准备演讲内容和过渡语</li>
                <li>• 录音练习，自我监控</li>
                <li>• 放慢语速，增加思考时间</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">📊 俱乐部整体趋势</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• 平均每人 {Math.round(data.reduce((sum, item) => sum + item.totalCount, 0) / data.length)} 个哼哈词</li>
                <li>• 最常见: {topFillerWords[0]?.[0]} ({topFillerWords[0]?.[1]}次)</li>
                <li>• 需重点关注高频使用者</li>
                <li>• 建议增加哼哈词专项训练</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FillerWordHeatmap;