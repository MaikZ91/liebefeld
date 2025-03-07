
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.1560d05ebee8486fa5f84767a1bcbcde',
  appName: 'liebefeld',
  webDir: 'dist',
  server: {
    url: 'https://1560d05e-bee8-486f-a5f8-4767a1bcbcde.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: null,
      keystoreAlias: null
    }
  }
};

export default config;
