-- 启用表的实时同步功能
ALTER TABLE public.meetings REPLICA IDENTITY FULL;
ALTER TABLE public.agenda_items REPLICA IDENTITY FULL;
ALTER TABLE public.timer_records REPLICA IDENTITY FULL;

-- 将表添加到实时发布中
ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agenda_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.timer_records;