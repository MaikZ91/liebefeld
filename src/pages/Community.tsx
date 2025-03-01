
import React, { useEffect } from 'react';
import CalendarNavbar from '@/components/CalendarNavbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Star, Heart, MessageSquare } from 'lucide-react';

const Community = () => {
  // Add smooth scroll-in animation effect on page load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col">
      <CalendarNavbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8 max-w-6xl animate-fade-in">
          <section className="mb-12">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold mb-3">Unsere Community</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Lerne die Gesichter hinter den Events kennen und vernetze dich mit Gleichgesinnten in unserer lebendigen Community.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communityMembers.map((member) => (
                <Card key={member.id} className="glass-card overflow-hidden hover-scale">
                  <CardHeader className="p-6 pb-3">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-primary/20">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{member.name}</CardTitle>
                        <CardDescription className="text-sm">{member.role}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-2">
                    <p className="text-sm mb-4">{member.bio}</p>
                    <div className="flex flex-wrap gap-2">
                      {member.interests.map((interest, i) => (
                        <Badge key={i} variant="secondary" className="text-xs font-normal">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="p-6 pt-0 flex justify-between text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{member.events} Events</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>Seit {member.joinedYear}</span>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">Aktive Gruppen</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {communityGroups.map((group) => (
                <Card key={group.id} className="glass-card overflow-hidden hover-scale">
                  <CardHeader className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{group.name}</CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {group.members} Mitglieder • {group.eventsCount} Events
                        </CardDescription>
                      </div>
                      <Badge className="capitalize">{group.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <p className="text-sm text-muted-foreground mb-4">{group.description}</p>
                    
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
                      <Avatar className="h-8 w-8 border-2 border-primary/20">
                        <AvatarImage src={group.organizer.avatar} alt={group.organizer.name} />
                        <AvatarFallback>{group.organizer.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="ml-2">Organisiert von {group.organizer.name}</span>
                    </div>
                    
                    <div className="flex -space-x-2 mb-2">
                      {group.memberAvatars.map((avatar, i) => (
                        <Avatar key={i} className="border-2 border-background h-8 w-8">
                          <AvatarImage src={avatar.src} alt={avatar.alt} />
                          <AvatarFallback>{avatar.alt.charAt(0)}</AvatarFallback>
                        </Avatar>
                      ))}
                      {group.members > 5 && (
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-xs font-medium">
                          +{group.members - 5}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-6 pt-0">
                    <Button variant="outline" className="w-full rounded-full">
                      Gruppe beitreten
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

// Sample data
const communityMembers = [
  {
    id: 1,
    name: 'Laura Schmidt',
    role: 'Event Organisatorin',
    bio: 'Leidenschaftliche Netzwerkerin mit Fokus auf Tech-Events und Community Building.',
    interests: ['Tech', 'Networking', 'Design', 'Coffee'],
    events: 12,
    joinedYear: '2021',
    avatar: 'https://randomuser.me/api/portraits/women/23.jpg'
  },
  {
    id: 2,
    name: 'Thomas Weber',
    role: 'Workshop Leiter',
    bio: 'Frontend Entwickler mit Leidenschaft für Wissensaustausch und Teamarbeit.',
    interests: ['Coding', 'UX/UI', 'Teaching', 'Music'],
    events: 8,
    joinedYear: '2022',
    avatar: 'https://randomuser.me/api/portraits/men/35.jpg'
  },
  {
    id: 3,
    name: 'Sophie Müller',
    role: 'Community Managerin',
    bio: 'Bringt Menschen zusammen und schafft unvergessliche Erlebnisse für die Community.',
    interests: ['Events', 'Marketing', 'Photography', 'Travel'],
    events: 24,
    joinedYear: '2020',
    avatar: 'https://randomuser.me/api/portraits/women/42.jpg'
  },
  {
    id: 4,
    name: 'Markus Fischer',
    role: 'Förderer',
    bio: 'Unterstützt lokale Initiativen und hilft beim Aufbau nachhaltiger Community-Projekte.',
    interests: ['Sustainability', 'Local Business', 'Mentoring'],
    events: 7,
    joinedYear: '2022',
    avatar: 'https://randomuser.me/api/portraits/men/42.jpg'
  },
  {
    id: 5,
    name: 'Hannah Klein',
    role: 'Yoga Lehrerin',
    bio: 'Teilt ihre Leidenschaft für Yoga und Achtsamkeit mit der Community.',
    interests: ['Yoga', 'Wellness', 'Meditation', 'Health'],
    events: 15,
    joinedYear: '2021',
    avatar: 'https://randomuser.me/api/portraits/women/66.jpg'
  },
  {
    id: 6,
    name: 'David Schulz',
    role: 'Tech Enthusiast',
    bio: 'Softwareentwickler mit Interesse an neuen Technologien und Open Source Projekten.',
    interests: ['AI', 'Open Source', 'Blockchain', 'IoT'],
    events: 9,
    joinedYear: '2022',
    avatar: 'https://randomuser.me/api/portraits/men/53.jpg'
  }
];

const communityGroups = [
  {
    id: 1,
    name: 'Tech Meetup Gruppe',
    description: 'Regelmäßige Treffen für Entwickler, Designer und Tech-Enthusiasten zum Austausch und Netzwerken.',
    members: 128,
    eventsCount: 42,
    category: 'Technologie',
    organizer: {
      name: 'Thomas Weber',
      avatar: 'https://randomuser.me/api/portraits/men/35.jpg'
    },
    memberAvatars: [
      { src: 'https://randomuser.me/api/portraits/men/35.jpg', alt: 'Thomas' },
      { src: 'https://randomuser.me/api/portraits/women/42.jpg', alt: 'Sophie' },
      { src: 'https://randomuser.me/api/portraits/men/42.jpg', alt: 'Markus' },
      { src: 'https://randomuser.me/api/portraits/women/23.jpg', alt: 'Laura' },
      { src: 'https://randomuser.me/api/portraits/men/53.jpg', alt: 'David' }
    ]
  },
  {
    id: 2,
    name: 'Yoga im Park',
    description: 'Gemeinsames Yoga für alle Level im Stadtpark. Entspannung und Bewegung in der Gemeinschaft.',
    members: 85,
    eventsCount: 24,
    category: 'Wellness',
    organizer: {
      name: 'Hannah Klein',
      avatar: 'https://randomuser.me/api/portraits/women/66.jpg'
    },
    memberAvatars: [
      { src: 'https://randomuser.me/api/portraits/women/66.jpg', alt: 'Hannah' },
      { src: 'https://randomuser.me/api/portraits/women/42.jpg', alt: 'Sophie' },
      { src: 'https://randomuser.me/api/portraits/women/23.jpg', alt: 'Laura' },
      { src: 'https://randomuser.me/api/portraits/men/42.jpg', alt: 'Markus' },
      { src: 'https://randomuser.me/api/portraits/men/53.jpg', alt: 'David' }
    ]
  },
  {
    id: 3,
    name: 'Kreative Workshop-Reihe',
    description: 'Workshops zu verschiedenen kreativen Themen wie Fotografie, Design, Kunst und DIY-Projekte.',
    members: 64,
    eventsCount: 18,
    category: 'Kreativität',
    organizer: {
      name: 'Sophie Müller',
      avatar: 'https://randomuser.me/api/portraits/women/42.jpg'
    },
    memberAvatars: [
      { src: 'https://randomuser.me/api/portraits/women/42.jpg', alt: 'Sophie' },
      { src: 'https://randomuser.me/api/portraits/women/23.jpg', alt: 'Laura' },
      { src: 'https://randomuser.me/api/portraits/men/42.jpg', alt: 'Markus' },
      { src: 'https://randomuser.me/api/portraits/women/66.jpg', alt: 'Hannah' },
      { src: 'https://randomuser.me/api/portraits/men/53.jpg', alt: 'David' }
    ]
  },
  {
    id: 4,
    name: 'Networking Stammtisch',
    description: 'Monatlicher Stammtisch für Networking und Austausch in entspannter Atmosphäre.',
    members: 95,
    eventsCount: 28,
    category: 'Networking',
    organizer: {
      name: 'Laura Schmidt',
      avatar: 'https://randomuser.me/api/portraits/women/23.jpg'
    },
    memberAvatars: [
      { src: 'https://randomuser.me/api/portraits/women/23.jpg', alt: 'Laura' },
      { src: 'https://randomuser.me/api/portraits/men/35.jpg', alt: 'Thomas' },
      { src: 'https://randomuser.me/api/portraits/women/42.jpg', alt: 'Sophie' },
      { src: 'https://randomuser.me/api/portraits/men/42.jpg', alt: 'Markus' },
      { src: 'https://randomuser.me/api/portraits/men/53.jpg', alt: 'David' }
    ]
  }
];

export default Community;
