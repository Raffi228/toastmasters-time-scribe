
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, RotateCcw, FileText, Volume2 } from 'lucide-react';

interface FillerWordRecord {
  id: string;
  speaker: string;
  fillerWords: Record<string, number>;
  totalCount: number;
  notes: string;
}

interface FillerWordTrackerProps {
  agendaItem: {
    id: string;
    title: string;
    speaker?: string;
  };
  onSaveRecord: (record: FillerWordRecord) => void;
  existingRecord?: FillerWordRecord;
}

const COMMON_FILLER_WORDS = [
  '这个', '那个', '就是', '然后', '所以', '所以说', '但是',
  '嗯', '啊', '呃', '额', '哦',
  '我我', '就是说', '然后然后'
];

const FillerWordTracker: React.FC<FillerWordTrackerProps> = ({
  agendaItem,
  onSaveRecord,
  existingRecord
}) => {
  const [currentRecord, setCurrentRecord] = useState<FillerWordRecord>(() => ({
    id: existingRecord?.id || `filler-${agendaItem.id}`,
    speaker: existingRecord?.speaker || agendaItem.speaker || '',
    fillerWords: existingRecord?.fillerWords || {},
    totalCount: existingRecord?.totalCount || 0,
    notes: existingRecord?.notes || ''
  }));

  const [selectedWord, setSelectedWord] = useState(COMMON_FILLER_WORDS[0]);
  const [customWord, setCustomWord] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    const total = Object.values(currentRecord.fillerWords).reduce((sum, count) => sum + count, 0);
    setCurrentRecord(prev => ({ ...prev, totalCount: total }));
  }, [currentRecord.fillerWords]);

  const addFillerWord = (word: string) => {
    if (!word.trim()) return;
    
    setCurrentRecord(prev => ({
      ...prev,
      fillerWords: {
        ...prev.fillerWords,
        [word]: (prev.fillerWords[word] || 0) + 1
      }
    }));

    if (customWord) {
      setCustomWord('');
      setShowCustomInput(false);
    }
  };

  const removeFillerWord = (word: string) => {
    setCurrentRecord(prev => {
      const newFillerWords = { ...prev.fillerWords };
      if (newFillerWords[word] > 1) {
        newFillerWords[word]--;
      } else {
        delete newFillerWords[word];
      }
      return {
        ...prev,
        fillerWords: newFillerWords
      };
    });
  };

  const resetRecord = () => {
    setCurrentRecord(prev => ({
      ...prev,
      fillerWords: {},
      totalCount: 0,
      notes: ''
    }));
  };

  const saveRecord = () => {
    onSaveRecord(currentRecord);
  };

  const quickAdd = (word: string, count: number = 1) => {
    for (let i = 0; i < count; i++) {
      addFillerWord(word);
    }
  };

  return (
    <Card className="bg-yellow-50 border-yellow-200">
      <CardHeader>
        <CardTitle className="flex items-center text-yellow-800">
          <Volume2 className="h-5 w-5 mr-2" />
          哼哈官记录 - {agendaItem.title}
        </CardTitle>
        <div className="text-sm text-yellow-700">
          演讲者: {currentRecord.speaker || '未指定'} | 总计哼哈词: {currentRecord.totalCount}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 演讲者输入 */}
        <div>
          <label className="text-sm font-medium text-yellow-800">演讲者姓名</label>
          <Input
            value={currentRecord.speaker}
            onChange={(e) => setCurrentRecord(prev => ({ ...prev, speaker: e.target.value }))}
            placeholder="输入演讲者姓名"
            className="bg-white border-yellow-300"
          />
        </div>

        {/* 快速添加区域 */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-yellow-800">快速记录哼哈词</h4>
          
          {/* 常用哼哈词快速按钮 */}
          <div className="grid grid-cols-4 gap-2">
            {COMMON_FILLER_WORDS.map(word => (
              <Button
                key={word}
                size="sm"
                variant="outline"
                onClick={() => addFillerWord(word)}
                className="text-xs bg-white hover:bg-yellow-100 border-yellow-300"
              >
                {word}
              </Button>
            ))}
          </div>

          {/* 选择器添加 */}
          <div className="flex gap-2">
            <Select value={selectedWord} onValueChange={setSelectedWord}>
              <SelectTrigger className="flex-1 bg-white border-yellow-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {COMMON_FILLER_WORDS.map(word => (
                  <SelectItem key={word} value={word}>{word}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => addFillerWord(selectedWord)} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* 自定义哼哈词 */}
          <div className="flex gap-2">
            <Input
              placeholder="自定义哼哈词"
              value={customWord}
              onChange={(e) => setCustomWord(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addFillerWord(customWord)}
              className="bg-white border-yellow-300"
            />
            <Button onClick={() => addFillerWord(customWord)} size="sm" disabled={!customWord.trim()}>
              添加
            </Button>
          </div>
        </div>

        {/* 哼哈词统计显示 */}
        {Object.keys(currentRecord.fillerWords).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-yellow-800">哼哈词统计</h4>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {Object.entries(currentRecord.fillerWords).map(([word, count]) => (
                <div key={word} className="flex items-center justify-between bg-white p-2 rounded border border-yellow-200">
                  <span className="text-sm font-medium">{word}</span>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="bg-yellow-200 text-yellow-800">
                      {count}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => addFillerWord(word)}
                      className="h-6 w-6 p-0 hover:bg-yellow-100"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFillerWord(word)}
                      className="h-6 w-6 p-0 hover:bg-yellow-100"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 备注区域 */}
        <div>
          <label className="text-sm font-medium text-yellow-800">备注与建议</label>
          <textarea
            value={currentRecord.notes}
            onChange={(e) => setCurrentRecord(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="记录观察到的表达习惯、改进建议等..."
            className="w-full h-20 p-2 border border-yellow-300 rounded bg-white resize-none text-sm"
          />
        </div>

        {/* 控制按钮 */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={resetRecord}
            className="border-yellow-300 hover:bg-yellow-100"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            重置
          </Button>
          <Button
            onClick={saveRecord}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            <FileText className="h-4 w-4 mr-2" />
            保存记录
          </Button>
        </div>

        {/* 哼哈官小贴士 */}
        <div className="bg-yellow-100 p-3 rounded text-xs text-yellow-800">
          <div className="font-medium mb-1">💡 哼哈官小贴士:</div>
          <div>• 专注倾听，准确记录每一个哼哈词</div>
          <div>• 观察演讲者的表达习惯和改进空间</div>
          <div>• 在报告中给出具体的改进建议</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FillerWordTracker;
