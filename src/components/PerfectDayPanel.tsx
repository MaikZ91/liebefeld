import React, { useState, useEffect, useRef } from 'react';
import { Heart, Cloud, CloudSun, Sun, Music, Dumbbell, Calendar, Sunrise, Moon, ChevronDown, MessageCircle, Dice1, RefreshCw, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { useEventContext } from '@/contexts/EventContext';
import { getFutureEvents } from '@/utils/eventUtils';
import { getActivitySuggestions, getAllSuggestionsByCategory, generatePerfectDayResponse } from '@/utils/chatUIUtils';
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

const suggestionPrompts = [
  "Ich suche was Entspannendes 😌",
  "Ich will unter Menschen 🤝",
  "Ich brauche Abwechslung 🎯",
  "Zeit für mich alleine 🧘‍♂️",
  "Ich will tanzen 💃",
  "Lust auf Sport 🏃‍♂️",
  "Kreativ sein 🎨",
  "Neue Leute kennenlernen 👋"
];

const PerfectDayPanel: React.FC<PerfectDayProps> = ({ className, onAskChatbot }) => {
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>(getTimeOfDay());
  const [weather, setWeather] = useState('partly_cloudy');
  const [selectedInterest, setSelectedInterest] = useState<string>('Ausgehen');
  const [chatInput, setChatInput] = useState('');
  const { events } = useEventContext();
  const [relevantEvents, setRelevantEvents] = useState<any[]>([]);
  const [activitySuggestions, setActivitySuggestions] = useState<Array<{ activity: string; link?: string | null }>>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const previousInterestRef = useRef<string>(selectedInterest);
  const previousWeatherRef = useRef<string>(weather);
  const previousTimeRef = useRef<'morning' | 'afternoon' | 'evening'>(timeOfDay);
  const allSuggestionsRef = useRef<Array<{ activity: string; link?: string | null }>>([]);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);
  
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
  
  useEffect(() => {
    if (previousInterestRef.current !== selectedInterest || 
        previousWeatherRef.current !== weather ||
        previousTimeRef.current !== timeOfDay) {
      
      previousInterestRef.current = selectedInterest;
      previousWeatherRef.current = weather;
      previousTimeRef.current = timeOfDay;
      
      const fetchAndSetSuggestions = async () => {
        const suggestions = await getActivitySuggestions(timeOfDay, selectedInterest, weather);
        setActivitySuggestions(suggestions);
        
        const allSuggestions = await getAllSuggestionsByCategory(timeOfDay, selectedInterest, weather);
        allSuggestionsRef.current = allSuggestions;
        
        console.log(`Loaded ${suggestions.length} suggestions (showing max 4) from ${allSuggestions.length} total for ${selectedInterest}`);
      };
      
      fetchAndSetSuggestions();
    }
  }, [timeOfDay, selectedInterest, weather]);
  
  useEffect(() => {
    const loadInitialSuggestions = async () => {
      const initialSuggestions = await getActivitySuggestions(timeOfDay, selectedInterest, weather);
      setActivitySuggestions(initialSuggestions);
      
      const allSuggestions = await getAllSuggestionsByCategory(timeOfDay, selectedInterest, weather);
      allSuggestionsRef.current = allSuggestions;
      
      console.log(`Initially loaded ${initialSuggestions.length} suggestions (showing max 4) from ${allSuggestions.length} total for ${selectedInterest}`);
    };
    
    loadInitialSuggestions();
  }, []);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSuggestionIndex((prevIndex) => 
        (prevIndex + 1) % suggestionPrompts.length
      );
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleSendChat = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    if (chatInput.trim()) {
      let query;
      
      if (chatInput.toLowerCase().includes('events heute') || 
          chatInput.toLowerCase().includes('events today') ||
          (chatInput.toLowerCase().includes('events') && chatInput.toLowerCase().includes('heute'))) {
        query = `Finde Events für heute. Gib mir alle verfügbaren Events ohne Einschränkung auf bestimmte Kategorien.`;
        toast.success("Ich suche alle Events für heute!");
      } else {
        query = `Finde kreative Events und Workshops passend zu meiner Stimmung: ${chatInput}. Berücksichtige dabei die Tageszeit (${timeOfDay}) und das Wetter (${weather}). Konzentriere dich auf kreative Aktivitäten wie Kunst, Musik, Theater, Workshops und andere inspirierende Erlebnisse.`;
        toast.success("Ich suche kreative Events für dich!");
      }
      
      onAskChatbot(query);
      setChatInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && chatInput.trim()) {
      e.stopPropagation();
      handleSendChat();
    }
  };

  const refreshSuggestions = async () => {
    try {
      const newSuggestions = await getActivitySuggestions(timeOfDay, selectedInterest, weather);
      setActivitySuggestions(newSuggestions);
      setRefreshKey(prev => prev + 1);
      toast.info("Neue Vorschläge wurden geladen!");
    } catch (error) {
      console.error("Error refreshing suggestions:", error);
      toast.error("Fehler beim Laden neuer Vorschläge");
    }
  };

  const handleDiceClick = async () => {
    try {
      if (allSuggestionsRef.current.length === 0) {
        allSuggestionsRef.current = await getAllSuggestionsByCategory(
          timeOfDay, 
          selectedInterest, 
          weather
        );
      }
      
      if (allSuggestionsRef.current.length === 0) {
        toast.error("Keine Aktivitäten gefunden!");
        return;
      }
      
      const randomIndex = Math.floor(Math.random() * allSuggestionsRef.current.length);
      const randomSuggestion = allSuggestionsRef.current[randomIndex];
      
      toast.info("Zufallsvorschlag für dich!", {
        description: randomSuggestion.link 
          ? `${randomSuggestion.activity} - ${randomSuggestion.link}`
          : randomSuggestion.activity,
        duration: 4000
      });
    } catch (error) {
      console.error("Error getting random suggestion:", error);
      toast.error("Fehler beim Laden eines zufälligen Vorschlags");
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setChatInput(suggestion);
  };

  const handlePerfectDayQuery = async () => {
    try {
      const allInterests = ['Ausgehen', 'Sport', 'Kreativität'];
      const response = await generatePerfectDayResponse(timeOfDay, weather, allInterests);
      toast.info("Dein perfekter Tag:", {
        description: response,
        duration: 6000
      });
    } catch (error) {
      console.error("Error generating perfect day response:", error);
      toast.error("Fehler beim Erstellen eines perfekten Tages");
    }
  };

  const handleCollapsibleOpenChange = (open: boolean) => {
    setIsCollapsibleOpen(open);
  };

  return (
    <Collapsible 
      className={`relative bg-black text-white dark:bg-black dark:text-white shadow-lg border border-gray-800 dark:border-gray-700 rounded-xl ${className}`}
      open={isCollapsibleOpen}
      onOpenChange={handleCollapsibleOpenChange}
    >
      <CollapsibleTrigger className="w-full p-4 flex flex-col hover:bg-gray-900/50 transition-colors">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 text-red-500" />
            <div className="flex flex-col items-start">
              <h3 className="text-lg font-bold text-red-500 dark:text-red-500 flex items-center gap-2">
                Dein perfekter Tag in #Liebefeld
              </h3>
              <p className="text-sm text-gray-400 flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" />
                Dein persönlicher Glücks-Navigator 🧭
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getTimeIcon(timeOfDay)}
            {getWeatherIcon(weather)}
            <ChevronDown className="h-4 w-4 text-red-500 transition-transform duration-200 data-[state=open]:rotate-180" />
          </div>
        </div>
        
        {!isCollapsibleOpen && (
          <div className="mt-4 px-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
                onClick={(e) => e.stopPropagation()}
                placeholder={suggestionPrompts[currentSuggestionIndex]}
                className="flex-grow bg-gray-900 text-red-300 border-gray-700 focus:border-red-500 text-sm"
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
        )}
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
              <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {activitySuggestions.length === 0 ? (
                  <li className="bg-gray-900/60 dark:bg-gray-900/60 rounded-lg p-2 text-sm text-gray-400">
                    Keine Vorschläge gefunden. Bitte versuche andere Filter.
                  </li>
                ) : (
                  activitySuggestions.map((suggestion, index) => (
                    <motion.li 
                      key={`${suggestion.activity}-${index}-${refreshKey}`}
                      className="bg-gray-900/60 dark:bg-gray-900/60 rounded-lg p-2 text-sm text-red-300 dark:text-red-300 flex items-center gap-2 shadow-sm"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className={`h-2 w-2 rounded-full ${
                        selectedInterest === 'Ausgehen' ? 'bg-purple-500' : 
                        selectedInterest === 'Sport' ? 'bg-green-500' : 
                        'bg-amber-500'
                      }`}></div>
                      {suggestion.link ? (
                        <a 
                          href={suggestion.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-red-400 transition-colors flex items-center gap-1 break-all"
                        >
                          {suggestion.activity}
                          <ExternalLink className="h-3 w-3 inline-block flex-shrink-0" />
                        </a>
                      ) : (
                        suggestion.activity
                      )}
                    </motion.li>
                  ))
                )}
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
          
          <div className="mt-4 mb-2">
            <div className="flex flex-wrap gap-2">
              {suggestionPrompts.slice(0, 4).map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(prompt)}
                  className="bg-gray-900/60 text-red-300 border-gray-700 hover:bg-gray-800 hover:text-red-200 text-xs"
                >
                  {prompt}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={handlePerfectDayQuery}
                className="bg-red-900/20 text-red-300 border-red-800/30 hover:bg-red-900/40 hover:text-red-200 text-xs"
              >
                Perfekter Tag
              </Button>
            </div>
          </div>
          
          <div className="mt-2 mb-3">
            <div className="relative h-6 overflow-hidden">
              {suggestionPrompts.map((prompt, index) => (
                <motion.div
                  key={index}
                  className="absolute inset-0 flex items-center text-sm text-gray-400 italic"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ 
                    opacity: currentSuggestionIndex === index ? 1 : 0,
                    y: currentSuggestionIndex === index ? 0 : 10
                  }}
                  transition={{ duration: 0.5 }}
                >
                  {prompt}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default PerfectDayPanel;
