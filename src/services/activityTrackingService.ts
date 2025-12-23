// src/services/activityTrackingService.ts
import { supabase } from '@/integrations/supabase/client';
import { USERNAME_KEY } from '@/types/chatTypes';
import type { Json } from '@/integrations/supabase/types';

interface ActivityEvent {
  event_type: 'click' | 'scroll' | 'page_view' | 'page_leave' | 'interaction';
  event_target?: string;
  event_data?: Record<string, unknown>;
  page_path: string;
  scroll_depth?: number;
  time_on_page?: number;
}

interface ActivityLogEntry {
  username: string;
  session_id: string;
  event_type: string;
  event_target: string | null;
  event_data: Json;
  page_path: string;
  scroll_depth: number | null;
  time_on_page: number | null;
  viewport_width: number;
  viewport_height: number;
}

class ActivityTrackingService {
  private sessionId: string;
  private pageStartTime: number = Date.now();
  private currentPath: string = '';
  private maxScrollDepth: number = 0;
  private eventQueue: ActivityEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isTracking: boolean = false;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('activity_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('activity_session_id', sessionId);
    }
    return sessionId;
  }

  private getUsername(): string {
    // Priority 1: Chat username (from community chat)
    const chatUsername = localStorage.getItem(USERNAME_KEY);
    if (chatUsername) {
      return chatUsername;
    }
    
    // Priority 2: Tribe user profile (contains Guest_xxx)
    const tribeProfile = localStorage.getItem('tribe_user_profile');
    if (tribeProfile) {
      try {
        const profile = JSON.parse(tribeProfile);
        if (profile.username) {
          return profile.username;
        }
      } catch {
        // Invalid JSON, continue
      }
    }
    
    // Priority 3: Chat username from tribe
    const tribeUsername = localStorage.getItem('chat_username');
    if (tribeUsername) {
      return tribeUsername;
    }
    
    // Fallback: anonymous (should rarely happen)
    return 'anonymous';
  }

  private getViewportSize() {
    return {
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight
    };
  }

  private createLogEntry(event: ActivityEvent): ActivityLogEntry {
    const username = this.getUsername();
    const viewport = this.getViewportSize();

    return {
      username,
      session_id: this.sessionId,
      event_type: event.event_type,
      event_target: event.event_target || null,
      event_data: (event.event_data || {}) as Json,
      page_path: event.page_path,
      scroll_depth: event.scroll_depth ?? null,
      time_on_page: event.time_on_page ?? null,
      ...viewport
    };
  }

  private isAdminPage(): boolean {
    return this.currentPath.includes('/admin') || window.location.pathname.includes('/admin');
  }

  async logEvent(event: ActivityEvent): Promise<void> {
    // Skip tracking on admin pages entirely
    if (this.isAdminPage()) return;

    const logEntry = this.createLogEntry(event);

    // Queue events for batch insert
    this.eventQueue.push(event);
    
    // Debounce flush
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }
    this.flushTimer = setTimeout(() => this.flushEvents(), 2000);

    // Immediate insert for important events
    if (event.event_type === 'page_view' || event.event_type === 'page_leave') {
      try {
        await supabase.from('user_activity_logs').insert(logEntry);
      } catch (error) {
        console.error('Error logging activity:', error);
      }
    }
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = this.eventQueue.map(event => this.createLogEntry(event));
    this.eventQueue = [];

    try {
      await supabase.from('user_activity_logs').insert(events);
    } catch (error) {
      console.error('Error flushing activity events:', error);
    }
  }

  // Track page view
  trackPageView(path: string): void {
    this.currentPath = path;
    this.pageStartTime = Date.now();
    this.maxScrollDepth = 0;

    this.logEvent({
      event_type: 'page_view',
      page_path: path,
      event_data: {
        referrer: document.referrer,
        userAgent: navigator.userAgent
      }
    });
  }

  // Track page leave with time on page
  trackPageLeave(): void {
    const timeOnPage = Math.round((Date.now() - this.pageStartTime) / 1000);

    this.logEvent({
      event_type: 'page_leave',
      page_path: this.currentPath,
      time_on_page: timeOnPage,
      scroll_depth: this.maxScrollDepth
    });
  }

  // Track clicks
  trackClick(target: string, data?: Record<string, unknown>): void {
    this.logEvent({
      event_type: 'click',
      event_target: target,
      event_data: data,
      page_path: this.currentPath
    });
  }

  // Track scroll depth
  trackScroll(): void {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollTop = window.scrollY;
    const depth = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;

    if (depth > this.maxScrollDepth) {
      this.maxScrollDepth = depth;

      // Log at 25%, 50%, 75%, 100% milestones
      if ([25, 50, 75, 100].includes(depth)) {
        this.logEvent({
          event_type: 'scroll',
          page_path: this.currentPath,
          scroll_depth: depth
        });
      }
    }
  }

  // Track interactions (form inputs, toggles, etc.)
  trackInteraction(action: string, data?: Record<string, unknown>): void {
    this.logEvent({
      event_type: 'interaction',
      event_target: action,
      event_data: data,
      page_path: this.currentPath
    });
  }

  // Start global tracking listeners
  startTracking(): void {
    if (this.isTracking) return;
    this.isTracking = true;

    // Click tracking
    document.addEventListener('click', this.handleClick.bind(this), { capture: true });

    // Input tracking (for text fields, search, etc.)
    document.addEventListener('focusout', this.handleInputBlur.bind(this), { capture: true });

    // Scroll tracking (debounced)
    let scrollTimeout: NodeJS.Timeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => this.trackScroll(), 150);
    }, { passive: true });

    // Page leave tracking
    window.addEventListener('beforeunload', () => this.trackPageLeave());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.trackPageLeave();
      }
    });

    console.log('Activity tracking started');
  }

  private handleInputBlur(e: FocusEvent): void {
    const target = e.target as HTMLElement;
    if (!target) return;

    // Only track input and textarea elements
    const tagName = target.tagName.toLowerCase();
    if (tagName !== 'input' && tagName !== 'textarea') return;

    const inputElement = target as HTMLInputElement | HTMLTextAreaElement;
    const value = inputElement.value?.trim();
    
    // Only track if there's actual content
    if (!value || value.length < 2) return;

    // Get field identifier
    const fieldName = inputElement.getAttribute('aria-label') 
      || inputElement.getAttribute('placeholder')
      || inputElement.getAttribute('name')
      || inputElement.getAttribute('id')
      || 'Textfeld';

    this.trackInteraction(`Eingabe: ${fieldName}`, {
      value: value.slice(0, 100), // Limit to 100 chars
      fieldType: inputElement.type || 'text'
    });
  }

  private handleClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target) return;

    // Get meaningful target info
    const targetInfo = this.getTargetInfo(target);
    
    // Only track if we have meaningful, readable text
    if (targetInfo.name && this.isMeaningfulText(targetInfo.name)) {
      this.trackClick(targetInfo.name, {
        text: targetInfo.text
      });
    }
  }

  private isJustCssClass(name: string): boolean {
    const cleaned = name.trim().toLowerCase();
    
    // Must be at least 2 characters and contain at least one letter
    if (cleaned.length < 2 || !/[a-zäöü]/i.test(cleaned)) {
      return true;
    }
    
    // Filter out CSS/Tailwind class patterns
    const cssPatterns = [
      /^[a-z]{1,2}-\d+$/,        // p-1, w-7, m-4, h-6
      /^-?[a-z]{1,4}-\d+$/,      // -mt-2, gap-4
      /^[a-z]+-\[.+\]$/,         // w-[100px]
      /^(flex|grid|block|inline|relative|absolute|fixed|sticky|static)$/i,
      /^(hidden|visible|overflow|cursor|pointer|select|resize)$/i,
      /^(text|bg|border|rounded|shadow|opacity|ring|outline)-/i,
      /^(hover|focus|active|disabled|group|peer)[:_-]/i,
      /^(min|max)-(w|h)-/i,
      /^(space|gap|p|m|px|py|mx|my|pl|pr|pt|pb|ml|mr|mt|mb)-/i,
      /^(w|h|top|left|right|bottom|inset)-/i,
      /^(font|leading|tracking|truncate|whitespace|break)-/i,
      /^(items|justify|self|content|place)-/i,
      /^(col|row|order|z|duration|ease|transition|transform|rotate|scale|translate)-/i,
      /^\[object/i,              // [object Object] etc.
      /^radix-/i,                // radix-r0 etc.
      /^:r\d+:/,                 // :r1: etc.
      /^lucide-/i,               // lucide icons
      /^svg$/i,
      /^path$/i,
      /^(div|span|section|article|aside|nav|header|footer|main|ul|ol|li)$/i,
    ];
    
    return cssPatterns.some(pattern => pattern.test(cleaned));
  }

  private isMeaningfulText(text: string): boolean {
    const cleaned = text.trim();
    
    // Must be at least 2 characters
    if (cleaned.length < 2) return false;
    
    // Must contain at least one word character (letter)
    if (!/[a-zA-ZäöüßÄÖÜ]/.test(cleaned)) return false;
    
    // Should not look like a CSS class (single word with dashes and numbers)
    if (/^[a-z]+-\d+$/i.test(cleaned)) return false;
    if (/^[a-z]-[a-z]+$/i.test(cleaned)) return false;
    
    // Check if it's a known CSS utility
    if (this.isJustCssClass(cleaned)) return false;
    
    return true;
  }

  private getTargetInfo(el: HTMLElement): { name: string; text: string } {
    // Walk up the DOM to find the closest interactive element with meaningful text
    let currentEl: HTMLElement | null = el;
    
    for (let i = 0; i < 5 && currentEl; i++) {
      const info = this.extractElementInfo(currentEl);
      if (info.name && !this.isJustCssClass(info.name)) {
        return info;
      }
      currentEl = currentEl.parentElement;
    }

    // Last resort: describe what type of element was clicked
    const tagName = el.tagName.toLowerCase();
    const role = el.getAttribute('role');
    
    if (role === 'button' || tagName === 'button') {
      return { name: 'Button (ohne Text)', text: '' };
    } else if (tagName === 'a') {
      return { name: 'Link', text: '' };
    } else if (tagName === 'input') {
      const inputType = el.getAttribute('type') || 'text';
      return { name: `Eingabefeld (${inputType})`, text: '' };
    } else if (tagName === 'img') {
      return { name: 'Bild', text: '' };
    }
    
    return { name: '', text: '' };
  }

  private extractElementInfo(el: HTMLElement): { name: string; text: string } {
    // Priority 1: aria-label (most reliable)
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel && ariaLabel.length > 1) {
      return { name: ariaLabel, text: ariaLabel };
    }
    
    // Priority 2: title attribute
    const title = el.getAttribute('title');
    if (title && title.length > 1) {
      return { name: title, text: title };
    }
    
    // Priority 3: data-action
    const dataAction = el.getAttribute('data-action');
    if (dataAction && dataAction.length > 1) {
      return { name: dataAction, text: dataAction };
    }
    
    // Priority 4: Text content (cleaned)
    const textContent = this.getCleanTextContent(el);
    if (textContent && textContent.length > 1) {
      return { name: textContent, text: textContent };
    }
    
    // Priority 5: alt text for images
    if (el.tagName.toLowerCase() === 'img') {
      const alt = el.getAttribute('alt');
      if (alt && alt.length > 1) {
        return { name: alt, text: alt };
      }
    }
    
    return { name: '', text: '' };
  }

  private getCleanTextContent(el: HTMLElement): string {
    try {
      const clone = el.cloneNode(true) as HTMLElement;
      // Remove non-text elements
      clone.querySelectorAll('svg, script, style, img, video, audio, canvas, iframe').forEach(e => e.remove());
      
      const text = clone.textContent?.trim() || '';
      // Return first 50 chars, clean up whitespace
      return text.replace(/\s+/g, ' ').slice(0, 50);
    } catch {
      return '';
    }
  }

  stopTracking(): void {
    this.isTracking = false;
    this.flushEvents();
  }
}

export const activityTracker = new ActivityTrackingService();
