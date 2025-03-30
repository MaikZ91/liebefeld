
import { useEffect, useState } from 'react';
import CalendarNavbar from '@/components/CalendarNavbar';
import EventCard from '@/components/EventCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronsRight, Settings2, Plus, Pin } from 'lucide-react';
import { Event } from '@/types/eventTypes';
import { useToast } from '@/hooks/use-toast';
import { groupEventsByDate } from '@/utils/eventUtils';

const Groups = () => {
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<Record<string, Event[]>>({});
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [myGroups, setMyGroups] = useState([
    { id: 'running', name: 'Running Club', color: 'bg-green-500', members: 23 },
    { id: 'hiking', name: 'Hiking Enthusiasts', color: 'bg-orange-500', members: 42 },
    { id: 'board-games', name: 'Board Game Nights', color: 'bg-purple-500', members: 16 },
    { id: 'techie', name: 'Tech Meetups', color: 'bg-blue-500', members: 31 }
  ]);
  const [recommendedGroups, setRecommendedGroups] = useState([
    { id: 'cycling', name: 'Bielefeld Cyclists', color: 'bg-cyan-500', members: 57 },
    { id: 'food', name: 'Foodies Bielefeld', color: 'bg-red-500', members: 89 },
    { id: 'parents', name: 'Parents Group', color: 'bg-yellow-500', members: 34 },
    { id: 'book-club', name: 'Book Club', color: 'bg-pink-500', members: 12 }
  ]);
  
  // Group mock events for display
  useEffect(() => {
    // This would normally fetch from an API
    const mockEvents: Event[] = [
      {
        id: 'run-1',
        title: 'Morning Run',
        description: 'Start your day with a refreshing run',
        date: '2023-05-15',
        time: '07:30',
        location: 'Stadtpark',
        category: 'Running Club',
        organizer: 'Thomas',
        likes: 5
      },
      {
        id: 'hike-1',
        title: 'Weekend Hike',
        description: 'Explore the beautiful trails around Bielefeld',
        date: '2023-05-20',
        time: '09:00',
        location: 'Teutoburg Forest',
        category: 'Hiking Enthusiasts',
        organizer: 'Laura',
        likes: 12
      },
      {
        id: 'board-1',
        title: 'Board Game Night',
        description: 'Join us for an evening of fun games',
        date: '2023-05-18',
        time: '19:00',
        location: 'Café Central',
        category: 'Board Game Nights',
        organizer: 'Michael',
        likes: 8
      }
    ];
    
    // Group by date for display
    const grouped = groupEventsByDate(mockEvents);
    setUpcomingEvents(grouped);
    setRecentEvents(mockEvents.slice(0, 2));
    
  }, []);
  
  const handleJoinGroup = (groupId: string) => {
    toast({
      title: "Group joined!",
      description: "You've successfully joined this group.",
      duration: 3000
    });
    
    // Move from recommended to my groups
    const groupToMove = recommendedGroups.find(g => g.id === groupId);
    if (groupToMove) {
      setMyGroups([...myGroups, groupToMove]);
      setRecommendedGroups(recommendedGroups.filter(g => g.id !== groupId));
    }
  };
  
  const handleCreateGroup = () => {
    setIsCreateModalOpen(true);
    // Modal implementation would go here
    toast({
      title: "Coming soon!",
      description: "Group creation will be available in the next update.",
      duration: 3000
    });
  };

  return (
    <div className="min-h-screen bg-[#FFF5EB] dark:bg-[#2E1E12] text-orange-900 dark:text-orange-100">
      <CalendarNavbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Community Groups</h1>
          <Button 
            onClick={handleCreateGroup}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
          >
            <Plus size={18} />
            <span>Create Group</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - My Groups */}
          <div className="col-span-1 lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-[#3A2A1E] rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">My Groups</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {myGroups.map(group => (
                  <div key={group.id} className="border border-gray-200 dark:border-orange-900/30 rounded-lg p-4 flex justify-between items-center bg-gray-50 dark:bg-[#2E1E12]/40">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${group.color} rounded-lg flex items-center justify-center text-white font-bold text-lg`}>
                        {group.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-medium">{group.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{group.members} members</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Settings2 size={18} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-white dark:bg-[#3A2A1E] rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentEvents.map((event, index) => (
                  <div key={event.id} className="py-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-orange-700 dark:text-orange-300">
                        {event.organizer}
                      </span> posted a new event in {event.category}
                    </p>
                    <EventCard 
                      event={event}
                      compact={true}
                      onLike={() => {}}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right column - Recommended & Upcoming */}
          <div className="space-y-6">
            {/* Recommended Groups */}
            <div className="bg-white dark:bg-[#3A2A1E] rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Recommended Groups</h2>
              
              <div className="space-y-3">
                {recommendedGroups.map(group => (
                  <div key={group.id} className="border border-gray-200 dark:border-orange-900/30 rounded-lg p-3 flex justify-between items-center bg-gray-50 dark:bg-[#2E1E12]/40">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 ${group.color} rounded-lg flex items-center justify-center text-white font-bold`}>
                        {group.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{group.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{group.members} members</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => handleJoinGroup(group.id)}
                    >
                      Join
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Upcoming Events */}
            <div className="bg-white dark:bg-[#3A2A1E] rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold flex justify-between items-center mb-4">
                <span>Upcoming Events</span>
                <Button variant="ghost" size="sm" className="text-orange-700 dark:text-orange-300 p-1 h-auto">
                  <span className="text-xs mr-1">All</span>
                  <ChevronsRight size={16} />
                </Button>
              </h2>
              
              <ScrollArea className="h-[300px]">
                <div className="space-y-4 pr-4">
                  {Object.keys(upcomingEvents).map((dateKey) => (
                    <div key={dateKey} className="space-y-2">
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 flex items-center">
                        <Pin size={12} className="mr-1" />
                        {dateKey}
                      </h3>
                      
                      {upcomingEvents[dateKey].map((event) => (
                        <div key={event.id} className="bg-gray-50 dark:bg-[#2E1E12]/40 p-3 rounded-lg">
                          <p className="font-medium">{event.title}</p>
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span>{event.time}</span>
                            <span>{event.category}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Groups;
