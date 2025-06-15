
import React from 'react';

interface TimerRulesProps {
  timingRules: {
    green: number;
    yellow: number;
    red: number;
    white?: number | null;
  };
}

const TimerRules: React.FC<TimerRulesProps> = ({ timingRules }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mt-4 text-xs text-gray-500">
      <div className="grid grid-cols-2 gap-2">
        <div>绿牌: {formatTime(Math.max(0, timingRules.green))}</div>
        <div>黄牌: {formatTime(Math.max(0, timingRules.yellow))}</div>
        <div>红牌: {formatTime(timingRules.red)}</div>
        {timingRules.white && <div>白牌: {formatTime(timingRules.white)}</div>}
      </div>
    </div>
  );
};

export default TimerRules;
