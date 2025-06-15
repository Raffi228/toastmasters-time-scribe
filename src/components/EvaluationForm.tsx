
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, Save, Eye } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AgendaItem {
  id: string;
  title: string;
  duration: number;
  type: 'speech' | 'evaluation' | 'table-topics' | 'break';
  speaker?: string;
}

interface EvaluationData {
  content: string;
  strengths: string[];
  improvements: string[];
}

interface EvaluationFormProps {
  agendaItem: AgendaItem;
  initialData?: EvaluationData;
  onSave: (data: EvaluationData) => void;
  onBack: () => void;
}

const EvaluationForm: React.FC<EvaluationFormProps> = ({ 
  agendaItem, 
  initialData, 
  onSave, 
  onBack 
}) => {
  const [content, setContent] = useState(initialData?.content || '');
  const [strengths, setStrengths] = useState<string[]>(initialData?.strengths || ['']);
  const [improvements, setImprovements] = useState<string[]>(initialData?.improvements || ['']);
  const [isPreview, setIsPreview] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    const autoSave = setTimeout(() => {
      if (content || strengths.some(s => s.trim()) || improvements.some(i => i.trim())) {
        localStorage.setItem(`evaluation_${agendaItem.id}`, JSON.stringify({
          content,
          strengths: strengths.filter(s => s.trim()),
          improvements: improvements.filter(i => i.trim())
        }));
      }
    }, 2000);

    return () => clearTimeout(autoSave);
  }, [content, strengths, improvements, agendaItem.id]);

  const addStrength = () => {
    setStrengths([...strengths, '']);
  };

  const removeStrength = (index: number) => {
    setStrengths(strengths.filter((_, i) => i !== index));
  };

  const updateStrength = (index: number, value: string) => {
    const newStrengths = [...strengths];
    newStrengths[index] = value;
    setStrengths(newStrengths);
  };

  const addImprovement = () => {
    setImprovements([...improvements, '']);
  };

  const removeImprovement = (index: number) => {
    setImprovements(improvements.filter((_, i) => i !== index));
  };

  const updateImprovement = (index: number, value: string) => {
    const newImprovements = [...improvements];
    newImprovements[index] = value;
    setImprovements(newImprovements);
  };

  const handleSave = () => {
    const evaluationData: EvaluationData = {
      content,
      strengths: strengths.filter(s => s.trim()),
      improvements: improvements.filter(i => i.trim())
    };
    
    onSave(evaluationData);
    
    // Clear auto-save
    localStorage.removeItem(`evaluation_${agendaItem.id}`);
  };

  const getEvaluationTemplate = () => {
    switch (agendaItem.type) {
      case 'speech':
        return `对于 ${agendaItem.speaker} 的演讲《${agendaItem.title}》的点评：

# 整体印象
[请描述演讲的整体印象和主要观点]

# 表现优秀的方面
[列举演讲者的亮点和优势]

# 改进建议
[提供具体的改进建议]

# 总结
[简要总结并给予鼓励]`;
      
      case 'table-topics':
        return `即兴演讲点评：

# 应题能力
[评价演讲者对题目的理解和回应]

# 结构清晰度
[评价演讲的逻辑结构]

# 表达流畅度
[评价语言表达和临场发挥]

# 改进建议
[提供具体建议]`;

      default:
        return '';
    }
  };

  const loadTemplate = () => {
    if (!content.trim()) {
      setContent(getEvaluationTemplate());
    }
  };

  const formatPreview = () => {
    let preview = content;
    
    if (strengths.filter(s => s.trim()).length > 0) {
      preview += '\n\n## 优点总结\n';
      strengths.filter(s => s.trim()).forEach((strength, index) => {
        preview += `${index + 1}. ${strength}\n`;
      });
    }
    
    if (improvements.filter(i => i.trim()).length > 0) {
      preview += '\n\n## 改进建议\n';
      improvements.filter(i => i.trim()).forEach((improvement, index) => {
        preview += `${index + 1}. ${improvement}\n`;
      });
    }
    
    return preview;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">点评记录</h1>
                <p className="text-sm text-gray-600">{agendaItem.title}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsPreview(!isPreview)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {isPreview ? '编辑' : '预览'}
              </Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                保存点评
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Meeting Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-3">
                  <span>{agendaItem.title}</span>
                  {agendaItem.speaker && (
                    <Badge variant="secondary">{agendaItem.speaker}</Badge>
                  )}
                </CardTitle>
                <Badge variant="outline">
                  {agendaItem.type === 'speech' ? '备稿演讲' :
                   agendaItem.type === 'evaluation' ? '点评环节' :
                   agendaItem.type === 'table-topics' ? '即兴演讲' : '其他'}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Content Area */}
          {isPreview ? (
            /* Preview Mode */
            <Card>
              <CardHeader>
                <CardTitle>点评预览</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {formatPreview()}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Edit Mode */
            <Tabs defaultValue="content" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">主要内容</TabsTrigger>
                <TabsTrigger value="strengths">优点记录</TabsTrigger>
                <TabsTrigger value="improvements">改进建议</TabsTrigger>
              </TabsList>

              <TabsContent value="content">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>点评内容</CardTitle>
                      <Button
                        variant="outline"
                        onClick={loadTemplate}
                        disabled={content.trim().length > 0}
                      >
                        加载模板
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="请输入详细的点评内容..."
                      className="min-h-[400px] font-mono text-sm"
                    />
                    <div className="mt-2 text-xs text-gray-500">
                      支持 Markdown 格式 | 自动保存已启用
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="strengths">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>优点记录</CardTitle>
                      <Button onClick={addStrength} size="sm">
                        <Plus className="h-3 w-3 mr-1" />
                        添加优点
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {strengths.map((strength, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Label className="text-sm text-gray-500 w-8">
                            {index + 1}.
                          </Label>
                          <Input
                            value={strength}
                            onChange={(e) => updateStrength(index, e.target.value)}
                            placeholder="请输入一个优点..."
                            className="flex-1"
                          />
                          {strengths.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeStrength(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="improvements">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>改进建议</CardTitle>
                      <Button onClick={addImprovement} size="sm">
                        <Plus className="h-3 w-3 mr-1" />
                        添加建议
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {improvements.map((improvement, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Label className="text-sm text-gray-500 w-8">
                            {index + 1}.
                          </Label>
                          <Input
                            value={improvement}
                            onChange={(e) => updateImprovement(index, e.target.value)}
                            placeholder="请输入一个改进建议..."
                            className="flex-1"
                          />
                          {improvements.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeImprovement(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Help Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-sm text-blue-800">点评指南</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-700">
              <ul className="space-y-1">
                <li>• 先肯定演讲者的优点和亮点</li>
                <li>• 提供具体、可行的改进建议</li>
                <li>• 保持积极正面的语调</li>
                <li>• 可以分享个人经验和技巧</li>
                <li>• 内容会自动保存，无需担心丢失</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default EvaluationForm;
