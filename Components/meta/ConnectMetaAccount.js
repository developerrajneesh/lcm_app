import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AdAccountSelector from "./AdAccountSelector";

export default function MetaConnectScreen({ onSuccess }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [adAccounts, setAdAccounts] = useState([]);
  const [showAccountSelector, setShowAccountSelector] = useState(false);

  const handleConnectAccount = async () => {
    if (!accessToken.trim()) {
      Alert.alert("Error", "Please enter your Facebook Access Token");
      return;
    }

    setIsConnecting(true);

    try {
      // Validate token by fetching ad accounts
      const axios = require("axios");
      const { API_BASE_URL } = require("../../config/api");
      
      // Exchange short-lived token for long-lived token
      let longLivedToken = accessToken;
      try {
        console.log("🔄 Attempting to exchange short-lived token for long-lived token...");
        const exchangeResponse = await axios.post(`${API_BASE_URL}/exchange-token`, {
          token: accessToken.trim()
        });
        if (exchangeResponse.data.success) {
          longLivedToken = exchangeResponse.data.access_token;
          console.log("✅ Successfully exchanged for long-lived token");
          console.log("  - Long-lived token length:", longLivedToken?.length || 0);
        } else {
          console.warn("⚠️ Token exchange response not successful:", exchangeResponse.data);
        }
      } catch (exchangeError) {
        console.warn("⚠️ Failed to exchange token, using provided token");
        console.warn("  - Error:", exchangeError.response?.data?.error || exchangeError.message);
        console.warn("  - Status:", exchangeError.response?.status);
        // Continue with original token if exchange fails
      }
      
      // Save token first (even before validating with ad accounts)
      // This ensures token is saved even if ad accounts fetch fails
      await AsyncStorage.setItem("fb_access_token", longLivedToken);
      console.log("✅ Token saved to AsyncStorage:", longLivedToken ? longLivedToken.substring(0, 20) + "..." : "null");

      // Fetch ad accounts using the dedicated endpoint
      const response = await axios.get(`${API_BASE_URL}/campaigns`, {
        headers: {
          "x-fb-access-token": longLivedToken,
        },
      });

      if (response.data.success) {
        
        // Get ad accounts from response
        // The endpoint returns { success: true, adAccounts: { data: [...] } }
        const accounts = response.data.adAccounts?.data || [];
        const validAccounts = accounts.filter(
          (account) => account && account.id && typeof account.id === "string" && account.id.trim() !== ""
        );

        if (validAccounts.length === 0) {
          // Clear the token since user has no ad accounts
          await AsyncStorage.removeItem("fb_access_token");
          await AsyncStorage.removeItem("fb_token");
          await AsyncStorage.removeItem("fb_ad_account_id");
          await AsyncStorage.removeItem("act_ad_account_id");
          setIsConnecting(false);
          Alert.alert(
            "No Ad Account Found",
            "You don't have any Meta ad accounts. Please create an ad account in Meta Business Manager first, then reconnect with LCM.\n\n" +
            "Steps:\n" +
            "1. Go to Meta Business Manager (business.facebook.com)\n" +
            "2. Create an ad account\n" +
            "3. Come back here and reconnect your Meta account"
          );
          return;
        }

        if (validAccounts.length === 1) {
          // Only one account - auto-select it
          const accountId = validAccounts[0].id;
          await AsyncStorage.setItem("fb_ad_account_id", accountId);
          setIsConnected(true);
          Alert.alert(
            "Success",
            "Your Meta account has been connected successfully!"
          );
          if (onSuccess) {
            onSuccess();
          }
        } else {
          // Multiple accounts - show selection modal
          setAdAccounts(validAccounts);
          setShowAccountSelector(true);
        }
      } else {
        throw new Error("Invalid access token");
      }
    } catch (error) {
      console.error("Connection error:", error);
      
      // If token was saved but validation failed, keep it saved
      // Only clear token if it's actually invalid (401/403 errors)
      const isTokenError = error.response?.status === 401 || error.response?.status === 403;
      if (isTokenError) {
        console.warn("⚠️ Token validation failed, clearing saved token");
        await AsyncStorage.removeItem("fb_access_token");
      } else {
        // For other errors (network, etc.), keep the token saved
        console.log("✅ Token kept in storage despite validation error");
      }
      
      Alert.alert(
        "Error",
        error.response?.data?.fb?.message ||
          error.response?.data?.message ||
          error.message ||
          "Failed to connect to Meta. Please check your access token."
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAccountSelect = async (accountId) => {
    try {
      await AsyncStorage.setItem("fb_ad_account_id", accountId);
      setShowAccountSelector(false);
      setIsConnected(true);
      Alert.alert(
        "Success",
        "Your Meta account has been connected successfully!"
      );
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving ad account:", error);
      Alert.alert("Error", "Failed to save ad account selection");
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    Alert.alert("Disconnected", "Your Meta account has been disconnected.");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Meta Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <FontAwesome5 name="facebook" size={40} color="#1877F2" />
            </View>
            <Text style={styles.logoText}>Meta</Text>
          </View>

          <Text style={styles.title}>Connect Your Meta Account</Text>
          <Text style={styles.subtitle}>
            Connect your Meta account to access advertising features, manage
            campaigns, and track performance
          </Text>

          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusIndicator,
                isConnected ? styles.connected : styles.disconnected,
              ]}
            />
            <Text style={styles.statusText}>
              {isConnected ? "Connected to Meta" : "Not connected"}
            </Text>
          </View>

          {!isConnected ? (
            <>
              <View style={styles.tokenInputContainer}>
                <Text style={styles.tokenLabel}>Facebook Access Token</Text>
                <TextInput
                  style={styles.tokenInput}
                  placeholder="Enter your Facebook Access Token"
                  value={accessToken}
                  onChangeText={setAccessToken}
                  secureTextEntry
                  multiline
                  placeholderTextColor="#999"
                />
                <Text style={styles.tokenHint}>
                  Get your access token from Facebook Developers Console
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.connectButton,
                  (isConnecting || !accessToken.trim()) &&
                    styles.connectButtonDisabled,
                ]}
                onPress={handleConnectAccount}
                disabled={isConnecting || !accessToken.trim()}
              >
                {isConnecting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <FontAwesome5
                      name="facebook"
                      size={20}
                      color="white"
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.connectButtonText}>
                      Connect Meta Account
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={handleDisconnect}
            >
              <Text style={styles.disconnectButtonText}>
                Disconnect Account
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Benefits of Connecting:</Text>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons
                name="chart-areaspline"
                size={20}
                color="#4361EE"
              />
              <Text style={styles.featureText}>Advanced analytics</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="target" size={20} color="#4361EE" />
              <Text style={styles.featureText}>Audience targeting</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons
                name="cash-multiple"
                size={20}
                color="#4361EE"
              />
              <Text style={styles.featureText}>Ad performance tracking</Text>
            </View>
          </View>

          <Text style={styles.footerText}>
            By connecting your account, you agree to our Terms of Service and
            Privacy Policy
          </Text>
        </View>
      </ScrollView>

      {/* Ad Account Selector Modal */}
      <AdAccountSelector
        visible={showAccountSelector}
        adAccounts={adAccounts}
        onSelect={handleAccountSelect}
        onClose={() => setShowAccountSelector(false)}
        loading={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1877F2",
    marginTop: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  connected: {
    backgroundColor: "#4caf50",
  },
  disconnected: {
    backgroundColor: "#f44336",
  },
  statusText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  connectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1877F2",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: "100%",
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 24,
  },
  connectButtonDisabled: {
    opacity: 0.7,
  },
  connectButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  disconnectButton: {
    backgroundColor: "#f8f9fa",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: "100%",
    maxWidth: 300,
    borderWidth: 1,
    borderColor: "#dc3545",
    marginBottom: 24,
  },
  disconnectButtonText: {
    color: "#dc3545",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  featuresContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "100%",
    maxWidth: 300,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
  },
  footerText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
  },
  tokenInputContainer: {
    width: "100%",
    maxWidth: 300,
    marginBottom: 20,
  },
  tokenLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  tokenInput: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#D8DEE6",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#1C1E21",
    minHeight: 80,
    textAlignVertical: "top",
  },
  tokenHint: {
    fontSize: 12,
    color: "#606770",
    marginTop: 6,
    fontStyle: "italic",
  },
});
