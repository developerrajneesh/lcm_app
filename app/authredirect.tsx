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
        router.push("/MetaWorker");
        return;
      }

      // Check for Facebook access token
      const accessToken = params.access_token as string;
      
      if (accessToken) {
        await handleFacebookToken(accessToken);
      } else {
        Alert.alert("Error", "No access token received");
        router.push("/MetaWorker");
      }
    } catch (error) {
      console.error("Auth redirect error:", error);
      Alert.alert("Error", "Failed to process authentication");
      router.push("/MetaWorker");
    }
  };

  const handleFacebookToken = async (token: string) => {
    try {
      // Exchange short-lived token for long-lived token
      let longLivedToken = token;
      try {
        const exchangeResponse = await axios.post(`${API_BASE_URL}/exchange-token`, {
          token: token.trim()
        });
        if (exchangeResponse.data.success) {
          longLivedToken = exchangeResponse.data.access_token;
          console.log("✅ Successfully exchanged for long-lived token");
        }
      } catch (exchangeError) {
        console.warn("⚠️ Failed to exchange token, using short-lived token:", exchangeError.response?.data?.error || exchangeError.message);
        // Continue with original token if exchange fails
      }

      // Save long-lived token to AsyncStorage first
      // This ensures token is saved even if ad accounts validation fails
      await AsyncStorage.setItem("fb_access_token", longLivedToken);
      console.log("✅ Token saved to AsyncStorage:", longLivedToken ? longLivedToken.substring(0, 20) + "..." : "null");

      // Validate token by fetching ad accounts
      const response = await axios.get(`${API_BASE_URL}/campaigns`, {
        headers: {
          "x-fb-access-token": longLivedToken,
        },
      });

      if (response.data.success) {

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
          // Clear the token since user has no ad accounts
          await AsyncStorage.removeItem("fb_access_token");
          await AsyncStorage.removeItem("fb_token");
          await AsyncStorage.removeItem("fb_ad_account_id");
          await AsyncStorage.removeItem("act_ad_account_id");
          Alert.alert(
            "No Ad Account Found",
            "You don't have any Meta ad accounts. Please create an ad account in Meta Business Manager first, then reconnect with LCM.\n\n" +
            "Steps:\n" +
            "1. Go to Meta Business Manager (business.facebook.com)\n" +
            "2. Create an ad account\n" +
            "3. Come back here and reconnect your Meta account"
          );
          router.push("/MetaWorker");
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
          router.push("/MetaWorker");
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
          router.push("/MetaWorker");
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
      router.push("/MetaWorker");
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

