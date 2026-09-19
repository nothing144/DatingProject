import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const currentUserIdRef = useRef<string | undefined>(undefined);
  const lastSyncTimestampRef = useRef<string>(new Date().toISOString());

  const fetchNotifications = useCallback(async () => {
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
      if (data && data.length > 0) {
        lastSyncTimestampRef.current = data[0].created_at;
      }
    }
    setLoading(false);
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!userId) return;
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
  }, [userId]);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      console.error("Error marking all as read:", error);
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  }, [userId]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!userId) return;
    const notificationToDelete = notifications.find(n => n.id === notificationId);
    
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) {
      console.error("Error deleting notification:", error);
    } else {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notificationToDelete && !notificationToDelete.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  }, [userId, notifications]);

  const deleteAllNotifications = useCallback(async () => {
    if (!userId) return;
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting all notifications:", error);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [userId]);

  const disconnectRealtime = useCallback(() => {
    if (subscriptionRef.current) {
      console.log("🔌 Disconnecting real-time notification subscription (tab hidden or cleaning up)...");
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
  }, []);

  const connectRealtime = useCallback(() => {
    if (!userId || subscriptionRef.current || document.hidden) return;

    console.log("🔗 Setting up real-time notification subscription...");
    const channel = supabase
      .channel(`notifications-${userId}`)
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
          setNotifications(prev => {
            if (prev.some(n => n.id === newNotification.id)) return prev;
            return [newNotification, ...prev];
          });
          setUnreadCount(prev => prev + 1);
          lastSyncTimestampRef.current = newNotification.created_at;
          
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        }
      )
      .subscribe();

    subscriptionRef.current = channel;
  }, [userId]);

  const fetchMissedNotifications = useCallback(async () => {
    if (!userId) return;
    
    console.log("🔄 Fetching missed notifications since:", lastSyncTimestampRef.current);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .gt("created_at", lastSyncTimestampRef.current)
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const newNotifs = data.filter(n => !existingIds.has(n.id));
        return [...newNotifs, ...prev];
      });
      setUnreadCount(prev => prev + data.filter(n => !n.read).length);
      lastSyncTimestampRef.current = data[0].created_at;
    }
  }, [userId]);

  useEffect(() => {
    // Clean up if user changes
    if (userId !== currentUserIdRef.current) {
      disconnectRealtime();
      currentUserIdRef.current = userId;
      
      if (!userId) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }
      
      // Fetch initial for new user
      fetchNotifications().then(() => {
        connectRealtime();
      });
    }

    // Cleanup on unmount
    return () => {
      disconnectRealtime();
      if (!userId) currentUserIdRef.current = undefined;
    };
  }, [userId, fetchNotifications, connectRealtime, disconnectRealtime]);

  // Tab visibility refresh logic
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        disconnectRealtime();
      } else if (userId) {
        console.log("🔔 Tab visible - fetching missed notifications and reconnecting...");
        fetchMissedNotifications().then(() => {
          connectRealtime();
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId, fetchMissedNotifications, connectRealtime, disconnectRealtime]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      deleteAllNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
