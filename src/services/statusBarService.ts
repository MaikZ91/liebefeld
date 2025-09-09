import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export class StatusBarService {
  static async initialize() {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      // Make status bar transparent
      await StatusBar.setOverlaysWebView({ overlay: true });
      
      // Set status bar style to light content (white icons)
      await StatusBar.setStyle({ style: Style.Light });
      
      // Make status bar background transparent
      await StatusBar.setBackgroundColor({ color: '#00000000' });
      
    } catch (error) {
      console.error('Error configuring status bar:', error);
    }
  }

  static async setTransparent() {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await StatusBar.setOverlaysWebView({ overlay: true });
      await StatusBar.setBackgroundColor({ color: '#00000000' });
    } catch (error) {
      console.error('Error setting transparent status bar:', error);
    }
  }

  static async setDark() {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await StatusBar.setStyle({ style: Style.Dark });
    } catch (error) {
      console.error('Error setting dark status bar:', error);
    }
  }

  static async setLight() {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await StatusBar.setStyle({ style: Style.Light });
    } catch (error) {
      console.error('Error setting light status bar:', error);
    }
  }
}