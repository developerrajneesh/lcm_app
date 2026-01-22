import { useEffect, useRef, useState } from 'react';
import { Platform, BackHandler } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Custom hook to manage navigation history and handle back button
 * Stores previous screens and navigates back properly instead of going to home
 * 
 * @returns {Object} { history, goBack, clearHistory, canGoBack }
 */
export function useNavigationHistory() {
  const router = useRouter();
  const segments = useSegments();
  const historyRef = useRef([]);
  const [history, setHistory] = useState([]);
  const isNavigatingRef = useRef(false);
  const previousSegmentsRef = useRef([]);

  // Get current route path from segments
  const getCurrentRoute = () => {
    if (!segments || segments.length === 0) {
      return '/Home'; // Default to Home if no segments
    }
    // Construct path from segments
    const path = '/' + segments.join('/');
    return path;
  };

  // Initialize history with current route on mount
  useEffect(() => {
    if (historyRef.current.length === 0) {
      const currentRoute = getCurrentRoute();
      historyRef.current = [currentRoute];
      previousSegmentsRef.current = [...segments];
      setHistory([...historyRef.current]);
      console.log('📚 [NavigationHistory] Initialized with route:', currentRoute);
    }
  }, []);

  // Add current route to history when it changes
  useEffect(() => {
    const currentRoute = getCurrentRoute();
    const previousRoute = historyRef.current[historyRef.current.length - 1];
    const segmentsString = JSON.stringify(segments);
    const previousSegmentsString = JSON.stringify(previousSegmentsRef.current);

    // Only add to history if route actually changed and we're not navigating back
    if (currentRoute && segmentsString !== previousSegmentsString && !isNavigatingRef.current) {
      // Don't add if it's the same as the last entry (avoid duplicates)
      if (previousRoute !== currentRoute) {
        historyRef.current = [...historyRef.current, currentRoute];
        // Limit history to last 50 entries to prevent memory issues
        if (historyRef.current.length > 50) {
          historyRef.current = historyRef.current.slice(-50);
        }
        setHistory([...historyRef.current]);
        previousSegmentsRef.current = [...segments];
        console.log('📚 [NavigationHistory] Added to history:', currentRoute);
        console.log('📚 [NavigationHistory] History length:', historyRef.current.length);
      }
    }
    
    // Reset navigation flag after a short delay
    if (isNavigatingRef.current) {
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 100);
    }
  }, [segments]);

  // Navigate back to previous screen
  const goBack = async () => {
    const currentRoute = getCurrentRoute();
    
    // Special handling for AdsScreen -> AdSetsScreen navigation
    if (currentRoute && currentRoute.includes('AdsScreen')) {
      try {
        const campaignId = await AsyncStorage.getItem("last_campaign_id");
        const campaignName = await AsyncStorage.getItem("last_campaign_name");
        
        if (campaignId) {
          isNavigatingRef.current = true;
          console.log('⬅️ [NavigationHistory] Navigating from AdsScreen to AdSetsScreen with campaignId:', campaignId);
          
          // Remove current route from history
          historyRef.current.pop();
          setHistory([...historyRef.current]);
          
          // Navigate to AdSetsScreen with params
          router.push({
            pathname: "/AdSetsScreen",
            params: {
              campaignId: campaignId,
              campaignName: campaignName || "Campaign",
            },
          });
          return true;
        }
      } catch (error) {
        console.error('❌ [NavigationHistory] Error loading campaign data:', error);
      }
    }

    if (historyRef.current.length <= 1) {
      // No history, try default router.back()
      if (router.canGoBack()) {
        router.back();
        return true;
      }
      return false;
    }

    // Get the previous route (second to last, since last is current)
    const previousRoute = historyRef.current[historyRef.current.length - 2];

    if (previousRoute) {
      isNavigatingRef.current = true;
      console.log('⬅️ [NavigationHistory] Going back to:', previousRoute);
      console.log('📚 [NavigationHistory] Current history:', historyRef.current);
      
      // Remove current route and the one we're going back to
      // We'll navigate to previousRoute, and it will be re-added to history
      historyRef.current = historyRef.current.slice(0, -2);
      setHistory([...historyRef.current]);
      
      // Navigate to previous route
      router.push(previousRoute);
      return true;
    }

    // Fallback to default behavior
    if (router.canGoBack()) {
      router.back();
      return true;
    }
    return false;
  };

  // Clear navigation history
  const clearHistory = () => {
    const currentRoute = getCurrentRoute();
    historyRef.current = currentRoute ? [currentRoute] : [];
    setHistory([...historyRef.current]);
    console.log('🗑️ [NavigationHistory] History cleared');
  };

  // Check if we can go back
  const canGoBack = () => {
    return historyRef.current.length > 1 || router.canGoBack();
  };

  // Handle Android hardware back button
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', async () => {
      console.log('🔙 [NavigationHistory] Hardware back button pressed');
      const wentBack = await goBack();
      return wentBack; // Return true to prevent default behavior, false to allow
    });

    return () => backHandler.remove();
  }, [router]);

  return {
    history: [...historyRef.current],
    goBack,
    clearHistory,
    canGoBack: canGoBack(),
  };
}

