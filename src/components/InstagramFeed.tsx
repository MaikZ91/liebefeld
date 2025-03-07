
import React from 'react';
import { Instagram } from 'lucide-react';
import { Button } from './ui/button';

const InstagramFeed = () => {
  const instagramUsername = 'the_tribe.bi';
  const instagramUrl = `https://www.instagram.com/${instagramUsername}/`;

  return (
    <div className="py-16 bg-gradient-to-b from-orange-50 to-white dark:from-orange-950 dark:to-black">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <Instagram className="text-pink-600 h-8 w-8" />
            <h2 className="text-3xl md:text-4xl font-bold">Folge uns auf Instagram</h2>
          </div>
          
          <p className="text-center text-muted-foreground max-w-2xl mb-4">
            Bleibe auf dem Laufenden mit den neuesten Updates, Event-Ankündigungen und Community-Highlights.
          </p>
          
          <Button 
            className="rounded-full bg-gradient-to-r from-purple-500 via-pink-600 to-orange-500 hover:from-purple-600 hover:via-pink-700 hover:to-orange-600 text-white px-8 py-6 h-auto text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            asChild
          >
            <a 
              href={instagramUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3"
            >
              <Instagram className="h-6 w-6" />
              @{instagramUsername}
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InstagramFeed;
