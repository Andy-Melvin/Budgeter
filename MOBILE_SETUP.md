# Mobile App Setup Guide

Your Budgeter app is now configured for mobile deployment! Here's how to complete the setup and get it running on your iPhone.

## Prerequisites

### 1. Install Xcode
- Download Xcode from the Mac App Store
- This is required for iOS development
- Make sure to install the iOS Simulator as well

### 2. Install CocoaPods
```bash
sudo gem install cocoapods
```

### 3. Install Xcode Command Line Tools
```bash
xcode-select --install
```

## Setup Steps

### 1. Complete iOS Setup
After installing the prerequisites, run:
```bash
npx cap sync ios
```

### 2. Open in Xcode
```bash
npx cap open ios
```

### 3. Configure Your App
In Xcode:
1. Select the "App" project in the navigator
2. Click on "App" under TARGETS
3. In the "General" tab:
   - Update "Display Name" to "Budgeter"
   - Update "Bundle Identifier" to "com.budgeter.app" (or your preferred domain)
   - Set "Version" and "Build" numbers

### 4. Configure Signing
1. In Xcode, go to "Signing & Capabilities"
2. Select your Apple Developer Team
3. If you don't have one, you can use "Personal Team" for testing on your device

### 5. Build and Run
1. Select your iPhone as the target device
2. Click the "Play" button to build and install on your device
3. You may need to trust the developer in Settings > General > VPN & Device Management

## Development Workflow

### Making Changes
1. Make changes to your React code
2. Build the app: `npm run build`
3. Sync changes: `npx cap sync ios`
4. Open in Xcode: `npx cap open ios`
5. Build and run on device

### Quick Development Commands
```bash
# Build and sync
npm run build && npx cap sync ios

# Open in Xcode
npx cap open ios

# Live reload (optional - for faster development)
npx cap run ios --livereload --external
```

## Alternative: Progressive Web App (PWA)

If you prefer a simpler approach, you can also make your app installable as a PWA:

### 1. Add PWA Support
```bash
npm install vite-plugin-pwa
```

### 2. Configure PWA
Update your `vite.config.ts` to include PWA configuration.

### 3. Install on iPhone
- Open your app in Safari
- Tap the Share button
- Select "Add to Home Screen"

## Troubleshooting

### Common Issues

1. **Xcode not found**: Make sure Xcode is installed and you've run `xcode-select --install`

2. **CocoaPods not found**: Install with `sudo gem install cocoapods`

3. **Signing issues**: 
   - Use "Personal Team" for testing
   - Make sure your Apple ID is added to Xcode

4. **Device not showing**: 
   - Connect your iPhone via USB
   - Trust the computer on your iPhone
   - Make sure your device is unlocked

### Getting Help
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Development Guide](https://developer.apple.com/develop/)
- [Xcode Documentation](https://developer.apple.com/xcode/)

## Next Steps

Once your app is running on your iPhone:

1. **Test all features** - Make sure your Supabase backend works correctly
2. **Optimize for mobile** - Consider adding mobile-specific UI improvements
3. **Add native features** - Consider adding push notifications, biometric auth, etc.
4. **Publish to App Store** - If you want to distribute it publicly

## Security Notes

- Your app uses Supabase for backend services
- Make sure your environment variables are properly configured
- Consider adding additional security measures for mobile deployment 