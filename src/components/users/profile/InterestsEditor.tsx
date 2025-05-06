
import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { X, Plus } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface InterestsEditorProps {
  interests: string[];
  onInterestsChange: (interests: string[]) => void;
}

const InterestsEditor: React.FC<InterestsEditorProps> = ({
  interests,
  onInterestsChange
}) => {
  const [newInterest, setNewInterest] = useState('');
  
  const handleAddInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      onInterestsChange([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    onInterestsChange(interests.filter(i => i !== interest));
  };
  
  return (
    <div className="space-y-2">
      <Label>Interessen</Label>
      <div className="flex flex-wrap gap-2 mb-2">
        {interests.map((interest, index) => (
          <Badge 
            key={index} 
            variant="outline" 
            className="bg-gray-800 border-gray-700 flex items-center gap-1"
          >
            {interest}
            <X 
              size={14} 
              className="cursor-pointer text-gray-400 hover:text-red-400" 
              onClick={() => handleRemoveInterest(interest)}
            />
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={newInterest}
          onChange={(e) => setNewInterest(e.target.value)}
          placeholder="Neues Interesse"
          className="bg-gray-900 border-gray-700"
          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())}
        />
        <Button 
          type="button" 
          size="icon" 
          onClick={handleAddInterest}
          variant="outline"
          className="border-gray-700 text-white"
        >
          <Plus size={16} />
        </Button>
      </div>
    </div>
  );
};

export default InterestsEditor;
