import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFCMToken } from "../hooks/useFCMToken";
import { useNavigationHistory } from "../hooks/useNavigationHistory";

export default function RootLayout() {
  const [userId, setUserId] = useState<string | null>(null);
  const responseListener = useRef<{ remove: () => void } | null>(null);
  
  // Use navigation history hook to track and handle back navigation
  const navigationHistory = useNavigationHistory();

  // Load user ID from AsyncStorage
  useEffect(() => {
    const loadUserId = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          const id = user.id || user._id || null;
          setUserId(id);
          console.log("✅ [FCM] User ID loaded:", id);
        } else {
          setUserId(null);
        }
      } catch (error) {
        console.error("❌ [FCM] Error loading user ID:", error);
        setUserId(null);
      }
    };
    loadUserId();
  }, []);

  // Register FCM token - always auto-register when app opens (even without userId)
  const fcmTokenHook = useFCMToken({
    userId: (userId || null) as string | null,
    autoRegister: true, // Always auto-register when app opens
  }) as { token: string | null; isLoading: boolean; error: string | null };
  const token = fcmTokenHook.token;
  const isLoading = fcmTokenHook.isLoading;
  const error = fcmTokenHook.error;

  // Handle notification taps (when user taps on a device notification)
  useEffect(() => {
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("👆 [FCM] Notification tapped:", response);
      console.log("📱 [FCM] Platform:", Platform.OS);

      // Handle navigation or other actions here
      const data = response.notification.request.content.data;
      const notification = response.notification;

      if (data) {
        console.log("📦 [FCM] Notification data:", data);

        // Handle deep linking or navigation based on data
        if (data.screen) {
          // Navigate to specific screen
          console.log("🧭 [FCM] Navigate to:", data.screen);
          // Example: router.push(data.screen);
        }

        if (data.url) {
          // Open URL
          console.log("🔗 [FCM] Open URL:", data.url);
          // Example: Linking.openURL(data.url);
        }
      }

      // Handle action buttons (iOS)
      if (response.actionIdentifier === "VIEW") {
        console.log("👀 [FCM] View action pressed");
        // Handle view action
      } else if (response.actionIdentifier === "DISMISS") {
        console.log("❌ [FCM] Dismiss action pressed");
        // Handle dismiss action
      }
    });

    return () => {
      // Remove subscription using the remove() method on the subscription object
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // Navigation history hook handles Android back button automatically
  // It tracks previous screens and navigates back properly

  // Log token registration status
  useEffect(() => {
    if (token) {
      console.log("\n" + "=".repeat(60));
      console.log("🎉 [FCM] TOKEN SUCCESSFULLY REGISTERED!");
      console.log("=".repeat(60));
      console.log("📱 [FCM] Token:", token ? token.substring(0, 20) + "..." : "null");
      console.log("👤 [FCM] User ID:", userId);
      console.log("=".repeat(60) + "\n");
    }
    if (error) {
      console.log("\n" + "=".repeat(60));
      console.error("❌ [FCM] TOKEN ERROR!");
      console.log("=".repeat(60));
      console.error("❌ [FCM] Error:", error);
      console.log("=".repeat(60) + "\n");
    }
    if (isLoading) {
      console.log("⏳ [FCM] Token registration in progress...");
    }
  }, [token, error, isLoading, userId]);

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false, // hides header
        }}
      />
    </SafeAreaProvider>
  );
}
