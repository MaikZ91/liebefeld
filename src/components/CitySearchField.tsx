// src/components/CitySearchField.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Users, Calendar, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEventContext } from '@/contexts/EventContext';
import { createCitySpecificGroupId, createGroupDisplayName } from '@/utils/groupIdUtils'; // Hinzugefügter Import

interface CityData {
  name: string;
  eventCount: number;
  hasEvents: boolean;
  hasCommunity: boolean;
}

interface CitySearchFieldProps {
  onCitySelect: (city: string) => void;
  currentCity: string;
}

const CitySearchField: React.FC<CitySearchFieldProps> = ({ onCitySelect, currentCity }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [availableCities, setAvailableCities] = useState<CityData[]>([]);
  const [isGeneratingEvents, setIsGeneratingEvents] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { refreshEvents, selectedCity: contextSelectedCity } = useEventContext(); // selectedCity aus Kontext, um aktuell zu bleiben

  useEffect(() => {
    fetchAvailableCities();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAvailableCities = async () => {
    try {
      // Hole alle Städte mit Events aus der Datenbank
      const { data: citiesWithEvents, error } = await supabase
        .from('community_events')
        .select('city')
        .not('city', 'is', null);

      if (error) {
        console.error('Error fetching cities:', error);
        return;
      }

      // Zähle Events pro Stadt
      const cityStats: Record<string, number> = {};
      citiesWithEvents?.forEach(event => {
        if (event.city) {
          cityStats[event.city] = (cityStats[event.city] || 0) + 1;
        }
      });

      // Erstelle CityData Array
      const cities: CityData[] = Object.entries(cityStats).map(([name, count]) => ({
        name,
        eventCount: count,
        hasEvents: count > 0,
        hasCommunity: true // Für jetzt nehmen wir an, dass jede Stadt eine Community hat
      }));

      // Sortiere nach Event-Anzahl
      cities.sort((a, b) => b.eventCount - a.eventCount);

      setAvailableCities(cities);
    } catch (error) {
      console.error('Exception fetching cities:', error);
    }
  };

  const handleGenerateEvents = async (cityName: string) => {
    if (isGeneratingEvents) return;
    
    setIsGeneratingEvents(true);
    toast.loading(`Generiere Events für ${cityName} und bereite Community-Chats vor...`);

    try {
      // 1. Events für die neue Stadt generieren
      const { data, error: generateError } = await supabase.functions.invoke('generate-city-events', {
        body: { city: cityName }
      });

      if (generateError) {
        throw generateError;
      }

      if (!data?.success) {
        throw new Error('Event generation failed');
      }

      // 2. Die normalisierte Städte-Abkürzung für die Chat-Gruppen-ID bestimmen
      // Für neue, nicht vordefinierte Städte verwenden wir den kleingeschriebenen, bereinigten Namen als ID.
      const normalizedCityAbbr = cityName.toLowerCase().replace(/[^a-z]/g, ''); 

      // Die Kategorien für die Chat-Gruppen
      const categories = ['kreativität', 'ausgehen', 'sport']; // Kleinbuchstaben für die ID-Erstellung

      // 3. Neue Chat-Gruppen in die chat_groups-Tabelle einfügen
      for (const category of categories) {
        const groupId = createCitySpecificGroupId(category, normalizedCityAbbr);
        // Den angezeigten Namen korrekt bilden (z.B. "Kreativität • NeueStadt")
        const groupName = `${category.charAt(0).toUpperCase() + category.slice(1)} • ${cityName}`; 
        const groupDescription = `Community-Chat für ${category} in ${cityName}`;

        const { error: groupInsertError } = await supabase
          .from('chat_groups')
          .insert({
            id: groupId,
            name: groupName,
            description: groupDescription
          })
          .select() // Select, um Daten bei Konflikt zu erhalten (Unique-Fehler)
          .single();

        if (groupInsertError && groupInsertError.code !== '23505') { // '23505' ist der Fehlercode für UNIQUE-Constraint-Verletzung (Gruppe existiert bereits)
          console.error(`Fehler beim Einfügen der Chat-Gruppe ${groupId}:`, groupInsertError);
        } else if (groupInsertError && groupInsertError.code === '23505') {
          console.log(`Chat-Gruppe ${groupId} existiert bereits, Überspringe Einfügung.`);
        }
      }

      toast.success(`${data.eventsGenerated} Events für ${cityName} erstellt und Community-Chats vorbereitet!`);
      
      // WICHTIG: selectedCity auf die korrekte Abkürzung/normalisierten Namen setzen
      // Dadurch wird sichergestellt, dass die App danach den richtigen Chat öffnet.
      onCitySelect(normalizedCityAbbr); 
      setIsOpen(false);
      await fetchAvailableCities(); 
      await refreshEvents(); 

    } catch (error: any) {
      console.error('Fehler beim Generieren von Events oder Erstellen der Community:', error);
      toast.error(`Fehler: ${error.message || 'Beim Erstellen der Community ist ein unerwarteter Fehler aufgetreten.'}`);
    } finally {
      setIsGeneratingEvents(false);
      toast.dismiss();
    }
  };

  const filteredCities = availableCities.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isNewCity = searchTerm.length > 2 && 
    !availableCities.some(city => 
      city.name.toLowerCase() === searchTerm.toLowerCase()
    );

  const handleCitySelect = (cityName: string) => {
    onCitySelect(cityName);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-20 md:w-24" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white/40 h-3 w-3" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={currentCity.toLowerCase()}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-7 pr-0 py-1 h-8 text-xs bg-transparent border-none focus:ring-0 focus:border-none text-white/60 placeholder:text-white/60 placeholder:font-normal hover:text-white/80 transition-colors"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border border-red-500/20 rounded-2xl shadow-2xl shadow-red-500/10 z-[9999] max-h-80 overflow-y-auto min-w-[280px] scrollbar-thin scrollbar-thumb-red-500/20 scrollbar-track-transparent">
          {/* Bestehende Städte */}
          {filteredCities.length > 0 && (
            <div className="p-3">
              <div className="text-xs text-red-400 px-2 py-1 font-semibold uppercase tracking-wide">Verfügbare Städte</div>
              {filteredCities.map((city) => (
                <div
                  key={city.name}
                  onClick={() => handleCitySelect(city.name)}
                  className="flex items-center justify-between px-3 py-2.5 hover:bg-red-500/10 cursor-pointer rounded-lg transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-400 group-hover:text-red-300" />
                    <div className="flex flex-col">
                      <span className="text-white font-medium text-sm lowercase group-hover:text-red-300 transition-colors">{city.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {city.hasEvents && (
                      <Badge variant="secondary" className="bg-red-600/20 text-red-300 border-red-600/30 text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {city.eventCount}
                      </Badge>
                    )}
                    {city.hasCommunity && (
                      <Badge variant="secondary" className="bg-red-600/20 text-red-300 border-red-600/30 text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        Community
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Neue Stadt Option */}
          {isNewCity && (
            <div className="border-t border-red-500/20 p-3">
              <div className="text-xs text-red-400 px-2 py-1 font-semibold uppercase tracking-wide">Neue Stadt</div>
              <div className="px-3 py-2.5 hover:bg-red-500/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-red-400" />
                    <div className="flex flex-col">
                      <span className="text-white font-medium text-sm lowercase">{searchTerm}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleGenerateEvents(searchTerm)}
                    disabled={isGeneratingEvents}
                    size="sm"
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white h-8 px-3 text-xs shadow-lg shadow-red-500/30"
                  >
                    {isGeneratingEvents ? 'Erstelle...' : 'Community erstellen'}
                  </Button>
                </div>
                <div className="text-xs text-white/50 mt-2 pl-6">
                  Erstelle eine neue Community und generiere Events mit KI
                </div>
              </div>
            </div>
          )}

          {filteredCities.length === 0 && !isNewCity && searchTerm.length > 0 && (
            <div className="p-4 text-center text-white/50">
              <div className="text-sm">Keine Städte gefunden</div>
              <div className="text-xs mt-1">Gib mindestens 3 Zeichen ein, um eine neue Stadt zu erstellen</div>
            </div>
          )}

          {searchTerm.length === 0 && (
            <div className="p-4 text-center text-white/50">
              <div className="text-sm">Beginne zu tippen, um zu suchen</div>
              <div className="text-xs mt-1">oder wähle eine verfügbare Stadt</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CitySearchField;