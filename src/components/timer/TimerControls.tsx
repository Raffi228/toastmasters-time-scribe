
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square } from 'lucide-react';

interface TimerControlsProps {
  isRunning: boolean;
  hasStarted: boolean;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
}

const TimerControls: React.FC<TimerControlsProps> = ({
  isRunning,
  hasStarted,
  onStart,
  onPause,
  onStop
}) => {
  return (
    <div className="flex justify-center space-x-2">
      {!isRunning && (
        <Button onClick={onStart} size="sm" className="bg-green-600 hover:bg-green-700">
          <Play className="h-3 w-3 mr-1" />
          {hasStarted ? '继续' : '开始'}
        </Button>
      )}
      
      {isRunning && (
        <>
          <Button onClick={onPause} size="sm" variant="outline">
            <Pause className="h-3 w-3 mr-1" />
            暂停
          </Button>
          <Button onClick={onStop} size="sm" variant="destructive">
            <Square className="h-3 w-3 mr-1" />
            结束
          </Button>
        </>
      )}
    </div>
  );
};

export default TimerControls;
