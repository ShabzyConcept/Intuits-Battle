-- Create battles table
CREATE TABLE IF NOT EXISTS public.battles (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  member1_id BIGINT NOT NULL,
  member2_id BIGINT NOT NULL,
  member1_votes INTEGER DEFAULT 0 NOT NULL,
  member2_votes INTEGER DEFAULT 0 NOT NULL,
  total_votes INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  start_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Foreign key constraints
  CONSTRAINT fk_member1 FOREIGN KEY (member1_id) REFERENCES public.community_members(id) ON DELETE CASCADE,
  CONSTRAINT fk_member2 FOREIGN KEY (member2_id) REFERENCES public.community_members(id) ON DELETE CASCADE,
  
  -- Ensure members are different
  CONSTRAINT different_members CHECK (member1_id != member2_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_battles_is_active ON public.battles(is_active);
CREATE INDEX IF NOT EXISTS idx_battles_start_date ON public.battles(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_battles_end_date ON public.battles(end_date);
CREATE INDEX IF NOT EXISTS idx_battles_member1_id ON public.battles(member1_id);
CREATE INDEX IF NOT EXISTS idx_battles_member2_id ON public.battles(member2_id);
CREATE INDEX IF NOT EXISTS idx_battles_total_votes ON public.battles(total_votes DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_battles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_battles_updated_at
  BEFORE UPDATE ON public.battles
  FOR EACH ROW
  EXECUTE FUNCTION update_battles_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow everyone to read active battles
CREATE POLICY "Anyone can view active battles"
  ON public.battles
  FOR SELECT
  USING (is_active = true);

-- Allow authenticated users to view all battles
CREATE POLICY "Authenticated users can view all battles"
  ON public.battles
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create battles
CREATE POLICY "Authenticated users can create battles"
  ON public.battles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update battles
CREATE POLICY "Authenticated users can update battles"
  ON public.battles
  FOR UPDATE
  TO authenticated
  USING (true);

-- Add helpful comments
COMMENT ON TABLE public.battles IS 'Stores community member battles/contests';
COMMENT ON COLUMN public.battles.title IS 'Battle title';
COMMENT ON COLUMN public.battles.description IS 'Battle description';
COMMENT ON COLUMN public.battles.member1_id IS 'First contestant';
COMMENT ON COLUMN public.battles.member2_id IS 'Second contestant';
COMMENT ON COLUMN public.battles.member1_votes IS 'Vote count for member 1';
COMMENT ON COLUMN public.battles.member2_votes IS 'Vote count for member 2';
COMMENT ON COLUMN public.battles.total_votes IS 'Total votes for the battle';
COMMENT ON COLUMN public.battles.is_active IS 'Whether the battle is currently active';
COMMENT ON COLUMN public.battles.start_date IS 'When the battle starts';
COMMENT ON COLUMN public.battles.end_date IS 'When the battle ends (optional)';
