import { useEffect } from 'react';
import { StatusBarService } from '../services/statusBarService';

export const useStatusBar = () => {
  useEffect(() => {
    // Initialize status bar after React has mounted
    const initializeStatusBar = async () => {
      await StatusBarService.initialize();
    };

    initializeStatusBar().catch(console.error);
  }, []);

  return {
    setTransparent: StatusBarService.setTransparent,
    setDark: StatusBarService.setDark,
    setLight: StatusBarService.setLight,
  };
};