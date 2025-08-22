# Database Cleanup Setup Guide

This document explains how to set up automatic database cleanup for the Heartbeat@ITER app.

## Features Implemented

### 1. Delete All Notifications
- **Location**: Notifications panel (bell icon)
- **Function**: Bulk delete all notifications for a user
- **Benefit**: Reduces database load and improves performance

### 2. Delete Date Requests
- **Location**: Date Requests tab
- **Function**: Individual delete buttons for each date request
- **Benefit**: Keep database clean within free plan limits

### 3. Enhanced Warning Messages
- **Location**: Messages and Chat pages
- **Function**: Inform users about database management and profile deletion
- **Benefit**: User education about maintaining free community access

### 4. Automatic Confession Cleanup
- **Function**: Automatically delete confessions older than 20 days
- **Implementation**: SQL functions + Edge Functions

## Automatic Confession Cleanup Setup

### Option 1: Supabase Cron (Recommended)
If your Supabase project supports cron jobs:

```sql
-- Run this in Supabase SQL Editor
SELECT cron.schedule(
  'daily-confession-cleanup',
  '0 2 * * *', -- Daily at 2 AM UTC
  'SELECT scheduled_confession_cleanup();'
);
```

### Option 2: External Cron Service
Use a service like cron-job.org or similar:

1. **URL**: `https://your-project.supabase.co/functions/v1/daily-cleanup`
2. **Method**: POST
3. **Schedule**: Daily at 02:00 UTC
4. **Headers**: 
   - `Authorization: Bearer YOUR_ANON_KEY`
   - `Content-Type: application/json`

### Option 3: GitHub Actions (Automated)
Create `.github/workflows/daily-cleanup.yml`:

```yaml
name: Daily Database Cleanup
on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM UTC
  workflow_dispatch: # Allow manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Call Cleanup Function
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json" \
            https://your-project.supabase.co/functions/v1/daily-cleanup
```

### Option 4: Manual Cleanup (Development)
For development or manual triggering:

```javascript
// Run in browser console
await window.adminCleanup.manualConfessionCleanup();

// Check cleanup stats
await window.adminCleanup.getCleanupStats();
```

## Database Functions Created

### 1. `cleanup_old_confessions()`
- Deletes confessions older than 20 days
- Returns count of deleted records

### 2. `get_confession_cleanup_stats()`
- Returns statistics about confessions ready for cleanup
- Useful for monitoring

### 3. `scheduled_confession_cleanup()`
- Main function for automated cleanup
- Returns detailed cleanup results

### 4. `delete_all_user_notifications(target_user_id)`
- Bulk delete all notifications for a user
- Used by the "Delete All" button

## Monitoring

To monitor the cleanup process:

1. **Check logs**: View Supabase Function logs
2. **Run stats**: Use `get_confession_cleanup_stats()` function
3. **Manual check**: Query confession counts by date

```sql
-- Check confession age distribution
SELECT 
  date_trunc('day', created_at) as date,
  count(*) as confession_count,
  CASE 
    WHEN created_at < (now() - interval '20 days') THEN 'Ready for cleanup'
    ELSE 'Keep'
  END as status
FROM confessions 
GROUP BY date_trunc('day', created_at)
ORDER BY date DESC
LIMIT 30;
```

## Benefits

1. **Database Performance**: Reduced storage and faster queries
2. **Cost Management**: Stay within Supabase free tier limits  
3. **User Experience**: Faster app performance
4. **Community Sustainability**: Maintain free access for all users

## Troubleshooting

### Edge Function Not Working
1. Check Supabase project settings
2. Verify environment variables are set
3. Check function deployment status

### Cleanup Not Running
1. Verify cron job setup
2. Check function logs for errors
3. Test manual cleanup in console

### Database Errors
1. Check RLS policies are correctly set
2. Verify user permissions
3. Review migration files for any syntax errors

## Next Steps

1. Deploy the edge function: `supabase functions deploy daily-cleanup`
2. Set up your preferred scheduling method (Options 1-3 above)
3. Monitor the first few runs to ensure everything works correctly
4. Consider adding email notifications for cleanup results (optional)