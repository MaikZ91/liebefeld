
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Instagram } from 'lucide-react';
import { Button } from './ui/button';

interface InstagramPost {
  id: string;
  caption?: string;
  media_url: string;
  permalink: string;
  timestamp: string;
}

const InstagramFeed = () => {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const instagramUsername = 'the_tribe.bi';

  useEffect(() => {
    // For now we'll show sample Instagram posts since we can't directly
    // fetch without authentication tokens
    setLoading(true);
    
    // These are placeholder posts - in a production environment you would
    // integrate with Instagram Graph API using access tokens
    const placeholderPosts: InstagramPost[] = [
      {
        id: '1',
        caption: 'Entdecke die neuesten Events in Bielefeld! #Liebefeld ❤️',
        media_url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        permalink: `https://www.instagram.com/${instagramUsername}/`,
        timestamp: '2025-03-01T12:00:00Z'
      },
      {
        id: '2',
        caption: 'Gemeinsam erleben wir mehr! Komm zur nächsten Community-Veranstaltung.',
        media_url: 'https://images.unsplash.com/photo-1540317580384-e5d43867caa6?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        permalink: `https://www.instagram.com/${instagramUsername}/`,
        timestamp: '2025-02-20T14:30:00Z'
      },
      {
        id: '3',
        caption: 'Bielefeld at night - die Stadt pulsiert! #NightLife #Bielefeld',
        media_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        permalink: `https://www.instagram.com/${instagramUsername}/`,
        timestamp: '2025-02-15T20:15:00Z'
      },
      {
        id: '4',
        caption: 'Unsere Community wächst! Danke an alle, die dabei sind. ❤️',
        media_url: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        permalink: `https://www.instagram.com/${instagramUsername}/`,
        timestamp: '2025-02-10T09:45:00Z'
      }
    ];
    
    setPosts(placeholderPosts);
    setLoading(false);
  }, []);

  // Format the date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('de-DE', options);
  };

  // Truncate caption text if it's too long
  const truncateCaption = (caption: string | undefined, maxLength: number = 100) => {
    if (!caption) return '';
    return caption.length > maxLength 
      ? `${caption.substring(0, maxLength)}...` 
      : caption;
  };

  return (
    <div className="py-10 bg-gradient-to-b from-orange-50 to-white dark:from-orange-950 dark:to-black">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Instagram className="text-pink-600 h-6 w-6" />
            <h2 className="text-2xl md:text-3xl font-bold">Folge uns auf Instagram</h2>
          </div>
          <p className="text-center text-muted-foreground max-w-2xl">
            Bleibe auf dem Laufenden mit den neuesten Updates, Event-Ankündigungen und Community-Highlights.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {posts.map((post) => (
                <a 
                  href={post.permalink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  key={post.id}
                  className="group"
                >
                  <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg h-full flex flex-col">
                    <div className="relative aspect-square overflow-hidden">
                      <img 
                        src={post.media_url} 
                        alt={post.caption || "Instagram post"} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <p className="text-xs text-white">{formatDate(post.timestamp)}</p>
                      </div>
                    </div>
                    <div className="p-4 flex-grow">
                      <p className="text-sm text-muted-foreground">
                        {truncateCaption(post.caption)}
                      </p>
                    </div>
                  </Card>
                </a>
              ))}
            </div>
            
            <div className="flex justify-center">
              <Button 
                className="rounded-full flex items-center gap-2"
                asChild
              >
                <a 
                  href={`https://www.instagram.com/${instagramUsername}/`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Instagram className="h-4 w-4" />
                  @{instagramUsername} folgen
                </a>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InstagramFeed;
