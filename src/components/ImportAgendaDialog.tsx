
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Table } from 'lucide-react';
import { parseAgendaText, validateAgendaItems, type ParsedAgendaItem } from './import/AgendaParser';
import AgendaPreview from './import/AgendaPreview';
import ImportExamples from './import/ImportExamples';

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
  const [inputText, setInputText] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedAgendaItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const handleTextChange = (text: string) => {
    setInputText(text);
    
    if (text.trim()) {
      const items = parseAgendaText(text);
      const validationErrors = validateAgendaItems(items);
      setParsedItems(items);
      setErrors(validationErrors);
    } else {
      setParsedItems([]);
      setErrors([]);
    }
  };

  const handleImport = () => {
    if (errors.length === 0 && parsedItems.length > 0) {
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

  const handleUseExample = (text: string) => {
    setInputText(text);
    handleTextChange(text);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            智能导入议程
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
          {/* 左侧：输入区域 */}
          <div className="space-y-4">
            <Tabs defaultValue="paste" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="paste" className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  粘贴文本
                </TabsTrigger>
                <TabsTrigger value="table" className="flex items-center gap-1">
                  <Table className="h-3 w-3" />
                  表格数据
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="paste" className="space-y-3">
                <div>
                  <Label htmlFor="agenda-text">议程文本</Label>
                  <Textarea
                    id="agenda-text"
                    placeholder="请粘贴议程文本，支持表格格式..."
                    value={inputText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="table" className="space-y-3">
                <div>
                  <Label htmlFor="agenda-table">表格数据</Label>
                  <Textarea
                    id="agenda-table"
                    placeholder="时间	项目	时长	演讲者
19:00	开场致辞	3'	张主席
19:05	备稿演讲	5-7'	李演讲者"
                    value={inputText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <ImportExamples onUseExample={handleUseExample} />
          </div>

          {/* 右侧：预览区域 */}
          <div className="space-y-4 overflow-y-auto">
            <AgendaPreview items={parsedItems} errors={errors} />
            
            {parsedItems.length > 0 && (
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={handleClose}>
                  取消
                </Button>
                <Button 
                  onClick={handleImport}
                  disabled={errors.length > 0 || parsedItems.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  导入 {parsedItems.length} 项
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportAgendaDialog;
