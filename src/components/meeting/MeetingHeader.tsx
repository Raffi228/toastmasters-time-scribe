
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, Download } from 'lucide-react';

interface MeetingHeaderProps {
  meeting: {
    title: string;
    date: string;
    time: string;
  };
  onBack: () => void;
  onImport: () => void;
  onExport: () => void;
}

const MeetingHeader: React.FC<MeetingHeaderProps> = ({
  meeting,
  onBack,
  onImport,
  onExport
}) => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{meeting.title}</h1>
              <p className="text-sm text-gray-600">{meeting.date} {meeting.time}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button onClick={onImport} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Smart Import Agenda
            </Button>
            <Button onClick={onExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default MeetingHeader;
