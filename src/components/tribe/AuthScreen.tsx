import React, { useState } from 'react';
import { UserProfile } from '@/types/tribe';
import { ArrowRight, UserX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AuthScreenProps {
  onLogin: (profile: UserProfile) => void;
}

const AVATAR_OPTIONS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=150&h=150"
];

const CITIES = ['Bielefeld', 'Berlin', 'Hamburg', 'Köln', 'München'];

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [selectedCity, setSelectedCity] = useState('Bielefeld');
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const handleEnter = () => {
    if (!username.trim()) return;
    
    const profile: UserProfile = {
      username: username,
      avatarUrl: selectedAvatar,
      bio: 'New Member',
      homebase: selectedCity
    };
    
    onLogin(profile);
  };

  const handleGuestLogin = async () => {
    setIsGuestLoading(true);
    try {
      // Get next guest number from database
      const { data: existingGuests, error } = await supabase
        .from('user_profiles')
        .select('username')
        .like('username', 'Guest_%')
        .order('created_at', { ascending: false })
        .limit(1);

      let guestNumber = 1;
      if (!error && existingGuests && existingGuests.length > 0) {
        const lastGuest = existingGuests[0].username;
        const match = lastGuest.match(/Guest_(\d+)/);
        if (match) {
          guestNumber = parseInt(match[1]) + 1;
        }
      }

      const guestUsername = `Guest_${guestNumber}`;
      const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
      
      const profile: UserProfile = {
        username: guestUsername,
        avatarUrl: randomAvatar,
        bio: 'Guest',
        homebase: selectedCity
      };
      
      onLogin(profile);
    } catch (err) {
      // Fallback to timestamp-based guest name
      const profile: UserProfile = {
        username: `Guest_${Date.now().toString().slice(-4)}`,
        avatarUrl: AVATAR_OPTIONS[0],
        bio: 'Guest',
        homebase: selectedCity
      };
      onLogin(profile);
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden animate-fadeIn">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gold/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-zinc-800/20 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-sm z-10">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
            <div className="relative w-12 h-12 mb-4">
                <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 22H22L12 2Z" className="fill-white"/>
                    <circle cx="12" cy="14" r="3" className="fill-black"/>
                </svg>
            </div>
            <h1 className="text-2xl font-serif font-bold tracking-[0.2em] text-white">THE TRIBE</h1>
            <p className="text-[10px] text-gold uppercase tracking-widest mt-2">Dein Netzwerk in Bielefeld</p>
        </div>

        {/* Step 1: Identity */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center space-y-2">
                <h2 className="text-xl font-light">Willkommen in Bielefeld!</h2>
                <p className="text-xs text-zinc-400 leading-relaxed px-4">
                  Neu in der Stadt? Finde Events, lerne Leute kennen und entdecke deine neue Heimat.
                </p>
            </div>

            <div className="space-y-5">
                <div className="relative">
                    <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Dein Name oder Spitzname"
                        className="w-full bg-transparent border-b border-white/20 py-3 text-center text-xl font-serif text-white placeholder-zinc-600 outline-none focus:border-gold transition-colors"
                        autoFocus
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Deine Stadt</label>
                    <select 
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 text-white text-sm p-3 outline-none focus:border-gold transition-colors"
                    >
                        {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                </div>
            </div>

            <button 
                onClick={() => setStep(2)}
                disabled={!username.trim()}
                className="w-full bg-white text-black py-4 font-bold uppercase tracking-widest text-xs hover:bg-gold transition-colors disabled:opacity-50 disabled:hover:bg-white"
            >
                Weiter
            </button>

            {/* Guest Login Option */}
            <div className="pt-4 border-t border-white/10">
              <button 
                onClick={handleGuestLogin}
                disabled={isGuestLoading}
                className="w-full flex items-center justify-center gap-2 text-zinc-500 text-xs uppercase tracking-wider hover:text-white transition-colors py-2"
              >
                <UserX size={14} />
                {isGuestLoading ? 'Wird geladen...' : 'Als Gast weitermachen'}
              </button>
              <p className="text-[10px] text-zinc-600 text-center mt-2">
                Schnell reinschauen ohne Anmeldung
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Persona */}
        {step === 2 && (
           <div className="space-y-6 animate-fadeIn">
             <div className="text-center space-y-2">
                <h2 className="text-xl font-light">Wähle dein Profilbild</h2>
                <p className="text-xs text-zinc-400">So sehen dich andere in der Community</p>
            </div>

            <div className="grid grid-cols-3 gap-4 justify-items-center">
                {AVATAR_OPTIONS.map((url, idx) => (
                    <button 
                        key={idx}
                        onClick={() => setSelectedAvatar(url)}
                        className={`w-20 h-20 rounded-full overflow-hidden border-2 transition-all duration-300 ${selectedAvatar === url ? 'border-gold scale-110 shadow-[0_0_20px_rgba(212,180,131,0.3)]' : 'border-transparent opacity-50 hover:opacity-100'}`}
                    >
                        <img src={url} className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>

            <button 
                onClick={handleEnter}
                className="w-full bg-gold text-black py-4 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-white transition-colors shadow-[0_0_20px_rgba(212,180,131,0.2)]"
            >
                Los geht's <ArrowRight size={14} />
            </button>
            
            <button onClick={() => setStep(1)} className="w-full text-zinc-600 text-[10px] uppercase tracking-widest hover:text-white">Zurück</button>
           </div>
        )}
      </div>
    </div>
  );
};
