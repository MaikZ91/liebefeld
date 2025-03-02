
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import CalendarNavbar from "@/components/CalendarNavbar";
import { Send, Users } from 'lucide-react';
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
  messages: Message[];
};

const Groups = () => {
  const [activeGroup, setActiveGroup] = useState<string>("ausgehen");
  const [newMessage, setNewMessage] = useState("");
  
  const [groups, setGroups] = useState<Record<string, Group>>({
    ausgehen: {
      id: "ausgehen",
      name: "Ausgehen",
      description: "Gemeinsam ausgehen, feiern und Spaß haben",
      members: 42,
      messages: [
        { id: 1, text: "Hey, was geht heute Abend?", sender: "Max", timestamp: new Date(2023, 7, 5, 18, 30) },
        { id: 2, text: "Ich bin für alles offen! Wer hat noch Lust?", sender: "Lisa", timestamp: new Date(2023, 7, 5, 18, 35) }
      ]
    },
    sport: {
      id: "sport",
      name: "Sport",
      description: "Zusammen Sport treiben und fit bleiben",
      members: 28,
      messages: [
        { id: 1, text: "Morgen 18 Uhr Laufen im Park?", sender: "Thomas", timestamp: new Date(2023, 7, 6, 10, 15) },
        { id: 2, text: "Bin dabei!", sender: "Anna", timestamp: new Date(2023, 7, 6, 10, 20) }
      ]
    },
    kreativ: {
      id: "kreativ",
      name: "Kreativität",
      description: "Kreative Projekte zusammen gestalten",
      members: 18,
      messages: [
        { id: 1, text: "Hat jemand Lust auf einen Malkurs am Wochenende?", sender: "Julia", timestamp: new Date(2023, 7, 4, 14, 10) },
        { id: 2, text: "Ich wäre interessiert! Wo findet das statt?", sender: "Mark", timestamp: new Date(2023, 7, 4, 14, 25) }
      ]
    }
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const updatedGroups = { ...groups };
    
    updatedGroups[activeGroup].messages.push({
      id: Date.now(),
      text: newMessage,
      sender: "Du",
      timestamp: new Date()
    });

    setGroups(updatedGroups);
    setNewMessage("");
    
    toast({
      title: "Nachricht gesendet",
      description: "Deine Nachricht wurde an die Gruppe gesendet.",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <CalendarNavbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Gruppen</h1>
        <p className="text-lg mb-8">Entdecke Gruppen in deiner Stadt und tausche dich mit Gleichgesinnten aus!</p>
        
        <Tabs value={activeGroup} onValueChange={setActiveGroup} className="w-full">
          <TabsList className="w-full mb-4 grid grid-cols-3">
            <TabsTrigger value="ausgehen">Ausgehen</TabsTrigger>
            <TabsTrigger value="sport">Sport</TabsTrigger>
            <TabsTrigger value="kreativ">Kreativität</TabsTrigger>
          </TabsList>
          
          {Object.entries(groups).map(([id, group]) => (
            <TabsContent key={id} value={id}>
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>{group.name}</CardTitle>
                  <CardDescription>
                    {group.description} • <span className="inline-flex items-center"><Users className="h-4 w-4 mr-1" />{group.members} Mitglieder</span>
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pb-0">
                  <div className="h-[400px] border rounded-md p-4 mb-4 overflow-y-auto flex flex-col space-y-3 bg-muted/20">
                    {group.messages.map(message => (
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
                    ))}
                  </div>
                </CardContent>
                
                <CardFooter>
                  <div className="w-full flex gap-2">
                    <Textarea 
                      placeholder="Schreibe eine Nachricht..." 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="min-h-[50px] flex-grow"
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={!newMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Groups;
