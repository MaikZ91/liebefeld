
import React from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventLikeButtonProps {
  likes: number;
  isLiking: boolean;
  onLike: (e: React.MouseEvent) => void;
  className?: string;
  badgeClassName?: string;
  iconSize?: number;
  small?: boolean;
}

const EventLikeButton: React.FC<EventLikeButtonProps> = ({
  likes,
  isLiking,
  onLike,
  className,
  badgeClassName,
  iconSize = 16,
  small = false,
}) => (
  <div className={cn("flex items-center gap-0.5", className)}>
    <Button
      variant="ghost"
      size={small ? "icon" : "sm"}
      className={cn(
        small ? "h-4 w-4 p-0" : "h-7 w-7 mr-1",
        "rounded-full transition-all",
        isLiking && "opacity-70 cursor-not-allowed"
      )}
      onClick={onLike}
      disabled={isLiking}
      aria-label="Gefällt mir"
    >
      <Heart
        className={cn(
          small ? "w-2 h-2" : "w-4 h-4",
          "transition-transform text-white",
          likes > 0 ? "fill-red-500 text-white" : "",
          isLiking ? "scale-125" : ""
        )}
        width={iconSize}
        height={iconSize}
      />
    </Button>
    {likes > 0 && (
      <span
        className={cn(
          small ? "text-[8px]" : "text-sm",
          "text-white font-medium",
          badgeClassName
        )}
      >
        {likes}
      </span>
    )}
  </div>
);

export default EventLikeButton;
