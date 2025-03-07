
import React from 'react';
import { Instagram } from 'lucide-react';
import { Button } from './ui/button';

const InstagramFeed = () => {
  const instagramUsername = 'the_tribe.bi';
  const instagramUrl = `https://www.instagram.com/${instagramUsername}/`;

  return (
    <Button 
      className="bg-gradient-to-r from-purple-500 via-pink-600 to-orange-500 hover:from-purple-600 hover:via-pink-700 hover:to-orange-600 text-white rounded-full px-6 py-2 shadow-lg hover:shadow-xl transition-all"
      asChild
    >
      <a 
        href={instagramUrl}
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2"
      >
        <Instagram className="h-5 w-5" />
        Instagram folgen
      </a>
    </Button>
  );
};

export default InstagramFeed;
