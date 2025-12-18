import { useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Alert, View, ActivityIndicator, StyleSheet } from "react-native";
import { API_BASE_URL } from "../config/api";

export default function AuthRedirect() {
  const params = useLocalSearchParams();

  useEffect(() => {
    handleAuthRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuthRedirect = async () => {
    try {
      // Check for errors
      if (params.error) {
        const errorDesc = Array.isArray(params.error_description) 
          ? params.error_description[0] 
          : params.error_description;
        const errorMsg = Array.isArray(params.error) 
          ? params.error[0] 
          : params.error;
        Alert.alert(
          "OAuth Error",
          (errorDesc || errorMsg || "Authentication failed") as string
        );
        router.replace("/MetaWorker");
        return;
      }

      // Check for Facebook access token
      const accessToken = params.access_token as string;
      
      if (accessToken) {
        await handleFacebookToken(accessToken);
      } else {
        Alert.alert("Error", "No access token received");
        router.replace("/MetaWorker");
      }
    } catch (error) {
      console.error("Auth redirect error:", error);
      Alert.alert("Error", "Failed to process authentication");
      router.replace("/MetaWorker");
    }
  };

  const handleFacebookToken = async (token: string) => {
    try {
      // Validate token by fetching ad accounts
      const response = await axios.get(`${API_BASE_URL}/campaigns`, {
        headers: {
          "x-fb-access-token": token,
        },
      });

      if (response.data.success) {
        // Save token to AsyncStorage
        await AsyncStorage.setItem("fb_access_token", token);

        // Get ad accounts from response
        const accounts = response.data.adAccounts?.data || [];
        const validAccounts = accounts.filter(
          (account: any) =>
            account &&
            account.id &&
            typeof account.id === "string" &&
            account.id.trim() !== ""
        );

        if (validAccounts.length === 0) {
          Alert.alert(
            "No Ad Accounts",
            "No valid ad accounts found. Please make sure you have ad accounts in your Meta Business Manager."
          );
          router.replace("/MetaWorker");
          return;
        }

        if (validAccounts.length === 1) {
          // Only one account - auto-select it
          const accountId = validAccounts[0].id;
          await AsyncStorage.setItem("fb_ad_account_id", accountId);
          
          Alert.alert(
            "Success",
            "Your Meta account has been connected successfully!"
          );
          
          // Navigate to MetaWorker to show campaigns
          router.replace("/MetaWorker");
        } else {
          // Multiple accounts - save first one for now, or show selector
          // For now, we'll use the first account
          const accountId = validAccounts[0].id;
          await AsyncStorage.setItem("fb_ad_account_id", accountId);
          
          Alert.alert(
            "Success",
            "Your Meta account has been connected successfully!"
          );
          
          // Navigate to MetaWorker to show campaigns
          router.replace("/MetaWorker");
        }
      } else {
        throw new Error("Invalid access token");
      }
    } catch (error: any) {
      console.error("Facebook token connection error:", error);
      Alert.alert(
        "Error",
        error.response?.data?.fb?.message ||
          error.response?.data?.message ||
          error.message ||
          "Failed to connect to Meta. Please check your access token."
      );
      router.replace("/MetaWorker");
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6366f1" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
});

