// src/components/admin/ElementPreview.tsx
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, Send, Plus, Menu, Search, Settings, 
  User, Home, Calendar, MessageSquare, X, Check,
  ChevronLeft, ChevronRight, ArrowUp, ArrowDown,
  Star, ThumbsUp, Share, Filter, RefreshCw, Eye
} from 'lucide-react';

interface ElementPreviewProps {
  target: string;
  className?: string;
}

// Map common button/element names to icons and styles
const elementMappings: Record<string, { icon: React.ReactNode; label: string; variant: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' }> = {
  // Like buttons
  'like': { icon: <Heart className="w-3 h-3" />, label: 'Like', variant: 'outline' },
  'heart': { icon: <Heart className="w-3 h-3 fill-red-500 text-red-500" />, label: 'Like', variant: 'outline' },
  'favorite': { icon: <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />, label: 'Favorit', variant: 'outline' },
  
  // Action buttons
  'send': { icon: <Send className="w-3 h-3" />, label: 'Senden', variant: 'default' },
  'submit': { icon: <Check className="w-3 h-3" />, label: 'Absenden', variant: 'default' },
  'save': { icon: <Check className="w-3 h-3" />, label: 'Speichern', variant: 'default' },
  'add': { icon: <Plus className="w-3 h-3" />, label: 'Hinzufügen', variant: 'default' },
  'create': { icon: <Plus className="w-3 h-3" />, label: 'Erstellen', variant: 'default' },
  
  // Navigation
  'menu': { icon: <Menu className="w-3 h-3" />, label: 'Menü', variant: 'ghost' },
  'home': { icon: <Home className="w-3 h-3" />, label: 'Home', variant: 'ghost' },
  'back': { icon: <ChevronLeft className="w-3 h-3" />, label: 'Zurück', variant: 'ghost' },
  'next': { icon: <ChevronRight className="w-3 h-3" />, label: 'Weiter', variant: 'default' },
  'close': { icon: <X className="w-3 h-3" />, label: 'Schließen', variant: 'ghost' },
  
  // Search & Filter
  'search': { icon: <Search className="w-3 h-3" />, label: 'Suche', variant: 'outline' },
  'filter': { icon: <Filter className="w-3 h-3" />, label: 'Filter', variant: 'outline' },
  
  // User actions
  'profile': { icon: <User className="w-3 h-3" />, label: 'Profil', variant: 'ghost' },
  'settings': { icon: <Settings className="w-3 h-3" />, label: 'Settings', variant: 'ghost' },
  'user': { icon: <User className="w-3 h-3" />, label: 'User', variant: 'ghost' },
  
  // Content actions
  'calendar': { icon: <Calendar className="w-3 h-3" />, label: 'Kalender', variant: 'outline' },
  'chat': { icon: <MessageSquare className="w-3 h-3" />, label: 'Chat', variant: 'outline' },
  'message': { icon: <MessageSquare className="w-3 h-3" />, label: 'Nachricht', variant: 'outline' },
  'share': { icon: <Share className="w-3 h-3" />, label: 'Teilen', variant: 'outline' },
  'refresh': { icon: <RefreshCw className="w-3 h-3" />, label: 'Aktualisieren', variant: 'ghost' },
  'view': { icon: <Eye className="w-3 h-3" />, label: 'Ansehen', variant: 'outline' },
  
  // Voting
  'upvote': { icon: <ArrowUp className="w-3 h-3" />, label: 'Upvote', variant: 'outline' },
  'downvote': { icon: <ArrowDown className="w-3 h-3" />, label: 'Downvote', variant: 'outline' },
  'thumbsup': { icon: <ThumbsUp className="w-3 h-3" />, label: 'Gefällt', variant: 'outline' },
};

export function ElementPreview({ target, className = '' }: ElementPreviewProps) {
  if (!target) return null;

  const lowerTarget = target.toLowerCase();
  
  // Find matching element
  for (const [key, config] of Object.entries(elementMappings)) {
    if (lowerTarget.includes(key)) {
      return (
        <Button 
          variant={config.variant} 
          size="sm" 
          className={`h-6 px-2 text-xs pointer-events-none ${className}`}
        >
          {config.icon}
          <span className="ml-1">{config.label}</span>
        </Button>
      );
    }
  }

  // Check for common HTML elements
  if (lowerTarget.includes('button')) {
    return (
      <Button variant="secondary" size="sm" className={`h-6 px-2 text-xs pointer-events-none ${className}`}>
        Button
      </Button>
    );
  }

  if (lowerTarget.includes('link') || lowerTarget.includes('href')) {
    return (
      <Badge variant="outline" className={`text-xs text-blue-500 underline ${className}`}>
        Link
      </Badge>
    );
  }

  if (lowerTarget.includes('input') || lowerTarget.includes('text')) {
    return (
      <div className={`h-6 px-2 border rounded text-xs flex items-center bg-muted/50 ${className}`}>
        <span className="text-muted-foreground">Eingabefeld</span>
      </div>
    );
  }

  if (lowerTarget.includes('card') || lowerTarget.includes('event')) {
    return (
      <div className={`h-6 px-2 border rounded-md text-xs flex items-center bg-card shadow-sm ${className}`}>
        <Calendar className="w-3 h-3 mr-1" />
        <span>Event Card</span>
      </div>
    );
  }

  if (lowerTarget.includes('tab')) {
    return (
      <Badge variant="secondary" className={`text-xs ${className}`}>
        Tab
      </Badge>
    );
  }

  if (lowerTarget.includes('chip') || lowerTarget.includes('badge')) {
    return (
      <Badge className={`text-xs ${className}`}>
        Chip
      </Badge>
    );
  }

  // Fallback: show truncated target text
  return (
    <Badge variant="outline" className={`text-xs max-w-[120px] truncate ${className}`}>
      {target.length > 20 ? target.slice(0, 20) + '...' : target}
    </Badge>
  );
}
