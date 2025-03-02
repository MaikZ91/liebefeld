
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarNavbar } from "@/components/CalendarNavbar";
import { Send, UserPlus, Check, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type Message = {
  id: number;
  text: string;
  sender: string;
  timestamp: Date;
};

type Group = {
  id: string;
  name: string;
  description: string;
  members: number;
  joined: boolean;
  messages: Message[];
};

const Groups = () => {
  const [activeGroup, setActiveGroup] = useState<string>("ausgehen");
  const [newMessage, setNewMessage] = useState("");
  const [groups, setGroups] = useState<Record<string, Group[]>>({
    ausgehen: [
      {
        id: "clubbing",
        name: "Clubbing",
        description: "Zusammen in die besten Clubs in Liebefeld",
        members: 24,
        joined: false,
        messages: [
          { id: 1, text: "Hey, wer kommt heute Abend mit ins Vanilla?", sender: "Max", timestamp: new Date(2023, 7, 5, 18, 30) },
          { id: 2, text: "Ich bin dabei! Wann treffen wir uns?", sender: "Lisa", timestamp: new Date(2023, 7, 5, 18, 35) }
        ]
      },
      {
        id: "concerts",
        name: "Konzerte",
        description: "Gemeinsam Live-Musik genießen",
        members: 18,
        joined: false,
        messages: []
      }
    ],
    sport: [
      {
        id: "football",
        name: "Fußball",
        description: "Wöchentliche Fußballspiele im Park",
        members: 16,
        joined: false,
        messages: []
      },
      {
        id: "running",
        name: "Laufgruppe",
        description: "Gemeinsam laufen und fit bleiben",
        members: 12,
        joined: false,
        messages: []
      }
    ],
    kreativ: [
      {
        id: "painting",
        name: "Malen",
        description: "Gemeinsam kreativ sein mit Pinsel und Farbe",
        members: 8,
        joined: false,
        messages: []
      },
      {
        id: "writing",
        name: "Schreibwerkstatt",
        description: "Zusammen Geschichten schreiben",
        members: 10,
        joined: false,
        messages: []
      }
    ]
  });

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedGroupId) return;

    const updatedGroups = { ...groups };
    const category = activeGroup;
    const groupIndex = updatedGroups[category].findIndex(g => g.id === selectedGroupId);

    if (groupIndex !== -1) {
      updatedGroups[category][groupIndex].messages.push({
        id: Date.now(),
        text: newMessage,
        sender: "Du",
        timestamp: new Date()
      });

      setGroups(updatedGroups);
      setNewMessage("");
    }
  };

  const handleJoinGroup = (category: string, groupId: string) => {
    const updatedGroups = { ...groups };
    const groupIndex = updatedGroups[category].findIndex(g => g.id === groupId);

    if (groupIndex !== -1) {
      const alreadyJoined = updatedGroups[category][groupIndex].joined;
      updatedGroups[category][groupIndex].joined = !alreadyJoined;
      
      if (!alreadyJoined) {
        updatedGroups[category][groupIndex].members += 1;
        toast({
          title: "Gruppe beigetreten",
          description: `Du bist der Gruppe ${updatedGroups[category][groupIndex].name} beigetreten.`,
        });
      } else {
        updatedGroups[category][groupIndex].members -= 1;
        toast({
          title: "Gruppe verlassen",
          description: `Du hast die Gruppe ${updatedGroups[category][groupIndex].name} verlassen.`,
        });
      }
      
      setGroups(updatedGroups);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectedGroup = selectedGroupId 
    ? groups[activeGroup].find(g => g.id === selectedGroupId)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <CalendarNavbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Gruppen</h1>
        <p className="text-lg mb-8">Entdecke Gruppen in deiner Stadt, tritt bei und tausche dich mit Gleichgesinnten aus!</p>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/3">
            <Tabs value={activeGroup} onValueChange={setActiveGroup} className="w-full">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="ausgehen" className="flex-1">Ausgehen</TabsTrigger>
                <TabsTrigger value="sport" className="flex-1">Sport</TabsTrigger>
                <TabsTrigger value="kreativ" className="flex-1">Kreativität</TabsTrigger>
              </TabsList>
              
              {Object.entries(groups).map(([category, groupList]) => (
                <TabsContent key={category} value={category} className="space-y-4">
                  {groupList.map(group => (
                    <Card 
                      key={group.id} 
                      className={`cursor-pointer hover:shadow-md transition-shadow ${selectedGroupId === group.id ? 'border-primary' : ''}`}
                      onClick={() => setSelectedGroupId(group.id)}
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{group.name}</CardTitle>
                            <CardDescription>{group.description}</CardDescription>
                          </div>
                          <Button 
                            variant={group.joined ? "outline" : "default"}
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinGroup(category, group.id);
                            }}
                          >
                            {group.joined ? (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Beigetreten
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-1" />
                                Beitreten
                              </>
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardFooter>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{group.members} Mitglieder</span>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          </div>
          
          <div className="w-full md:w-2/3">
            <Card className="h-full">
              {selectedGroup ? (
                <>
                  <CardHeader>
                    <CardTitle>{selectedGroup.name}</CardTitle>
                    <CardDescription>
                      {selectedGroup.description} • {selectedGroup.members} Mitglieder
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-0">
                    <div className="h-[400px] border rounded-md p-4 mb-4 overflow-y-auto flex flex-col space-y-3 bg-muted/20">
                      {selectedGroup.messages.length === 0 ? (
                        <div className="flex-grow flex items-center justify-center text-center p-4">
                          <div className="text-muted-foreground">
                            <p className="mb-2">Noch keine Nachrichten</p>
                            {!selectedGroup.joined && (
                              <p className="text-sm">Tritt der Gruppe bei, um zu chatten</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        selectedGroup.messages.map(message => (
                          <div 
                            key={message.id} 
                            className={`max-w-[80%] p-3 rounded-lg ${message.sender === "Du" 
                              ? "bg-primary text-primary-foreground ml-auto" 
                              : "bg-secondary text-secondary-foreground"
                            }`}
                          >
                            <div className="font-medium text-xs mb-1">
                              {message.sender}
                            </div>
                            <div>{message.text}</div>
                            <div className="text-xs mt-1 opacity-70">
                              {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="w-full flex gap-2">
                      <Textarea 
                        placeholder={selectedGroup.joined ? "Schreibe eine Nachricht..." : "Tritt der Gruppe bei, um zu chatten"} 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="min-h-[50px] flex-grow"
                        disabled={!selectedGroup.joined}
                      />
                      <Button 
                        onClick={handleSendMessage} 
                        disabled={!newMessage.trim() || !selectedGroup.joined}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </>
              ) : (
                <div className="flex-grow flex items-center justify-center text-center p-12">
                  <div className="text-muted-foreground">
                    <h3 className="text-lg font-medium mb-2">Wähle eine Gruppe aus</h3>
                    <p>Entdecke Gruppen und tausche dich mit anderen aus</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Groups;
