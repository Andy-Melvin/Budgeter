import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.budgeter.app',
  appName: 'Budgeter',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  ios: {
    scheme: 'Budgeter'
  }
};

export default config;
