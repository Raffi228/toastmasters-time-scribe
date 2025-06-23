
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
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
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            智能导入议程
          </DialogTitle>
          <DialogDescription>
            支持复制粘贴表格数据，自动识别时间、项目、时长、演讲者等信息
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full p-6">
            {/* 左侧：输入区域 */}
            <div className="flex flex-col space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" />
                <Label htmlFor="agenda-text" className="text-base font-medium">议程文本</Label>
              </div>
              
              <Textarea
                id="agenda-text"
                placeholder="请粘贴议程文本，支持表格格式：

时间	项目	时长	演讲者
19:00	开场致辞	3'	张主席
19:05	备稿演讲	5-7'	李演讲者
..."
                value={inputText}
                onChange={(e) => handleTextChange(e.target.value)}
                className="flex-1 min-h-[300px] font-mono text-sm resize-none"
              />

              <ImportExamples onUseExample={handleUseExample} />
            </div>

            {/* 右侧：预览区域 */}
            <div className="flex flex-col">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  <AgendaPreview items={parsedItems} errors={errors} />
                </div>
              </ScrollArea>
              
              {parsedItems.length > 0 && (
                <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportAgendaDialog;
