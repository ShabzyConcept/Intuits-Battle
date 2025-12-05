-- =====================================================
-- Battle Descriptions Table
-- =====================================================
-- This script creates a table to store predefined battle
-- descriptions that admins can select from when creating battles
-- =====================================================

-- Drop existing functions if they exist (to allow return type change)
DROP FUNCTION IF EXISTS get_active_battle_descriptions();
DROP FUNCTION IF EXISTS increment_description_usage(BIGINT);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active battle descriptions" ON public.battle_descriptions;
DROP POLICY IF EXISTS "Allow all operations on battle descriptions" ON public.battle_descriptions;

-- Create battle_descriptions table
CREATE TABLE IF NOT EXISTS public.battle_descriptions (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for active descriptions (faster queries)
CREATE INDEX IF NOT EXISTS idx_battle_descriptions_active 
ON public.battle_descriptions(is_active) 
WHERE is_active = true;

-- Add index for usage count (for analytics/popular descriptions)
CREATE INDEX IF NOT EXISTS idx_battle_descriptions_usage 
ON public.battle_descriptions(usage_count DESC);

-- Enable Row Level Security
ALTER TABLE public.battle_descriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active descriptions
CREATE POLICY "Anyone can view active battle descriptions"
ON public.battle_descriptions
FOR SELECT
USING (is_active = true);

-- Policy: Allow all authenticated operations (simplified for now)
CREATE POLICY "Allow all operations on battle descriptions"
ON public.battle_descriptions
FOR ALL
USING (true)
WITH CHECK (true);

-- Function to increment usage count when a description is used
CREATE OR REPLACE FUNCTION increment_description_usage(description_id BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.battle_descriptions
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = description_id;
END;
$$;

-- Function to get all active descriptions (for dropdown)
CREATE FUNCTION get_active_battle_descriptions()
RETURNS TABLE (
  id BIGINT,
  title TEXT,
  description TEXT,
  usage_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bd.id,
    bd.title,
    bd.description,
    bd.usage_count
  FROM public.battle_descriptions bd
  WHERE bd.is_active = true
  ORDER BY bd.usage_count DESC, bd.title ASC;
END;
$$;

-- Seed initial battle descriptions
-- Descriptions are phrased to work with "embodies" predicate
-- Example: "[Member] embodies [Description]" → "Zeth embodies legendary status"
INSERT INTO public.battle_descriptions (title, description, is_active) VALUES
  ('Legends Showdown', 'legendary status', true),
  ('Skills Battle', 'superior skills and strategy', true),
  ('Supreme Reign', 'supreme dominance', true),
  ('Glory Face-off', 'ultimate glory', true),
  ('Titans Clash', 'titan-level power', true),
  ('Favorites Head-to-Head', 'community favorite status', true),
  ('Awaited Battle', 'highly anticipated excellence', true),
  ('Champions Ground', 'championship caliber', true),
  ('Legendary Rivalry', 'legendary competitive spirit', true),
  ('Winner Takes All', 'winning mentality', true),
  ('Dominance Test', 'dominant performance', true),
  ('Remembered Battle', 'memorable greatness', true),
  ('Two Enter One Wins', 'sole victor qualities', true),
  ('High Stakes', 'high-pressure excellence', true),
  ('Styles Clash', 'unique battle style', true)
ON CONFLICT (title) DO NOTHING;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION increment_description_usage(BIGINT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_active_battle_descriptions() TO anon, authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ Battle descriptions table created successfully';
  RAISE NOTICE '✓ Row Level Security policies applied';
  RAISE NOTICE '✓ Helper functions created';
  RAISE NOTICE '✓ Initial descriptions seeded';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now:';
  RAISE NOTICE '1. Query descriptions: SELECT * FROM get_active_battle_descriptions();';
  RAISE NOTICE '2. Add new descriptions via admin interface';
  RAISE NOTICE '3. Track usage statistics per description';
END $$;
