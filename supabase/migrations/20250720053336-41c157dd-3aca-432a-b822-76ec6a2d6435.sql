-- 创建哼哈词记录表
CREATE TABLE public.filler_word_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agenda_item_id UUID NOT NULL,
  speaker TEXT NOT NULL,
  filler_words JSONB NOT NULL DEFAULT '{}',
  total_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用行级安全
ALTER TABLE public.filler_word_records ENABLE ROW LEVEL SECURITY;

-- 创建策略允许所有访问（因为这是演示应用）
CREATE POLICY "Allow all access to filler_word_records" 
ON public.filler_word_records 
FOR ALL 
USING (true);

-- 创建更新时间戳的触发器
CREATE TRIGGER update_filler_word_records_updated_at
BEFORE UPDATE ON public.filler_word_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 为实时更新启用复制标识
ALTER TABLE public.filler_word_records REPLICA IDENTITY FULL;

-- 将表添加到实时发布
ALTER PUBLICATION supabase_realtime ADD TABLE public.filler_word_records;