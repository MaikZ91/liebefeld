
import React from 'react';
import { Palette } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface ThemeColorPickerProps {
  compact?: boolean;
}

const ThemeColorPicker: React.FC<ThemeColorPickerProps> = ({ compact = false }) => {
  const { themeColor, setThemeColor } = useTheme();
  
  const colors = [
    { name: 'red', label: 'Rot', value: '#ea384c' },
    { name: 'blue', label: 'Blau', value: '#3b82f6' },
    { name: 'green', label: 'Grün', value: '#10b981' },
    { name: 'purple', label: 'Lila', value: '#8b5cf6' },
    { name: 'orange', label: 'Orange', value: '#f97316' },
  ];

  const handleColorChange = (colorName: string) => {
    setThemeColor(colorName as any);
    toast({
      title: "Farbschema geändert",
      description: `Das Farbschema wurde auf ${colors.find(c => c.name === colorName)?.label || colorName} geändert.`,
      variant: "default",
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          className="flex items-center gap-2"
        >
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: colors.find(c => c.name === themeColor)?.value || '#ea384c' }}
          />
          <Palette className="h-4 w-4" />
          {!compact && "Farbschema"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <h3 className="text-sm font-medium mb-2">Farbschema auswählen</h3>
        <div className="grid grid-cols-5 gap-2">
          {colors.map((color) => (
            <button
              key={color.name}
              onClick={() => handleColorChange(color.name)}
              className={`h-8 w-8 rounded-full transition-all ${themeColor === color.name ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-105'}`}
              style={{ 
                backgroundColor: color.value,
                ringColor: color.value
              }}
              title={color.label}
              aria-label={`Theme color ${color.label}`}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ThemeColorPicker;
