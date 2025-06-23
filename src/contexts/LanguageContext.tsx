
import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'zh' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  zh: {
    // Header
    'app.title': '时间官助手',
    'app.subtitle': '头马俱乐部时间管理与点评记录工具',
    'button.newMeeting': '新建会议',
    'button.cancel': '取消',
    
    // Import
    'import.title': '智能导入议程',
    'import.description': '支持复制粘贴表格数据，自动识别时间、项目、时长、演讲者等信息',
    'import.agendaText': '议程文本',
    'import.placeholder': '请粘贴议程文本，支持表格格式：\n\n时间\t项目\t时长\t演讲者\n19:00\t开场致辞\t3\'\t张主席\n19:05\t备稿演讲\t5-7\'\t李演讲者\n...',
    'import.importItems': '导入',
    
    // Stats
    'stats.monthlyMeetings': '本月会议',
    'stats.monthlyMeetings.change': '+1 较上月',
    'stats.timerRecords': '计时记录',
    'stats.timerRecords.total': '总计时次数',
    'stats.evaluationRecords': '点评记录',
    'stats.evaluationRecords.count': '点评份数',
    
    // Meeting list
    'meetings.title': '会议列表',
    'meetings.agendaItems': '个议程项目',
    'meetings.estimatedDuration': '预计时长',
    'meetings.minutes': '分钟',
    'button.enterMeeting': '进入会议',
    'button.viewMeeting': '查看会议',
    
    // Status
    'status.active': '进行中',
    'status.upcoming': '即将开始',
    'status.completed': '已结束',
    
    // Time
    'time.current': '当前时间',
  },
  en: {
    // Header
    'app.title': 'Timer Assistant',
    'app.subtitle': 'Toastmasters Club Timer & Evaluation Tool',
    'button.newMeeting': 'New Meeting',
    'button.cancel': 'Cancel',
    
    // Import
    'import.title': 'Smart Import Agenda',
    'import.description': 'Support copy-paste table data, automatically recognize time, items, duration, speakers and other information',
    'import.agendaText': 'Agenda Text',
    'import.placeholder': 'Please paste agenda text, supports table format:\n\nTime\tItem\tDuration\tSpeaker\n19:00\tOpening Speech\t3\'\tChairman Zhang\n19:05\tPrepared Speech\t5-7\'\tSpeaker Li\n...',
    'import.importItems': 'Import',
    
    // Stats
    'stats.monthlyMeetings': 'Monthly Meetings',
    'stats.monthlyMeetings.change': '+1 from last month',
    'stats.timerRecords': 'Timer Records',
    'stats.timerRecords.total': 'Total timer count',
    'stats.evaluationRecords': 'Evaluation Records',
    'stats.evaluationRecords.count': 'Evaluation count',
    
    // Meeting list
    'meetings.title': 'Meeting List',
    'meetings.agendaItems': 'agenda items',
    'meetings.estimatedDuration': 'Estimated duration',
    'meetings.minutes': 'minutes',
    'button.enterMeeting': 'Enter Meeting',
    'button.viewMeeting': 'View Meeting',
    
    // Status
    'status.active': 'Active',
    'status.upcoming': 'Upcoming',
    'status.completed': 'Completed',
    
    // Time
    'time.current': 'Current Time',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('zh');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
