
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Volume2, Zap } from 'lucide-react';
import TimerDisplay from '@/components/timer/TimerDisplay';
import TimerControls from '@/components/timer/TimerControls';
import TimerRules from '@/components/timer/TimerRules';
import CurrentTime from '@/components/CurrentTime';

interface InlineTimerProps {
  agendaItem: {
    id: string;
    title: string;
    duration: number;
    type: 'speech' | 'evaluation' | 'table-topics' | 'break';
    scheduledTime?: string;
  };
  onComplete: (data: { actualDuration: number; isOvertime: boolean; overtimeAmount: number }) => void;
  onClose: () => void;
}

const InlineTimer: React.FC<InlineTimerProps> = ({ agendaItem, onComplete, onClose }) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const flashIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const targetDuration = agendaItem.duration;
  const isOvertime = timeElapsed > targetDuration;
  const overtimeAmount = Math.max(0, timeElapsed - targetDuration);

  // 计算计划时间与实际时间的差异
  const getTimeComparison = () => {
    if (!agendaItem.scheduledTime || !hasStarted) return null;
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const [scheduledHour, scheduledMinute] = agendaItem.scheduledTime.split(':').map(Number);
    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    
    const scheduledMinutes = scheduledHour * 60 + scheduledMinute;
    const currentMinutes = currentHour * 60 + currentMinute;
    const diffMinutes = currentMinutes - scheduledMinutes;
    
    return {
      isLate: diffMinutes > 0,
      isEarly: diffMinutes < 0,
      diffMinutes: Math.abs(diffMinutes)
    };
  };

  // 头马计时规则配置
  const getTimingRules = () => {
    const durationMinutes = targetDuration / 60;
    
    if (agendaItem.type === 'speech' || (agendaItem.type === 'evaluation' && durationMinutes >= 3)) {
      return {
        green: targetDuration - 120,
        yellow: targetDuration - 60,
        red: targetDuration,
        white: targetDuration + 30
      };
    } else if (agendaItem.type === 'table-topics' || (agendaItem.type === 'evaluation' && durationMinutes < 3)) {
      return {
        green: targetDuration - 60,
        yellow: targetDuration - 30,
        red: targetDuration,
        white: null
      };
    } else if (agendaItem.title.includes('分享') || agendaItem.title.includes('主持')) {
      return {
        green: targetDuration - 300,
        yellow: targetDuration - 120,
        red: targetDuration,
        white: null
      };
    } else {
      return {
        green: targetDuration,
        yellow: targetDuration - 30,
        red: targetDuration,
        white: null
      };
    }
  };

  const timingRules = getTimingRules();

  const getCurrentPhase = () => {
    if (timingRules.white && timeElapsed >= timingRules.white) return 'white';
    if (timeElapsed >= timingRules.red) return 'red';
    if (timeElapsed >= timingRules.yellow) return 'yellow';
    if (timeElapsed >= timingRules.green) return 'green';
    return 'none';
  };

  // 保存计时状态到本地存储
  useEffect(() => {
    const timerState = {
      agendaItemId: agendaItem.id,
      timeElapsed,
      isRunning,
      hasStarted,
      timestamp: Date.now()
    };
    localStorage.setItem(`timer_${agendaItem.id}`, JSON.stringify(timerState));
  }, [timeElapsed, isRunning, hasStarted, agendaItem.id]);

  // 从本地存储恢复计时状态
  useEffect(() => {
    const savedState = localStorage.getItem(`timer_${agendaItem.id}`);
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        const timeDiff = Math.floor((Date.now() - state.timestamp) / 1000);
        
        if (state.isRunning && timeDiff < 300) { // 5分钟内恢复状态
          setTimeElapsed(state.timeElapsed + timeDiff);
          setIsRunning(true);
          setHasStarted(true);
        } else if (state.hasStarted) {
          setTimeElapsed(state.timeElapsed);
          setHasStarted(true);
        }
      } catch (error) {
        console.error('恢复计时状态失败:', error);
      }
    }
  }, [agendaItem.id]);

  useEffect(() => {
    // Create audio context for beep sound
    if (typeof window !== 'undefined') {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioRef.current = {
          play: () => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
          }
        } as any;
      } catch (error) {
        console.log('Audio context not available');
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (flashIntervalRef.current) {
        clearInterval(flashIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
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

  useEffect(() => {
    // 阶段变化时播放提示音
    const phase = getCurrentPhase();
    if (phase !== 'none' && (timeElapsed === timingRules.green || timeElapsed === timingRules.yellow || timeElapsed === timingRules.red)) {
      if (audioRef.current) {
        audioRef.current.play();
      }
    }
  }, [timeElapsed]);

  const handleStart = () => {
    setIsRunning(true);
    setHasStarted(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    onComplete({
      actualDuration: timeElapsed,
      isOvertime: isOvertime,
      overtimeAmount: overtimeAmount
    });
    // 清除保存的状态
    localStorage.removeItem(`timer_${agendaItem.id}`);
  };

  const handleManualFlash = () => {
    setIsFlashing(true);
    if (audioRef.current) {
      audioRef.current.play();
    }
    
    // 频闪效果
    let flashCount = 0;
    flashIntervalRef.current = setInterval(() => {
      flashCount++;
      if (flashCount >= 6) { // 闪烁3次（每次包含开关）
        setIsFlashing(false);
        if (flashIntervalRef.current) {
          clearInterval(flashIntervalRef.current);
        }
      }
    }, 200);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentPhase = getCurrentPhase();
  const timeComparison = getTimeComparison();

  return (
    <Card className={`mb-4 border-2 transition-all duration-200 ${
      isFlashing ? 'animate-pulse bg-red-100 border-red-500' : 
      currentPhase === 'white' ? 'border-black bg-white animate-pulse' : 
      currentPhase === 'red' ? 'border-red-500 bg-red-50' : 
      currentPhase === 'yellow' ? 'border-yellow-500 bg-yellow-50' : 
      currentPhase === 'green' ? 'border-green-500 bg-green-50' : 'border-gray-200'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{agendaItem.title}</h3>
              {agendaItem.scheduledTime && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {agendaItem.scheduledTime}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>目标时长: {formatTime(targetDuration)}</span>
              {timeComparison && (
                <Badge variant={timeComparison.isLate ? "destructive" : timeComparison.isEarly ? "secondary" : "default"} className="text-xs">
                  {timeComparison.isLate ? `晚开始 ${timeComparison.diffMinutes}分钟` : 
                   timeComparison.isEarly ? `早开始 ${timeComparison.diffMinutes}分钟` : '准时开始'}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualFlash}
              className="flex items-center gap-1"
              disabled={isFlashing}
            >
              <Zap className="h-3 w-3" />
              {isFlashing ? '频闪中...' : '手动提示'}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
        </div>

        <div className="mb-4">
          <CurrentTime />
        </div>

        <TimerDisplay
          timeElapsed={timeElapsed}
          targetDuration={targetDuration}
          currentPhase={currentPhase}
          isOvertime={isOvertime}
          overtimeAmount={overtimeAmount}
        />

        <TimerControls
          isRunning={isRunning}
          hasStarted={hasStarted}
          onStart={handleStart}
          onPause={handlePause}
          onStop={handleStop}
        />

        <TimerRules timingRules={timingRules} />
      </CardContent>
    </Card>
  );
};

export default InlineTimer;
