-- Function to get total battles for a community member
CREATE OR REPLACE FUNCTION get_member_total_battles(member_id_param BIGINT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM battles
    WHERE member1_id = member_id_param OR member2_id = member_id_param
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get won battles count for a community member
CREATE OR REPLACE FUNCTION get_member_won_battles(member_id_param BIGINT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM battles
    WHERE is_active = false
    AND (
      (member1_id = member_id_param AND member1_votes > member2_votes)
      OR
      (member2_id = member_id_param AND member2_votes > member1_votes)
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get win percentage for a community member
CREATE OR REPLACE FUNCTION get_member_win_percentage(member_id_param BIGINT)
RETURNS NUMERIC AS $$
DECLARE
  total_battles INTEGER;
  won_battles INTEGER;
BEGIN
  total_battles := get_member_total_battles(member_id_param);
  
  IF total_battles = 0 THEN
    RETURN 0;
  END IF;
  
  won_battles := get_member_won_battles(member_id_param);
  
  RETURN ROUND((won_battles::NUMERIC / total_battles::NUMERIC) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to get complete battle stats for a member
CREATE OR REPLACE FUNCTION get_member_battle_stats(member_id_param BIGINT)
RETURNS TABLE(
  total_battles INTEGER,
  won_battles INTEGER,
  lost_battles INTEGER,
  active_battles INTEGER,
  win_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER 
     FROM battles 
     WHERE member1_id = member_id_param OR member2_id = member_id_param) as total_battles,
    
    (SELECT COUNT(*)::INTEGER 
     FROM battles 
     WHERE is_active = false 
     AND ((member1_id = member_id_param AND member1_votes > member2_votes) 
          OR (member2_id = member_id_param AND member2_votes > member1_votes))) as won_battles,
    
    (SELECT COUNT(*)::INTEGER 
     FROM battles 
     WHERE is_active = false 
     AND ((member1_id = member_id_param AND member1_votes < member2_votes) 
          OR (member2_id = member_id_param AND member2_votes < member1_votes))) as lost_battles,
    
    (SELECT COUNT(*)::INTEGER 
     FROM battles 
     WHERE is_active = true 
     AND (member1_id = member_id_param OR member2_id = member_id_param)) as active_battles,
    
    get_member_win_percentage(member_id_param) as win_percentage;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON FUNCTION get_member_total_battles IS 'Returns total number of battles (active + completed) for a member';
COMMENT ON FUNCTION get_member_won_battles IS 'Returns number of battles won by a member';
COMMENT ON FUNCTION get_member_win_percentage IS 'Returns win percentage for a member (0-100)';
COMMENT ON FUNCTION get_member_battle_stats IS 'Returns comprehensive battle statistics for a member';

-- Example usage:
-- SELECT get_member_total_battles(1);
-- SELECT get_member_won_battles(1);
-- SELECT get_member_win_percentage(1);
-- SELECT * FROM get_member_battle_stats(1);
