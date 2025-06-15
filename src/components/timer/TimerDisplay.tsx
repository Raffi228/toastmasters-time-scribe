
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Volume2 } from 'lucide-react';

interface TimerDisplayProps {
  timeElapsed: number;
  targetDuration: number;
  currentPhase: string;
  isOvertime: boolean;
  overtimeAmount: number;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timeElapsed,
  targetDuration,
  currentPhase,
  isOvertime,
  overtimeAmount
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRemainingTime = () => {
    const remaining = Math.max(0, targetDuration - timeElapsed);
    return formatTime(remaining);
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

  return (
    <div className="text-center mb-4">
      <div className={`text-4xl font-mono font-bold mb-2 ${
        currentPhase === 'red' || currentPhase === 'white' ? 'text-red-600' : 
        currentPhase === 'yellow' ? 'text-yellow-600' : 
        currentPhase === 'green' ? 'text-green-600' : 'text-gray-800'
      }`}>
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
      
      <div className="flex justify-center mb-4">
        <Badge className={`${getPhaseColor(currentPhase)} text-lg px-4 py-2`}>
          <Volume2 className="h-4 w-4 mr-2" />
          {getPhaseText(currentPhase)}
        </Badge>
      </div>
    </div>
  );
};

export default TimerDisplay;
