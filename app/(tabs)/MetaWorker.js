import { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MetaConnectScreen from "../../Components/meta/ConnectMetaAccount";
import MetaCompaigns from "../../Components/meta/MetaCompaigns";

const MetaWorker = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkConnectionStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("fb_access_token");
      const accountId = await AsyncStorage.getItem("fb_ad_account_id");
      console.log("🔍 MetaWorker: Checking connection - hasToken:", !!token, "hasAccountId:", !!accountId, "token:", token ? token.substring(0, 20) + "..." : "null");
      
      // Check if token exists and is not empty/null/undefined
      if (token && token.trim() && token !== "null" && token !== "undefined") {
        console.log("✅ MetaWorker: Token found, setting connected to true");
        setIsConnected(true);
      } else {
        console.log("❌ MetaWorker: No valid token found, setting connected to false");
        setIsConnected(false);
      }
    } catch (error) {
      console.error("❌ MetaWorker: Error checking connection status:", error);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  // Refresh connection status when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      checkConnectionStatus();
    }, [])
  );

  const handleConnectionSuccess = () => {
    setIsConnected(true);
  };

  if (loading) {
    return null; // Or a loading spinner
  }

  if (!isConnected) {
    return <MetaConnectScreen onSuccess={handleConnectionSuccess} />;
  }
  return <MetaCompaigns />;
};

export default MetaWorker;
