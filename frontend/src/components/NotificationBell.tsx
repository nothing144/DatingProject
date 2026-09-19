import { useState, useEffect } from "react";
import { Bell, X, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNotifications } from "@/contexts/NotificationContext";

interface NotificationBellProps {
  userId: string;
  isMobilePositioned?: boolean;
}

const NotificationBell = ({ userId, isMobilePositioned = false }: NotificationBellProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    fetchNotifications, 
    deleteNotification, 
    deleteAllNotifications,
  } = useNotifications();

  const handleNotificationClick = (notificationId: string, read: boolean) => {
    if (!read) {
      markAsRead(notificationId);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Refresh notifications when panel opens
      fetchNotifications();
    }
  };

  // Mobile-specific positioning when used as fixed positioned element
  const mobilePositionClasses = isMobilePositioned 
    ? "fixed top-20 right-4 z-40 sm:hidden"
    : "";

  // Desktop positioning - hide mobile version on desktop
  const desktopClasses = isMobilePositioned 
    ? "sm:hidden"
    : "";

  return (
    <div className={`${mobilePositionClasses} ${desktopClasses} ${isMobilePositioned ? 'mobile-notification-bell' : ''}`}>
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          <div className="notification-bell-container mobile-notification-fix">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`relative flex items-center justify-center ${
                isMobilePositioned 
                  ? "h-11 w-11 bg-card/80 backdrop-blur-md border border-primary/30 hover:border-primary/50 hover:bg-card/90 shadow-lg rounded-full" 
                  : "h-10 w-10"
              }`}
              aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
              aria-describedby="notification-count"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge 
                  id="notification-count"
                  variant="destructive" 
                  className="notification-badge notification-badge-android mobile-notification-fix absolute top-[-8px] right-[-8px] h-5 w-5 min-w-[1.25rem] flex items-center justify-center p-0 text-xs font-bold border-2 border-background shadow-lg"
                  style={{ 
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    zIndex: 20
                  }}
                  aria-label={`${unreadCount} unread notifications`}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
          </div>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              Notifications
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={fetchNotifications}
                  disabled={loading}
                  className="flex items-center gap-1"
                  aria-label="Refresh notifications"
                >
                  <RotateCcw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={markAllAsRead}
                    aria-label="Mark all notifications as read"
                  >
                    Mark all read
                  </Button>
                )}
              </div>
            </SheetTitle>
          </SheetHeader>

          {/* Performance Tip */}
          <Alert className="mt-4 border-blue-700 bg-blue-950/30">
            <AlertDescription className="text-blue-200 text-sm">
              <strong>⚡ Performance:</strong> Real-time notifications are now active. Close this panel to save battery and improve performance.
            </AlertDescription>
          </Alert>

          {/* Database Performance Tip */}
          {notifications.length > 0 && (
            <Alert className="mt-4 border-amber-700 bg-amber-950/30">
              <AlertDescription className="text-amber-200 text-sm">
                <strong>💡 Tip:</strong> After reading, delete notifications to reduce database load and keep your app fast.
              </AlertDescription>
            </Alert>
          )}

          {/* Delete All Button */}
          {notifications.length > 0 && (
            <div className="mt-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="w-full bg-red-900 hover:bg-red-800 border-red-700"
                    aria-label="Delete all notifications"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete All Notifications
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-900 border-slate-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-slate-100">Delete All Notifications?</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-300">
                      This will permanently delete all your notifications. This action cannot be undone.
                      <br /><br />
                      <span className="text-amber-400">💡 This helps reduce database load and keeps the app running smoothly for everyone.</span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={deleteAllNotifications}
                      className="bg-red-900 hover:bg-red-800 text-white"
                    >
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
          <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
            <div className="space-y-2">
              {loading ? (
                <Card>
                  <CardContent className="p-4 text-center text-muted-foreground">
                    Loading notifications...
                  </CardContent>
                </Card>
              ) : notifications.length === 0 ? (
                <Card>
                  <CardContent className="p-4 text-center text-muted-foreground">
                    No notifications yet
                  </CardContent>
                </Card>
              ) : (
                notifications.map((notification) => (
                  <Card 
                    key={notification.id}
                    className={`cursor-pointer transition-colors group ${
                      notification.read ? 'bg-muted/30' : 'bg-primary/5 border-primary/30'
                    }`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div 
                          className="flex-1"
                          onClick={() => handleNotificationClick(notification.id, notification.read)}
                          role="button"
                          tabIndex={0}
                          aria-label={`Notification: ${notification.title}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              handleNotificationClick(notification.id, notification.read);
                            }
                          }}
                        >
                          <h4 className="font-semibold text-sm">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <div 
                              className="w-2 h-2 bg-primary rounded-full flex-shrink-0"
                              aria-label="Unread notification indicator"
                            ></div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            aria-label={`Delete notification: ${notification.title}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default NotificationBell;