
import React, { useState, useEffect } from 'react';
import { Clock, Cloud, CloudSun, Sun, Music, Dumbbell, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEventContext } from '@/contexts/EventContext';
import { getFutureEvents } from '@/utils/eventUtils';
import { getActivitySuggestions } from '@/utils/chatUIUtils';

interface PerfectDayProps {
  className?: string;
  onAskChatbot: (query: string) => void;
}

// Function to get current time of day
const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

// Function to get weather icon (in a real app, this would use a weather API)
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

// Weather conditions to simulate a real app
const weatherConditions = ['sunny', 'cloudy', 'partly_cloudy'];

const PerfectDayPanel: React.FC<PerfectDayProps> = ({ className, onAskChatbot }) => {
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>(getTimeOfDay());
  const [weather, setWeather] = useState('partly_cloudy');
  const [selectedInterest, setSelectedInterest] = useState<string>('Ausgehen');
  const { events } = useEventContext();
  const [relevantEvents, setRelevantEvents] = useState<any[]>([]);
  
  // Update time of day
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOfDay(getTimeOfDay());
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);
  
  // Simulate weather API
  useEffect(() => {
    // In a real app, this would be an API call
    const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    setWeather(randomWeather);
  }, []);
  
  // Get relevant events
  useEffect(() => {
    if (events && events.length > 0) {
      const todaysEvents = getFutureEvents(events).slice(0, 3);
      setRelevantEvents(todaysEvents);
    }
  }, [events]);
  
  // Get activities based on time, interest and weather
  const getActivities = () => {
    return getActivitySuggestions(timeOfDay, selectedInterest, weather === 'sunny' ? 'sunny' : 'cloudy');
  };
  
  // Ask chatbot for more personalized suggestions
  const askForPersonalizedSuggestions = () => {
    const query = `Gib mir Vorschläge für ${selectedInterest} Aktivitäten in Bielefeld am ${timeOfDay === 'morning' ? 'Morgen' : timeOfDay === 'afternoon' ? 'Nachmittag' : 'Abend'} bei ${weather === 'sunny' ? 'sonnigem' : weather === 'cloudy' ? 'bewölktem' : 'teilweise bewölktem'} Wetter`;
    onAskChatbot(query);
  };
  
  // Get time of day icon
  const getTimeIcon = () => {
    switch (timeOfDay) {
      case 'morning':
        return <Coffee className="h-5 w-5 text-orange-400" />;
      case 'afternoon':
        return <Utensils className="h-5 w-5 text-green-400" />;
      case 'evening':
        return <Wine className="h-5 w-5 text-purple-400" />;
    }
  };
  
  return (
    <motion.div 
      className={`relative bg-white dark:bg-zinc-900 shadow-lg border border-purple-200 dark:border-purple-500/20 rounded-xl ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-purple-800 dark:text-purple-300 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Dein perfekter Tag in Bielefeld
          </h3>
          <div className="flex items-center gap-2">
            {getTimeIcon()}
            {getWeatherIcon(weather)}
          </div>
        </div>
        
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
                    : ''
                }`}
                onClick={() => setSelectedInterest(interest)}
              >
                {interest === 'Ausgehen' && <Music className="h-3 w-3 mr-1" />}
                {interest === 'Sport' && <Dumbbell className="h-3 w-3 mr-1" />}
                {interest === 'Kreativität' && <Calendar className="h-3 w-3 mr-1" />}
                {interest}
              </Badge>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">
              {timeOfDay === 'morning' ? 'Morgens' : timeOfDay === 'afternoon' ? 'Mittags' : 'Abends'} in Bielefeld
            </p>
            <ul className="space-y-2">
              {getActivities().slice(0, 3).map((activity, index) => (
                <motion.li 
                  key={index}
                  className="bg-white/60 dark:bg-white/10 rounded-lg p-2 text-sm text-zinc-800 dark:text-white flex items-center gap-2 shadow-sm"
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
              <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">Events heute</p>
              <ul className="space-y-2">
                {relevantEvents.slice(0, 3).map((event, index) => (
                  <motion.li 
                    key={event.id}
                    className="bg-white/60 dark:bg-white/10 rounded-lg p-2 text-sm text-zinc-800 dark:text-white flex items-center gap-2 shadow-sm"
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
        
        <Button 
          onClick={askForPersonalizedSuggestions}
          size="sm"
          className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white"
        >
          Mehr persönliche Vorschläge
        </Button>
      </div>
    </motion.div>
  );
};

export default PerfectDayPanel;
