import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { registerFCMToken, unregisterFCMToken, checkFCMTokenExists, updateFCMTokenUserId } from '../services/fcmApi';

// Configure notification handler for Android and iOS
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Platform-specific handling
    if (Platform.OS === 'android') {
      // Android: Show alert, play sound, set badge
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      };
    } else if (Platform.OS === 'ios') {
      // iOS: Show alert, play sound, set badge
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      };
    }
    
    // Default for other platforms
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

/**
 * Hook to manage FCM token registration
 * @param {Object} options - Configuration options
 * @param {string|null} options.userId - User ID (optional, can be null)
 * @param {boolean} options.autoRegister - Auto-register token on mount (default: true)
 * @returns {Object} { token, isLoading, error, registerToken, unregisterToken }
 */
export function useFCMToken({ userId, autoRegister = true }) {
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get platform
  const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

  /**
   * Request notification permissions (Android & iOS)
   */
  const requestPermissions = async () => {
    try {
      console.log('🔔 [FCM] Checking device type...');
      if (!Device.isDevice) {
        console.warn('⚠️ [FCM] Not a physical device - using simulator/emulator');
        setError('Must use physical device for Push Notifications');
        return false;
      }

      console.log('🔔 [FCM] Platform:', Platform.OS);
      console.log('🔔 [FCM] Requesting notification permissions...');
      
      // Get current permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      console.log('🔔 [FCM] Current permission status:', existingStatus);

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        console.log('🔔 [FCM] Requesting new permissions...');
        
        // Platform-specific permission request
        if (Platform.OS === 'android') {
          // Android: Request all permissions
          const { status } = await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
              allowAnnouncements: false,
            },
            android: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
            },
          });
          finalStatus = status;
        } else if (Platform.OS === 'ios') {
          // iOS: Request with specific options
          const { status } = await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
              allowAnnouncements: false,
            },
          });
          finalStatus = status;
        } else {
          // Other platforms
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        console.log('🔔 [FCM] New permission status:', finalStatus);
      }

      if (finalStatus !== 'granted') {
        console.error('❌ [FCM] Permission denied!');
        setError('Failed to get push token for push notification! Please enable notifications in device settings.');
        return false;
      }

      console.log('✅ [FCM] Permissions granted!');
      
      // Configure Android notification channel (if Android)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });
        
        // Create additional channels for different notification types
        await Notifications.setNotificationChannelAsync('high-priority', {
          name: 'High Priority',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });

        await Notifications.setNotificationChannelAsync('low-priority', {
          name: 'Low Priority',
          importance: Notifications.AndroidImportance.LOW,
          vibrationPattern: [0, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
          enableVibrate: false,
          showBadge: false,
        });
        
        console.log('✅ [FCM] Android notification channels configured');
      }

      return true;
    } catch (error) {
      console.error('❌ [FCM] Error requesting permissions:', error);
      setError('Error requesting notification permissions');
      return false;
    }
  };

  /**
   * Get FCM token
   */
  const getToken = async () => {
    try {
      console.log('🔑 [FCM] Starting token retrieval...');
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        console.error('❌ [FCM] No permission - cannot get token');
        return null;
      }

      // Get project ID from expo-constants or app.json
      console.log('🔑 [FCM] Getting project ID from config...');
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.expoConfig?.extra?.projectId;
      console.log('🔑 [FCM] Project ID:', projectId);

      if (!projectId) {
        console.error('❌ [FCM] Project ID not found in config!');
        throw new Error('Project ID not found. Please configure it in app.json');
      }

      // Check if running in Expo Go (which doesn't support FCM)
      const isExpoGo = Constants.executionEnvironment === 'storeClient';
      if (isExpoGo) {
        console.warn('⚠️ [FCM] Running in Expo Go - FCM requires a development build');
        setError('FCM requires a development build. Please build with: eas build --profile development --platform android');
        return null;
      }

      const tokenResponse = await Notifications.getDevicePushTokenAsync();
      const fcmToken = tokenResponse.data;
      console.log('✅ [FCM] Token retrieved:', fcmToken ? fcmToken.substring(0, 20) + '...' : 'null');

      return fcmToken;
    } catch (error) {
      console.error('❌ [FCM] Error getting push token:', error);
      
      // Check if it's a Firebase initialization error
      if (error.message && (
        error.message.includes('FirebaseApp is not initialized') ||
        error.message.includes('Make sure to complete the guide') ||
        error.message.includes('FCM-credentials')
      )) {
        const errorMsg = 'FCM requires a development build with Firebase configured. Build with: eas build --profile development --platform android';
        console.error('⚠️ [FCM]', errorMsg);
        console.error('⚠️ [FCM] Make sure google-services.json is in the root directory');
        console.error('⚠️ [FCM] Configure FCM credentials in EAS: https://docs.expo.dev/push-notifications/fcm-credentials/');
        setError('FCM requires a development build. See console for details.');
      } else {
        setError('Error getting push token: ' + (error.message || 'Unknown error'));
      }
      return null;
    }
  };

  /**
   * Register token with backend
   * This will check if token exists, if not create it, if exists update userId if provided
   */
  const registerToken = useCallback(async () => {
    try {
      console.log('🚀 [FCM] Starting token registration');
      console.log('🚀 [FCM] User ID:', userId || 'null (not logged in)');
      console.log('🚀 [FCM] Platform:', platform);
      setIsLoading(true);
      setError(null);

      const fcmToken = await getToken();
      if (!fcmToken) {
        console.error('❌ [FCM] Failed to get FCM token');
        // Don't throw error, just set it and return
        setError('Failed to get FCM token. This may be normal if running in Expo Go or simulator.');
        setIsLoading(false);
        return;
      }

      console.log('📱 [FCM] Setting token in state:', fcmToken ? fcmToken.substring(0, 20) + '...' : 'null');
      setToken(fcmToken);

      // Check if token exists in database
      console.log('🔍 [FCM] Checking if token exists in database...');
      let tokenExists = false;
      try {
        const checkResult = await checkFCMTokenExists(fcmToken);
        tokenExists = checkResult?.data?.exists || false;
        console.log('🔍 [FCM] Token exists:', tokenExists);
        
        if (tokenExists && userId) {
          // Token exists, check if userId needs to be updated
          const existingUserId = checkResult?.data?.token?.userId;
          if (!existingUserId || existingUserId.toString() !== userId.toString()) {
            console.log('🔄 [FCM] Updating userId for existing token...');
            try {
              await updateFCMTokenUserId(fcmToken, userId);
              console.log('✅ [FCM] Token userId updated successfully!');
            } catch (updateError) {
              console.error('⚠️ [FCM] Error updating userId:', updateError);
              // Don't fail the whole process if userId update fails
            }
          } else {
            console.log('✅ [FCM] Token already has correct userId');
          }
        } else if (!tokenExists) {
          // Token doesn't exist, register it (with or without userId)
          console.log('📡 [FCM] Token not found, registering new token...');
          try {
            await registerFCMToken(fcmToken, platform, userId || null);
            console.log('✅ [FCM] Token registered successfully with backend!');
          } catch (registerError) {
            console.error('⚠️ [FCM] Error registering token:', registerError);
            // If registration fails, still keep the token in state
            // The error will be logged but won't crash the app
          }
        } else {
          console.log('✅ [FCM] Token exists but no userId provided - keeping as is');
        }
      } catch (checkError) {
        // If check fails, try to register anyway
        console.log('⚠️ [FCM] Error checking token, attempting to register...');
        try {
          await registerFCMToken(fcmToken, platform, userId || null);
          console.log('✅ [FCM] Token registered successfully with backend!');
        } catch (registerError) {
          console.error('⚠️ [FCM] Error registering token after check failed:', registerError);
          // Don't set error state - token is still valid locally
        }
      }

      console.log('🎉 [FCM] FINAL TOKEN:', fcmToken ? fcmToken.substring(0, 20) + '...' : 'null');
    } catch (error) {
      console.error('❌ [FCM] Error in registerToken:', error);
      // Only set error for critical failures, not for expected scenarios
      if (error.message && !error.message.includes('Failed to get FCM token')) {
        setError(error instanceof Error ? error.message : 'Failed to register token');
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, platform]);

  /**
   * Unregister token from backend
   */
  const unregisterToken = async () => {
    try {
      if (!token) {
        return;
      }

      setIsLoading(true);
      setError(null);

      await unregisterFCMToken(token);
      setToken(null);
      console.log('✅ [FCM] Token unregistered successfully');
    } catch (error) {
      console.error('❌ [FCM] Error unregistering token:', error);
      setError(error instanceof Error ? error.message : 'Failed to unregister token');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-register on mount - always check/register token when app opens
  // This ensures token is registered even if user is not logged in
  useEffect(() => {
    console.log('🔄 [FCM] useEffect triggered - autoRegister:', autoRegister);
    if (autoRegister) {
      console.log('🔄 [FCM] Auto-registering token (app opened)...');
      registerToken().catch((err) => {
        console.error('❌ [FCM] Auto-register failed:', err);
      });
    } else {
      console.log('⏭️ [FCM] Skipping auto-register (autoRegister:', autoRegister, ')');
      setIsLoading(false);
    }
  }, [autoRegister, registerToken]);

  // Update userId when user logs in
  useEffect(() => {
    if (token && userId) {
      console.log('🔄 [FCM] User logged in, updating token userId...');
      updateFCMTokenUserId(token, userId).catch((err) => {
        console.error('⚠️ [FCM] Failed to update userId (non-critical):', err);
        // Don't set error state - this is not critical
      });
    }
  }, [userId, token]);

  return {
    token,
    isLoading,
    error,
    registerToken,
    unregisterToken,
  };
}

