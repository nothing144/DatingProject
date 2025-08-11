import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read_at?: string;
}

interface ChatProps {
  conversationId: string;
  otherUser: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  currentUserId: string;
  onBack: () => void;
}

const Chat = ({ conversationId, otherUser, currentUserId, onBack }: ChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [messageCount, setMessageCount] = useState(0);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const MESSAGE_LIMIT = 50;
  const DAILY_MESSAGE_LIMIT = 50;

  useEffect(() => {
    fetchMessages();
    checkDailyMessageLimit();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkDailyMessageLimit = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { count, error } = await supabase
      .from("messages")
      .select("*", { count: 'exact', head: true })
      .eq("sender_id", currentUserId)
      .gte("created_at", `${today}T00:00:00.000Z`)
      .lte("created_at", `${today}T23:59:59.999Z`);

    if (!error && count && count >= DAILY_MESSAGE_LIMIT) {
      setHasReachedLimit(true);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }) // ✅ FIXED: removed incorrect semicolon
      .limit(MESSAGE_LIMIT);                    // ✅ chained properly

    if (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } else {
      const messageData = data || [];
      setMessages(messageData);
      setMessageCount(messageData.length);
      if (messageData.length >= MESSAGE_LIMIT) {
        setHasReachedLimit(true);
      }
    }
    setLoading(false);
  };

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    }, 100);
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim() || hasReachedLimit || sending) return;

    if (messageCount >= MESSAGE_LIMIT) {
      toast({
        title: "Message Limit Reached",
        description: `This conversation has reached the ${MESSAGE_LIMIT} message limit. Please exchange contact details to continue chatting elsewhere.`,
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    const { error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: newMessage.trim()
      });

    if (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } else {
      setNewMessage("");
      setMessageCount(prev => prev + 1);
      setTimeout(() => {
        fetchMessages();
      }, 500);

      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);

      if (messageCount < 3) {
        await supabase.rpc('create_notification', {
          target_user_id: otherUser.id,
          notification_type: 'message',
          notification_title: 'New Message',
          notification_message: `You have a new message`
        });
      }
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Notice for limited messaging */}
      <Alert className="mb-4 border-destructive bg-destructive/10">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <AlertDescription className="text-destructive">
          <strong>Limited Messaging:</strong> Only {MESSAGE_LIMIT} messages per conversation. Exchange contact details quickly and move to WhatsApp, Instagram, or other platforms.
        </AlertDescription>
      </Alert>

      {/* Warning when near limit */}
      {messageCount >= MESSAGE_LIMIT - 3 && (
        <Alert className="mb-4 border-yellow-500 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Warning:</strong> {MESSAGE_LIMIT - messageCount} messages remaining. Share your contact details now!
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <img
              src={otherUser.avatar_url || "/placeholder.svg"}
              alt={otherUser.name}
              className="w-8 h-8 rounded-full object-cover"
            />
            <CardTitle className="text-lg">{otherUser.name}</CardTitle>
            <div className="ml-auto text-xs text-muted-foreground">
              {messageCount}/{MESSAGE_LIMIT} messages
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <Card className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          {loading ? (
            <div className="text-center text-muted-foreground">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-3">
              {messageCount >= MESSAGE_LIMIT && (
                <div className="text-center p-4 bg-destructive/10 rounded-lg">
                  <p className="text-sm text-destructive font-medium">
                    Message limit reached! Exchange contact details to continue chatting.
                  </p>
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.sender_id === currentUserId
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender_id === currentUserId
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground'
                    }`}>
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <div className={`p-4 border-t ${hasReachedLimit ? 'opacity-50' : ''}`}>
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={hasReachedLimit ? "Message limit reached" : "Type a message..."}
              className="flex-1"
              disabled={hasReachedLimit}
            />
            <Button 
              onClick={sendMessage} 
              size="icon" 
              disabled={!newMessage.trim() || hasReachedLimit || sending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {hasReachedLimit && (
            <p className="text-xs text-destructive mt-2 text-center">
              Daily message limit reached. Try again tomorrow or exchange contact details.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Chat;
