
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, Pause, Square, Volume2 } from 'lucide-react';

interface AgendaItem {
  id: string;
  title: string;
  duration: number;
  type: 'speech' | 'evaluation' | 'table-topics' | 'break';
  speaker?: string;
}

interface TimerComponentProps {
  agendaItem: AgendaItem;
  onComplete: (data: { actualDuration: number; isOvertime: boolean; overtimeAmount: number }) => void;
  onBack: () => void;
}

const TimerComponent: React.FC<TimerComponentProps> = ({ agendaItem, onComplete, onBack }) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const targetDuration = agendaItem.duration;
  const warningTime = targetDuration * 0.8; // 80% warning
  const isOvertime = timeElapsed > targetDuration;
  const overtimeAmount = Math.max(0, timeElapsed - targetDuration);
  const progress = Math.min((timeElapsed / targetDuration) * 100, 100);

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
    if (timeElapsed === Math.floor(warningTime) || timeElapsed === targetDuration) {
      if (audioRef.current) {
        audioRef.current.play();
      }
    }
  }, [timeElapsed, warningTime, targetDuration]);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    setHasFinished(true);
  };

  const handleComplete = () => {
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
    if (timeElapsed >= warningTime) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = () => {
    if (isOvertime) return 'bg-red-500';
    if (timeElapsed >= warningTime) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <div className="text-center">
              <CardTitle className="text-2xl">{agendaItem.title}</CardTitle>
              {agendaItem.speaker && (
                <Badge variant="secondary" className="mt-2">{agendaItem.speaker}</Badge>
              )}
            </div>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {/* Main Timer Display */}
          <div className="text-center">
            <div className={`text-8xl font-mono font-bold ${getTimerColor()}`}>
              {formatTime(timeElapsed)}
            </div>
            <div className="text-lg text-gray-600 mt-2">
              目标时长: {formatTime(targetDuration)}
            </div>
            {isOvertime && (
              <div className="text-red-600 font-semibold mt-2">
                超时: {formatTime(overtimeAmount)}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>进度</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="relative">
              <Progress value={Math.min(progress, 100)} className="h-3" />
              {progress > 100 && (
                <div className="absolute top-0 left-0 h-3 bg-red-500 rounded-full opacity-50"
                     style={{ width: `${Math.min((progress - 100) * 2, 100)}%` }}>
                </div>
              )}
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>0:00</span>
              <span className="text-yellow-600">警告: {formatTime(Math.floor(warningTime))}</span>
              <span>{formatTime(targetDuration)}</span>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex justify-center space-x-4">
            {timeElapsed >= warningTime && timeElapsed < targetDuration && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                <Volume2 className="h-3 w-3 mr-1" />
                接近时间
              </Badge>
            )}
            {timeElapsed >= targetDuration && !isOvertime && (
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

          {/* Control Buttons */}
          <div className="flex justify-center space-x-4">
            {!isRunning && !hasFinished && (
              <Button onClick={handleStart} size="lg" className="bg-green-600 hover:bg-green-700">
                <Play className="h-5 w-5 mr-2" />
                开始
              </Button>
            )}
            
            {isRunning && (
              <>
                <Button onClick={handlePause} size="lg" variant="outline">
                  <Pause className="h-5 w-5 mr-2" />
                  暂停
                </Button>
                <Button onClick={handleStop} size="lg" variant="destructive">
                  <Square className="h-5 w-5 mr-2" />
                  结束
                </Button>
              </>
            )}

            {!isRunning && timeElapsed > 0 && !hasFinished && (
              <Button onClick={handleStart} size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Play className="h-5 w-5 mr-2" />
                继续
              </Button>
            )}
          </div>

          {/* Complete Button */}
          {(hasFinished || (!isRunning && timeElapsed > 0)) && (
            <div className="text-center">
              <Button onClick={handleComplete} size="lg" className="bg-blue-600 hover:bg-blue-700">
                完成记录
              </Button>
            </div>
          )}

          {/* Timer Rules Info */}
          <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
            <h4 className="font-semibold mb-2">计时规则说明:</h4>
            <ul className="space-y-1">
              <li>• 80% 时间时会有提醒音</li>
              <li>• 到达目标时间时会有提醒音</li>
              <li>• 超时后显示红色警告</li>
              <li>• 可随时暂停和继续计时</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimerComponent;
