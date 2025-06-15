
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle } from 'lucide-react';
import type { ParsedAgendaItem } from './AgendaParser';

interface AgendaPreviewProps {
  items: ParsedAgendaItem[];
  errors: string[];
}

const AgendaPreview: React.FC<AgendaPreviewProps> = ({ items, errors }) => {
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

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'speech': return 'bg-blue-500';
      case 'evaluation': return 'bg-green-500';
      case 'table-topics': return 'bg-purple-500';
      case 'break': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (items.length === 0 && errors.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {errors.length === 0 ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          解析预览 ({items.length} 项)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <h4 className="text-sm font-medium text-red-800 mb-2">解析错误:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
        
        {items.length > 0 && (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {items.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`text-white ${getTypeBadgeColor(item.type)}`}>
                      {getTypeDisplayName(item.type)}
                    </Badge>
                    <span className="font-medium">{item.title}</span>
                  </div>
                  {item.speaker && (
                    <div className="text-sm text-gray-600">演讲者: {item.speaker}</div>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {formatTime(item.duration)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgendaPreview;
