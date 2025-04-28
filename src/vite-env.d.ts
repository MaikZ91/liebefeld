
/// <reference types="vite/client" />

// Centralize window interface declaration for the entire application
interface Window {
  triggerAddEvent?: () => void;
  chatbotQuery?: (query: string) => void;
}
