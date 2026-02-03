import React, { useState, useEffect } from 'react';
import { Radio, Send, MapPin, Users, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PingMessage {
  id: string;
  sender: string;
  senderAvatar?: string;
  message: string;
  location?: { lat: number; lng: number };
  locationName?: string;
  timestamp: Date;
  respondents: Array<{ username: string; avatar?: string }>;
}

interface PingPanelProps {
  userProfile: { username: string; avatarUrl?: string };
  onSendPing: (message: string, location?: { lat: number; lng: number }) => void;
  activePings: PingMessage[];
  onRespondToPing: (pingId: string) => void;
  userLocation?: { lat: number; lng: number };
}

const PING_PRESETS = [
  { emoji: '🍻', text: 'Wer kommt auf ein Bier?' },
  { emoji: '☕', text: 'Kaffee trinken?' },
  { emoji: '🏃', text: 'Wer geht laufen?' },
  { emoji: '🎵', text: 'Wer geht heute Abend feiern?' },
  { emoji: '🎨', text: 'Jemand Lust auf Kunst?' },
  { emoji: '🌳', text: 'Park chillen?' },
];

export const PingPanel: React.FC<PingPanelProps> = ({
  userProfile,
  onSendPing,
  activePings,
  onRespondToPing,
  userLocation
}) => {
  const [customMessage, setCustomMessage] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [showNewPing, setShowNewPing] = useState(false);
  const [includeLocation, setIncludeLocation] = useState(true);

  const handleSendPing = () => {
    const message = customMessage || selectedPreset;
    if (!message) return;
    
    onSendPing(message, includeLocation ? userLocation : undefined);
    setCustomMessage('');
    setSelectedPreset(null);
    setShowNewPing(false);
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return 'Gerade eben';
    if (minutes < 60) return `vor ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `vor ${hours}h`;
  };

  return (
    <div className="bg-black/95 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio size={16} className="text-gold" />
          <span className="text-sm font-medium text-white">Ping</span>
        </div>
        <button
          onClick={() => setShowNewPing(!showNewPing)}
          className="text-xs px-3 py-1 bg-gold text-black font-semibold rounded-full hover:bg-gold/90 transition-all"
        >
          Neuer Ping
        </button>
      </div>

      {/* New Ping Creator */}
      {showNewPing && (
        <div className="p-4 border-b border-white/10 bg-white/5">
          <p className="text-xs text-zinc-400 mb-3">Was möchtest du unternehmen?</p>
          
          {/* Presets */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {PING_PRESETS.map(preset => (
              <button
                key={preset.text}
                onClick={() => {
                  setSelectedPreset(preset.text);
                  setCustomMessage('');
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all text-left",
                  selectedPreset === preset.text
                    ? "bg-gold/20 border border-gold text-gold"
                    : "bg-white/5 text-zinc-300 hover:bg-white/10"
                )}
              >
                <span>{preset.emoji}</span>
                <span className="truncate text-xs">{preset.text}</span>
              </button>
            ))}
          </div>

          {/* Custom Message */}
          <input
            type="text"
            value={customMessage}
            onChange={(e) => {
              setCustomMessage(e.target.value);
              setSelectedPreset(null);
            }}
            placeholder="Eigene Nachricht..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-gold/50 mb-3"
            maxLength={100}
          />

          {/* Include Location Toggle */}
          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeLocation}
              onChange={(e) => setIncludeLocation(e.target.checked)}
              className="w-4 h-4 rounded bg-white/10 border-white/20 text-gold focus:ring-gold"
            />
            <span className="text-xs text-zinc-400">Standort mitsenden</span>
          </label>

          {/* Send Button */}
          <button
            onClick={handleSendPing}
            disabled={!customMessage && !selectedPreset}
            className={cn(
              "w-full py-2.5 font-semibold rounded-lg flex items-center justify-center gap-2 transition-all",
              (customMessage || selectedPreset)
                ? "bg-gold text-black hover:bg-gold/90"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            )}
          >
            <Send size={16} />
            <span>Ping senden</span>
          </button>
        </div>
      )}

      {/* Active Pings List */}
      <div className="max-h-64 overflow-y-auto">
        {activePings.length === 0 ? (
          <div className="p-6 text-center">
            <Radio size={24} className="text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">Keine aktiven Pings</p>
            <p className="text-xs text-zinc-600 mt-1">Starte einen Ping um andere zu finden!</p>
          </div>
        ) : (
          activePings.map(ping => (
            <div key={ping.id} className="p-4 border-b border-white/5 hover:bg-white/5 transition-all">
              {/* Ping Header */}
              <div className="flex items-start gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0">
                  {ping.senderAvatar ? (
                    <img src={ping.senderAvatar} alt={ping.sender} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400">
                      {ping.sender[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{ping.sender}</span>
                    <span className="text-xs text-zinc-500">{getTimeAgo(ping.timestamp)}</span>
                  </div>
                  <p className="text-sm text-zinc-300 mt-0.5">{ping.message}</p>
                  {ping.locationName && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-zinc-500">
                      <MapPin size={10} />
                      <span>{ping.locationName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Respondents */}
              {ping.respondents.length > 0 && (
                <div className="flex items-center gap-2 ml-11 mb-2">
                  <div className="flex -space-x-2">
                    {ping.respondents.slice(0, 5).map((r, i) => (
                      <div key={i} className="w-5 h-5 rounded-full border-2 border-black bg-zinc-700 overflow-hidden">
                        {r.avatar ? (
                          <img src={r.avatar} alt={r.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-zinc-300">
                            {r.username[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-zinc-400">
                    {ping.respondents.length} {ping.respondents.length === 1 ? 'Person' : 'Personen'} dabei
                  </span>
                </div>
              )}

              {/* Respond Button */}
              {ping.sender !== userProfile.username && (
                <button
                  onClick={() => onRespondToPing(ping.id)}
                  className={cn(
                    "ml-11 px-3 py-1.5 text-xs font-medium rounded-full transition-all",
                    ping.respondents.some(r => r.username === userProfile.username)
                      ? "bg-gold/20 text-gold border border-gold"
                      : "bg-white/10 text-white hover:bg-white/20"
                  )}
                >
                  {ping.respondents.some(r => r.username === userProfile.username)
                    ? '✓ Bin dabei'
                    : 'Bin dabei!'}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
