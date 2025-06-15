import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, Volume2, Settings, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { PRESET_RULES, getTypeFromTitle, type AgendaType, type TimerRules, type TimerConfig } from '@/types/timer';
import CurrentTime from '@/components/CurrentTime';

interface AdvancedTimerProps {
  agendaItem: {
    id: string;
    title: string;
    duration: number;
    type: 'speech' | 'evaluation' | 'table-topics' | 'break';
    speaker?: string;
  };
  onComplete: (data: { actualDuration: number; isOvertime: boolean; overtimeAmount: number }) => void;
  onClose: () => void;
  onUpdate?: (updatedItem: { id: string; title: string; duration: number; speaker?: string; type: 'speech' | 'evaluation' | 'table-topics' | 'break' }) => void;
}

interface PersonalTimer {
  id: string;
  name: string;
  timeElapsed: number;
  isRunning: boolean;
}

// 类型映射函数：将议程类型映射到计时器类型
const mapAgendaTypeToTimerType = (agendaType: string): AgendaType => {
  switch (agendaType) {
    case 'speech': return 'speech';
    case 'evaluation': return 'longEval';
    case 'table-topics': return 'shortEval';
    case 'break': return 'other';
    default: return 'other';
  }
};

// 类型映射函数：将计时器类型映射到议程类型
const mapTimerTypeToAgendaType = (timerType: AgendaType): 'speech' | 'evaluation' | 'table-topics' | 'break' => {
  switch (timerType) {
    case 'speech': return 'speech';
    case 'longEval': 
    case 'shortEval': return 'evaluation';
    case 'shareHost': return 'speech';
    case 'other': return 'break';
    default: return 'break';
  }
};

