import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { X, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnboardingLogic } from '@/hooks/chat/useOnboardingLogic';

interface OnboardingDialogProps {
  onClose: () => void;
  onComplete?: (action: 'community_chat' | 'event_heatmap') => void;
  setSelectedCity?: (city: string) => void;
}

const OnboardingDialog: React.FC<OnboardingDialogProps> = ({ onClose, onComplete, setSelectedCity }) => {
  const onboardingLogic = useOnboardingLogic(
    (action) => {
      onComplete?.(action);
      onClose();
    },
    setSelectedCity
  );

  return (
    <div className="fixed top-20 right-4 left-4 md:left-auto md:w-[520px] z-[1100] animate-fade-in">
      <Card className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/70 backdrop-blur-xl shadow-[0_20px_80px_rgba(239,68,68,0.25)]">
        {/* Gradient ring */}
        <div
          className="pointer-events-none absolute inset-0 rounded-3xl"
          style={{
            background:
              "radial-gradient(120% 60% at 100% 0%, rgba(239,68,68,0.35) 0%, rgba(239,68,68,0.05) 30%, transparent 60%)",
          }}
        />
        
        {/* Header */}
        <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-0.5 rounded-full bg-red-500/30 blur-md" />
              <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center ring-2 ring-white/10">
                <Avatar className="w-9 h-9">
                  <AvatarImage src={onboardingLogic.chatbotAvatar} />
                  <AvatarFallback className="bg-transparent">
                    <span className="text-white text-xs">M</span>
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div>
              <div className="text-white font-semibold leading-tight">MIA</div>
              <div className="text-[11px] text-white/50">Willkommen bei THE TRIBE!</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9 rounded-full text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="relative max-h-[66vh] overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin scrollbar-thumb-white/20">
          {/* Onboarding Messages */}
          {onboardingLogic.messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3 animate-fade-in",
                msg.isBot ? "justify-start" : "justify-end"
              )}
            >
              {msg.isBot && (
                <Avatar className="w-8 h-8 shrink-0 ring-2 ring-white/10">
                  <AvatarImage src={onboardingLogic.chatbotAvatar} />
                  <AvatarFallback className="bg-gradient-to-br from-red-500 to-rose-600 text-white text-xs">
                    MIA
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5",
                  msg.isBot
                    ? "bg-white/10 text-white border border-white/10"
                    : "bg-gradient-to-r from-red-600 to-red-700 text-white"
                )}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                {msg.hasButtons && msg.buttons && msg.buttons.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {msg.buttons.map((btn, idx) => (
                      <Button
                        key={idx}
                        size="sm"
                        variant={btn.variant || 'outline'}
                        onClick={btn.action}
                        className={cn(
                          "rounded-full text-xs",
                          btn.variant === 'default'
                            ? "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white border-0"
                            : "bg-white/5 text-white border-white/20 hover:bg-white/10 hover:border-white/30",
                          onboardingLogic.userData.interests.includes(btn.text.split(' ')[1]) && "ring-2 ring-red-500"
                        )}
                      >
                        {btn.text}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* City suggestions dropdown */}
          {onboardingLogic.currentStep === 'city' && onboardingLogic.filteredCities.length > 0 && onboardingLogic.citySearch && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-2 space-y-1">
              {onboardingLogic.filteredCities.map((city) => (
                <button
                  key={city.abbr}
                  onClick={() => onboardingLogic.selectCity(city.name)}
                  className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  {city.name}
                </button>
              ))}
            </div>
          )}

          {/* Typing Indicator */}
          {onboardingLogic.isTyping && (
            <div className="flex gap-3 animate-fade-in">
              <Avatar className="w-8 h-8 shrink-0 ring-2 ring-white/10">
                <AvatarImage src={onboardingLogic.chatbotAvatar} />
                <AvatarFallback className="bg-gradient-to-br from-red-500 to-rose-600 text-white text-xs">
                  MIA
                </AvatarFallback>
              </Avatar>
              <div className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={onboardingLogic.messagesEndRef} />
        </div>

        {/* Input */}
        <div className="relative border-t border-white/10 p-3 bg-black/60 backdrop-blur-xl">
          <div className="flex gap-2">
            <Input
              value={
                onboardingLogic.currentStep === 'city'
                  ? onboardingLogic.citySearch
                  : onboardingLogic.inputMessage
              }
              onChange={(e) => {
                if (onboardingLogic.currentStep === 'city') {
                  onboardingLogic.setCitySearch(e.target.value);
                } else {
                  onboardingLogic.setInputMessage(e.target.value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onboardingLogic.handleSendMessage();
                }
              }}
              placeholder={
                onboardingLogic.currentStep === 'name'
                  ? 'Dein Name...'
                  : onboardingLogic.currentStep === 'city'
                  ? 'Stadt eingeben...'
                  : 'Nachricht eingeben...'
              }
              className="flex-1 bg-white/5 border-white/15 text-white placeholder:text-white/50 rounded-xl"
              disabled={onboardingLogic.currentStep === 'interests' || onboardingLogic.currentStep === 'avatar' || onboardingLogic.currentStep === 'notifications'}
            />
            <input
              type="file"
              ref={onboardingLogic.fileInputRef}
              onChange={onboardingLogic.handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            {(onboardingLogic.currentStep === 'name' || onboardingLogic.currentStep === 'city') && (
              <Button
                size="icon"
                onClick={onboardingLogic.handleSendMessage}
                className="rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OnboardingDialog;
