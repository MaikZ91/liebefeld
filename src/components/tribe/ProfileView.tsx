import React, { useState, useEffect } from 'react';
import { UserProfile, TribeEvent } from '@/types/tribe';
import { TribeEventCard } from './TribeEventCard';
import { Shield, Sparkles, MapPin, Edit3, X, Save, Upload, Plus, LogOut, Crown, Star } from 'lucide-react';
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
               <img src={MIA_AVATAR} alt="MIA" className="w-10 h-10 rounded-full object-cover border border-gold/50" />
               <div className="absolute -bottom-1 -right-1 bg-gold text-black text-[6px] font-bold px-1 py-0.5 rounded">MIA</div>
             </div>
             <div className="flex-1">
               <p className="text-sm text-white/90 leading-relaxed">
                 Super! Füge jetzt ein Bild hinzu, erzähl uns von deinen Interessen und wähle deine Lieblingsorte. Wenn du fertig bist, klick auf <span className="text-gold font-bold">Speichern</span>! 💫
               </p>
             </div>
           </div>
         </div>
       )}

       {/* Hero Profile Section */}
       <div className="relative">
         {/* Background gradient */}
         <div className="absolute inset-0 bg-gradient-to-b from-gold/[0.04] via-transparent to-transparent" />
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,_rgba(180,140,60,0.06)_0%,_transparent_60%)]" />
         
         {/* Action buttons - top right */}
         <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
           {isEditing ? (
             <>
               <button onClick={handleCancel} className="px-3 py-1.5 bg-white/5 backdrop-blur-sm border border-white/10 text-zinc-400 hover:text-white transition-all text-[10px] uppercase tracking-[0.15em] rounded-full">
                 Abbrechen
               </button>
               <button onClick={handleSave} disabled={isSubmitting} className="px-3 py-1.5 bg-gold/20 backdrop-blur-sm border border-gold/40 text-gold hover:bg-gold/30 transition-all text-[10px] uppercase tracking-[0.15em] rounded-full disabled:opacity-50">
                 {isSubmitting ? '...' : 'Speichern'}
               </button>
             </>
           ) : (
             <>
               <button onClick={() => setIsEditing(true)} className="p-2 bg-white/5 backdrop-blur-sm border border-white/10 text-zinc-400 hover:text-gold hover:border-gold/30 transition-all rounded-full">
                 <Edit3 size={14} />
               </button>
               {onSignOut && (
                 <button onClick={onSignOut} className="p-2 bg-white/5 backdrop-blur-sm border border-white/10 text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition-all rounded-full">
                   <LogOut size={14} />
                 </button>
               )}
             </>
           )}
         </div>

         <div className="relative z-10 pt-8 pb-6 px-6">
           {/* Early Access Badge - subtle, inline */}
           <div className="flex justify-center mb-6">
             <div className="relative px-6 py-2 bg-white overflow-hidden">
               <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(0,0,0,0.015)_8px,rgba(0,0,0,0.015)_16px)]" />
               <div className="relative flex flex-col items-center gap-0.5">
                 <span className="text-[7px] font-bold uppercase tracking-[0.4em] text-black/40">No. 001</span>
                 <span className="text-[10px] font-light uppercase tracking-[0.3em] text-black">Founding Member</span>
                 <div className="w-8 h-px bg-black/20 my-0.5" />
                 <span className="text-[7px] uppercase tracking-[0.35em] text-black/35">Early Access · Est. 2025</span>
               </div>
             </div>
           </div>

           {/* Avatar - larger, more prominent */}
           <div className="flex justify-center mb-5">
             <div className="relative">
               <div className="w-28 h-28 rounded-full p-[2px] bg-gradient-to-br from-gold/40 via-gold/20 to-gold/40">
                 <div className="w-full h-full rounded-full overflow-hidden bg-black">
                   <img 
                     src={isEditing ? editAvatar : userProfile.avatarUrl} 
                     className="w-full h-full object-cover" 
                     alt={userProfile.username} 
                   />
                 </div>
               </div>
               {isEditing && (
                 <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer hover:bg-black/60 transition-colors">
                   <Upload size={22} className="text-gold/80" />
                   <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                 </label>
               )}
               {/* Online indicator */}
               <div className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-black" />
             </div>
           </div>

           {/* Username */}
           <div className="text-center mb-1">
             {isEditing ? (
               <Input
                 value={editUsername}
                 onChange={(e) => setEditUsername(e.target.value)}
                 className="text-center text-xl font-light tracking-wide bg-white/5 border-white/10 text-white max-w-[200px] mx-auto"
                 placeholder="Username"
               />
             ) : (
               <h2 className="text-xl font-light tracking-wide text-white">{userProfile.username}</h2>
             )}
           </div>
           <p className="text-center text-zinc-600 text-[10px] font-light uppercase tracking-[0.2em] mb-6">{userProfile.bio}</p>

           {/* Stats Row */}
           <div className="flex justify-center gap-8 mb-6">
             <div className="text-center">
               <span className="block text-lg font-light text-white">{attendingEvents.length}</span>
               <span className="text-[8px] text-zinc-600 uppercase tracking-[0.2em]">Going</span>
             </div>
             <div className="w-px h-8 bg-white/5 self-center" />
             <div className="text-center">
               <span className="block text-lg font-light text-white">{likedEvents.length}</span>
               <span className="text-[8px] text-zinc-600 uppercase tracking-[0.2em]">Favorites</span>
             </div>
           </div>

           {/* Interests */}
           <div className="mb-6">
             <div className="flex items-center gap-2 mb-3 justify-center">
               <span className="text-[8px] text-zinc-600 uppercase tracking-[0.2em]">Interessen</span>
             </div>
             {isEditing ? (
               <div className="space-y-3">
                 <div className="flex flex-wrap gap-1.5 justify-center">
                   {editInterests.map((interest, idx) => (
                     <Badge 
                       key={idx}
                       className="px-2.5 py-1 bg-white/[0.04] border border-white/10 text-white/70 text-[10px] font-light tracking-wide flex items-center gap-1.5 rounded-full hover:border-gold/30 transition-colors"
                     >
                       {interest}
                       <X size={10} className="cursor-pointer text-zinc-500 hover:text-white" onClick={() => handleRemoveInterest(interest)} />
                     </Badge>
                   ))}
                 </div>
                 <div className="flex gap-2 justify-center max-w-[260px] mx-auto">
                   <Input
                     value={newInterest}
                     onChange={(e) => setNewInterest(e.target.value)}
                     placeholder="z.B. Sport, Musik"
                     className="bg-white/5 border-white/10 text-white text-xs rounded-full"
                     onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())}
                   />
                   <Button type="button" size="icon" onClick={handleAddInterest} variant="outline" className="border-white/10 text-zinc-400 hover:text-gold hover:border-gold/30 rounded-full h-9 w-9">
                     <Plus size={14} />
                   </Button>
                 </div>
               </div>
             ) : (
               <div className="flex flex-wrap gap-1.5 justify-center">
                 {(userProfile.interests && userProfile.interests.length > 0) ? (
                   userProfile.interests.map((interest, idx) => (
                     <div key={idx} className="px-3 py-1 bg-white/[0.04] border border-white/[0.06] text-white/60 text-[10px] font-light tracking-wide rounded-full">
                       {interest}
                     </div>
                   ))
                 ) : (
                   <p className="text-zinc-700 text-xs font-light">Keine Interessen hinzugefügt</p>
                 )}
               </div>
             )}
           </div>

           {/* Favorite Locations */}
           <div className="mb-6">
             <div className="flex items-center gap-2 mb-3 justify-center">
               <MapPin size={11} className="text-zinc-600" />
               <span className="text-[8px] text-zinc-600 uppercase tracking-[0.2em]">Lieblingsorte</span>
             </div>
             {isEditing ? (
               <div className="space-y-3">
                 <div className="flex flex-wrap gap-1.5 justify-center">
                   {editLocations.map((location, idx) => (
                     <Badge 
                       key={idx}
                       className="px-2.5 py-1 bg-white/[0.04] border border-white/10 text-white/70 text-[10px] font-light tracking-wide flex items-center gap-1.5 rounded-full hover:border-gold/30 transition-colors"
                     >
                       {location}
                       <X size={10} className="cursor-pointer text-zinc-500 hover:text-white" onClick={() => handleRemoveLocation(location)} />
                     </Badge>
                   ))}
                 </div>
                 <div className="relative max-w-[260px] mx-auto">
                   <Input
                     value={locationSearch}
                     onChange={(e) => { setLocationSearch(e.target.value); setShowLocationDropdown(true); }}
                     onFocus={() => setShowLocationDropdown(true)}
                     placeholder="Lokation suchen..."
                     className="bg-white/5 border-white/10 text-white text-xs rounded-full"
                   />
                   {showLocationDropdown && filteredLocations.length > 0 && (
                     <div className="absolute z-50 w-full mt-1 bg-zinc-900/95 backdrop-blur border border-white/10 rounded-xl shadow-2xl max-h-[200px] overflow-y-auto">
                       {filteredLocations.slice(0, 10).map((location) => (
                         <button key={location} type="button" onClick={() => handleAddLocation(location)} className="w-full px-3 py-2 text-left text-xs text-white/70 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors">
                           <MapPin size={10} className="text-zinc-600" />
                           {location}
                         </button>
                       ))}
                     </div>
                   )}
                 </div>
               </div>
             ) : (
               <div className="flex flex-wrap gap-1.5 justify-center">
                 {favoriteLocations.length > 0 ? (
                   favoriteLocations.map((location, idx) => (
                     <div key={idx} className="px-3 py-1 bg-white/[0.04] border border-white/[0.06] text-white/60 text-[10px] font-light tracking-wide rounded-full">
                       {location}
                     </div>
                   ))
                 ) : (
                   <p className="text-zinc-700 text-xs font-light">Keine Lokalitäten hinzugefügt</p>
                 )}
               </div>
             )}
           </div>

           {/* Share QR Code */}
           {!isEditing && <ShareAppQRCode variant="inline" />}
         </div>
         
         {/* Subtle divider */}
         <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
       </div>

       {/* Tabs */}
       <div className="flex border-b border-white/[0.06] sticky top-0 bg-black/95 backdrop-blur-xl z-20">
            <button 
               onClick={() => setActiveTab('GOING')}
               className={`flex-1 py-3.5 text-[9px] font-light uppercase tracking-[0.2em] transition-all ${activeTab === 'GOING' ? 'text-white border-b border-white/40' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
               Kalender
            </button>
            <button 
               onClick={() => setActiveTab('LIKED')}
               className={`flex-1 py-3.5 text-[9px] font-light uppercase tracking-[0.2em] transition-all ${activeTab === 'LIKED' ? 'text-white border-b border-white/40' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
               Favoriten
            </button>
            <button 
               onClick={onOpenMatcher}
               className="px-5 py-3.5 text-[9px] font-light uppercase tracking-[0.2em] text-gold/70 hover:text-gold transition-colors border-l border-white/[0.06]"
            >
               Leute finden
            </button>
        </div>

       {/* List */}
       <div className="p-5 space-y-2">
            {activeTab === 'GOING' && (
                attendingEvents.length > 0 ? (
                    attendingEvents.map(event => (
                        <TribeEventCard key={event.id} event={event} variant="standard" />
                    ))
                ) : (
                    <div className="text-center py-12 text-zinc-700 text-xs font-light">
                        Noch keine Pläne.
                    </div>
                )
            )}

            {activeTab === 'LIKED' && (
                likedEvents.length > 0 ? (
                    likedEvents.map(event => (
                        <TribeEventCard key={event.id} event={event} variant="standard" />
                    ))
                ) : (
                    <div className="text-center py-12 text-zinc-700 text-xs font-light">
                        Keine Favoriten gespeichert.
                    </div>
                )
            )}
        </div>
     </div>
   );
};
