import React, { useState } from 'react';
import CategorySelector from '../CategorySelector';

const ChatCategoryHeader: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('alle');

  const categories = [
    { id: 'alle', label: 'Alle' },
    { id: 'sport', label: 'Sport' },
    { id: 'ausgehen', label: 'Ausgehen' },
    { id: 'kreativität', label: 'Kreativität' },
    { id: 'musik', label: 'Musik' },
    { id: 'kunst', label: 'Kunst' },
  ];
  
  return (
    <header className="w-full bg-black">
      <div className="px-4 py-3">
        <CategorySelector
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          className="max-w-full"
        />
      </div>
    </header>
  );
};

export default ChatCategoryHeader;