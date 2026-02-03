import React, { useState } from 'react';
import { MapPin, Navigation, Radio, Eye, EyeOff, Clock, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationSharingPanelProps {
  isSharing: boolean;
  onToggleSharing: (share: boolean) => void;
  onUpdateStatus: (status: string) => void;
  currentStatus: string;
  shareUntil?: Date;
  onSetShareDuration: (hours: number) => void;
}

const STATUS_PRESETS = [
  { emoji: '🎉', text: 'Bin unterwegs' },
  { emoji: '☕', text: 'Auf einen Kaffee?' },
  { emoji: '🍻', text: 'Wer kommt mit?' },
  { emoji: '🏃', text: 'Sport machen' },
  { emoji: '🎵', text: 'Musik hören' },
  { emoji: '🎨', text: 'Kreativ unterwegs' },
];

const DURATION_OPTIONS = [
  { hours: 1, label: '1h' },
  { hours: 2, label: '2h' },
  { hours: 4, label: '4h' },
  { hours: 8, label: '8h' },
];

export const LocationSharingPanel: React.FC<LocationSharingPanelProps> = ({
  isSharing,
  onToggleSharing,
  onUpdateStatus,
  currentStatus,
  shareUntil,
  onSetShareDuration
}) => {
  const [customStatus, setCustomStatus] = useState('');
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(2);

  const handleStartSharing = () => {
    onSetShareDuration(selectedDuration);
    onToggleSharing(true);
    setShowDurationPicker(false);
  };

  const getRemainingTime = () => {
    if (!shareUntil) return null;
    const now = new Date();
    const diff = shareUntil.getTime() - now.getTime();
    if (diff <= 0) return null;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="bg-black/95 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isSharing ? "bg-green-500 animate-pulse" : "bg-zinc-600"
          )} />
          <span className="text-sm font-medium text-white">
            {isSharing ? 'Location aktiv' : 'Location teilen'}
          </span>
        </div>
        {isSharing && shareUntil && (
          <div className="flex items-center gap-1 text-xs text-zinc-400">
            <Clock size={12} />
            <span>{getRemainingTime()} verbleibend</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {!isSharing ? (
          <>
            {/* Duration Selection */}
            <div className="mb-4">
              <p className="text-xs text-zinc-400 mb-2">Wie lange teilen?</p>
              <div className="flex gap-2">
                {DURATION_OPTIONS.map(opt => (
                  <button
                    key={opt.hours}
                    onClick={() => setSelectedDuration(opt.hours)}
                    className={cn(
                      "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                      selectedDuration === opt.hours
                        ? "bg-gold text-black"
                        : "bg-white/5 text-zinc-400 hover:bg-white/10"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Selection */}
            <div className="mb-4">
              <p className="text-xs text-zinc-400 mb-2">Was machst du?</p>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_PRESETS.map(preset => (
                  <button
                    key={preset.text}
                    onClick={() => setCustomStatus(preset.text)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all text-left",
                      customStatus === preset.text
                        ? "bg-gold/20 border border-gold text-gold"
                        : "bg-white/5 text-zinc-300 hover:bg-white/10"
                    )}
                  >
                    <span>{preset.emoji}</span>
                    <span className="truncate">{preset.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Status Input */}
            <div className="mb-4">
              <input
                type="text"
                value={customStatus}
                onChange={(e) => setCustomStatus(e.target.value)}
                placeholder="Eigener Status..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-gold/50"
                maxLength={50}
              />
            </div>

            {/* Start Button */}
            <button
              onClick={() => {
                if (customStatus) onUpdateStatus(customStatus);
                handleStartSharing();
              }}
              className="w-full py-3 bg-gold text-black font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-gold/90 transition-all"
            >
              <Navigation size={18} />
              <span>Location teilen</span>
            </button>
          </>
        ) : (
          <>
            {/* Current Status Display */}
            <div className="mb-4 p-3 bg-white/5 rounded-lg">
              <p className="text-xs text-zinc-400 mb-1">Dein Status</p>
              <p className="text-white font-medium">{currentStatus || 'Unterwegs'}</p>
            </div>

            {/* Quick Status Update */}
            <div className="mb-4">
              <p className="text-xs text-zinc-400 mb-2">Status ändern</p>
              <div className="flex gap-2 flex-wrap">
                {STATUS_PRESETS.slice(0, 4).map(preset => (
                  <button
                    key={preset.text}
                    onClick={() => onUpdateStatus(preset.text)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white/5 text-zinc-300 rounded-full hover:bg-white/10 transition-all"
                  >
                    <span>{preset.emoji}</span>
                    <span>{preset.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stop Sharing Button */}
            <button
              onClick={() => onToggleSharing(false)}
              className="w-full py-3 bg-zinc-800 text-white font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-zinc-700 transition-all"
            >
              <EyeOff size={18} />
              <span>Location verstecken</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
