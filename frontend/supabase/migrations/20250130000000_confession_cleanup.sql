/*
  # Automatic Confession Cleanup System
  
  1. Functions
    - Function to delete confessions older than 20 days
    - Function to get confession cleanup stats
  
  2. Policies
    - Add policy for automatic cleanup function
    
  3. Scheduled Cleanup
    - Creates a function that can be called via cron or edge functions
*/

-- Function to clean up old confessions (older than 20 days)
CREATE OR REPLACE FUNCTION cleanup_old_confessions()
RETURNS TABLE(deleted_count integer, cleanup_date timestamptz) AS $$
DECLARE
  deleted_rows integer;
  cutoff_date timestamptz;
BEGIN
  -- Calculate cutoff date (20 days ago)
  cutoff_date := now() - interval '20 days';
  
  -- Delete confessions older than 20 days
  DELETE FROM confessions 
  WHERE created_at < cutoff_date;
  
  -- Get count of deleted rows
  GET DIAGNOSTICS deleted_rows = ROW_COUNT;
  
  -- Return results
  RETURN QUERY SELECT deleted_rows, now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get confession cleanup statistics
CREATE OR REPLACE FUNCTION get_confession_cleanup_stats()
RETURNS TABLE(
  total_confessions integer,
  old_confessions_count integer,
  cleanup_threshold_date timestamptz
) AS $$
DECLARE
  total_count integer;
  old_count integer;
  cutoff_date timestamptz;
BEGIN
  -- Calculate cutoff date (20 days ago)
  cutoff_date := now() - interval '20 days';
  
  -- Get total confessions count
  SELECT COUNT(*) INTO total_count FROM confessions;
  
  -- Get old confessions count (ready for cleanup)
  SELECT COUNT(*) INTO old_count 
  FROM confessions 
  WHERE created_at < cutoff_date;
  
  -- Return results
  RETURN QUERY SELECT total_count, old_count, cutoff_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_old_confessions() TO authenticated;
GRANT EXECUTE ON FUNCTION get_confession_cleanup_stats() TO authenticated;

-- Create index for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_confessions_created_at_cleanup 
ON confessions(created_at) 
WHERE created_at < (now() - interval '20 days');

-- Function to be called by edge functions or cron jobs
CREATE OR REPLACE FUNCTION scheduled_confession_cleanup()
RETURNS json AS $$
DECLARE
  cleanup_result record;
  stats_result record;
BEGIN
  -- Get stats before cleanup
  SELECT * INTO stats_result FROM get_confession_cleanup_stats();
  
  -- Perform cleanup if there are old confessions
  IF stats_result.old_confessions_count > 0 THEN
    SELECT * INTO cleanup_result FROM cleanup_old_confessions();
    
    RETURN json_build_object(
      'success', true,
      'deleted_count', cleanup_result.deleted_count,
      'cleanup_date', cleanup_result.cleanup_date,
      'total_before_cleanup', stats_result.total_confessions,
      'old_confessions_found', stats_result.old_confessions_count
    );
  ELSE
    RETURN json_build_object(
      'success', true,
      'deleted_count', 0,
      'cleanup_date', now(),
      'total_confessions', stats_result.total_confessions,
      'message', 'No old confessions found for cleanup'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION scheduled_confession_cleanup() TO authenticated;

-- Add comment for maintenance
COMMENT ON FUNCTION cleanup_old_confessions() IS 'Deletes confessions older than 20 days to maintain database performance';
COMMENT ON FUNCTION scheduled_confession_cleanup() IS 'Scheduled function for automatic confession cleanup - call this from edge functions or cron jobs';