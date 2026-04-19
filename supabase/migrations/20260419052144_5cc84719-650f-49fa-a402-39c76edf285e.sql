-- Remove duplicate grocery items per user (case-insensitive), keeping the earliest created
DELETE FROM public.grocery_lists a
USING public.grocery_lists b
WHERE a.user_id = b.user_id
  AND lower(a.item_name) = lower(b.item_name)
  AND a.created_at > b.created_at;

-- Safety-net unique index
CREATE UNIQUE INDEX IF NOT EXISTS grocery_lists_user_item_unique
  ON public.grocery_lists (user_id, lower(item_name));