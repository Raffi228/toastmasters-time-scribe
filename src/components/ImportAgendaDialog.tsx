
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Copy, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { parseAgendaText, validateAgendaItems, type ParsedAgendaItem } from './import/AgendaParser';
import { useLanguage } from '@/contexts/LanguageContext';

interface ImportAgendaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (agenda: Array<Omit<ParsedAgendaItem, 'id'>>) => void;
}

const ImportAgendaDialog: React.FC<ImportAgendaDialogProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const { t } = useLanguage();
  const [inputText, setInputText] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedAgendaItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const exampleText = `时间	项目	时长	姓名	等级
19:00	开场致辞	3'	张主席	DTM
19:05	暖场分享	8'	李小明	CC
19:15	会议介绍	2'	王主持	CL
19:20	备稿演讲：《科技改变生活》	5-7'	陈演讲者	CC
19:28	即兴演讲环节	20'	刘主持人	ACB
19:50	备稿演讲：《团队协作的力量》	5-7'	赵发言人	CC
19:58	个体评估1	2-3'	孙评估员	ACB
20:02	个体评估2	2-3'	周点评人	CC
20:08	即兴评估	5-7'	吴评估师	DTM
20:16	语法官报告	2'	郑语法官	CL
20:19	总评报告	3'	何总评官	DTM
20:25	休息时间	10'		
20:35	颁奖环节	5'	主席团	DTM`;

  // 添加调试日志
  useEffect(() => {
    console.log('ImportAgendaDialog state:', {
      inputText: inputText.length,
      parsedItems: parsedItems.length,
      errors: errors.length,
      isOpen
    });
  }, [inputText, parsedItems, errors, isOpen]);

  const handleTextChange = (text: string) => {
    console.log('输入文本变化:', text.length);
    setInputText(text);
    
    if (text.trim()) {
      try {
        const items = parseAgendaText(text);
        console.log('解析结果:', items);
        const validationErrors = validateAgendaItems(items);
        console.log('验证错误:', validationErrors);
        setParsedItems(items);
        setErrors(validationErrors);
      } catch (error) {
        console.error('解析出错:', error);
        setParsedItems([]);
        setErrors(['解析失败，请检查文本格式']);
      }
    } else {
      setParsedItems([]);
      setErrors([]);
    }
  };

  const handleImport = () => {
    console.log('开始导入:', parsedItems.length, '项');
    if (parsedItems.length > 0) {
      onImport(parsedItems);
      onClose();
      setInputText('');
      setParsedItems([]);
      setErrors([]);
    }
  };

  const handleClose = () => {
    onClose();
    setInputText('');
    setParsedItems([]);
    setErrors([]);
  };

  const handleUseExample = () => {
    console.log('使用示例数据');
    setInputText(exampleText);
    handleTextChange(exampleText);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'speech': return t('agenda.type.speech') || '备稿演讲';
      case 'evaluation': return t('agenda.type.evaluation') || '点评环节';
      case 'table-topics': return t('agenda.type.tableTopics') || '即兴演讲';
      case 'break': return t('agenda.type.break') || '休息时间';
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

  // 判断是否可以导入
  const canImport = parsedItems.length > 0 && errors.length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl w-[95vw] h-[90vh] flex flex-col p-0">
        {/* 固定头部 */}
        <DialogHeader className="px-6 py-4 border-b bg-slate-50 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Upload className="h-5 w-5 text-blue-600" />
            {t('import.title') || '智能导入议程'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {t('import.description') || '支持复制粘贴表格数据，自动识别时间、项目、时长、演讲者等信息'}
          </DialogDescription>
        </DialogHeader>

        {/* 主要内容区域 */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* 左侧输入区域 */}
          <div className="w-full lg:w-1/2 flex flex-col border-r border-gray-200">
            {/* 输入标题 */}
            <div className="px-6 py-3 border-b bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <Label className="text-sm font-medium text-gray-700">
                  {t('import.agendaText') || '议程文本'}
                </Label>
              </div>
            </div>

            {/* 输入框区域 */}
            <div className="flex-1 p-6 flex flex-col gap-4 min-h-0">
              <div className="flex-1">
                <Textarea
                  placeholder={t('import.placeholder') || `请粘贴议程文本，支持表格格式：

时间	项目	时长	演讲者
19:00	开场致辞	3'	张主席
19:05	备稿演讲	5-7'	李演讲者
...`}
                  value={inputText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  className="h-full resize-none font-mono text-sm border-2 border-dashed border-gray-300 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* 示例区域 */}
              <Card className="flex-shrink-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-700">
                    {t('import.example') || '导入示例'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="text-xs text-gray-500">
                      {t('import.exampleDescription') || '支持复制粘贴表格数据，包含：时间、项目、时长、演讲者等信息'}
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md border max-h-20 overflow-y-auto">
                      <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap">
                        {exampleText}
                      </pre>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUseExample}
                      className="w-full h-8 text-xs"
                    >
                      <Copy className="h-3 w-3 mr-2" />
                      {t('import.useExample') || '使用此示例'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 右侧预览区域 */}
          <div className="w-full lg:w-1/2 flex flex-col min-h-0">
            {/* 预览标题 */}
            <div className="px-6 py-3 border-b bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-2">
                {errors.length === 0 && parsedItems.length > 0 ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : errors.length > 0 ? (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {t('import.preview') || '解析预览'} ({parsedItems.length} {t('import.items') || '项'})
                </span>
              </div>
            </div>

            {/* 预览内容 */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* 错误信息 */}
              {errors.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {t('import.parseErrors') || '解析错误'}:
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 预览项目 */}
              {parsedItems.length > 0 ? (
                <div className="space-y-3">
                  {parsedItems.map((item, index) => (
                    <Card key={index} className="border border-gray-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={`text-white text-xs ${getTypeBadgeColor(item.type)}`}>
                                {getTypeDisplayName(item.type)}
                              </Badge>
                              <span className="font-medium text-gray-900">{item.title}</span>
                              {item.scheduledTime && (
                                <Badge variant="outline" className="text-xs flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {item.scheduledTime}
                                </Badge>
                              )}
                            </div>
                            {item.speaker && (
                              <div className="text-sm text-gray-600">
                                {t('import.speaker') || '演讲者'}: {item.speaker}
                              </div>
                            )}
                          </div>
                          <div className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {formatTime(item.duration)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : inputText.trim() === '' ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">
                    {t('import.noContent') || '请在左侧输入议程文本'}
                  </p>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">
                    {t('import.parsing') || '正在解析...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 固定底部按钮区域 - 始终显示 */}
        <div className="px-6 py-4 border-t bg-gray-50 flex-shrink-0">
          <div className="flex justify-between items-center w-full">
            {/* 左侧状态信息 */}
            <div className="text-sm text-gray-600">
              {parsedItems.length > 0 && (
                <span>已解析 {parsedItems.length} 个议程项目</span>
              )}
              {errors.length > 0 && (
                <span className="text-red-600 ml-2">({errors.length} 个错误)</span>
              )}
            </div>

            {/* 右侧按钮 */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="px-6">
                {t('button.cancel') || '取消'}
              </Button>
              <Button 
                onClick={handleImport}
                disabled={!canImport}
                className={`px-6 ${canImport 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {parsedItems.length > 0 
                  ? `${t('import.importItems') || '导入'} ${parsedItems.length} 项`
                  : t('import.importItems') || '导入'
                }
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportAgendaDialog;
