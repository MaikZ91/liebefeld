
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
    <div className="space-y-3">
      <Label className="text-gray-300">Interessen</Label>
      <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-900/50 border border-gray-800 rounded-md min-h-[40px] items-center">
        {interests.length === 0 && <p className="text-sm text-gray-500">Füge deine Interessen hinzu...</p>}
        {interests.map((interest, index) => (
          <Badge 
            key={index} 
            variant="outline" 
            className="bg-red-900/80 border border-red-700/50 text-red-100 flex items-center gap-1.5"
          >
            {interest}
            <X 
              size={14} 
              className="cursor-pointer text-red-200 hover:text-white" 
              onClick={() => handleRemoveInterest(interest)}
            />
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={newInterest}
          onChange={(e) => setNewInterest(e.target.value)}
          placeholder="z.B. Sport, Musik, Reisen"
          className="bg-gray-900/50 border-gray-700 focus:ring-red-500 focus:border-red-500"
          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())}
        />
        <Button 
          type="button" 
          size="icon" 
          onClick={handleAddInterest}
          variant="outline"
          className="border-gray-700 text-white hover:bg-red-500/20 hover:border-red-500"
        >
          <Plus size={16} />
        </Button>
      </div>
    </div>
  );
};

export default InterestsEditor;
