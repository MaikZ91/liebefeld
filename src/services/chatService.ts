
import { messageService } from './messageService';
import { reactionService } from './reactionService';
import { subscriptionService } from './subscriptionService';
import { typingService } from './typingService';
import { Message, TypingUser } from '@/types/chatTypes';

/**
 * Central service that exports all chat-related functionality.
 * This is a facade that provides access to the specialized services.
 */
export const chatService = {
  // Message operations
  enableRealtime: messageService.enableRealtime,
  fetchMessages: messageService.fetchMessages,
  markMessagesAsRead: messageService.markMessagesAsRead,
  sendMessage: messageService.sendMessage,
  
  // Reaction operations
  toggleReaction: reactionService.toggleReaction,
  
  // Typing indicator operations
  sendTypingStatus: typingService.sendTypingStatus,
  createTypingSubscription: typingService.createTypingSubscription,
  
  // Subscription operations
  createMessageSubscription: subscriptionService.createMessageSubscription
};
