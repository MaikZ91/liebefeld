import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CalendarDays, ChevronRight, Filter, Loader2, Send, Sparkles, Wand2, Heart, History } from "lucide-react";
import { cities } from "@/contexts/EventContext";

type ChatInputProps = {
  input: string;
  setInput: (value: string) => void;
  handleSendMessage: (value?: string) => Promise<void> | void;
  isTyping: boolean;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isHeartActive: boolean;
  handleHeartClick: () => void;
  globalQueries: string[];
  toggleRecentQueries: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  onAddEvent: () => void;
  showAnimatedPrompts: boolean;
  activeChatModeValue: string;
};

type HeatmapHeaderProps = {
  selectedCity: string;
  selectedDate: Date;
  timeRange: number[] | null;
  chatInputProps: ChatInputProps;
  showFilterPanel: boolean;
  onToggleFilterPanel: () => void;
  onOpenSwipeMode: () => void;
  onMIAOpenChange?: (isOpen: boolean) => void;
  hasNewDailyRecommendation?: boolean;
  onMIAClick?: () => void;
  isDailyRecommendationLoading?: boolean;
};

const baseNavItems = ["Art", "Comedy", "Jazz", "Meetups"];

const HeatmapHeader: React.FC<HeatmapHeaderProps> = ({
  selectedCity,
  selectedDate,
  timeRange,
  chatInputProps,
  showFilterPanel,
  onToggleFilterPanel,
  onOpenSwipeMode,
  onMIAOpenChange,
  hasNewDailyRecommendation,
  onMIAClick,
  isDailyRecommendationLoading,
}) => {
  const [isMiaExpanded, setIsMiaExpanded] = useState(false);

  const formattedCityName = useMemo(() => {
    const foundCity =
      cities.find((city) => city.abbr.toLowerCase() === selectedCity.toLowerCase())?.name || selectedCity;
    return foundCity;
  }, [selectedCity]);

  const weekdayLabel = format(selectedDate, "EEE", { locale: de });
  const dateLabel = format(selectedDate, "dd.MM.", { locale: de });
  const timeLabel = timeRange === null ? "Alle" : `ab ${timeRange[0]}h`;

  const navItems = useMemo(() => {
    return [`Tonight in ${formattedCityName}`, ...baseNavItems];
  }, [formattedCityName]);

  const handleMiaToggle = () => {
    const nextState = !isMiaExpanded;
    setIsMiaExpanded(nextState);
    onMIAOpenChange?.(nextState);
    if (nextState) {
      onMIAClick?.();
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    chatInputProps.setInput(suggestion);
    await chatInputProps.handleSendMessage(suggestion);
  };

  const renderSuggestions = () => {
    if (!chatInputProps.globalQueries?.length) return null;

    const suggestions = chatInputProps.globalQueries.slice(0, 4);
    return (
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => handleSuggestionClick(suggestion)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 transition hover:bg-white/10"
          >
            {suggestion}
          </button>
        ))}
      </div>
    );
  };

  return (
    <header className="pointer-events-none fixed left-0 right-0 top-3 z-[1010] px-3 sm:px-6">
      <div className="pointer-events-auto flex flex-col gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onToggleFilterPanel}
            className={cn(
              "flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 text-[11px] font-medium text-white transition hover:bg-white/10",
              showFilterPanel && "bg-white/10 text-white",
            )}
          >
            <Sparkles className="h-3.5 w-3.5 text-white/80" />
            Alle
          </button>

          <div className="flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/75 px-2 py-1.5 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
            <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap">
              {navItems.map((item, index) => (
                <span
                  key={item}
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-medium text-white/70 transition",
                    index === 0 ? "bg-white text-black" : "hover:bg-white/10 hover:text-white",
                  )}
                >
                  {item}
                </span>
              ))}
              <span className="px-1 text-sm text-white/40">
                <ChevronRight className="h-4 w-4" />
              </span>
              <button
                onClick={handleMiaToggle}
                className="relative flex items-center gap-1 rounded-full bg-gradient-to-r from-red-500 to-rose-600 px-3 py-1 text-[11px] font-semibold text-white shadow-lg transition hover:from-red-500/90 hover:to-rose-600/90"
              >
                <Sparkles className="h-3.5 w-3.5" />
                MIA
                {isDailyRecommendationLoading && <Loader2 className="h-3 w-3 animate-spin text-white/80" />}
                {!isDailyRecommendationLoading && hasNewDailyRecommendation && (
                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                )}
              </button>
            </div>
          </div>

          <button
            onClick={onToggleFilterPanel}
            className="flex flex-col items-center rounded-2xl border border-white/15 bg-black/75 px-2 py-1 text-white transition hover:bg-black/60"
          >
            <span className="text-[10px] font-semibold uppercase text-white/60">{weekdayLabel}</span>
            <span className="text-sm font-bold leading-none">{dateLabel}</span>
            <span className="text-[10px] text-white/60">{timeLabel}</span>
          </button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSwipeMode}
            className="hidden h-9 w-9 rounded-2xl border border-white/15 bg-black/70 text-white hover:bg-black/50 sm:flex"
          >
            <Wand2 className="h-4 w-4" />
          </Button>
        </div>

        {isMiaExpanded && (
          <div className="rounded-3xl border border-white/10 bg-black/80 px-3 py-3 shadow-[0_20px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 text-white/70">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/60">MIA</p>
                    <p className="text-[11px] text-white/40">Frag nach Events oder lass dir Ideen geben</p>
                  </div>
                </div>
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    ref={chatInputProps.inputRef}
                    value={chatInputProps.input}
                    onChange={chatInputProps.onChange}
                    onKeyDown={chatInputProps.onKeyDown}
                    placeholder="Frag MIA nach Events..."
                    className="flex-1 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/40"
                  />
                  <Button
                    size="icon"
                    onClick={() => chatInputProps.handleSendMessage()}
                    disabled={chatInputProps.isTyping}
                    className="h-10 w-10 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-500/90 hover:to-rose-600/90"
                  >
                    {chatInputProps.isTyping ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={chatInputProps.handleHeartClick}
                  className={cn(
                    "h-8 rounded-full border border-white/15 px-3 text-xs text-white/70 hover:bg-white/10",
                    chatInputProps.isHeartActive && "bg-white/10 text-white",
                  )}
                >
                  <Heart className="mr-1 h-3.5 w-3.5" />
                  Favoriten
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={chatInputProps.toggleRecentQueries}
                  className="h-8 rounded-full border border-white/15 px-3 text-xs text-white/70 hover:bg-white/10"
                >
                  <History className="mr-1 h-3.5 w-3.5" />
                  Verlauf
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={chatInputProps.onAddEvent}
                  className="h-8 rounded-full border border-white/15 px-3 text-xs text-white/70 hover:bg-white/10"
                >
                  <Sparkles className="mr-1 h-3.5 w-3.5" />
                  Event hinzufügen
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleFilterPanel}
                  className="h-8 rounded-full border border-white/15 px-3 text-xs text-white/70 hover:bg-white/10"
                >
                  <Filter className="mr-1 h-3.5 w-3.5" />
                  Filter
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onOpenSwipeMode}
                  className="h-8 rounded-full border border-white/15 px-3 text-xs text-white/70 hover:bg-white/10"
                >
                  <Wand2 className="mr-1 h-3.5 w-3.5" />
                  Swipe Mode
                </Button>
              </div>

              {chatInputProps.showAnimatedPrompts && renderSuggestions()}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default HeatmapHeader;
