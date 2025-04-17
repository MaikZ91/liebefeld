
import React, { useState, useEffect, useCallback } from 'react';
import { Heart, Cloud, CloudSun, Sun, Music, Dumbbell, Calendar, Sunrise, Moon, ChevronDown, MessageSquare, Dice1, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { useEventContext } from '@/contexts/EventContext';
import { getFutureEvents } from '@/utils/eventUtils';
import { getActivitySuggestions } from '@/utils/chatUIUtils';
import { fetchWeather } from '@/utils/weatherUtils';
import { toast } from 'sonner';

interface PerfectDayProps {
  className?: string;
  onAskChatbot: (query: string) => void;
}

const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

const getWeatherIcon = (condition: string) => {
  switch (condition) {
    case 'sunny':
      return <Sun className="h-5 w-5 text-amber-400" />;
    case 'cloudy':
      return <Cloud className="h-5 w-5 text-gray-400" />;
    case 'partly_cloudy':
      return <CloudSun className="h-5 w-5 text-blue-400" />;
    default:
      return <CloudSun className="h-5 w-5 text-blue-400" />;
  }
};

const weatherConditions = ['sunny', 'cloudy', 'partly_cloudy'];

const getTimeIcon = (timeOfDay: 'morning' | 'afternoon' | 'evening') => {
  switch (timeOfDay) {
    case 'morning':
      return <Sunrise className="h-5 w-5 text-orange-400" />;
    case 'afternoon':
      return <Sun className="h-5 w-5 text-yellow-400" />;
    case 'evening':
      return <Moon className="h-5 w-5 text-purple-400" />;
  }
};

const PerfectDayPanel: React.FC<PerfectDayProps> = ({ className, onAskChatbot }) => {
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>(getTimeOfDay());
  const [weather, setWeather] = useState('partly_cloudy');
  const [selectedInterest, setSelectedInterest] = useState<string>('Ausgehen');
  const [chatInput, setChatInput] = useState('');
  const { events } = useEventContext();
  const [relevantEvents, setRelevantEvents] = useState<any[]>([]);
  const [activitySuggestions, setActivitySuggestions] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOfDay(getTimeOfDay());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    const getWeather = async () => {
      const currentWeather = await fetchWeather();
      setWeather(currentWeather);
    };
    
    getWeather();
    const interval = setInterval(getWeather, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (events && events.length > 0) {
      const todaysEvents = getFutureEvents(events).slice(0, 3);
      setRelevantEvents(todaysEvents);
    }
  }, [events]);
  
  const getRandomizedSuggestions = useCallback(() => {
    // Holt neue Vorschläge basierend auf den aktuellen Parametern
    const allSuggestions = getActivitySuggestions(
      timeOfDay, 
      selectedInterest, 
      weather === 'sunny' ? 'sunny' : 'cloudy'
    );
    
    // Mische die Vorschläge
    const shuffled = [...allSuggestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Nimm die ersten 4 oder weniger
    return shuffled.slice(0, 4);
  }, [timeOfDay, selectedInterest, weather]);
  
  useEffect(() => {
    // Hole initial Vorschläge
    setActivitySuggestions(getRandomizedSuggestions());
  }, [timeOfDay, selectedInterest, weather, getRandomizedSuggestions]);
  
  const handleSendChat = () => {
    if (chatInput.trim()) {
      onAskChatbot(chatInput);
      setChatInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && chatInput.trim()) {
      handleSendChat();
    }
  };

  const refreshSuggestions = () => {
    // Aktualisiere die Vorschläge mit vollständig neuen Vorschlägen
    const newSuggestions = getRandomizedSuggestions();
    setActivitySuggestions(newSuggestions);
    setRefreshKey(prev => prev + 1); // Trigger Animation-Reset
    toast.info("Neue Vorschläge wurden geladen!");
  };

  const handleDiceClick = () => {
    const activities = getActivitySuggestions(
      timeOfDay, 
      selectedInterest, 
      weather === 'sunny' ? 'sunny' : 'cloudy'
    );
    const randomIndex = Math.floor(Math.random() * activities.length);
    toast.info("Zufallsvorschlag für dich!", {
      description: activities[randomIndex],
      duration: 4000
    });
  };

  return (
    <Collapsible className={`relative bg-black text-white dark:bg-black dark:text-white shadow-lg border border-gray-800 dark:border-gray-700 rounded-xl ${className}`}>
      <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-gray-900/50 transition-colors">
        <div className="flex items-center gap-3">
          <Heart className="h-5 w-5 text-red-500" />
          <div className="flex flex-col items-start">
            <h3 className="text-lg font-bold text-red-500 dark:text-red-500 flex items-center gap-2">
              Dein perfekter Tag in #Liebefeld
            </h3>
            <p className="text-sm text-gray-400 flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              Dein persönlicher Glücks-Navigator 🧭
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getTimeIcon(timeOfDay)}
          {getWeatherIcon(weather)}
          <ChevronDown className="h-4 w-4 text-red-500 transition-transform duration-200 data-[state=open]:rotate-180" />
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="p-4 pt-0">
          <div className="mb-4">
            <div className="flex gap-2 flex-wrap">
              {['Ausgehen', 'Sport', 'Kreativität'].map(interest => (
                <Badge 
                  key={interest}
                  variant={selectedInterest === interest ? "default" : "outline"}
                  className={`cursor-pointer ${
                    selectedInterest === interest 
                      ? (interest === 'Ausgehen' ? 'bg-purple-500 hover:bg-purple-600' : 
                         interest === 'Sport' ? 'bg-green-500 hover:bg-green-600' : 
                         'bg-amber-500 hover:bg-amber-600')
                      : 'bg-transparent hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedInterest(interest)}
                >
                  {interest === 'Ausgehen' && <Music className="h-3 w-3 mr-1" />}
                  {interest === 'Sport' && <Dumbbell className="h-3 w-3 mr-1" />}
                  {interest === 'Kreativität' && <Calendar className="h-3 w-3 mr-1" />}
                  {interest}
                </Badge>
              ))}
              
              <div className="ml-auto flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={refreshSuggestions}
                  className="h-7 w-7 rounded-full bg-gray-800 hover:bg-gray-700"
                  title="Neue Vorschläge laden"
                >
                  <RefreshCw className="h-4 w-4 text-blue-400" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleDiceClick}
                  className="h-7 w-7 rounded-full bg-gray-800 hover:bg-gray-700"
                  title="Zufallsvorschlag"
                >
                  <Dice1 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-red-500 dark:text-red-500 mb-2">
                {timeOfDay === 'morning' ? 'Morgens' : timeOfDay === 'afternoon' ? 'Mittags' : 'Abends'} in Bielefeld
              </p>
              <ul className="space-y-2">
                {activitySuggestions.map((activity, index) => (
                  <motion.li 
                    key={`${activity}-${index}-${refreshKey}`}
                    className="bg-gray-900/60 dark:bg-gray-900/60 rounded-lg p-2 text-sm text-red-300 dark:text-red-300 flex items-center gap-2 shadow-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className={`h-2 w-2 rounded-full ${
                      selectedInterest === 'Ausgehen' ? 'bg-purple-500' : 
                      selectedInterest === 'Sport' ? 'bg-green-500' : 
                      'bg-amber-500'
                    }`}></div>
                    {activity}
                  </motion.li>
                ))}
              </ul>
            </div>
            
            {relevantEvents.length > 0 && (
              <div>
                <p className="text-sm text-red-500 dark:text-red-500 mb-2">Events heute</p>
                <ul className="space-y-2">
                  {relevantEvents.slice(0, 3).map((event, index) => (
                    <motion.li 
                      key={event.id}
                      className="bg-gray-900/60 dark:bg-gray-900/60 rounded-lg p-2 text-sm text-red-300 dark:text-red-300 flex items-center gap-2 shadow-sm"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                    >
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      {event.title} - {event.time}
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Stelle eine Frage zu Aktivitäten..."
              className="flex-grow bg-gray-900 text-red-300 border-gray-700 focus:border-red-500"
            />
            <Button 
              onClick={handleSendChat}
              disabled={!chatInput.trim()}
              size="default"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Senden
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default PerfectDayPanel;
