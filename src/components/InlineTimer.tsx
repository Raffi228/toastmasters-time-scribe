import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import TimerDisplay from '@/components/timer/TimerDisplay';
import TimerControls from '@/components/timer/TimerControls';
import TimerRules from '@/components/timer/TimerRules';

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

  const currentPhase = getCurrentPhase();

  return (
    <Card className="mb-4 border-2" style={{ 
      borderColor: currentPhase === 'white' ? '#000' : 
                  currentPhase === 'red' ? '#ef4444' : 
                  currentPhase === 'yellow' ? '#eab308' : 
                  currentPhase === 'green' ? '#22c55e' : '#e5e7eb' 
    }}>
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
