import React, { useState } from 'react';
import { Users, MapPin, Clock, MessageCircle, Navigation, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NearbyUser {
  id: string;
  username: string;
  avatar?: string;
  status?: string;
  distance?: number; // in meters
  lastSeen: Date;
  interests?: string[];
  location?: { lat: number; lng: number };
}

interface DiscoveryPanelProps {
  nearbyUsers: NearbyUser[];
  onUserClick: (userId: string) => void;
  onMessageUser: (userId: string) => void;
  userInterests?: string[];
}

const INTEREST_FILTERS = ['Alle', 'Party', 'Sport', 'Kunst', 'Musik', 'Kaffee'];

export const DiscoveryPanel: React.FC<DiscoveryPanelProps> = ({
  nearbyUsers,
  onUserClick,
  onMessageUser,
  userInterests = []
}) => {
  const [selectedFilter, setSelectedFilter] = useState('Alle');
  const [showFilters, setShowFilters] = useState(false);

  const formatDistance = (meters?: number) => {
    if (!meters) return 'In der Nähe';
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return 'Gerade aktiv';
    if (minutes < 5) return 'Aktiv';
    if (minutes < 60) return `vor ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `vor ${hours}h`;
    return 'Vor längerer Zeit';
  };

  const getActivityStatus = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 5) return 'active';
    if (minutes < 30) return 'recent';
    return 'away';
  };

  const filteredUsers = nearbyUsers.filter(user => {
    if (selectedFilter === 'Alle') return true;
    return user.interests?.some(i => 
      i.toLowerCase().includes(selectedFilter.toLowerCase())
    );
  });

  // Sort by distance and activity
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aActive = getActivityStatus(a.lastSeen) === 'active' ? 0 : 1;
    const bActive = getActivityStatus(b.lastSeen) === 'active' ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;
    return (a.distance || 0) - (b.distance || 0);
  });

  return (
    <div className="bg-black/95 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-gold" />
          <span className="text-sm font-medium text-white">In der Nähe</span>
          <span className="text-xs text-zinc-500">({nearbyUsers.length})</span>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "p-1.5 rounded-lg transition-all",
            showFilters ? "bg-gold text-black" : "bg-white/10 text-zinc-400 hover:bg-white/20"
          )}
        >
          <Filter size={14} />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="px-4 py-3 border-b border-white/10 bg-white/5">
          <div className="flex gap-2 flex-wrap">
            {INTEREST_FILTERS.map(filter => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-full transition-all",
                  selectedFilter === filter
                    ? "bg-gold text-black"
                    : "bg-white/10 text-zinc-400 hover:bg-white/20"
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="max-h-80 overflow-y-auto">
        {sortedUsers.length === 0 ? (
          <div className="p-6 text-center">
            <Users size={24} className="text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">Niemand in der Nähe</p>
            <p className="text-xs text-zinc-600 mt-1">Teile deinen Standort um andere zu finden!</p>
          </div>
        ) : (
          sortedUsers.map(user => {
            const activityStatus = getActivityStatus(user.lastSeen);
            return (
              <div
                key={user.id}
                className="p-4 border-b border-white/5 hover:bg-white/5 transition-all cursor-pointer"
                onClick={() => onUserClick(user.id)}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar with activity indicator */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-zinc-800 overflow-hidden ring-2 ring-white/10">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg font-bold text-zinc-400">
                          {user.username[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-black",
                      activityStatus === 'active' ? "bg-green-500" :
                      activityStatus === 'recent' ? "bg-yellow-500" :
                      "bg-zinc-600"
                    )} />
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{user.username}</span>
                      {activityStatus === 'active' && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                          LIVE
                        </span>
                      )}
                    </div>
                    
                    {user.status && (
                      <p className="text-sm text-zinc-300 mt-0.5 truncate">{user.status}</p>
                    )}
                    
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500">
                      <div className="flex items-center gap-1">
                        <Navigation size={10} />
                        <span>{formatDistance(user.distance)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={10} />
                        <span>{formatLastSeen(user.lastSeen)}</span>
                      </div>
                    </div>

                    {/* Shared Interests */}
                    {user.interests && userInterests && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {user.interests
                          .filter(i => userInterests.some(ui => ui.toLowerCase() === i.toLowerCase()))
                          .slice(0, 3)
                          .map(interest => (
                            <span
                              key={interest}
                              className="px-2 py-0.5 text-[10px] bg-gold/20 text-gold rounded-full"
                            >
                              {interest}
                            </span>
                          ))
                        }
                      </div>
                    )}
                  </div>

                  {/* Message Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMessageUser(user.id);
                    }}
                    className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all"
                  >
                    <MessageCircle size={16} className="text-white" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
