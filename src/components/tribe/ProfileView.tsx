import React, { useState } from 'react';
import { UserProfile, TribeEvent } from '@/types/tribe';
import { TribeEventCard } from './TribeEventCard';
import { Shield, Sparkles } from 'lucide-react';

interface ProfileViewProps {
  userProfile: UserProfile;
  attendingEvents: TribeEvent[];
  likedEvents: TribeEvent[];
  onToggleAttendance?: (event: TribeEvent) => void;
  attendingEventIds?: Set<string>;
  likedEventIds?: Set<string>;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ 
  userProfile, 
  attendingEvents, 
  likedEvents,
  onToggleAttendance,
  attendingEventIds,
  likedEventIds
}) => {
  const [activeTab, setActiveTab] = useState<'GOING' | 'LIKED'>('GOING');

  return (
    <div className="min-h-screen bg-black text-white pb-24 animate-fadeIn">
       {/* Identity Card */}
       <div className="p-6 bg-surface border-b border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
              <Shield size={120} />
          </div>
          
          <div className="relative z-10 flex flex-col items-center text-center mt-4">
              <div className="w-24 h-24 rounded-full border-2 border-gold p-1 mb-4">
                  <img src={userProfile.avatarUrl} className="w-full h-full rounded-full object-cover grayscale-[0.2]" alt={userProfile.username} />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-serif text-white">{userProfile.username}</h2>
                <Sparkles size={14} className="text-gold" />
              </div>
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