import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import ProfileCard from "@/components/ProfileCard";
import Navigation from "@/components/Navigation";
import NotificationBell from "@/components/NotificationBell";
import Chat from "@/components/Chat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Calendar, Megaphone, User, RotateCcw, AlertTriangle, Heart } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("discover");
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [confessions, setConfessions] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [newConfession, setNewConfession] = useState("");
  const [dateRequests, setDateRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const navigate = useNavigate();

  // Listen for message events from ProfileCard
  useEffect(() => {
    const handleSwitchToMessages = (event: any) => {
      setActiveTab("messages");
      // Optionally auto-select the conversation
      setTimeout(() => {
        const conversation = conversations.find(c => c.id === event.detail.conversationId);
        if (conversation) {
          setSelectedConversation(conversation);
        }
      }, 100);
    };

    window.addEventListener('switchToMessages', handleSwitchToMessages);
    return () => window.removeEventListener('switchToMessages', handleSwitchToMessages);
  }, [conversations]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user || null);
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      if (!session) {
        navigate("/auth");
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchProfiles();
      fetchAnnouncements();
      fetchConfessions();
      fetchConversations();
      fetchDateRequests();
    }
  }, [user]);

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", user?.id)
      .limit(10);

    if (error) {
      console.error("Error fetching profiles:", error);
    } else {
      setProfiles(data || []);
    }
  };

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select(`
        *,
        profiles!fk_author_profile(name, avatar_url)
      `)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching announcements:", error);
    } else {
      setAnnouncements(data || []);
    }
  };

  const fetchConfessions = async () => {
    const { data, error } = await supabase
      .from("confessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching confessions:", error);
    } else {
      setConfessions(data || []);
    }
  };

  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select(`
        *,
        participant_1_profile:profiles!conversations_participant_1_fkey(name, avatar_url),
        participant_2_profile:profiles!conversations_participant_2_fkey(name, avatar_url)
      `)
      .or(`participant_1.eq.${user?.id},participant_2.eq.${user?.id}`)
      .order("last_message_at", { ascending: false })
      .limit(20); // Limit conversations to reduce data usage

    if (error) {
      console.error("Error fetching conversations:", error);
    } else {
      setConversations(data || []);
    }
  };

  const fetchDateRequests = async () => {
    const { data, error } = await supabase
      .from("date_requests")
      .select(`
        *,
        sender:profiles!date_requests_sender_id_fkey(id, name, avatar_url),
        receiver:profiles!date_requests_receiver_id_fkey(id, name, avatar_url)
      `)
      .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching date requests:", error);
    } else {
      setDateRequests(data || []);
    }
  };

  const handleDateRequestResponse = async (requestId: string, status: 'accepted' | 'rejected') => {
    const { error } = await supabase
      .from("date_requests")
      .update({ status })
      .eq("id", requestId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      fetchDateRequests();
      toast({
        title: status === 'accepted' ? "Request Accepted!" : "Request Rejected",
        description: `You have ${status} the date request`
      });
    }
  };

  const handleLike = async () => {
    setCurrentProfileIndex(prev => prev + 1);
  };

  const handlePass = () => {
    setCurrentProfileIndex(prev => prev + 1);
  };

  const postAnnouncement = async () => {
    if (!newAnnouncement.trim()) return;

    const { error } = await supabase
      .from("announcements")
      .insert({
        content: newAnnouncement,
        author_id: user?.id
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setNewAnnouncement("");
      fetchAnnouncements();
      toast({
        title: "Posted!",
        description: "Your announcement has been posted"
      });
    }
  };

  const postConfession = async () => {
    if (!newConfession.trim()) return;

    const { error } = await supabase
      .from("confessions")
      .insert({
        content: newConfession,
        author_id: user?.id
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setNewConfession("");
      fetchConfessions();
      toast({
        title: "Posted!",
        description: "Your confession has been posted anonymously"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const currentProfile = profiles[currentProfileIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 pb-20 relative overflow-hidden">
      {/* Electric background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 animate-pulse"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-radial from-primary/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-radial from-secondary/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
      <div className="container mx-auto p-4 max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8"></div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-pulse">
              ⚡ HeartBeat@ITER 
            </h1>
            <NotificationBell userId={user.id} />
          </div>
          <p className="text-muted-foreground text-sm bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
            Campus connections 
          </p>
        </div>

        {/* Content based on active tab */}
        {activeTab === "discover" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Discover</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  fetchProfiles();
                  setCurrentProfileIndex(0);
                  toast({ title: "Profiles refreshed!" });
                }}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
            {currentProfile ? (
              <ProfileCard
                profile={currentProfile}
                currentUserId={user.id}
                onLike={handleLike}
                onPass={handlePass}
              />
            ) : (
              <Card className="text-center p-8">
                <CardContent>
                  <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No more profiles</h3>
                  <p className="text-muted-foreground">Check back later for new people!</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "messages" && (
          selectedConversation ? (
            <Chat
              conversationId={selectedConversation.id}
              otherUser={selectedConversation.participant_1 === user?.id 
                ? { id: selectedConversation.participant_2, ...selectedConversation.participant_2_profile }
                : { id: selectedConversation.participant_1, ...selectedConversation.participant_1_profile }
              }
              currentUserId={user.id}
              onBack={() => setSelectedConversation(null)}
            />
          ) : (
            <div className="space-y-4">
              <Alert className="border-destructive bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">
                  <strong>Limited Messaging:</strong> Exchange contact details quickly and move to other platforms for better communication.
                </AlertDescription>
              </Alert>
              
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Messages</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    fetchConversations();
                    toast({ title: "Messages refreshed!" });
                  }}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
              {conversations.length > 0 ? (
                conversations.map((conversation) => {
                  const otherUser = conversation.participant_1 === user?.id 
                    ? conversation.participant_2_profile 
                    : conversation.participant_1_profile;
                  
                  return (
                    <Card 
                      key={conversation.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={otherUser?.avatar_url || "/placeholder.svg"}
                            alt={otherUser?.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold">{otherUser?.name}</h3>
                            <p className="text-sm text-muted-foreground">Tap to chat</p>
                          </div>
                          <MessageCircle className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card className="text-center p-8">
                  <CardContent>
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
                    <p className="text-muted-foreground">Start by liking someone's profile!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )
        )}

        {activeTab === "announcements" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Campus Life</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  fetchAnnouncements();
                  fetchConfessions();
                  toast({ title: "Feed refreshed!" });
                }}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
            
            {/* Post new announcement */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Make an Announcement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="What's happening on campus?"
                  value={newAnnouncement}
                  onChange={(e) => setNewAnnouncement(e.target.value)}
                />
                <Button onClick={postAnnouncement} className="w-full">
                  Post Announcement
                </Button>
              </CardContent>
            </Card>

            {/* Post new confession */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Anonymous Confession</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Share something anonymously..."
                  value={newConfession}
                  onChange={(e) => setNewConfession(e.target.value)}
                />
                <Button onClick={postConfession} variant="secondary" className="w-full">
                  Post Anonymously
                </Button>
              </CardContent>
            </Card>

            {/* Announcements */}
            <div className="space-y-3">
              <h3 className="font-semibold text-primary">Recent Announcements</h3>
              {announcements.map((announcement) => (
                <Card key={announcement.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <img
                        src={announcement.profiles?.avatar_url || "/placeholder.svg"}
                        alt="Author"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">{announcement.profiles?.name}</span>
                          <Badge variant="outline">
                            <Megaphone className="w-3 h-3 mr-1" />
                            Announcement
                          </Badge>
                        </div>
                        <p className="text-sm">{announcement.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(announcement.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Confessions */}
            <div className="space-y-3">
              <h3 className="font-semibold text-secondary">Anonymous Confessions</h3>
              {confessions.map((confession) => (
                <Card key={confession.id} className="bg-secondary/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                        <span className="text-xs">🎭</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-secondary">Anonymous</span>
                          <Badge variant="secondary">Confession</Badge>
                        </div>
                        <p className="text-sm">{confession.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(confession.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "date-requests" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Date Requests</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  fetchDateRequests();
                  toast({ title: "Date requests refreshed!" });
                }}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
            
            {dateRequests.length > 0 ? (
              <div className="space-y-3">
                {dateRequests.map((request) => {
                  const isReceived = request.receiver_id === user?.id;
                  const otherUser = isReceived ? request.sender : request.receiver;
                  
                  return (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={otherUser?.avatar_url || "/placeholder.svg"}
                            alt={otherUser?.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <h3 
  className={`font-semibold ${isReceived ? 'text-blue-600 underline cursor-pointer hover:opacity-80' : ''}`}
  onClick={() => {
     navigate(`/profile/${otherUser?.id}`);
  }}
>
  {otherUser?.name}
</h3>              
                            <Button
  size="icon"
  variant="ghost"
  className="mt-2"
  onClick={async () => {
    const { data, error } = await supabase
      .rpc("get_or_create_conversation", {
        user1: user.id,
        user2: otherUser.id
      });

    if (error) {
      toast({
        title: "Error creating conversation",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const event = new CustomEvent("switchToMessages", {
      detail: { conversationId: data.id },
    });
    window.dispatchEvent(event);
  }}
>
  <MessageCircle className="w-4 h-4" />
</Button>


                            <p className="text-sm text-muted-foreground">
                              {isReceived ? "Sent you a date request" : "You sent a date request"}
                            </p>
                            <Badge 
                              variant={
                                request.status === 'accepted' ? 'default' : 
                                request.status === 'rejected' ? 'destructive' : 
                                'secondary'
                              }
                              className="mt-1"
                            >
                              {request.status}
                            </Badge>
                          </div>
                          {isReceived && request.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleDateRequestResponse(request.id, 'accepted')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDateRequestResponse(request.id, 'rejected')}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="text-center p-8">
                <CardContent>
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No date requests</h3>
                  <p className="text-muted-foreground">Send date requests by browsing profiles!</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-4">
            <Card className="text-center p-8 bg-gradient-to-br from-primary/10 via-card to-secondary/10 border-primary/30 shadow-[var(--shadow-electric)]">
              <CardContent>
                <User className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
                <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  Profile Settings
                </h3>
                <p className="text-muted-foreground mb-4">Manage your dating profile ⚡</p>
                <Button 
                  className="w-full bg-gradient-to-r from-primary via-accent to-secondary hover:opacity-90 text-white shadow-[var(--shadow-lightning)]"
                  onClick={() => navigate("/profile")}
                >
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