const AdvancedTimer: React.FC<AdvancedTimerProps> = ({ agendaItem, onComplete, onClose, onUpdate }) => {
  const [currentTitle, setCurrentTitle] = useState(agendaItem.title);
  const [currentSpeaker, setCurrentSpeaker] = useState(agendaItem.speaker || '');
  const [currentType, setCurrentType] = useState(agendaItem.type);
  const [timeRemaining, setTimeRemaining] = useState(agendaItem.duration);
  const [originalDuration, setOriginalDuration] = useState(agendaItem.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showCustomRules, setShowCustomRules] = useState(false);
  const [selectedType, setSelectedType] = useState<AgendaType>(() => 
    mapAgendaTypeToTimerType(agendaItem.type)
  );
  const [customRules, setCustomRules] = useState<TimerRules>(() => 
    PRESET_RULES[mapAgendaTypeToTimerType(agendaItem.type)]
  );
  
  // 即兴演讲个人计时器
  const [isTableTopics, setIsTableTopics] = useState(false);
  const [personalTimers, setPersonalTimers] = useState<PersonalTimer[]>([]);
  const [newPersonName, setNewPersonName] = useState('');
  
  // 编辑状态
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [isEditingSpeaker, setIsEditingSpeaker] = useState(false);
  const [editTitle, setEditTitle] = useState(agendaItem.title);
  const [editDuration, setEditDuration] = useState(Math.round(agendaItem.duration / 60));
  const [editSpeaker, setEditSpeaker] = useState(agendaItem.speaker || '');
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const personalIntervalsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const audioContextRef = useRef<AudioContext | null>(null);

  // 检查是否为即兴演讲环节
  useEffect(() => {
    const isImpromptu = currentType === 'table-topics' || 
                       selectedType === 'shortEval' ||
                       currentTitle.includes('即兴') || 
                       currentTitle.toLowerCase().includes('table topics');
    setIsTableTopics(isImpromptu);
  }, [currentType, selectedType, currentTitle]);

  // 初始化音频上下文
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.log('Audio context not available');
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      Object.values(personalIntervalsRef.current).forEach(interval => {
        clearInterval(interval);
      });
    };
  }, []);

  // 主计时器逻辑
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // 个人计时器逻辑
  useEffect(() => {
    personalTimers.forEach(timer => {
      if (timer.isRunning && !personalIntervalsRef.current[timer.id]) {
        personalIntervalsRef.current[timer.id] = setInterval(() => {
          setPersonalTimers(prev => prev.map(t => 
            t.id === timer.id ? { ...t, timeElapsed: t.timeElapsed + 1 } : t
          ));
        }, 1000);
      } else if (!timer.isRunning && personalIntervalsRef.current[timer.id]) {
        clearInterval(personalIntervalsRef.current[timer.id]);
        delete personalIntervalsRef.current[timer.id];
      }
    });

    return () => {
      Object.values(personalIntervalsRef.current).forEach(interval => {
        clearInterval(interval);
      });
      personalIntervalsRef.current = {};
    };
  }, [personalTimers]);

  // 获取当前计时规则
  const getCurrentRules = (): TimerRules => {
    if (showCustomRules) {
      return customRules;
    }
    return PRESET_RULES[selectedType];
  };

  // 获取当前阶段
  const getCurrentPhase = () => {
    const rules = getCurrentRules();
    
    if (timeRemaining <= (rules.white || -30)) return 'white';
    if (timeRemaining <= (rules.red || 0)) return 'red';
    if (timeRemaining <= rules.yellow) return 'yellow';
    if (timeRemaining <= rules.green) return 'green';
    return 'normal';
  };

  // 播放提示音
  const playSound = (frequency: number, duration: number = 0.5, volume: number = 0.3) => {
    if (!audioContextRef.current) return;
    
    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
      gainNode.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration);
    } catch (error) {
      console.log('Audio playback failed');
    }
  };

  // 阶段变化时播放提示音
  useEffect(() => {
    const rules = getCurrentRules();
    const phase = getCurrentPhase();
    
    if (timeRemaining === rules.green) {
      playSound(800, 0.5); // 绿牌提示音
    } else if (timeRemaining === rules.yellow) {
      playSound(1000, 0.8); // 黄牌警示音
    } else if (timeRemaining === (rules.red || 0)) {
      playSound(1200, 1.0, 0.5); // 红牌警示音
    } else if (phase === 'white') {
      playSound(1500, 0.3, 0.6); // 白牌强烈警示音
    }
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    return `${isNegative ? '-' : ''}${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    setHasStarted(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeRemaining(originalDuration);
  };

  const handleStop = () => {
    setIsRunning(false);
    const actualDuration = originalDuration - timeRemaining;
    const isOvertime = timeRemaining < 0;
    const overtimeAmount = Math.abs(Math.min(0, timeRemaining));
    
    onComplete({
      actualDuration,
      isOvertime,
      overtimeAmount
    });
  };

  const handleTypeChange = (type: AgendaType) => {
    setSelectedType(type);
    const newAgendaType = mapTimerTypeToAgendaType(type);
    setCurrentType(newAgendaType);
    
    if (!showCustomRules) {
      setCustomRules(PRESET_RULES[type]);
    }
    
    // 通知父组件更新
    if (onUpdate) {
      onUpdate({
        id: agendaItem.id,
        title: currentTitle,
        duration: originalDuration,
        speaker: currentSpeaker,
        type: newAgendaType
      });
    }
  };

  const handleTitleEdit = () => {
    setCurrentTitle(editTitle);
    setIsEditingTitle(false);
    
    // 通知父组件更新
    if (onUpdate) {
      onUpdate({
        id: agendaItem.id,
        title: editTitle,
        duration: originalDuration,
        speaker: currentSpeaker,
        type: currentType
      });
    }
  };

  const handleDurationEdit = () => {
    const newDuration = editDuration * 60;
    setOriginalDuration(newDuration);
    if (!hasStarted) {
      setTimeRemaining(newDuration);
    }
    setIsEditingDuration(false);
    
    // 通知父组件更新
    if (onUpdate) {
      onUpdate({
        id: agendaItem.id,
        title: currentTitle,
        duration: newDuration,
        speaker: currentSpeaker,
        type: currentType
      });
    }
  };

  const handleSpeakerEdit = () => {
    setCurrentSpeaker(editSpeaker);
    setIsEditingSpeaker(false);
    
    // 通知父组件更新
    if (onUpdate) {
      onUpdate({
        id: agendaItem.id,
        title: currentTitle,
        duration: originalDuration,
        speaker: editSpeaker,
        type: currentType
      });
    }
  };

  // 个人计时器管理
  const addPersonalTimer = () => {
    if (!newPersonName.trim()) return;
    
    const newTimer: PersonalTimer = {
      id: Date.now().toString(),
      name: newPersonName.trim(),
      timeElapsed: 0,
      isRunning: false
    };
    
    setPersonalTimers(prev => [...prev, newTimer]);
    setNewPersonName('');
  };

  const removePersonalTimer = (id: string) => {
    setPersonalTimers(prev => prev.filter(t => t.id !== id));
    if (personalIntervalsRef.current[id]) {
      clearInterval(personalIntervalsRef.current[id]);
      delete personalIntervalsRef.current[id];
    }
  };

  const togglePersonalTimer = (id: string) => {
    setPersonalTimers(prev => prev.map(timer => 
      timer.id === id ? { ...timer, isRunning: !timer.isRunning } : timer
    ));
  };

  const resetPersonalTimer = (id: string) => {
    setPersonalTimers(prev => prev.map(timer => 
      timer.id === id ? { ...timer, timeElapsed: 0, isRunning: false } : timer
    ));
    if (personalIntervalsRef.current[id]) {
      clearInterval(personalIntervalsRef.current[id]);
      delete personalIntervalsRef.current[id];
    }
  };

  const phase = getCurrentPhase();
  const rules = getCurrentRules();

  // 获取背景颜色
  const getBackgroundColor = () => {
    switch (phase) {
      case 'white': return 'bg-red-600 animate-pulse';
      case 'red': return 'bg-red-500';
      case 'yellow': return 'bg-yellow-500';
      case 'green': return 'bg-green-500';
      default: return 'bg-white';
    }
  };

  // 获取文字颜色
  const getTextColor = () => {
    return phase === 'normal' ? 'text-gray-900' : 'text-white';
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'white': return '白牌 - 强制停止';
      case 'red': return '红牌 - 时间到';
      case 'yellow': return '黄牌 - 准备结束';
      case 'green': return '绿牌 - 时间充足';
      default: return '正常计时';
    }
  };

  // 获取类型显示名称
  const getTypeDisplayName = (type: AgendaType) => {
    switch (type) {
      case 'speech': return '备稿演讲';
      case 'longEval': return '长评估';
      case 'shortEval': return '即兴/短评估';
      case 'shareHost': return '分享/主持';
      case 'other': return '其他环节';
      default: return type;
    }
  };

  return (
    <Card className={`mb-4 border-2 ${getBackgroundColor()} transition-all duration-300`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-white/20 border-white/30"
                  onBlur={handleTitleEdit}
                  onKeyPress={(e) => e.key === 'Enter' && handleTitleEdit()}
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={handleTitleEdit} className={getTextColor()}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingTitle(false)} className={getTextColor()}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div 
                className={`font-semibold ${getTextColor()} cursor-pointer hover:bg-white/10 p-1 rounded flex items-center gap-2`}
                onClick={() => setIsEditingTitle(true)}
              >
                {currentTitle}
                <Edit2 className="h-3 w-3 opacity-50" />
              </div>
            )}
            
            <div className="flex items-center gap-4 mt-1">
              {isEditingDuration ? (
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${getTextColor()} opacity-80`}>总时长:</span>
                  <Input
                    type="number"
                    value={editDuration}
                    onChange={(e) => setEditDuration(parseInt(e.target.value) || 1)}
                    className="w-16 h-6 text-xs bg-white/20 border-white/30"
                    onBlur={handleDurationEdit}
                    onKeyPress={(e) => e.key === 'Enter' && handleDurationEdit()}
                    autoFocus
                  />
                  <span className={`text-sm ${getTextColor()} opacity-80`}>分钟</span>
                  <Button size="sm" variant="ghost" onClick={handleDurationEdit} className={getTextColor()}>
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div 
                  className={`text-sm ${getTextColor()} opacity-80 cursor-pointer hover:bg-white/10 p-1 rounded flex items-center gap-1`}
                  onClick={() => setIsEditingDuration(true)}
                >
                  总时长: {formatTime(originalDuration)}
                  <Edit2 className="h-3 w-3 opacity-50" />
                </div>
              )}
              
              {isEditingSpeaker ? (
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${getTextColor()} opacity-80`}>演讲者:</span>
                  <Input
                    value={editSpeaker}
                    onChange={(e) => setEditSpeaker(e.target.value)}
                    className="w-24 h-6 text-xs bg-white/20 border-white/30"
                    onBlur={handleSpeakerEdit}
                    onKeyPress={(e) => e.key === 'Enter' && handleSpeakerEdit()}
                    autoFocus
                  />
                  <Button size="sm" variant="ghost" onClick={handleSpeakerEdit} className={getTextColor()}>
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div 
                  className={`text-sm ${getTextColor()} opacity-80 cursor-pointer hover:bg-white/10 p-1 rounded flex items-center gap-1`}
                  onClick={() => setIsEditingSpeaker(true)}
                >
                  演讲者: {currentSpeaker || '未指定'}
                  <Edit2 className="h-3 w-3 opacity-50" />
                </div>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className={getTextColor()}>
            ×
          </Button>
        </div>

        {/* 当前时间显示 */}
        <div className="text-center mb-4">
          <CurrentTime />
        </div>

        {/* 主倒计时显示 */}
        <div className="text-center mb-6">
          <div className={`text-6xl font-mono font-bold mb-2 ${getTextColor()}`}>
            {formatTime(timeRemaining)}
          </div>
          <Badge className={`text-lg px-4 py-2 ${
            phase === 'white' ? 'bg-white text-black border-2 border-black' :
            phase === 'red' ? 'bg-red-600 text-white' :
            phase === 'yellow' ? 'bg-yellow-600 text-white' :
            phase === 'green' ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'
          }`}>
            <Volume2 className="h-4 w-4 mr-2" />
            {getPhaseText()}
          </Badge>
        </div>

        {/* 主控制按钮 */}
        <div className="flex justify-center space-x-3 mb-6">
          {!isRunning && (
            <Button onClick={handleStart} className="bg-green-600 hover:bg-green-700">
              <Play className="h-4 w-4 mr-2" />
              {hasStarted ? '继续' : '开始'}
            </Button>
          )}
          
          {isRunning && (
            <>
              <Button onClick={handlePause} variant="outline">
                <Pause className="h-4 w-4 mr-2" />
                暂停
              </Button>
              <Button onClick={handleStop} variant="destructive">
                结束计时
              </Button>
            </>
          )}
          
          <Button onClick={handleReset} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            重置
          </Button>
        </div>

        {/* 即兴演讲个人计时器 */}
        {isTableTopics && (
          <div className="border-t pt-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <Label className={getTextColor()}>个人计时器</Label>
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="演讲者姓名"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  className="w-32 bg-white/20 border-white/30"
                  onKeyPress={(e) => e.key === 'Enter' && addPersonalTimer()}
                />
                <Button size="sm" onClick={addPersonalTimer} disabled={!newPersonName.trim()}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {personalTimers.map(timer => (
                <div key={timer.id} className="flex items-center justify-between bg-white/10 rounded p-2">
                  <div className="flex items-center space-x-3">
                    <span className={`font-medium ${getTextColor()}`}>{timer.name}</span>
                    <span className={`font-mono ${getTextColor()}`}>{formatTime(timer.timeElapsed)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => togglePersonalTimer(timer.id)}
                      className={getTextColor()}
                    >
                      {timer.isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => resetPersonalTimer(timer.id)}
                      className={getTextColor()}
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removePersonalTimer(timer.id)}
                      className={getTextColor()}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 规则配置 */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <Label className={getTextColor()}>计时规则配置</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCustomRules(!showCustomRules)}
              className={getTextColor()}
            >
              <Settings className="h-4 w-4 mr-1" />
              {showCustomRules ? '使用预设' : '自定义'}
            </Button>
          </div>

          {!showCustomRules ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className={getTextColor()}>环节类型</Label>
                <Select value={selectedType} onValueChange={handleTypeChange}>
                  <SelectTrigger className="bg-white/20 border-white/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg z-50">
                    <SelectItem value="speech">备稿演讲</SelectItem>
                    <SelectItem value="longEval">长评估</SelectItem>
                    <SelectItem value="shortEval">即兴/短评估</SelectItem>
                    <SelectItem value="shareHost">分享/主持</SelectItem>
                    <SelectItem value="other">其他环节</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-xs space-y-1">
                <div className={`${getTextColor()} opacity-80`}>规则预览:</div>
                <div className={`${getTextColor()} opacity-70`}>绿牌: 剩余 {formatTime(rules.green)}</div>
                <div className={`${getTextColor()} opacity-70`}>黄牌: 剩余 {formatTime(rules.yellow)}</div>
                <div className={`${getTextColor()} opacity-70`}>当前类型: {getTypeDisplayName(selectedType)}</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className={getTextColor()}>绿牌剩余时间(秒)</Label>
                <Input
                  type="number"
                  value={customRules.green}
                  onChange={(e) => setCustomRules(prev => ({ ...prev, green: parseInt(e.target.value) || 0 }))}
                  className="bg-white/20 border-white/30"
                />
              </div>
              <div>
                <Label className={getTextColor()}>黄牌剩余时间(秒)</Label>
                <Input
                  type="number"
                  value={customRules.yellow}
                  onChange={(e) => setCustomRules(prev => ({ ...prev, yellow: parseInt(e.target.value) || 0 }))}
                  className="bg-white/20 border-white/30"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedTimer;
