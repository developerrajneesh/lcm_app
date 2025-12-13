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
      setIsConnected(!!token);
    } catch (error) {
      console.error("Error checking connection status:", error);
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
