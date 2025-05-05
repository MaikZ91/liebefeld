
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, MessageSquare } from 'lucide-react';
import { userService } from '@/services/userService';
import { UserProfile } from '@/types/chatTypes';
import { getInitials } from '@/utils/chatUIUtils';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface UserDirectoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser: (user: UserProfile) => void;
  currentUsername: string;
}

const UserDirectory: React.FC<UserDirectoryProps> = ({ 
  open, 
  onOpenChange, 
  onSelectUser,
  currentUsername
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);
  
  useEffect(() => {
    filterUsers();
  }, [searchQuery, users]);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await userService.getUsers();
      setUsers(fetchedUsers);
      setFilteredUsers(fetchedUsers.filter(user => user.username !== currentUsername));
    } catch (error) {
      console.error('Fehler beim Abrufen der Benutzer:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users.filter(user => user.username !== currentUsername));
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = users.filter(user => {
      // Aktuellen Benutzer ausschließen
      if (user.username === currentUsername) return false;
      
      return (
        user.username.toLowerCase().includes(query) ||
        (user.interests || []).some(i => i.toLowerCase().includes(query)) ||
        (user.hobbies || []).some(h => h.toLowerCase().includes(query))
      );
    });
    
    setFilteredUsers(filtered);
  };
  
  const formatLastOnline = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: de 
      });
    } catch (error) {
      return 'unbekannt';
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Benutzerverzeichnis</DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nach Benutzern oder Interessen suchen..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <ScrollArea className="h-[50vh]">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-purple-500 rounded-full"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine Benutzer gefunden
            </div>
          ) : (
            <div className="space-y-4 p-1">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer" onClick={() => onSelectUser(user)}>
                  <Avatar className="h-12 w-12 border border-purple-200/30">
                    <AvatarImage src={user.avatar || undefined} alt={user.username} />
                    <AvatarFallback className="bg-purple-800 text-white">
                      {getInitials(user.username)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium truncate">{user.username}</h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatLastOnline(user.last_online)}
                      </span>
                    </div>
                    
                    {(user.interests && user.interests.length > 0) && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.interests.slice(0, 3).map((interest, i) => (
                          <Badge key={i} variant="secondary" className="text-xs px-1">
                            {interest}
                          </Badge>
                        ))}
                        {user.interests.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{user.interests.length - 3}</span>
                        )}
                      </div>
                    )}
                    
                    {(user.hobbies && user.hobbies.length > 0) && (
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {user.hobbies.slice(0, 3).join(', ')}
                        {user.hobbies.length > 3 && ` +${user.hobbies.length - 3}`}
                      </div>
                    )}
                  </div>
                  
                  <Button size="sm" variant="ghost" className="flex-shrink-0">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default UserDirectory;
