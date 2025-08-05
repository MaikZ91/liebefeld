
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Users, ChevronDown } from 'lucide-react';
import { getChannelColor } from '@/utils/channelColors';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GroupSelectorProps {
  activeGroup: string;
  activeGroupName: string;
  groups: any[]; // Using any here but you can replace with your specific type
  handleGroupSelect: (groupId: string) => void;
  mobile?: boolean;
}

export const GroupSelector: React.FC<GroupSelectorProps> = ({
  activeGroup,
  activeGroupName,
  groups,
  handleGroupSelect,
  mobile = false
}) => {
  // Determine group type based on active group name
  const getGroupType = (groupName: string): 'ausgehen' | 'sport' | 'kreativität' => {
    const lowerName = groupName.toLowerCase();
    if (lowerName.includes('sport')) return 'sport';
    if (lowerName.includes('kreativität')) return 'kreativität';
    return 'ausgehen';
  };
  
  const groupType = getGroupType(activeGroupName);
  const colors = getChannelColor(groupType);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          className={cn(
            "text-white",
            mobile && "flex-grow"
          )}
          style={colors.bgStyle}
        >
          <span style={colors.textStyle}>#{activeGroupName.toLowerCase()}</span> <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-gray-900 border border-gray-700 text-white z-50">
        <DropdownMenuLabel>Gruppe wählen</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-700" />
        {groups.map((group) => (
          <DropdownMenuItem 
            key={group.id} 
            className={cn(
              "cursor-pointer hover:bg-gray-800",
              activeGroup === group.id && "bg-gray-800"
            )}
            onClick={() => handleGroupSelect(group.id)}
          >
            <Users className="h-4 w-4 mr-2" />
            {group.displayName || group.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
