
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, Volume2 } from 'lucide-react';

interface InlineTimerProps {
  agendaItem: {
    id: string;
    title: string;
    duration: number;
    type: 'speech' | 'evaluation' | 'table-topics' | 'break';
  };
  onComplete: (data: { actualDuration: number; isOvertime: boolean; overtimeAmount: number }) => void;
  onClose: () => void;
}

const InlineTimer: React.FC<InlineTimerProps> = ({ agendaItem, onComplete, onClose }) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const targetDuration = agendaItem.duration;
  const isOvertime = timeElapsed > targetDuration;
  const overtimeAmount = Math.max(0, timeElapsed - targetDuration);

  // 头马计时规则配置
  const getTimingRules = () => {
    const durationMinutes = targetDuration / 60;
    
    if (agendaItem.type === 'speech' || (agendaItem.type === 'evaluation' && durationMinutes >= 3)) {
      // 备稿演讲、大于3分钟的评估
      return {
        green: targetDuration - 120, // 剩2分钟
        yellow: targetDuration - 60,  // 剩1分钟
        red: targetDuration,          // 时间到
        white: targetDuration + 30    // 30秒后立即停止
      };
    } else if (agendaItem.type === 'table-topics' || (agendaItem.type === 'evaluation' && durationMinutes < 3)) {
      // 即兴演讲、小于3分钟的评估
      return {
        green: targetDuration - 60,   // 剩1分钟
        yellow: targetDuration - 30,  // 剩30秒
        red: targetDuration,          // 时间到
        white: null
      };
    } else if (agendaItem.title.includes('分享') || agendaItem.title.includes('主持')) {
      // 分享、即兴主持
      return {
        green: targetDuration - 300,  // 剩5分钟
        yellow: targetDuration - 120, // 剩2分钟
        red: targetDuration,          // 时间到
        white: null
      };
    } else {
      // 其他环节
      return {
        green: targetDuration,        // 时间合格
        yellow: targetDuration - 30,  // 剩30秒
        red: targetDuration,          // 时间到
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

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'green': return 'bg-green-500 text-white';
      case 'yellow': return 'bg-yellow-500 text-white';
      case 'red': return 'bg-red-500 text-white';
      case 'white': return 'bg-white text-black border-2 border-black';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPhaseText = (phase: string) => {
    switch (phase) {
      case 'green': return '绿牌';
      case 'yellow': return '黄牌';
      case 'red': return '红牌';
      case 'white': return '白牌 - 立即停止';
      default: return '准备中';
    }
  };

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
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRemainingTime = () => {
    const remaining = Math.max(0, targetDuration - timeElapsed);
    return formatTime(remaining);
  };

  const currentPhase = getCurrentPhase();

  return (
    <Card className="mb-4 border-2" style={{ borderColor: currentPhase === 'white' ? '#000' : currentPhase === 'red' ? '#ef4444' : currentPhase === 'yellow' ? '#eab308' : currentPhase === 'green' ? '#22c55e' : '#e5e7eb' }}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">{agendaItem.title}</h3>
            <p className="text-sm text-gray-600">目标时长: {formatTime(targetDuration)}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="text-center mb-4">
          <div className={`text-4xl font-mono font-bold mb-2 ${currentPhase === 'red' || currentPhase === 'white' ? 'text-red-600' : currentPhase === 'yellow' ? 'text-yellow-600' : currentPhase === 'green' ? 'text-green-600' : 'text-gray-800'}`}>
            {formatTime(timeElapsed)}
          </div>
          <div className="text-lg text-gray-600 mb-2">
            剩余: {getRemainingTime()}
          </div>
          {isOvertime && (
            <div className="text-red-600 font-semibold">
              超时: {formatTime(overtimeAmount)}
            </div>
          )}
        </div>

        <div className="flex justify-center mb-4">
          <Badge className={`${getPhaseColor(currentPhase)} text-lg px-4 py-2`}>
            <Volume2 className="h-4 w-4 mr-2" />
            {getPhaseText(currentPhase)}
          </Badge>
        </div>

        <div className="flex justify-center space-x-2">
          {!isRunning && (
            <Button onClick={handleStart} size="sm" className="bg-green-600 hover:bg-green-700">
              <Play className="h-3 w-3 mr-1" />
              {hasStarted ? '继续' : '开始'}
            </Button>
          )}
          
          {isRunning && (
            <>
              <Button onClick={handlePause} size="sm" variant="outline">
                <Pause className="h-3 w-3 mr-1" />
                暂停
              </Button>
              <Button onClick={handleStop} size="sm" variant="destructive">
                <Square className="h-3 w-3 mr-1" />
                结束
              </Button>
            </>
          )}
        </div>

        {/* 时间规则提示 */}
        <div className="mt-4 text-xs text-gray-500">
          <div className="grid grid-cols-2 gap-2">
            <div>绿牌: {formatTime(Math.max(0, timingRules.green))}</div>
            <div>黄牌: {formatTime(Math.max(0, timingRules.yellow))}</div>
            <div>红牌: {formatTime(timingRules.red)}</div>
            {timingRules.white && <div>白牌: {formatTime(timingRules.white)}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InlineTimer;
