-- ============================================================================
-- COMPLETE BATTLES SYSTEM SETUP
-- This script creates all tables, functions, triggers, and RLS policies
-- ============================================================================

-- ============================================================================
-- 1. CREATE BATTLES TABLE
-- ============================================================================

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
  
  -- Ensure members are different
  CONSTRAINT different_members CHECK (member1_id != member2_id)
);

-- Add foreign key constraints separately (if not exists)
DO $$
BEGIN
  -- Add member1_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'battles_member1_id_fkey'
  ) THEN
    ALTER TABLE public.battles 
    ADD CONSTRAINT battles_member1_id_fkey 
    FOREIGN KEY (member1_id) 
    REFERENCES public.community_members(id) 
    ON DELETE CASCADE;
  END IF;

  -- Add member2_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'battles_member2_id_fkey'
  ) THEN
    ALTER TABLE public.battles 
    ADD CONSTRAINT battles_member2_id_fkey 
    FOREIGN KEY (member2_id) 
    REFERENCES public.community_members(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for battles table
CREATE INDEX IF NOT EXISTS idx_battles_is_active ON public.battles(is_active);
CREATE INDEX IF NOT EXISTS idx_battles_start_date ON public.battles(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_battles_end_date ON public.battles(end_date);
CREATE INDEX IF NOT EXISTS idx_battles_member1_id ON public.battles(member1_id);
CREATE INDEX IF NOT EXISTS idx_battles_member2_id ON public.battles(member2_id);
CREATE INDEX IF NOT EXISTS idx_battles_total_votes ON public.battles(total_votes DESC);

-- Add comments for battles table
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

-- ============================================================================
-- 2. CREATE BATTLE_VOTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.battle_votes (
  id BIGSERIAL PRIMARY KEY,
  battle_id BIGINT NOT NULL,
  wallet_address TEXT NOT NULL,
  voted_for_member_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure one vote per wallet per battle
  CONSTRAINT unique_wallet_per_battle UNIQUE (battle_id, wallet_address)
);

-- Add foreign key constraints separately (if not exists)
DO $$
BEGIN
  -- Add battle_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'battle_votes_battle_id_fkey'
  ) THEN
    ALTER TABLE public.battle_votes 
    ADD CONSTRAINT battle_votes_battle_id_fkey 
    FOREIGN KEY (battle_id) 
    REFERENCES public.battles(id) 
    ON DELETE CASCADE;
  END IF;

  -- Add voted_for_member_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'battle_votes_voted_for_member_id_fkey'
  ) THEN
    ALTER TABLE public.battle_votes 
    ADD CONSTRAINT battle_votes_voted_for_member_id_fkey 
    FOREIGN KEY (voted_for_member_id) 
    REFERENCES public.community_members(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for battle_votes table
CREATE INDEX IF NOT EXISTS idx_battle_votes_battle_id ON public.battle_votes(battle_id);
CREATE INDEX IF NOT EXISTS idx_battle_votes_wallet ON public.battle_votes(wallet_address);
CREATE INDEX IF NOT EXISTS idx_battle_votes_created_at ON public.battle_votes(created_at DESC);

-- Add comments for battle_votes table
COMMENT ON TABLE public.battle_votes IS 'Tracks individual votes for battles by wallet address';
COMMENT ON COLUMN public.battle_votes.battle_id IS 'The battle being voted on';
COMMENT ON COLUMN public.battle_votes.wallet_address IS 'Voter wallet address';
COMMENT ON COLUMN public.battle_votes.voted_for_member_id IS 'The community member being voted for';
COMMENT ON CONSTRAINT unique_wallet_per_battle ON public.battle_votes IS 'Prevents duplicate votes from same wallet';

-- ============================================================================
-- 3. CREATE TRIGGERS
-- ============================================================================

-- Trigger function for battles updated_at
CREATE OR REPLACE FUNCTION update_battles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists, then create it
DROP TRIGGER IF EXISTS trigger_battles_updated_at ON public.battles;

CREATE TRIGGER trigger_battles_updated_at
  BEFORE UPDATE ON public.battles
  FOR EACH ROW
  EXECUTE FUNCTION update_battles_updated_at();

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on battles table
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active battles" ON public.battles;
DROP POLICY IF EXISTS "Authenticated users can view all battles" ON public.battles;
DROP POLICY IF EXISTS "Anyone can view all battles (public)" ON public.battles;
DROP POLICY IF EXISTS "Authenticated users can create battles" ON public.battles;
DROP POLICY IF EXISTS "Anyone can create battles" ON public.battles;
DROP POLICY IF EXISTS "Authenticated users can update battles" ON public.battles;
DROP POLICY IF EXISTS "Anyone can update battle votes" ON public.battles;

-- RLS Policies for battles
CREATE POLICY "Anyone can view active battles"
  ON public.battles
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all battles"
  ON public.battles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view all battles (public)"
  ON public.battles
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can create battles"
  ON public.battles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can create battles"
  ON public.battles
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update battles"
  ON public.battles
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can update battle votes"
  ON public.battles
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Enable RLS on battle_votes table
ALTER TABLE public.battle_votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view battle votes" ON public.battle_votes;
DROP POLICY IF EXISTS "Anyone can cast votes" ON public.battle_votes;

-- RLS Policies for battle_votes
CREATE POLICY "Anyone can view battle votes"
  ON public.battle_votes
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can cast votes"
  ON public.battle_votes
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 5. RPC FUNCTIONS FOR BATTLE STATISTICS
-- ============================================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_member_battle_stats(BIGINT);
DROP FUNCTION IF EXISTS get_member_current_standing(BIGINT);
DROP FUNCTION IF EXISTS has_wallet_voted(BIGINT, TEXT);
DROP FUNCTION IF EXISTS get_battle_leaderboard(INTEGER);
DROP FUNCTION IF EXISTS auto_end_expired_battles();

-- Function to get complete battle stats for a member
CREATE OR REPLACE FUNCTION get_member_battle_stats(member_id_param BIGINT)
RETURNS TABLE(
  total_battles INTEGER,
  won_battles INTEGER,
  lost_battles INTEGER,
  active_battles INTEGER,
  currently_winning INTEGER,
  win_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Total battles (all)
    (SELECT COUNT(*)::INTEGER 
     FROM battles 
     WHERE member1_id = member_id_param OR member2_id = member_id_param) as total_battles,
    
    -- Won battles (completed only)
    (SELECT COUNT(*)::INTEGER 
     FROM battles 
     WHERE is_active = false 
     AND ((member1_id = member_id_param AND member1_votes > member2_votes) 
          OR (member2_id = member_id_param AND member2_votes > member1_votes))) as won_battles,
    
    -- Lost battles (completed only)
    (SELECT COUNT(*)::INTEGER 
     FROM battles 
     WHERE is_active = false 
     AND ((member1_id = member_id_param AND member1_votes < member2_votes) 
          OR (member2_id = member_id_param AND member2_votes < member1_votes))) as lost_battles,
    
    -- Active battles
    (SELECT COUNT(*)::INTEGER 
     FROM battles 
     WHERE is_active = true 
     AND (member1_id = member_id_param OR member2_id = member_id_param)) as active_battles,
    
    -- Currently winning in active battles
    (SELECT COUNT(*)::INTEGER 
     FROM battles 
     WHERE is_active = true 
     AND ((member1_id = member_id_param AND member1_votes > member2_votes) 
          OR (member2_id = member_id_param AND member2_votes > member1_votes))) as currently_winning,
    
    -- Win percentage (based on completed battles only)
    (SELECT 
      CASE 
        WHEN COUNT(*) FILTER (WHERE is_active = false) = 0 THEN 0
        ELSE ROUND(
          (COUNT(*) FILTER (WHERE is_active = false 
            AND ((member1_id = member_id_param AND member1_votes > member2_votes) 
                 OR (member2_id = member_id_param AND member2_votes > member1_votes)))::NUMERIC 
          / COUNT(*) FILTER (WHERE is_active = false)::NUMERIC) * 100, 
          2)
      END
     FROM battles 
     WHERE member1_id = member_id_param OR member2_id = member_id_param) as win_percentage;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_member_battle_stats IS 'Returns comprehensive battle statistics including active battle standings';

-- Function to get current standing in all battles
CREATE OR REPLACE FUNCTION get_member_current_standing(member_id_param BIGINT)
RETURNS TABLE(
  battle_id BIGINT,
  battle_title TEXT,
  is_active BOOLEAN,
  opponent_id BIGINT,
  member_votes INTEGER,
  opponent_votes INTEGER,
  is_winning BOOLEAN,
  vote_difference INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id as battle_id,
    b.title as battle_title,
    b.is_active,
    CASE 
      WHEN b.member1_id = member_id_param THEN b.member2_id
      ELSE b.member1_id
    END as opponent_id,
    CASE 
      WHEN b.member1_id = member_id_param THEN b.member1_votes
      ELSE b.member2_votes
    END as member_votes,
    CASE 
      WHEN b.member1_id = member_id_param THEN b.member2_votes
      ELSE b.member1_votes
    END as opponent_votes,
    CASE 
      WHEN b.member1_id = member_id_param THEN b.member1_votes > b.member2_votes
      ELSE b.member2_votes > b.member1_votes
    END as is_winning,
    CASE 
      WHEN b.member1_id = member_id_param THEN (b.member1_votes - b.member2_votes)
      ELSE (b.member2_votes - b.member1_votes)
    END as vote_difference
  FROM battles b
  WHERE b.member1_id = member_id_param OR b.member2_id = member_id_param
  ORDER BY b.is_active DESC, b.created_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_member_current_standing IS 'Returns detailed standing for all battles including current vote counts';

-- Function to check if wallet has voted in a battle
CREATE OR REPLACE FUNCTION has_wallet_voted(
  battle_id_param BIGINT,
  wallet_address_param TEXT
)
RETURNS TABLE(
  has_voted BOOLEAN,
  voted_for_member_id BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(
      SELECT 1 
      FROM battle_votes 
      WHERE battle_id = battle_id_param 
      AND wallet_address = LOWER(wallet_address_param)
    ) as has_voted,
    (
      SELECT bv.voted_for_member_id
      FROM battle_votes bv
      WHERE bv.battle_id = battle_id_param 
      AND bv.wallet_address = LOWER(wallet_address_param)
      LIMIT 1
    ) as voted_for_member_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION has_wallet_voted IS 'Checks if a wallet address has voted in a specific battle';

-- Function to get battle leaderboard
CREATE OR REPLACE FUNCTION get_battle_leaderboard(limit_param INTEGER DEFAULT 10)
RETURNS TABLE(
  member_id BIGINT,
  total_battles INTEGER,
  won_battles INTEGER,
  win_percentage NUMERIC,
  total_votes_received INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH member_stats AS (
    SELECT 
      cm.id as member_id,
      COUNT(*) as total_battles,
      COUNT(*) FILTER (
        WHERE b.is_active = false 
        AND ((b.member1_id = cm.id AND b.member1_votes > b.member2_votes) 
             OR (b.member2_id = cm.id AND b.member2_votes > b.member1_votes))
      ) as won_battles,
      SUM(CASE WHEN b.member1_id = cm.id THEN b.member1_votes ELSE b.member2_votes END) as total_votes
    FROM community_members cm
    LEFT JOIN battles b ON b.member1_id = cm.id OR b.member2_id = cm.id
    GROUP BY cm.id
    HAVING COUNT(*) > 0
  )
  SELECT 
    ms.member_id,
    ms.total_battles::INTEGER,
    ms.won_battles::INTEGER,
    CASE 
      WHEN ms.total_battles > 0 
      THEN ROUND((ms.won_battles::NUMERIC / ms.total_battles::NUMERIC) * 100, 2)
      ELSE 0
    END as win_percentage,
    COALESCE(ms.total_votes, 0)::INTEGER as total_votes_received
  FROM member_stats ms
  ORDER BY win_percentage DESC, total_votes DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_battle_leaderboard IS 'Returns top members by battle win percentage and votes';

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically end battles that have passed their end_date
CREATE OR REPLACE FUNCTION auto_end_expired_battles()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE battles
  SET is_active = false
  WHERE is_active = true
  AND end_date IS NOT NULL
  AND end_date < NOW();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_end_expired_battles IS 'Automatically sets is_active=false for battles past their end_date';

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================

-- Display success message
DO $$
BEGIN
  RAISE NOTICE 'Battle system setup complete!';
  RAISE NOTICE 'Tables created: battles, battle_votes';
  RAISE NOTICE 'RPC functions available:';
  RAISE NOTICE '  - get_member_battle_stats(member_id)';
  RAISE NOTICE '  - get_member_current_standing(member_id)';
  RAISE NOTICE '  - has_wallet_voted(battle_id, wallet_address)';
  RAISE NOTICE '  - get_battle_leaderboard(limit)';
  RAISE NOTICE '  - auto_end_expired_battles()';
END $$;
