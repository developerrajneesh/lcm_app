# FCM Push Notifications Setup Guide

## Important: FCM Requires a Development Build

FCM (Firebase Cloud Messaging) **does NOT work with Expo Go**. You must build a development build using EAS Build.

## Error: "FirebaseApp is not initialized"

If you see this error, it means you're running the app in Expo Go. FCM requires a development build.

## Setup Steps

### 1. Prerequisites

- ✅ `google-services.json` is in the root directory (already configured)
- ✅ `expo-dev-client` is installed (already in package.json)
- ✅ `expo-notifications` is installed (already in package.json)
- ✅ EAS project ID is configured in `app.json`

### 2. Configure FCM Credentials in EAS

1. Go to [Expo Dashboard](https://expo.dev)
2. Select your project: `Lcm` (project ID: `e00bfff7-486a-4c24-91af-3526a83915d1`)
3. Navigate to **Credentials** → **Android** → **FCM Server Key**
4. Upload your FCM Server Key from Firebase Console:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select project: `lcmmain`
   - Go to **Project Settings** → **Cloud Messaging**
   - Copy the **Server Key**
   - Paste it in Expo Dashboard

### 3. Build Development Build

```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo
eas login

# Build development build for Android
eas build --profile development --platform android

# Or build for iOS
eas build --profile development --platform ios
```

### 4. Install Development Build

After the build completes:
- Download the APK/IPA from Expo Dashboard
- Install on your physical device (not emulator/simulator)
- FCM tokens will now work!

### 5. Alternative: Local Development Build

If you want to build locally:

```bash
# Build locally (requires Android Studio / Xcode)
eas build --profile development --platform android --local
```

## Testing FCM

1. **Start the app** (development build, not Expo Go)
2. **Check console logs** for:
   - `✅ [FCM] Permissions granted!`
   - `✅ [FCM] Token retrieved: ...`
   - `✅ [FCM] Token registered successfully with backend!`
3. **Send test notification** from admin dashboard:
   - Go to `/admin/push-notifications`
   - Select "All Users" or specific user
   - Enter title and message
   - Click "Send Notification"

## Troubleshooting

### Error: "FirebaseApp is not initialized"
- **Solution**: Build a development build. FCM doesn't work in Expo Go.

### Error: "Project ID not found"
- **Solution**: Check `app.json` has `extra.eas.projectId` configured.

### Error: "Must use physical device"
- **Solution**: FCM doesn't work in emulators/simulators. Use a physical device.

### Token not registering
- **Solution**: 
  1. Check backend is running
  2. Check API_BASE_URL in `config/api.js`
  3. Check network connectivity
  4. Check backend logs for errors

## Current Configuration

- ✅ `google-services.json` configured
- ✅ `expo-dev-client` plugin added
- ✅ `expo-notifications` plugin configured
- ✅ Android permissions added
- ✅ iOS background modes configured
- ✅ EAS project ID: `e00bfff7-486a-4c24-91af-3526a83915d1`

## Next Steps

1. **Configure FCM credentials in EAS Dashboard** (see step 2 above)
2. **Build development build**: `eas build --profile development --platform android`
3. **Install on physical device**
4. **Test FCM token registration**

## Resources

- [Expo FCM Setup Guide](https://docs.expo.dev/push-notifications/fcm-credentials/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)

