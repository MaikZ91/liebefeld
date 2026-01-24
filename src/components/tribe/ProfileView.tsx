import React, { useState, useEffect } from 'react';
import { UserProfile, TribeEvent } from '@/types/tribe';
import { TribeEventCard } from './TribeEventCard';
import { Shield, Sparkles, MapPin, Edit3, X, Save, Upload, Plus, LogOut } from 'lucide-react';
import { ShareAppQRCode } from './ShareAppQRCode';
import { personalizationService } from '@/services/personalizationService';
import { supabase } from '@/integrations/supabase/client';
import { userService } from '@/services/userService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { getInitials } from '@/utils/chatUIUtils';
import { OnboardingStep } from '@/hooks/useOnboardingFlow';

const MIA_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150";

interface ProfileViewProps {
  userProfile: UserProfile;
  attendingEvents: TribeEvent[];
  likedEvents: TribeEvent[];
  onToggleAttendance?: (event: TribeEvent) => void;
  attendingEventIds?: Set<string>;
  likedEventIds?: Set<string>;
  onOpenMatcher?: () => void;
  onProfileUpdate?: (updatedProfile: UserProfile) => void;
  onboardingStep?: OnboardingStep;
  onSignOut?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ 
  userProfile, 
  attendingEvents, 
  likedEvents,
  onToggleAttendance,
  attendingEventIds,
  likedEventIds,
  onOpenMatcher,
  onProfileUpdate,
  onboardingStep,
  onSignOut
}) => {
  const [activeTab, setActiveTab] = useState<'GOING' | 'LIKED'>('GOING');
  const [favoriteLocations, setFavoriteLocations] = useState<string[]>([]);
  
  // Edit mode state - auto-start editing if in onboarding editing_profile step
  const [isEditing, setIsEditing] = useState(onboardingStep === 'editing_profile');
  const [editUsername, setEditUsername] = useState(userProfile.username);
  const [editAvatar, setEditAvatar] = useState(userProfile.avatarUrl);
  const [editInterests, setEditInterests] = useState<string[]>(userProfile.interests || []);
  const [editLocations, setEditLocations] = useState<string[]>(userProfile.favorite_locations || []);
  const [newInterest, setNewInterest] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Location selector state
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  
  useEffect(() => {
    const locations = personalizationService.getFavoriteLocations();
    setFavoriteLocations(locations);
  }, [likedEvents]);

  // Auto-start editing when onboarding step is editing_profile
  useEffect(() => {
    if (onboardingStep === 'editing_profile') {
      setIsEditing(true);
    }
  }, [onboardingStep]);

  // Reset edit state when userProfile changes
  useEffect(() => {
    setEditUsername(userProfile.username);
    setEditAvatar(userProfile.avatarUrl);
    setEditInterests(userProfile.interests || []);
    setEditLocations(userProfile.favorite_locations || []);
  }, [userProfile]);

  // Fetch available locations when editing
  useEffect(() => {
    if (isEditing) {
      fetchLocations();
    }
  }, [isEditing]);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('unique_locations')
        .select('location');
        
      if (error) {
        console.error('Error fetching locations:', error);
        return;
      }
      
      const locationList = data
        .map(item => item.location)
        .filter(Boolean) as string[];
        
      setAvailableLocations(locationList);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Fehler",
        description: "Das Bild ist zu groß. Maximale Größe: 2MB",
        variant: "destructive"
      });
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Fehler",
        description: "Nur Bilder können hochgeladen werden",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setUploading(true);
      const publicUrl = await userService.uploadProfileImage(file);
      setEditAvatar(publicUrl);
      toast({
        title: "Erfolg",
        description: "Bild erfolgreich hochgeladen",
        variant: "success"
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Hochladen des Bildes",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAddInterest = () => {
    if (newInterest.trim() && !editInterests.includes(newInterest.trim())) {
      setEditInterests([...editInterests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setEditInterests(editInterests.filter(i => i !== interest));
  };

  const handleAddLocation = (location: string) => {
    if (location && !editLocations.includes(location)) {
      setEditLocations([...editLocations, location]);
    }
    setShowLocationDropdown(false);
    setLocationSearch('');
  };

  const handleRemoveLocation = (location: string) => {
    setEditLocations(editLocations.filter(l => l !== location));
  };

  const handleSave = async () => {
    if (!editUsername.trim()) {
      toast({
        title: "Fehler",
        description: "Username darf nicht leer sein",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Update profile in database
      await userService.createOrUpdateProfile({
        username: editUsername.trim(),
        avatar: editAvatar || null,
        interests: editInterests,
        favorite_locations: editLocations,
        hobbies: [],
      });

      // Update localStorage with new profile
      const updatedProfile: UserProfile = {
        ...userProfile,
        username: editUsername.trim(),
        avatarUrl: editAvatar,
        interests: editInterests,
        favorite_locations: editLocations,
      };
      
      localStorage.setItem('tribe_user_profile', JSON.stringify(updatedProfile));
      localStorage.setItem('chat_username', editUsername.trim());
      if (editAvatar) {
        localStorage.setItem('chat_avatar', editAvatar);
      }
      
      // Notify parent component
      if (onProfileUpdate) {
        onProfileUpdate(updatedProfile);
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Aktualisieren des Profils",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setEditUsername(userProfile.username);
    setEditAvatar(userProfile.avatarUrl);
    setEditInterests(userProfile.interests || []);
    setEditLocations(userProfile.favorite_locations || []);
    setIsEditing(false);
  };

  const filteredLocations = availableLocations.filter(loc => 
    loc.toLowerCase().includes(locationSearch.toLowerCase()) &&
    !editLocations.includes(loc)
  );

  return (
    <div className="min-h-screen bg-black text-white pb-24 animate-fadeIn">
       {/* MIA Guidance during onboarding */}
       {onboardingStep === 'editing_profile' && (
         <div className="bg-gold/10 border-b border-gold/20 p-4">
           <div className="flex items-start gap-3 max-w-lg mx-auto">
             <div className="relative flex-shrink-0">
               <img 
                 src={MIA_AVATAR} 
                 alt="MIA" 
                 className="w-10 h-10 rounded-full object-cover border border-gold/50"
               />
               <div className="absolute -bottom-1 -right-1 bg-gold text-black text-[6px] font-bold px-1 py-0.5 rounded">
                 MIA
               </div>
             </div>
             <div className="flex-1">
               <p className="text-sm text-white/90 leading-relaxed">
                 Super! Füge jetzt ein Bild hinzu, erzähl uns von deinen Interessen und wähle deine Lieblingsorte. Wenn du fertig bist, klick auf <span className="text-gold font-bold">Speichern</span>! 💫
               </p>
             </div>
           </div>
         </div>
       )}

       {/* Identity Card */}
       <div className="p-6 bg-surface border-b border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
              <Shield size={120} />
          </div>
          
           {/* Edit/Save/Cancel/SignOut Buttons */}
           <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
             {isEditing ? (
               <>
                 <button
                   onClick={handleCancel}
                   className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:border-white/30 transition-all text-xs uppercase tracking-widest"
                 >
                   <X size={14} />
                   Abbrechen
                 </button>
                 <button
                   onClick={handleSave}
                   disabled={isSubmitting}
                   className="flex items-center gap-2 px-3 py-2 bg-gold/20 border border-gold/50 text-gold hover:bg-gold/30 transition-all text-xs uppercase tracking-widest disabled:opacity-50"
                 >
                   <Save size={14} />
                   {isSubmitting ? 'Speichern...' : 'Speichern'}
                 </button>
               </>
             ) : (
                <>
                  <ShareAppQRCode />
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-white/10 text-zinc-400 hover:text-gold hover:border-gold/30 transition-all text-xs uppercase tracking-widest"
                  >
                    <Edit3 size={14} />
                    Bearbeiten
                  </button>
                  {onSignOut && (
                    <button
                      onClick={onSignOut}
                      className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-red-500/30 text-red-400 hover:text-red-300 hover:border-red-500/50 transition-all text-xs uppercase tracking-widest"
                    >
                      <LogOut size={14} />
                      Abmelden
                    </button>
                  )}
                </>
             )}
           </div>
          
          <div className="relative z-10 flex flex-col items-center text-center mt-4">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full border-2 border-gold p-1 mb-4 relative">
                  <img 
                    src={isEditing ? editAvatar : userProfile.avatarUrl} 
                    className="w-full h-full rounded-full object-cover grayscale-[0.2]" 
                    alt={userProfile.username} 
                  />
                  {isEditing && (
                    <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full cursor-pointer hover:bg-black/70 transition-colors">
                      <Upload size={20} className="text-gold" />
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                    </label>
                  )}
              </div>

              {/* Username */}
              {isEditing ? (
                <Input
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="text-center text-2xl font-serif bg-zinc-900 border-gold/30 text-white max-w-[200px] mb-1"
                  placeholder="Username"
                />
              ) : (
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-serif text-white">{userProfile.username}</h2>
                  <Sparkles size={14} className="text-gold" />
                </div>
              )}
              <p className="text-zinc-500 text-xs font-light uppercase tracking-widest mb-6">{userProfile.bio}</p>
              
               <div className="flex gap-12 border-t border-white/5 pt-6 w-full justify-center">
                   <div className="text-center">
                       <span className="block text-xl font-bold text-gold">{attendingEvents.length}</span>
                       <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Going</span>
                   </div>
                   <div className="text-center">
                       <span className="block text-xl font-bold text-gold">{likedEvents.length}</span>
                       <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Liked</span>
                   </div>
               </div>
               
               {/* Interests */}
               <div className="border-t border-white/5 pt-6 mt-6 w-full">
                 <div className="flex items-center gap-2 mb-3 justify-center">
                   <Sparkles size={14} className="text-gold" />
                   <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Interessen</span>
                 </div>
                 {isEditing ? (
                   <div className="space-y-3">
                     <div className="flex flex-wrap gap-2 justify-center">
                       {editInterests.map((interest, idx) => (
                         <Badge 
                           key={idx}
                           className="px-3 py-1 bg-zinc-900 border border-gold/20 text-gold text-[10px] font-medium flex items-center gap-1"
                         >
                           {interest}
                           <X 
                             size={12} 
                             className="cursor-pointer hover:text-white" 
                             onClick={() => handleRemoveInterest(interest)}
                           />
                         </Badge>
                       ))}
                     </div>
                     <div className="flex gap-2 justify-center max-w-[300px] mx-auto">
                       <Input
                         value={newInterest}
                         onChange={(e) => setNewInterest(e.target.value)}
                         placeholder="z.B. Sport, Musik"
                         className="bg-zinc-900 border-white/10 text-white text-sm"
                         onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())}
                       />
                       <Button 
                         type="button" 
                         size="icon" 
                         onClick={handleAddInterest}
                         variant="outline"
                         className="border-gold/30 text-gold hover:bg-gold/20"
                       >
                         <Plus size={16} />
                       </Button>
                     </div>
                   </div>
                 ) : (
                   <div className="flex flex-wrap gap-2 justify-center">
                     {(userProfile.interests && userProfile.interests.length > 0) ? (
                       userProfile.interests.map((interest, idx) => (
                         <div 
                           key={idx}
                           className="px-3 py-1 bg-zinc-900 border border-gold/20 text-gold text-[10px] font-medium"
                         >
                           {interest}
                         </div>
                       ))
                     ) : (
                       <p className="text-zinc-600 text-xs">Keine Interessen hinzugefügt</p>
                     )}
                   </div>
                 )}
               </div>
               
               {/* Favorite Locations */}
               <div className="border-t border-white/5 pt-6 mt-6 w-full">
                 <div className="flex items-center gap-2 mb-3 justify-center">
                   <MapPin size={14} className="text-gold" />
                   <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Favorit Lokalitäten</span>
                 </div>
                 {isEditing ? (
                   <div className="space-y-3">
                     <div className="flex flex-wrap gap-2 justify-center">
                       {editLocations.map((location, idx) => (
                         <Badge 
                           key={idx}
                           className="px-3 py-1 bg-zinc-900 border border-gold/20 text-gold text-[10px] font-medium flex items-center gap-1"
                         >
                           {location}
                           <X 
                             size={12} 
                             className="cursor-pointer hover:text-white" 
                             onClick={() => handleRemoveLocation(location)}
                           />
                         </Badge>
                       ))}
                     </div>
                     <div className="relative max-w-[300px] mx-auto">
                       <Input
                         value={locationSearch}
                         onChange={(e) => {
                           setLocationSearch(e.target.value);
                           setShowLocationDropdown(true);
                         }}
                         onFocus={() => setShowLocationDropdown(true)}
                         placeholder="Lokation suchen..."
                         className="bg-zinc-900 border-white/10 text-white text-sm"
                       />
                       {showLocationDropdown && filteredLocations.length > 0 && (
                         <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-white/10 rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                           {filteredLocations.slice(0, 10).map((location) => (
                             <button
                               key={location}
                               type="button"
                               onClick={() => handleAddLocation(location)}
                               className="w-full px-3 py-2 text-left text-sm text-white hover:bg-zinc-800 flex items-center gap-2"
                             >
                               <MapPin size={12} className="text-zinc-500" />
                               {location}
                             </button>
                           ))}
                         </div>
                       )}
                     </div>
                   </div>
                 ) : (
                   <div className="flex flex-wrap gap-2 justify-center">
                     {favoriteLocations.length > 0 ? (
                       favoriteLocations.map((location, idx) => (
                         <div 
                           key={idx}
                           className="px-3 py-1 bg-zinc-900 border border-gold/20 text-gold text-[10px] font-medium"
                         >
                           {location}
                         </div>
                       ))
                     ) : (
                       <p className="text-zinc-600 text-xs">Keine Lokalitäten hinzugefügt</p>
                     )}
                   </div>
                 )}
               </div>
           </div>
        </div>

       {/* Tabs */}
       <div className="flex border-b border-white/10 sticky top-0 bg-black/95 backdrop-blur z-20">
           <button 
              onClick={() => setActiveTab('GOING')}
              className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'GOING' ? 'text-gold border-b-2 border-gold' : 'text-zinc-600 hover:text-white'}`}
           >
              My Calendar
           </button>
           <button 
              onClick={() => setActiveTab('LIKED')}
              className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'LIKED' ? 'text-gold border-b-2 border-gold' : 'text-zinc-600 hover:text-white'}`}
           >
              Favorites
           </button>
           <button 
              onClick={onOpenMatcher}
              className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gold hover:bg-gold/10 transition-colors border-l border-white/10"
           >
              Find People
           </button>
       </div>

       {/* List */}
       <div className="p-6 space-y-2">
           {activeTab === 'GOING' && (
               attendingEvents.length > 0 ? (
                   attendingEvents.map(event => (
                       <TribeEventCard 
                        key={event.id} 
                        event={event} 
                        variant="standard"
                       />
                   ))
               ) : (
                   <div className="text-center py-10 text-zinc-600 text-xs font-light border border-dashed border-white/10 rounded-lg">
                       No upcoming plans.
                   </div>
               )
           )}

           {activeTab === 'LIKED' && (
               likedEvents.length > 0 ? (
                   likedEvents.map(event => (
                       <TribeEventCard 
                        key={event.id} 
                        event={event} 
                        variant="standard"
                       />
                   ))
               ) : (
                   <div className="text-center py-10 text-zinc-600 text-xs font-light border border-dashed border-white/10 rounded-lg">
                       No favorites saved.
                   </div>
               )
           )}
       </div>
    </div>
  );
};
