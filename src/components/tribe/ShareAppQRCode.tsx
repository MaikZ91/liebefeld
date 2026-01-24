import React from 'react';
import { Share2, Smartphone, Globe } from 'lucide-react';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=co.median.android.yadezx';
const WEB_APP_URL = 'https://liebefeld.lovable.app';
const SMART_LINK_URL = `${WEB_APP_URL}/app`;

interface ShareAppQRCodeProps {
  variant?: 'button' | 'inline';
}

export const ShareAppQRCode: React.FC<ShareAppQRCodeProps> = ({ variant = 'button' }) => {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'THE TRIBE',
          text: 'Entdecke Events und Community in deiner Stadt!',
          url: SMART_LINK_URL,
        });
      } catch (err) {
        console.log('Share cancelled or failed', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(SMART_LINK_URL);
      } catch (err) {
        console.error('Failed to copy', err);
      }
    }
  };

  const handlePlatformSelect = (platform: 'android' | 'ios' | 'web') => {
    switch (platform) {
      case 'android':
        window.open(PLAY_STORE_URL, '_blank');
        break;
      case 'ios':
      case 'web':
        window.open(WEB_APP_URL, '_blank');
        break;
    }
  };

  // Inline variant for profile page
  if (variant === 'inline') {
    return (
      <div className="border-t border-white/5 pt-6 mt-6 w-full">
        <div className="flex items-center gap-2 mb-4 justify-center">
          <Share2 size={14} className="text-gold" />
          <span className="text-[9px] text-zinc-500 uppercase tracking-widest">App teilen</span>
        </div>
        
        <div className="flex flex-col items-center gap-4">
          {/* QR Code */}
          <div className="bg-white p-2 rounded-lg shadow-lg">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(SMART_LINK_URL)}&color=000000&bgcolor=FFFFFF`}
              alt="QR Code für THE TRIBE App"
              width={120}
              height={120}
              className="rounded"
            />
          </div>
          
          <p className="text-zinc-500 text-xs text-center max-w-[200px]">
            Scanne den Code oder teile den Link
          </p>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold/90 text-black font-medium text-xs rounded transition-all"
            >
              <Share2 size={14} />
              Teilen
            </button>
            <button
              onClick={() => handlePlatformSelect('android')}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-white/10 hover:border-gold/30 text-zinc-300 hover:text-gold text-xs rounded transition-all"
              title="Google Play Store"
            >
              <Smartphone size={14} />
              Android
            </button>
            <button
              onClick={() => handlePlatformSelect('web')}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-white/10 hover:border-gold/30 text-zinc-300 hover:text-gold text-xs rounded transition-all"
              title="Web Browser"
            >
              <Globe size={14} />
              Web
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Button variant (original)
  return (
    <button 
      onClick={handleShare}
      className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-gold/30 text-gold hover:bg-gold/10 transition-all text-xs uppercase tracking-widest"
    >
      <Share2 size={14} />
      Teilen
    </button>
  );
};
