import React, { useState, useEffect } from 'react';
import { X, Smartphone, Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

const DISMISSED_KEY = 'app_download_dismissed';
const SHOW_DELAY_MS = 45000;

export const AppDownloadPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [deviceType, setDeviceType] = useState<'android' | 'ios' | 'desktop'>('desktop');
  const { canInstall, isInstalled, installApp } = usePWAInstall();

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;
    if (isInstalled) return;

    const userAgent = navigator.userAgent.toLowerCase();
    if (/android/.test(userAgent)) {
      setDeviceType('android');
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType('ios');
    } else {
      setDeviceType('desktop');
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isInstalled]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(DISMISSED_KEY, 'true');
  };

  const handlePWAInstall = async () => {
    const accepted = await installApp();
    if (accepted) handleDismiss();
  };

  const handlePlayStore = () => {
    window.open('https://play.google.com/store/apps/details?id=co.median.android.yadezx', '_blank');
    handleDismiss();
  };

  if (!isVisible) return null;

  // On desktop, only show if PWA install is available
  if (deviceType === 'desktop' && !canInstall) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] animate-fade-in"
        onClick={handleDismiss}
      />
      
      <div className="fixed bottom-0 left-0 right-0 z-[201] animate-slide-in-bottom">
        <div className="bg-gradient-to-t from-black via-zinc-900 to-zinc-800 border-t border-gold/30 p-6 shadow-2xl">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="max-w-md mx-auto">
            {/* PWA Install available (Android, Desktop, or any browser supporting it) */}
            {canInstall && deviceType !== 'ios' && (
              <PWAInstallContent onInstall={handlePWAInstall} onDismiss={handleDismiss} />
            )}

            {/* Android without PWA support → Play Store fallback */}
            {!canInstall && deviceType === 'android' && (
              <PlayStoreContent onDownload={handlePlayStore} onDismiss={handleDismiss} />
            )}

            {/* iOS → manual instructions */}
            {deviceType === 'ios' && (
              <IOSContent onDismiss={handleDismiss} />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const PWAInstallContent: React.FC<{ onInstall: () => void; onDismiss: () => void }> = ({ onInstall, onDismiss }) => (
  <>
    <div className="flex items-center gap-3 mb-4">
      <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center">
        <Download className="text-gold" size={24} />
      </div>
      <div>
        <h3 className="text-white font-extrabold tracking-[0.15em] text-lg">APP INSTALLIEREN</h3>
        <p className="text-zinc-400 text-sm">Direkt aus dem Browser – kein Store nötig</p>
      </div>
    </div>

    <p className="text-zinc-300 text-sm mb-6 leading-relaxed">
      Installiere THE TRIBE als App auf deinem Gerät. Push-Benachrichtigungen, schnellere Performance und die beste Community-Experience – mit einem Klick.
    </p>

    <button
      onClick={onInstall}
      className="w-full bg-gradient-to-r from-gold to-yellow-600 hover:from-gold/90 hover:to-yellow-600/90 text-black font-bold py-4 px-6 flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-gold/50"
    >
      <Download size={20} />
      Jetzt installieren
    </button>

    <button onClick={onDismiss} className="w-full mt-3 text-zinc-500 hover:text-white text-sm transition-colors">
      Vielleicht später
    </button>
  </>
);

const PlayStoreContent: React.FC<{ onDownload: () => void; onDismiss: () => void }> = ({ onDownload, onDismiss }) => (
  <>
    <div className="flex items-center gap-3 mb-4">
      <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center">
        <Smartphone className="text-gold" size={24} />
      </div>
      <div>
        <h3 className="text-white font-extrabold tracking-[0.15em] text-lg">ERLEBE MEHR</h3>
        <p className="text-zinc-400 text-sm">Die volle Experience in der App</p>
      </div>
    </div>

    <p className="text-zinc-300 text-sm mb-6 leading-relaxed">
      Push-Benachrichtigungen für neue Events, schnellere Performance und die beste Community-Experience – alles in der THE TRIBE App.
    </p>

    <button
      onClick={onDownload}
      className="w-full bg-gradient-to-r from-gold to-yellow-600 hover:from-gold/90 hover:to-yellow-600/90 text-black font-bold py-4 px-6 flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-gold/50"
    >
      <img 
        src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
        alt="Get it on Google Play"
        className="h-10"
      />
    </button>

    <button onClick={onDismiss} className="w-full mt-3 text-zinc-500 hover:text-white text-sm transition-colors">
      Vielleicht später
    </button>
  </>
);

const IOSContent: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => (
  <>
    <div className="flex items-center gap-3 mb-4">
      <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center">
        <Smartphone className="text-gold" size={24} />
      </div>
      <div>
        <h3 className="text-white font-extrabold tracking-[0.15em] text-lg">ERLEBE MEHR</h3>
        <p className="text-zinc-400 text-sm">Installiere THE TRIBE als App</p>
      </div>
    </div>

    <p className="text-zinc-300 text-sm mb-4 leading-relaxed">
      Die volle Experience mit Push-Benachrichtigungen und schnellerer Performance – installiere THE TRIBE auf deinem Home-Bildschirm.
    </p>

    <div className="bg-zinc-900 border border-gold/20 p-4 mb-6 space-y-3">
      {[
        { step: '1', title: 'Teilen-Button tippen', desc: 'Tippe auf das Teilen-Symbol unten in Safari' },
        { step: '2', title: '"Zum Home-Bildschirm"', desc: 'Wähle "Zum Home-Bildschirm hinzufügen" aus der Liste' },
        { step: '3', title: 'Fertig!', desc: 'THE TRIBE erscheint als App-Icon auf deinem Home-Bildschirm' },
      ].map(({ step, title, desc }) => (
        <div key={step} className="flex items-start gap-3">
          <div className="w-6 h-6 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-gold text-xs font-bold">{step}</span>
          </div>
          <div>
            <p className="text-white text-sm font-medium mb-1">{title}</p>
            <p className="text-zinc-400 text-xs">{desc}</p>
          </div>
        </div>
      ))}
    </div>

    <button onClick={onDismiss} className="w-full bg-gold hover:bg-gold/90 text-black font-bold py-4 px-6 transition-all duration-300">
      Verstanden
    </button>

    <button onClick={onDismiss} className="w-full mt-3 text-zinc-500 hover:text-white text-sm transition-colors">
      Vielleicht später
    </button>
  </>
);
