import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar } from 'lucide-react';
import { Event } from '@/types/eventTypes';

interface MultiCityCompareProps {
  cities: string[];
  events: Event[];
  onCitySelect: (city: string) => void;
}

export const MultiCityCompare: React.FC<MultiCityCompareProps> = ({
  cities,
  events,
  onCitySelect
}) => {
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  const toggleCity = (city: string) => {
    setSelectedCities(prev => 
      prev.includes(city) 
        ? prev.filter(c => c !== city)
        : [...prev, city]
    );
  };

  const getEventsForCity = (city: string) => {
    return events.filter(e => 
      e.city?.toLowerCase() === city.toLowerCase()
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {cities.map(city => (
          <Button
            key={city}
            variant={selectedCities.includes(city) ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleCity(city)}
            className={selectedCities.includes(city) ? 'bg-primary' : 'border-white/20'}
          >
            <MapPin className="h-3 w-3 mr-1" />
            {city}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {selectedCities.map(city => {
          const cityEvents = getEventsForCity(city);
          return (
            <Card key={city} className="bg-black/40 border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">{city}</h3>
                <Badge variant="outline" className="border-primary/30">
                  {cityEvents.length} Events
                </Badge>
              </div>
              
              <div className="space-y-2">
                {cityEvents.slice(0, 5).map(event => (
                  <div 
                    key={event.id}
                    className="flex items-start gap-2 p-2 rounded hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() => onCitySelect(city)}
                  >
                    <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.date).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                ))}
                
                {cityEvents.length > 5 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => onCitySelect(city)}
                  >
                    +{cityEvents.length - 5} weitere Events
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {selectedCities.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Wähle Städte aus, um Events zu vergleichen
        </div>
      )}
    </div>
  );
};
