import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getChannelColor } from "@/utils/channelColors";
import { useChatPreferences } from "@/contexts/ChatPreferencesContext";

export type FilterGroup = "alle" | "ausgehen" | "kreativität" | "sport";

interface FilterBarProps {
  value?: FilterGroup;
  onChange?: (value: FilterGroup) => void;
  className?: string;
  variant?: "dark" | "light";
}

const options: FilterGroup[] = ["alle", "ausgehen", "kreativität", "sport"];

const FilterBar: React.FC<FilterBarProps> = ({
  value: externalValue,
  onChange: externalOnChange,
  className,
  variant = "dark",
}) => {
  // Use context for persistence, with optional external control
  const { activeCategory, setActiveCategory } = useChatPreferences();
  const value = externalValue || (activeCategory as FilterGroup);

  const handleChange = (newValue: FilterGroup) => {
    console.log("FilterBar: changing from", value, "to", newValue);

    // Update context
    setActiveCategory(newValue);

    // Call external handler if provided
    if (externalOnChange) {
      externalOnChange(newValue);
    }
  };

  return (
    <div className={cn("w-full overflow-x-auto scrollbar-hide", className)}>
      <div
        className={cn(
          "inline-flex rounded-full p-0.5 gap-1",
          variant === "light" ? "bg-white/80 border border-gray-200" : "bg-black border border-white/10",
        )}
      >
        {options.map((opt) => {
          const isActive = value === opt;
          const isAll = opt === "alle";
          const chipBase = "px-3 h-7 text-xs rounded-full transition-colors";
          if (isAll) {
            return (
              <Button
                key={opt}
                size="sm"
                variant="ghost"
                onClick={() => handleChange(opt)}
                className={cn(
                  chipBase,
                  isActive
                    ? variant === "light"
                      ? "bg-gray-900 text-white border border-gray-800"
                      : "bg-white/15 text-white border border-white/30"
                    : variant === "light"
                      ? "text-gray-700 hover:bg-gray-100"
                      : "text-white hover:bg-white/5",
                )}
              >
                {opt}
              </Button>
            );
          }
          const type = (opt === "ausgehen" ? "ausgehen" : opt === "kreativität" ? "kreativität" : "sport") as
            | "ausgehen"
            | "kreativität"
            | "sport";
          const colors = getChannelColor(type);
          return (
            <Button
              key={opt}
              size="sm"
              variant="ghost"
              onClick={() => handleChange(opt)}
              style={
                isActive
                  ? { ...colors.bgStyle, ...colors.borderStyle, color: "hsl(var(--foreground))" }
                  : { ...colors.borderStyle, ...colors.textStyle }
              }
              className={cn(chipBase, "border", !isActive && "hover:bg-white/5")}
            >
              {opt}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default FilterBar;
