
import React from 'react';
import { Music, Users, ExternalLink, Calendar, PartyPopper, Brush, Dumbbell } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AdPanelProps {
  className?: string;
}

const AdPanel: React.FC<AdPanelProps> = ({ className }) => {
  const WHATSAPP_URL = "https://chat.whatsapp.com/C13SQuimtp0JHtx5x87uxK";
  
  return (
    <div className={`my-6 ${className}`}>
      <motion.div 
        className="rounded-xl overflow-hidden shadow-lg relative border border-white/10 bg-gradient-to-br from-[#128C7E]/80 to-black"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-6 md:p-8">
          <div className="md:flex items-start gap-6">
            {/* Left Side - Image */}
            <div className="md:w-1/3 mb-6 md:mb-0">
              <div className="relative aspect-square rounded-lg overflow-hidden border-4 border-white/30">
                <img 
                  src="/lovable-uploads/d62d764a-c245-4e68-b2cb-f6ed2de7c5bf.png" 
                  alt="WhatsApp Community" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                  <div className="p-3 w-full">
                    <Badge className="bg-[#25D366] hover:bg-[#128C7E] text-white text-xs mb-1">
                      Community
                    </Badge>
                    <h3 className="text-white font-bold text-lg">Tribe Liebefeld</h3>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Side - Content */}
            <div className="md:w-2/3">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">
                Lust auf coole Leute & gute Vibes?
              </h2>
              <p className="text-white/90 mb-6 text-lg">
                Dann join unsere Community:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2">
                  <Badge className="bg-[#FF5722] text-white">
                    <PartyPopper size={14} className="mr-1" />
                    #ausgehen
                  </Badge>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2">
                  <Badge className="bg-[#9C27B0] text-white">
                    <Brush size={14} className="mr-1" />
                    #kreativität
                  </Badge>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2">
                  <Badge className="bg-[#2196F3] text-white">
                    <Dumbbell size={14} className="mr-1" />
                    #sport
                  </Badge>
                </div>
              </div>
              
              <p className="text-white/90 mb-6 font-medium">
                Jetzt dabei sein & gemeinsam planen!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <a 
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-grow"
                >
                  <Button 
                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white border-none h-12 text-base shadow-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" className="h-5 w-5 mr-2">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp Community beitreten
                  </Button>
                </a>
                
                <Button 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10 h-12"
                  onClick={() => {
                    const element = document.getElementById('community-test');
                    if (element) element.click();
                  }}
                >
                  <Users className="mr-2 h-5 w-5" />
                  Mehr erfahren
                </Button>
              </div>
              
              <div className="mt-4 text-white/70 text-xs text-center md:text-left">
                <span className="inline-block animate-pulse-slow">🌱</span> Die App ist im Aufbau. Werde Teil der Community und helfe mit!
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Hidden button to trigger the community test modal */}
      <button id="community-test" className="hidden" />
    </div>
  );
};

export default AdPanel;
