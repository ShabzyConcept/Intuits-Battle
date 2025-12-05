-- =====================================================
-- Add Triple IDs to Battles Table
-- =====================================================
-- This script adds columns to store Intuition triple/claim IDs
-- These IDs are used for staking during voting
-- =====================================================

-- Add columns for storing triple IDs (claim IDs for voting)
ALTER TABLE public.battles 
ADD COLUMN IF NOT EXISTS member1_triple_id TEXT,
ADD COLUMN IF NOT EXISTS member2_triple_id TEXT;

-- Add indexes for quick lookup of battles by triple IDs
CREATE INDEX IF NOT EXISTS idx_battles_member1_triple_id 
ON public.battles(member1_triple_id) 
WHERE member1_triple_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_battles_member2_triple_id 
ON public.battles(member2_triple_id) 
WHERE member2_triple_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.battles.member1_triple_id IS 'Intuition triple/claim ID for member 1 - used for staking during voting';
COMMENT ON COLUMN public.battles.member2_triple_id IS 'Intuition triple/claim ID for member 2 - used for staking during voting';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ Triple ID columns added to battles table';
  RAISE NOTICE '✓ Indexes created for quick triple ID lookup';
  RAISE NOTICE '';
  RAISE NOTICE 'When creating battles:';
  RAISE NOTICE '1. Create Intuition triples for both members';
  RAISE NOTICE '2. Store the triple IDs in member1_triple_id and member2_triple_id';
  RAISE NOTICE '3. During voting, users stake on these triple IDs';
  RAISE NOTICE '';
  RAISE NOTICE 'Example:';
  RAISE NOTICE 'Triple 1: "Zeth embodies championship caliber" → triple_id_1';
  RAISE NOTICE 'Triple 2: "Horus embodies championship caliber" → triple_id_2';
  RAISE NOTICE 'Users vote by staking TRUST tokens on triple_id_1 or triple_id_2';
END $$;
