
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy } from 'lucide-react';

interface ImportExamplesProps {
  onUseExample: (text: string) => void;
}

const ImportExamples: React.FC<ImportExamplesProps> = ({ onUseExample }) => {
  const exampleText = `时间	项目	时长	姓名	等级
19:00	开场致辞	3'	张主席	DTM
19:05	暖场分享	8'	李小明	CC
19:15	会议介绍	2'	王主持	CL
19:20	备稿演讲：《科技改变生活》	5-7'	陈演讲者	CC
19:28	即兴演讲环节	20'	刘主持人	ACB
19:50	备稿演讲：《团队协作的力量》	5-7'	赵发言人	CC
19:58	个体评估1	2-3'	孙评估员	ACB
20:02	个体评估2	2-3'	周点评人	CC
20:08	即兴评估	5-7'	吴评估师	DTM
20:16	语法官报告	2'	郑语法官	CL
20:19	总评报告	3'	何总评官	DTM
20:25	休息时间	10'		
20:35	颁奖环节	5'	主席团	DTM`;

  const handleUseExample = () => {
    onUseExample(exampleText);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">导入示例</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            支持复制粘贴表格数据，包含：时间、项目、时长、演讲者等信息
          </div>
          <div className="bg-gray-50 p-3 rounded text-xs font-mono max-h-32 overflow-y-auto">
            <pre>{exampleText}</pre>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUseExample}
            className="w-full"
          >
            <Copy className="h-3 w-3 mr-2" />
            使用此示例
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportExamples;
