CREATE TABLE public.grocery_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  store_name TEXT,
  distance_km NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.grocery_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own grocery lists"
  ON public.grocery_lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own grocery lists"
  ON public.grocery_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own grocery lists"
  ON public.grocery_lists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own grocery lists"
  ON public.grocery_lists FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_grocery_lists_updated_at
  BEFORE UPDATE ON public.grocery_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_grocery_lists_user_id ON public.grocery_lists(user_id);

ALTER TABLE public.grocery_lists REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.grocery_lists;