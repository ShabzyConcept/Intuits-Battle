-- Create battle_votes table to track individual votes by wallet address
CREATE TABLE IF NOT EXISTS public.battle_votes (
  id BIGSERIAL PRIMARY KEY,
  battle_id BIGINT NOT NULL,
  wallet_address TEXT NOT NULL,
  voted_for_member_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Foreign key constraints
  CONSTRAINT fk_battle FOREIGN KEY (battle_id) REFERENCES public.battles(id) ON DELETE CASCADE,
  CONSTRAINT fk_voted_member FOREIGN KEY (voted_for_member_id) REFERENCES public.community_members(id) ON DELETE CASCADE,
  
  -- Ensure one vote per wallet per battle
  CONSTRAINT unique_wallet_per_battle UNIQUE (battle_id, wallet_address)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_battle_votes_battle_id ON public.battle_votes(battle_id);
CREATE INDEX IF NOT EXISTS idx_battle_votes_wallet ON public.battle_votes(wallet_address);
CREATE INDEX IF NOT EXISTS idx_battle_votes_created_at ON public.battle_votes(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.battle_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow everyone to read votes
CREATE POLICY "Anyone can view battle votes"
  ON public.battle_votes
  FOR SELECT
  USING (true);

-- Allow anyone to insert votes (validation handled in app)
CREATE POLICY "Anyone can cast votes"
  ON public.battle_votes
  FOR INSERT
  WITH CHECK (true);

-- Add helpful comments
COMMENT ON TABLE public.battle_votes IS 'Tracks individual votes for battles by wallet address';
COMMENT ON COLUMN public.battle_votes.battle_id IS 'The battle being voted on';
COMMENT ON COLUMN public.battle_votes.wallet_address IS 'Voter wallet address';
COMMENT ON COLUMN public.battle_votes.voted_for_member_id IS 'The community member being voted for';
COMMENT ON CONSTRAINT unique_wallet_per_battle ON public.battle_votes IS 'Prevents duplicate votes from same wallet';
