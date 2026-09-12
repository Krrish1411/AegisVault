import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.aegisvault.app',
  appName: 'AegisVault',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
