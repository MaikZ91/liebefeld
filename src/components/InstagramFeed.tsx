
import React from 'react';
import { Instagram } from 'lucide-react';
import { Button } from './ui/button';

const InstagramFeed = () => {
  const instagramUsername = 'the_tribe.bi';
  const instagramUrl = `https://www.instagram.com/${instagramUsername}/`;

  return (
    <Button 
      className="bg-gradient-to-r from-purple-500 via-pink-600 to-orange-500 hover:from-purple-600 hover:via-pink-700 hover:to-orange-600 text-white rounded-full h-10 w-10 p-0 flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
      asChild
      size="icon"
    >
      <a 
        href={instagramUrl}
        target="_blank" 
        rel="noopener noreferrer"
      >
        <Instagram className="h-5 w-5" />
      </a>
    </Button>
  );
};

export default InstagramFeed;
