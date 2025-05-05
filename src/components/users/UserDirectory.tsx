import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/chatTypes";
import { getInitials } from '@/utils/chatUIUtils';

interface UserDirectoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser: (user: UserProfile) => void;
  currentUsername?: string;
}

const UserDirectory: React.FC<UserDirectoryProps> = ({
  open,
  onOpenChange,
  onSelectUser,
  currentUsername
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchOnlineUsers();
    }
  }, [open]);

  const fetchOnlineUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get unique usernames from the chat messages table
      const { data, error } = await supabase
        .from('chat_messages')
        .select('sender, avatar')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Create a map to keep track of users with their avatars
      const uniqueUsers = new Map<string, string>();
      
      // Add currentUsername to the list if provided
      if (currentUsername && currentUsername !== 'Gast') {
        const currentAvatar = localStorage.getItem('community_chat_avatar') || '';
        uniqueUsers.set(currentUsername, currentAvatar);
      }

      // Add other users
      data?.forEach(message => {
        if (message.sender && message.sender !== 'Gast' && message.sender !== 'System') {
          uniqueUsers.set(message.sender, message.avatar || '');
        }
      });

      // Convert map to array of user profiles
      const userProfiles: UserProfile[] = Array.from(uniqueUsers).map(([username, avatar]) => ({
        id: username, // Using username as ID for simplicity
        username,
        avatar,
        isOnline: true, // Assuming all users who have sent messages are "online"
        lastSeen: new Date().toISOString()
      }));

      setUsers(userProfiles);

    } catch (err: any) {
      console.error('Error fetching online users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user: UserProfile) => {
    onSelectUser(user);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-black text-white border border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">Online Benutzer</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-red-500 border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 py-4 text-center">
              Fehler beim Laden der Benutzer: {error}
            </div>
          ) : users.length === 0 ? (
            <div className="text-gray-400 py-4 text-center">
              Keine Benutzer online
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-2">
                {users.map(user => (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-2 rounded-lg hover:bg-gray-900 cursor-pointer transition-colors ${
                      user.username === currentUsername ? 'bg-gray-900 opacity-70' : ''
                    }`}
                    onClick={() => user.username !== currentUsername && handleSelectUser(user)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-gray-800">
                        <AvatarImage src={user.avatar} alt={user.username} />
                        <AvatarFallback className="bg-red-500">{getInitials(user.username)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-xs text-gray-400">Online</span>
                        </div>
                      </div>
                    </div>
                    {user.username !== currentUsername && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-red-500 text-red-500 hover:bg-red-600/10"
                      >
                        Chatten
                      </Button>
                    )}
                    {user.username === currentUsername && (
                      <span className="text-xs text-gray-400 italic">Du</span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDirectory;
