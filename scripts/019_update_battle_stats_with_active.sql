-- Updated function to get complete battle stats including active battles
CREATE OR REPLACE FUNCTION get_member_battle_stats(member_id_param BIGINT)
RETURNS TABLE(
  total_battles INTEGER,
  won_battles INTEGER,
  lost_battles INTEGER,
  active_battles INTEGER,
  currently_winning INTEGER,
  win_percentage NUMERIC
) AS $$
DECLARE
  completed_battles INTEGER;
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

-- Function to get current standing in all battles (including active)
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

-- Add helpful comments
COMMENT ON FUNCTION get_member_battle_stats IS 'Returns comprehensive battle statistics including active battle standings';
COMMENT ON FUNCTION get_member_current_standing IS 'Returns detailed standing for all battles including current vote counts';

-- Example usage:
-- SELECT * FROM get_member_battle_stats(1);
-- SELECT * FROM get_member_current_standing(1);
