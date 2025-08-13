import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';

// Extend Window interface for Capacitor
declare global {
  interface Window {
    Capacitor?: {
      isNative: boolean;
      getPlatform: () => string;
    };
  }
}

export const initializeMobileApp = async () => {
  try {
    // Set status bar style
    await StatusBar.setStyle({ style: Style.Dark });
    
    // Set status bar background color
    await StatusBar.setBackgroundColor({ color: '#000000' });
    
    // Handle app state changes
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Is active?', isActive);
    });

    // Handle app URL open
    App.addListener('appUrlOpen', (data) => {
      console.log('App opened with URL:', data.url);
    });

    // Handle back button (Android)
    App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        App.exitApp();
      } else {
        window.history.back();
      }
    });

    // Configure keyboard behavior
    Keyboard.addListener('keyboardWillShow', (info) => {
      console.log('Keyboard will show with height:', info.keyboardHeight);
    });

    Keyboard.addListener('keyboardWillHide', () => {
      console.log('Keyboard will hide');
    });

    console.log('Mobile app initialized successfully');
  } catch (error) {
    console.log('Mobile app initialization failed (probably running in browser):', error);
  }
};

export const isNativePlatform = () => {
  return window.Capacitor?.isNative || false;
};

export const getPlatform = () => {
  return window.Capacitor?.getPlatform() || 'web';
}; 