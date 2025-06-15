
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, Volume2 } from 'lucide-react';

interface InlineTimerProps {
  onComplete: (data: { actualDuration: number; isOvertime: boolean; overtimeAmount: number }) => void;
  onClose: () => void;
}

const InlineTimer: React.FC<InlineTimerProps> = ({ onComplete, onClose }) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [targetDuration, setTargetDuration] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Preset durations in seconds
  const presetDurations = [
    { label: '1分钟', value: 60 },
    { label: '2分钟', value: 120 },
    { label: '3分钟', value: 180 },
    { label: '5分钟', value: 300 },
    { label: '7分钟', value: 420 },
    { label: '10分钟', value: 600 }
  ];

  const isOvertime = timeElapsed > targetDuration && targetDuration > 0;
  const overtimeAmount = Math.max(0, timeElapsed - targetDuration);
  const warningTime = targetDuration * 0.8;

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
    // Play warning sound at 80% and at target time
    if (targetDuration > 0 && (timeElapsed === Math.floor(warningTime) || timeElapsed === targetDuration)) {
      if (audioRef.current) {
        audioRef.current.play();
      }
    }
  }, [timeElapsed, warningTime, targetDuration]);

  const handleDurationSelect = (duration: number) => {
    setTargetDuration(duration);
    setTimeElapsed(0);
    setIsRunning(false);
    setHasStarted(false);
  };

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

  const getTimerColor = () => {
    if (isOvertime) return 'text-red-600';
    if (timeElapsed >= warningTime && targetDuration > 0) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">计时器</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        {!hasStarted && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">选择计时时长：</p>
            <div className="grid grid-cols-3 gap-2">
              {presetDurations.map((preset) => (
                <Button
                  key={preset.value}
                  variant={targetDuration === preset.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDurationSelect(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {targetDuration > 0 && (
          <div className="text-center mb-4">
            <div className={`text-4xl font-mono font-bold ${getTimerColor()}`}>
              {formatTime(timeElapsed)}
            </div>
            <div className="text-sm text-gray-600">
              目标: {formatTime(targetDuration)}
            </div>
            {isOvertime && (
              <div className="text-red-600 font-semibold">
                超时: {formatTime(overtimeAmount)}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-center space-x-2 mb-4">
          {timeElapsed >= warningTime && timeElapsed < targetDuration && targetDuration > 0 && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              <Volume2 className="h-3 w-3 mr-1" />
              接近时间
            </Badge>
          )}
          {timeElapsed >= targetDuration && !isOvertime && targetDuration > 0 && (
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              <Volume2 className="h-3 w-3 mr-1" />
              时间到
            </Badge>
          )}
          {isOvertime && (
            <Badge variant="destructive">
              <Volume2 className="h-3 w-3 mr-1" />
              超时
            </Badge>
          )}
        </div>

        <div className="flex justify-center space-x-2">
          {!isRunning && targetDuration > 0 && (
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
      </CardContent>
    </Card>
  );
};

export default InlineTimer;
