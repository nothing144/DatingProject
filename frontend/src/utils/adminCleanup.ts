import { supabase } from "@/integrations/supabase/client";

/**
 * Admin utility functions for database cleanup
 * These functions can be called from browser console for manual cleanup
 */

export const manualConfessionCleanup = async () => {
  try {
    console.log('Starting manual confession cleanup...');
    
    // Get cleanup stats first
    const { data: stats, error: statsError } = await supabase
      .rpc('get_confession_cleanup_stats');
    
    if (statsError) {
      console.error('Error getting cleanup stats:', statsError);
      return;
    }
    
    console.log('Cleanup stats:', stats);
    
    // Perform the cleanup
    const { data: result, error: cleanupError } = await supabase
      .rpc('scheduled_confession_cleanup');
    
    if (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
      return;
    }
    
    console.log('Cleanup completed:', result);
    return result;
    
  } catch (error) {
    console.error('Manual cleanup failed:', error);
  }
};

export const getCleanupStats = async () => {
  try {
    const { data: stats, error } = await supabase
      .rpc('get_confession_cleanup_stats');
    
    if (error) {
      console.error('Error getting stats:', error);
      return;
    }
    
    console.log('Current cleanup stats:', stats);
    return stats;
    
  } catch (error) {
    console.error('Failed to get stats:', error);
  }
};

// Make functions available globally for console access
if (typeof window !== 'undefined') {
  (window as any).adminCleanup = {
    manualConfessionCleanup,
    getCleanupStats
  };
  
  console.log('Admin cleanup functions available:');
  console.log('- window.adminCleanup.manualConfessionCleanup()');
  console.log('- window.adminCleanup.getCleanupStats()');
}