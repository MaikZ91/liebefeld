import React, { useState } from 'react';
import { UserProfile } from '@/types/tribe';
import { Sparkles, ArrowRight } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden animate-fadeIn">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gold/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-zinc-800/20 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-sm z-10">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-12">
            <div className="relative w-12 h-12 mb-4">
                <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 22H22L12 2Z" className="fill-white"/>
                    <circle cx="12" cy="14" r="3" className="fill-black"/>
                </svg>
            </div>
            <h1 className="text-2xl font-serif font-bold tracking-[0.2em] text-white">THE TRIBE</h1>
            <p className="text-[10px] text-gold uppercase tracking-widest mt-2">Access Gate</p>
        </div>

        {/* Step 1: Identity */}
        {step === 1 && (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center space-y-2">
                <h2 className="text-xl font-light">Identify Yourself</h2>
                <p className="text-xs text-zinc-500">Choose a codename for the network.</p>
            </div>

            <div className="space-y-6">
                <div className="relative">
                    <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="CODENAME"
                        className="w-full bg-transparent border-b border-white/20 py-3 text-center text-xl font-serif text-white placeholder-zinc-700 outline-none focus:border-gold transition-colors"
                        autoFocus
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Homebase</label>
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
                Next Step
            </button>
          </div>
        )}

        {/* Step 2: Persona */}
        {step === 2 && (
           <div className="space-y-8 animate-fadeIn">
             <div className="text-center space-y-2">
                <h2 className="text-xl font-light">Select Persona</h2>
                <p className="text-xs text-zinc-500">How will you be seen?</p>
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
                Enter The Tribe <ArrowRight size={14} />
            </button>
            
            <button onClick={() => setStep(1)} className="w-full text-zinc-600 text-[10px] uppercase tracking-widest hover:text-white">Back</button>
           </div>
        )}
      </div>
    </div>
  );
};