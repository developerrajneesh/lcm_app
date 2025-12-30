import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

export const useSubscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const userData = await AsyncStorage.getItem("user");
      const authToken = await AsyncStorage.getItem("authToken");

      if (!userData) {
        setLoading(false);
        return;
      }

      const user = JSON.parse(userData);
      const userId = user.id || user._id;

      const config = {
        params: { userId },
      };

      if (authToken) {
        config.headers = {
          Authorization: `Bearer ${authToken}`,
        };
      }

      const response = await axios.get(
        `${API_BASE_URL}/subscription/active-subscription`,
        config
      );

      if (response.data.success && response.data.data) {
        setSubscription(response.data.data);
      } else {
        setSubscription(null);
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
      setError(err.message);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const refreshSubscription = () => {
    fetchSubscription();
  };

  return {
    subscription,
    loading,
    error,
    refreshSubscription,
  };
};

