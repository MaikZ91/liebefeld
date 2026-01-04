import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Clock } from 'lucide-react';
import { getInitials } from '@/utils/chatUIUtils';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface UserProfile {
  id: string;
  username: string;
  avatar: string | null;
  interests: string[] | null;
  favorite_locations: string[] | null;
  last_online: string | null;
}

interface PeopleListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser?: (user: UserProfile) => void;
  currentUsername?: string;
}

const PeopleList: React.FC<PeopleListProps> = ({ 
  open, 
  onOpenChange,
  onSelectUser,
  currentUsername 
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if avatar is a custom uploaded image (not a default assigned one)
  const hasCustomAvatar = (avatar: string | null | undefined): boolean => {
    if (!avatar) return false;
    // Custom uploads are stored in Supabase storage or lovable-uploads
    const isUploadedImage = avatar.includes('supabase') || 
                            avatar.includes('lovable-uploads') ||
                            avatar.startsWith('blob:') ||
                            avatar.startsWith('data:');
    return isUploadedImage;
  };

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const { data: userProfiles, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('last_online', { ascending: false });

      if (error) throw error;

      // Sort: prioritize profiles with custom avatars, then by last_online
      const sortedProfiles = (userProfiles || [])
        .filter(user => user.username !== currentUsername) // Exclude current user
        .sort((a, b) => {
          const aHasCustom = hasCustomAvatar(a.avatar);
          const bHasCustom = hasCustomAvatar(b.avatar);
          
          // If one has custom avatar and other doesn't, prioritize custom
          if (aHasCustom && !bHasCustom) return -1;
          if (!aHasCustom && bHasCustom) return 1;
          
          // Both have same avatar status, sort by last_online
          const aTime = a.last_online ? new Date(a.last_online).getTime() : 0;
          const bTime = b.last_online ? new Date(b.last_online).getTime() : 0;
          return bTime - aTime;
        });

      setUsers(sortedProfiles);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatLastOnline = (lastOnline: string | null) => {
    if (!lastOnline) return 'Unbekannt';
    try {
      return formatDistanceToNow(new Date(lastOnline), { 
        addSuffix: true, 
        locale: de 
      });
    } catch {
      return 'Unbekannt';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md h-[80vh] flex flex-col p-0 bg-black border border-white/10 z-[9999]">
        <DialogHeader className="px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <Users size={20} className="text-gold" />
            <DialogTitle className="text-white font-bold text-lg tracking-wider uppercase">
              Community
            </DialogTitle>
          </div>
          <p className="text-zinc-500 text-xs mt-1">
            {users.length} Mitglieder
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-14 h-14 rounded-full bg-zinc-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-zinc-800 rounded" />
                    <div className="h-3 w-32 bg-zinc-800/50 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-zinc-500 text-sm">Keine Mitglieder gefunden</p>
            </div>
          ) : (
            <div className="p-4 space-y-1">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => onSelectUser?.(user)}
                  className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-lg transition-colors text-left group"
                >
                  <div className="relative">
                    <Avatar className="h-14 w-14 border-2 border-zinc-800 group-hover:border-gold/50 transition-colors">
                      <AvatarImage 
                        src={user.avatar || undefined} 
                        alt={user.username}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-zinc-800 text-white text-sm font-bold">
                        {getInitials(user.username)}
                      </AvatarFallback>
                    </Avatar>
                    {hasCustomAvatar(user.avatar) && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gold rounded-full flex items-center justify-center">
                        <span className="text-[8px]">✓</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">
                      {user.username}
                    </h3>
                    <div className="flex items-center gap-1 text-zinc-500 text-xs mt-0.5">
                      <Clock size={10} />
                      <span>{formatLastOnline(user.last_online)}</span>
                    </div>
                    {user.interests && user.interests.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {user.interests.slice(0, 3).map((interest, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-0.5 bg-zinc-900 border border-white/10 text-zinc-400 text-[9px] rounded"
                          >
                            {interest}
                          </span>
                        ))}
                        {user.interests.length > 3 && (
                          <span className="text-zinc-600 text-[9px]">
                            +{user.interests.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PeopleList;
