
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const CurrentTime: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="text-center">
      <div className="text-xs text-gray-500 mb-1">{t('time.current')}</div>
      <div className="text-lg font-mono font-semibold text-gray-700">
        {formatTime(currentTime)}
      </div>
    </div>
  );
};

export default CurrentTime;
