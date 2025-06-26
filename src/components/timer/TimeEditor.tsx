
import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface TimeEditorProps {
  value: number; // 时长（分钟）
  onChange: (value: number) => void;
  onCancel: () => void;
  className?: string;
}

const TimeEditor: React.FC<TimeEditorProps> = ({ value, onChange, onCancel, className = '' }) => {
  const [inputValue, setInputValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // 只允许数字输入，允许空字符串
    if (newValue === '' || /^\d+$/.test(newValue)) {
      setInputValue(newValue);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleSave = () => {
    // 如果输入为空或无效，默认为1分钟
    const finalValue = inputValue === '' ? 1 : Math.max(1, Math.min(60, parseInt(inputValue) || 1));
    onChange(finalValue);
  };

  const handleClear = () => {
    setInputValue('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onBlur={handleSave}
          className="w-16 h-8 text-center text-sm"
          placeholder="分钟"
        />
        {inputValue && (
          <button
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            type="button"
          >
            ×
          </button>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" onClick={handleSave} className="h-6 w-6 p-0">
          <Check className="h-3 w-3 text-green-600" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} className="h-6 w-6 p-0">
          <X className="h-3 w-3 text-red-600" />
        </Button>
      </div>
    </div>
  );
};

export default TimeEditor;
