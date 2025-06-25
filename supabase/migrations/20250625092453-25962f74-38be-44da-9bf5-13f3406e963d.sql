
-- 创建会议表
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建议程项目表
CREATE TABLE public.agenda_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  duration INTEGER NOT NULL, -- 预计时长(秒)
  type TEXT NOT NULL CHECK (type IN ('speech', 'evaluation', 'table-topics', 'break')),
  speaker TEXT,
  scheduled_time TIME, -- 计划开始时间
  actual_start_time TIMESTAMP WITH TIME ZONE, -- 实际开始时间
  actual_end_time TIMESTAMP WITH TIME ZONE, -- 实际结束时间
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建计时记录表
CREATE TABLE public.timer_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agenda_item_id UUID REFERENCES public.agenda_items(id) ON DELETE CASCADE NOT NULL,
  actual_duration INTEGER NOT NULL, -- 实际时长(秒)
  is_overtime BOOLEAN NOT NULL DEFAULT false,
  overtime_amount INTEGER DEFAULT 0, -- 超时时长(秒)
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 为表启用行级安全策略（RLS）
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timer_records ENABLE ROW LEVEL SECURITY;

-- 创建公开访问策略（暂时允许所有用户访问，后续可以根据需要调整）
CREATE POLICY "Allow all access to meetings" ON public.meetings FOR ALL USING (true);
CREATE POLICY "Allow all access to agenda_items" ON public.agenda_items FOR ALL USING (true);
CREATE POLICY "Allow all access to timer_records" ON public.timer_records FOR ALL USING (true);

-- 创建索引优化查询性能
CREATE INDEX idx_agenda_items_meeting_id ON public.agenda_items(meeting_id);
CREATE INDEX idx_agenda_items_order_index ON public.agenda_items(meeting_id, order_index);
CREATE INDEX idx_timer_records_agenda_item_id ON public.timer_records(agenda_item_id);
