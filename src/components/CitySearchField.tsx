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
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
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
          className="pl-7 pr-0 py-1 h-8 text-xs bg-gray-900 border-gray-700 focus:ring-red-500 focus:border-red-500 text-white placeholder:text-white placeholder:font-medium"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto min-w-[200px]">
          {/* Bestehende Städte */}
          {filteredCities.length > 0 && (
            <div className="p-2">
              <div className="text-xs text-gray-400 px-2 py-1 font-medium">Verfügbare Städte</div>
              {filteredCities.map((city) => (
                <div
                  key={city.name}
                  onClick={() => handleCitySelect(city.name)}
                  className="flex items-center justify-between px-3 py-2 hover:bg-gray-800 cursor-pointer rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div className="flex flex-col">
                      {/* Entfernt 'THE TRIBE.' */}
                      <span className="text-white font-medium text-xs lowercase">{city.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {city.hasEvents && (
                      <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-600/30">
                        <Calendar className="h-3 w-3 mr-1" />
                        {city.eventCount}
                      </Badge>
                    )}
                    {city.hasCommunity && (
                      <Badge variant="secondary" className="bg-blue-600/20 text-blue-400 border-blue-600/30">
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
            <div className="border-t border-gray-700 p-2">
              <div className="text-xs text-gray-400 px-2 py-1 font-medium">Neue Stadt</div>
              <div className="px-3 py-2 hover:bg-gray-800 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-gray-400" />
                    <div className="flex flex-col">
                      {/* Entfernt 'THE TRIBE.' */}
                      <span className="text-white font-medium text-xs lowercase">{searchTerm}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleGenerateEvents(searchTerm)}
                    disabled={isGeneratingEvents}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white h-7 px-3 text-xs"
                  >
                    {isGeneratingEvents ? 'Erstelle...' : 'Community erstellen'}
                  </Button>
                </div>
                <div className="text-xs text-gray-400 mt-1 pl-6">
                  Erstelle eine neue Community und generiere Events mit KI
                </div>
              </div>
            </div>
          )}

          {filteredCities.length === 0 && !isNewCity && searchTerm.length > 0 && (
            <div className="p-4 text-center text-gray-400">
              <div className="text-sm">Keine Städte gefunden</div>
              <div className="text-xs mt-1">Gib mindestens 3 Zeichen ein, um eine neue Stadt zu erstellen</div>
            </div>
          )}

          {searchTerm.length === 0 && (
            <div className="p-4 text-center text-gray-400">
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