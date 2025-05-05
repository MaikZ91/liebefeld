
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/chatTypes";
import { getInitials } from '@/utils/chatUIUtils';
import UserGallery from './UserGallery';
import { Grid2x2, List, Sparkles, Heart, UserCog, MapPin } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import ProfileEditor from './ProfileEditor';
import { userService } from '@/services/userService';

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
  const [viewMode, setViewMode] = useState<'list' | 'gallery'>('gallery');
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (open) {
      fetchOnlineUsers();
      if (currentUsername && currentUsername !== 'Gast') {
        fetchCurrentUserProfile();
      }
    }
  }, [open, currentUsername]);

  const fetchCurrentUserProfile = async () => {
    if (!currentUsername || currentUsername === 'Gast') return;
    
    try {
      const userProfile = await userService.getUserByUsername(currentUsername);
      if (userProfile) {
        setCurrentUserProfile(userProfile);
      }
    } catch (err) {
      console.error('Error fetching current user profile:', err);
    }
  };

  const fetchOnlineUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get actual user profiles from the user_profiles table
      const { data: userProfiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('last_online', { ascending: false });

      if (profilesError) {
        throw profilesError;
      }

      setUsers(userProfiles || []);

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

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'list' ? 'gallery' : 'list');
  };

  const handleOpenProfileEditor = () => {
    setProfileEditorOpen(true);
  };

  const handleProfileUpdate = () => {
    fetchOnlineUsers();
    fetchCurrentUserProfile();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-black text-white border border-gray-800">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-white">Online Benutzer</DialogTitle>
            <div className="flex items-center gap-2">
              {currentUsername && currentUsername !== 'Gast' && (
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleOpenProfileEditor}
                  className="h-8 w-8 border-gray-700 text-white hover:text-red-400 hover:border-red-500"
                  title="Profil bearbeiten"
                >
                  <UserCog className="h-4 w-4" />
                </Button>
              )}
              <Button 
                variant="outline" 
                size="icon"
                onClick={toggleViewMode}
                className="h-8 w-8 border-gray-700 text-white hover:text-red-400 hover:border-red-500"
              >
                {viewMode === 'list' ? <Grid2x2 className="h-4 w-4" /> : <List className="h-4 w-4" />}
              </Button>
            </div>
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
            ) : viewMode === 'gallery' ? (
              <UserGallery 
                users={users} 
                currentUsername={currentUsername} 
                onSelectUser={handleSelectUser} 
              />
            ) : (
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-2">
                  {users.map(user => (
                    <div
                      key={user.id}
                      className={`p-3 rounded-lg hover:bg-gray-900 cursor-pointer transition-colors ${
                        user.username === currentUsername ? 'bg-gray-900 opacity-70' : ''
                      }`}
                      onClick={() => user.username !== currentUsername && handleSelectUser(user)}
                    >
                      <div className="flex gap-3">
                        <Avatar className="h-12 w-12 border border-gray-800">
                          <AvatarImage src={user.avatar || ''} alt={user.username} />
                          <AvatarFallback className="bg-red-500">{getInitials(user.username)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{user.username}</p>
                            {user.username !== currentUsername ? (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-red-500 text-red-500 hover:bg-red-600/10"
                              >
                                Chatten
                              </Button>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Du</span>
                            )}
                          </div>
                          
                          <div className="flex items-center mb-2">
                            <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                            <span className="text-xs text-gray-400">Online</span>
                          </div>
                          
                          {/* Interests */}
                          {user.interests && user.interests.length > 0 && (
                            <div className="mb-1">
                              <div className="flex items-center gap-1 text-xs text-gray-300">
                                <Sparkles className="h-3 w-3 text-yellow-500" />
                                <span>Interessen:</span>
                                <div className="flex flex-wrap gap-1">
                                  {user.interests.map((interest, index) => (
                                    <Badge key={index} variant="outline" className="text-xs bg-gray-800/50 border-gray-700">
                                      {interest}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Hobbies */}
                          {user.hobbies && user.hobbies.length > 0 && (
                            <div className="mb-1">
                              <div className="flex items-center gap-1 text-xs text-gray-300">
                                <Heart className="h-3 w-3 text-red-500" />
                                <span>Hobbys:</span>
                                <div className="flex flex-wrap gap-1">
                                  {user.hobbies.map((hobby, index) => (
                                    <Badge key={index} variant="outline" className="text-xs bg-gray-800/50 border-gray-700">
                                      {hobby}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Favorite Locations */}
                          {user.favorite_locations && user.favorite_locations.length > 0 && (
                            <div>
                              <div className="flex items-center gap-1 text-xs text-gray-300">
                                <MapPin className="h-3 w-3 text-blue-500" />
                                <span>Lieblingsorte:</span>
                                <div className="flex flex-wrap gap-1">
                                  {user.favorite_locations.map((location, index) => (
                                    <Badge key={index} variant="outline" className="text-xs bg-gray-800/50 border-gray-700">
                                      {location}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ProfileEditor 
        open={profileEditorOpen}
        onOpenChange={setProfileEditorOpen}
        currentUser={currentUserProfile}
        onProfileUpdate={handleProfileUpdate}
      />
    </>
  );
};

export default UserDirectory;
