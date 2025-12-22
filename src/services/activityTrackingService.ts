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
    return localStorage.getItem(USERNAME_KEY) || 'anonymous';
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

  private handleClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target) return;

    // Get meaningful target info
    const targetInfo = this.getTargetInfo(target);
    
    this.trackClick(targetInfo.name, {
      tagName: target.tagName,
      className: target.className,
      id: target.id,
      text: targetInfo.text,
      href: (target as HTMLAnchorElement).href || null
    });
  }

  private getTargetInfo(el: HTMLElement): { name: string; text: string } {
    // Try to get a meaningful name for the clicked element
    const ariaLabel = el.getAttribute('aria-label');
    const dataAction = el.getAttribute('data-action');
    const buttonText = el.textContent?.trim().slice(0, 50);
    const id = el.id;
    const className = el.className?.toString().split(' ')[0];

    const name = ariaLabel || dataAction || id || className || el.tagName.toLowerCase();
    const text = buttonText || '';

    return { name, text };
  }

  stopTracking(): void {
    this.isTracking = false;
    this.flushEvents();
  }
}

export const activityTracker = new ActivityTrackingService();
