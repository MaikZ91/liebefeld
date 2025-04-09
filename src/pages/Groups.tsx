
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase, type ChatMessage } from "@/integrations/supabase/client";
import CalendarNavbar from "@/components/CalendarNavbar";
import { toast } from '@/hooks/use-toast';
import { ChatGroup, TypingUser, USERNAME_KEY, AVATAR_KEY } from '@/types/chatTypes';
import { getInitials } from '@/utils/chatUIUtils';
import ChatGroupComponent from '@/components/chat/ChatGroup';
import UsernameDialog from '@/components/chat/UsernameDialog';

const Groups = () => {
  const [activeGroup, setActiveGroup] = useState<string>("");
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem(USERNAME_KEY) || "";
  });
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Record<string, TypingUser[]>>({});

  useEffect(() => {
    if (!username) {
      setIsUsernameModalOpen(true);
    } else if (!localStorage.getItem(AVATAR_KEY)) {
      const avatarUrl = Math.random().toString(36).substring(2, 8);
      localStorage.setItem(AVATAR_KEY, `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarUrl}`);
    }
  }, [username]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_groups')
          .select('*')
          .order('created_at', { ascending: true })
          .not('name', 'eq', 'LiebefeldBot')
          .not('name', 'eq', 'Liebefeld'); // Exclude Liebefeld group
        
        if (error) {
          throw error;
        }

        setGroups(data);
        if (data && data.length > 0 && !activeGroup) {
          setActiveGroup(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
        toast({
          title: "Fehler beim Laden der Gruppen",
          description: "Die Gruppen konnten nicht geladen werden.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, [activeGroup]);

  useEffect(() => {
    if (!activeGroup) return;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('group_id', activeGroup)
          .order('created_at', { ascending: true });
        
        if (error) {
          throw error;
        }

        if (username && data && data.length > 0) {
          const messagesToUpdate = data.filter(msg => 
            msg.sender !== username && 
            (!msg.read_by || !msg.read_by.includes(username))
          );
          
          if (messagesToUpdate.length > 0) {
            for (const msg of messagesToUpdate) {
              const readBy = msg.read_by || [];
              await supabase
                .from('chat_messages')
                .update({ read_by: [...readBy, username] })
                .eq('id', msg.id);
            }
          }
        }

        if (data) {
          const typedMessages = data.map(msg => ({
            ...msg,
            reactions: msg.reactions as any[] || [],
            read_by: msg.read_by as string[] || []
          }));

          setMessages(prev => ({
            ...prev,
            [activeGroup]: typedMessages
          }));
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();

    const messagesChannel = supabase
      .channel('public:chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `group_id=eq.${activeGroup}`
      }, (payload) => {
        const newMessage = payload.new as ChatMessage;
        
        if (username && newMessage.sender !== username) {
          const readBy = newMessage.read_by || [];
          supabase
            .from('chat_messages')
            .update({ read_by: [...readBy, username] })
            .eq('id', newMessage.id);
        }
        
        setMessages(prev => ({
          ...prev,
          [activeGroup]: [...(prev[activeGroup] || []), newMessage]
        }));
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
        filter: `group_id=eq.${activeGroup}`
      }, (payload) => {
        const updatedMessage = payload.new as ChatMessage;
        setMessages(prev => {
          const groupMessages = [...(prev[activeGroup] || [])];
          const index = groupMessages.findIndex(msg => msg.id === updatedMessage.id);
          if (index !== -1) {
            groupMessages[index] = updatedMessage;
          }
          return {
            ...prev,
            [activeGroup]: groupMessages
          };
        });
      })
      .subscribe();

    const typingChannel = supabase
      .channel(`typing:${activeGroup}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { username: typingUsername, avatar, isTyping } = payload;
        
        if (typingUsername === localStorage.getItem(USERNAME_KEY)) return;
        
        setTypingUsers(prev => {
          const groupTypingUsers = [...(prev[activeGroup] || [])];
          
          if (isTyping) {
            const existingIndex = groupTypingUsers.findIndex(u => u.username === typingUsername);
            if (existingIndex >= 0) {
              groupTypingUsers[existingIndex] = {
                ...groupTypingUsers[existingIndex],
                lastTyped: new Date()
              };
            } else {
              groupTypingUsers.push({
                username: typingUsername,
                avatar,
                lastTyped: new Date()
              });
            }
          } else {
            const filteredUsers = groupTypingUsers.filter(u => u.username !== typingUsername);
            return {
              ...prev,
              [activeGroup]: filteredUsers
            };
          }
          
          return {
            ...prev,
            [activeGroup]: groupTypingUsers
          };
        });
      })
      .subscribe();

    const typingInterval = setInterval(() => {
      setTypingUsers(prev => {
        const groupTypingUsers = [...(prev[activeGroup] || [])];
        const now = new Date();
        const filteredUsers = groupTypingUsers.filter(user => {
          return now.getTime() - user.lastTyped.getTime() < 3000;
        });
        
        if (filteredUsers.length !== groupTypingUsers.length) {
          return {
            ...prev,
            [activeGroup]: filteredUsers
          };
        }
        return prev;
      });
    }, 2000);

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
      clearInterval(typingInterval);
    };
  }, [activeGroup, username]);

  const handleSetUsername = (newUsername: string) => {
    setUsername(newUsername);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Lade Gruppen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CalendarNavbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Gruppen</h1>
            <p className="text-lg">Entdecke Gruppen in deiner Stadt und tausche dich mit Gleichgesinnten aus!</p>
          </div>
          
          {username && (
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={localStorage.getItem(AVATAR_KEY) || undefined} alt={username} />
                <AvatarFallback>{getInitials(username)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{username}</div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsUsernameModalOpen(true)}
                  className="p-0 h-auto text-xs text-muted-foreground"
                >
                  Ändern
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-between mb-4">
          <Tabs value={activeGroup} onValueChange={setActiveGroup} className="w-full">
            <div className="flex justify-between items-center">
              <TabsList className="mb-4">
                {groups.map((group) => (
                  <TabsTrigger key={group.id} value={group.id}>
                    {group.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            {groups.map((group) => (
              <TabsContent key={group.id} value={group.id}>
                <ChatGroupComponent
                  group={group}
                  username={username}
                  messages={messages[group.id] || []}
                  typingUsers={typingUsers[group.id] || []}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
      
      <UsernameDialog 
        isOpen={isUsernameModalOpen}
        onOpenChange={setIsUsernameModalOpen}
        onUsernameSet={handleSetUsername}
      />
    </div>
  );
};

export default Groups;
