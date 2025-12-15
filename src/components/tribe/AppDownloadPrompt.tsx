import React, { useState, useEffect } from 'react';
import { X, Smartphone } from 'lucide-react';

const DISMISSED_KEY = 'tribe_app_download_dismissed';
const WELCOME_COMPLETED_KEY = 'tribe_welcome_completed';
const SHOW_DELAY_AFTER_WELCOME_MS = 3000; // 3 seconds after welcome screen

export const AppDownloadPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [deviceType, setDeviceType] = useState<'android' | 'ios' | 'other'>('other');

  useEffect(() => {
    // Check if user has already dismissed the prompt
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) {
      return;
    }

    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase();
    if (/android/.test(userAgent)) {
      setDeviceType('android');
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType('ios');
    } else {
      // Don't show on desktop/other devices
      return;
    }

    // Check if welcome screen was already completed
    const welcomeCompleted = localStorage.getItem(WELCOME_COMPLETED_KEY);
    if (welcomeCompleted) {
      // Welcome already completed, show after short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, SHOW_DELAY_AFTER_WELCOME_MS);
      return () => clearTimeout(timer);
    }

    // Listen for welcome completion event
    const handleWelcomeComplete = () => {
      setTimeout(() => {
        setIsVisible(true);
      }, SHOW_DELAY_AFTER_WELCOME_MS);
    };

    window.addEventListener('tribe_welcome_completed', handleWelcomeComplete);
    return () => window.removeEventListener('tribe_welcome_completed', handleWelcomeComplete);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(DISMISSED_KEY, 'true');
  };

  const handleDownload = () => {
    if (deviceType === 'android') {
      window.open('https://play.google.com/store/apps/details?id=co.median.android.yadezx', '_blank');
    }
    handleDismiss();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] animate-fade-in"
        onClick={handleDismiss}
      />
      
      {/* Prompt Dialog */}
      <div className="fixed bottom-0 left-0 right-0 z-[201] animate-slide-in-bottom">
        <div className="bg-gradient-to-t from-black via-zinc-900 to-zinc-800 border-t border-gold/30 p-6 shadow-2xl">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="max-w-md mx-auto">
            {deviceType === 'android' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center">
                    <Smartphone className="text-gold" size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-extrabold tracking-[0.15em] text-lg">
                      ERLEBE MEHR
                    </h3>
                    <p className="text-zinc-400 text-sm">
                      Die volle Experience in der App
                    </p>
                  </div>
                </div>

                <p className="text-zinc-300 text-sm mb-6 leading-relaxed">
                  Push-Benachrichtigungen für neue Events, schnellere Performance und die beste Community-Experience – 
                  alles in der THE TRIBE App.
                </p>

                <button
                  onClick={handleDownload}
                  className="w-full bg-gradient-to-r from-gold to-yellow-600 hover:from-gold/90 hover:to-yellow-600/90 text-black font-bold py-4 px-6 flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-gold/50"
                >
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                    alt="Get it on Google Play"
                    className="h-10"
                  />
                </button>

                <button
                  onClick={handleDismiss}
                  className="w-full mt-3 text-zinc-500 hover:text-white text-sm transition-colors"
                >
                  Vielleicht später
                </button>
              </>
            )}

            {deviceType === 'ios' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center">
                    <Smartphone className="text-gold" size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-extrabold tracking-[0.15em] text-lg">
                      ERLEBE MEHR
                    </h3>
                    <p className="text-zinc-400 text-sm">
                      Installiere THE TRIBE als App
                    </p>
                  </div>
                </div>

                <p className="text-zinc-300 text-sm mb-4 leading-relaxed">
                  Die volle Experience mit Push-Benachrichtigungen und schnellerer Performance – 
                  installiere THE TRIBE auf deinem Home-Bildschirm.
                </p>

                <div className="bg-zinc-900 border border-gold/20 p-4 mb-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-gold text-xs font-bold">1</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium mb-1">Teilen-Button tippen</p>
                      <p className="text-zinc-400 text-xs">
                        Tippe auf das <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 rounded-sm mx-1">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                          </svg>
                        </span> Symbol unten in Safari
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-gold text-xs font-bold">2</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium mb-1">"Zum Home-Bildschirm"</p>
                      <p className="text-zinc-400 text-xs">
                        Wähle "Zum Home-Bildschirm hinzufügen" aus der Liste
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-gold text-xs font-bold">3</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium mb-1">Fertig!</p>
                      <p className="text-zinc-400 text-xs">
                        THE TRIBE erscheint als App-Icon auf deinem Home-Bildschirm
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDismiss}
                  className="w-full bg-gold hover:bg-gold/90 text-black font-bold py-4 px-6 transition-all duration-300"
                >
                  Verstanden
                </button>

                <button
                  onClick={handleDismiss}
                  className="w-full mt-3 text-zinc-500 hover:text-white text-sm transition-colors"
                >
                  Vielleicht später
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
