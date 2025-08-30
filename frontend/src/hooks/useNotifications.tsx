import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export const useNotifications = (userId: string | undefined) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const subscriptionRef = useRef<any>(null);
  const isInitialized = useRef(false);

  const fetchNotifications = async () => {
    if (!userId) return;
    
    console.log("🔔 Fetching notifications...");
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching notifications:", error);
    } else {
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
      console.log("✅ Notifications loaded:", data?.length || 0);
    }
    setLoading(false);
  };

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking notification as read:", error);
    } else {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      console.error("Error marking all notifications as read:", error);
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast({
        title: "All notifications marked as read",
        description: "Your notifications have been updated"
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting notification:", error);
      toast({
        title: "Database Error",
        description: `Failed to delete notification: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    } else {
      setNotifications(prev => {
        const filteredNotifications = prev.filter(n => n.id !== notificationId);
        const deletedNotification = prev.find(n => n.id === notificationId);
        if (deletedNotification && !deletedNotification.read) {
          setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        }
        return filteredNotifications;
      });
      
      toast({
        title: "Notification deleted",
        description: "Notification has been permanently removed"
      });
    }
  };

  const deleteAllNotifications = async () => {
    if (!userId) return;

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting all notifications:", error);
      toast({
        title: "Database Error",
        description: `Failed to delete notifications: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    } else {
      setNotifications([]);
      setUnreadCount(0);
      toast({
        title: "All notifications deleted",
        description: "Your notifications have been cleared to reduce database load"
      });
    }
  };

  // PERFORMANCE OPTIMIZED: Only setup real-time when notification panel is opened
  const setupRealTimeSubscription = () => {
    if (!userId || subscriptionRef.current) return;

    console.log("🔗 Setting up real-time notification subscription...");
    
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const deletedNotification = payload.old as Notification;
          setNotifications(prev => prev.filter(n => n.id !== deletedNotification.id));
          setUnreadCount(prev => Math.max(0, prev - (deletedNotification.read ? 0 : 1)));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications(prev => {
            const updated = prev.map(n => n.id === updatedNotification.id ? updatedNotification : n);
            const newUnreadCount = updated.filter(n => !n.read).length;
            setUnreadCount(newUnreadCount);
            return updated;
          });
        }
      )
      .subscribe();

    subscriptionRef.current = channel;
  };

  const cleanupRealTimeSubscription = () => {
    if (subscriptionRef.current) {
      console.log("🔌 Cleaning up real-time notification subscription...");
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
  };

  // PERFORMANCE OPTIMIZED: Lazy loading - only fetch when component mounts
  useEffect(() => {
    if (userId && !isInitialized.current) {
      fetchNotifications();
      isInitialized.current = true;
    }

    return () => {
      cleanupRealTimeSubscription();
    };
  }, [userId]);

  // PERFORMANCE OPTIMIZED: Only refresh on tab visibility if user has interacted with notifications
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && userId && isInitialized.current) {
        // Only refresh if user has opened notification panel at least once
        console.log("🔔 Tab visible - refreshing notifications...");
        fetchNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    setupRealTimeSubscription,
    cleanupRealTimeSubscription
  };
};