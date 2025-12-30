import {
  Entypo,
  FontAwesome5,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSubscription } from "../../hooks/useSubscription";
import { hasActiveSubscription } from "../../utils/subscription";
import UpgradeModal from "../../Components/UpgradeModal";

const SettingsScreen = () => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [isMetaConnected, setIsMetaConnected] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Subscription
  const { subscription } = useSubscription();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Refresh auth status when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      checkAuthStatus();
    }, [])
  );

  const checkAuthStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      const authToken = await AsyncStorage.getItem("authToken");
      
      if (userData && authToken) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsLoggedIn(true);
        } catch (e) {
          // Invalid data, clear it
          await AsyncStorage.removeItem("user");
          await AsyncStorage.removeItem("authToken");
          setUser(null);
          setIsLoggedIn(false);
        }
      } else {
        // No user data or token, clear state
        setUser(null);
        setIsLoggedIn(false);
      }

      // Check Meta connection status
      const fbToken = await AsyncStorage.getItem("fb_access_token");
      setIsMetaConnected(!!fbToken);
    } catch (error) {
      console.error("Error checking auth status:", error);
      setUser(null);
      setIsLoggedIn(false);
      setIsMetaConnected(false);
    } finally {
      setLoading(false);
    }
  };


  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("user");
              await AsyncStorage.removeItem("authToken");
              setUser(null);
              setIsLoggedIn(false);
              Alert.alert("Logged Out", "You have been logged out successfully.");
            } catch (error) {
              console.error("Logout error:", error);
            }
          },
        },
      ]
    );
  };

  const handleDisconnectMeta = () => {
    Alert.alert(
      "Disconnect From Meta",
      "Are you sure you want to disconnect your Meta account? You will need to reconnect to use Meta Ads features.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("fb_access_token");
              await AsyncStorage.removeItem("fb_ad_account_id");
              setIsMetaConnected(false);
              Alert.alert("Disconnected", "Your Meta account has been disconnected successfully.");
            } catch (error) {
              console.error("Disconnect Meta error:", error);
              Alert.alert("Error", "Failed to disconnect Meta account. Please try again.");
            }
          },
        },
      ]
    );
  };

  const options = [
    {
      label: "Profile Setting",
      icon: <Entypo name="user" size={22} color="#6366f1" />,
      bgColor: "#e0e7ff",
      route: "/ProfileSetting",
      requiresAuth: true,
    },
    {
      label: "Live Chat",
      icon: <Ionicons name="chatbubbles-outline" size={22} color="#0ea5e9" />,
      bgColor: "#e0f2fe",
      route: "/LiveChat",
      requiresAuth: true,
    },
    {
      label: "Share App",
      icon: <Ionicons name="share-social-outline" size={22} color="#8b5cf6" />,
      bgColor: "#f3e8ff",
      route: "/ShareApp",
      requiresAuth: false,
    },
    {
      label: "Referrals",
      icon: <Ionicons name="gift-outline" size={22} color="#ec4899" />,
      bgColor: "#fce7f3",
      route: "/Referrals",
      requiresAuth: true,
    },
    {
      label: "Payment History",
      icon: <Ionicons name="receipt-outline" size={22} color="#ef4444" />,
      bgColor: "#fee2e2",
      route: "/PaymentHistory",
      requiresAuth: true,
    },
    {
      label: "Privacy Policy",
      icon: <Ionicons name="document-text-outline" size={22} color="#64748b" />,
      bgColor: "#f1f5f9",
      route: "/PrivacyPolicy",
      requiresAuth: false,
    },
    {
      label: "Account Delete",
      icon: <MaterialIcons name="delete-outline" size={22} color="#dc2626" />,
      bgColor: "#fef2f2",
      route: "/AccountDelete",
      requiresAuth: true,
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerLine} />
        </View>

        {/* Profile Section */}
        {isLoggedIn && user ? (
          <View style={styles.profileContainer}>
            <View style={styles.profileImageContainer}>
              {user.profileImage ? (
                <Image
                  source={{ uri: user.profileImage }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Ionicons name="person" size={40} color="#94a3b8" />
                </View>
              )}
              <View style={styles.onlineIndicator} />
            </View>
            <Text style={styles.profileName}>
              {user.name || "User"}
            </Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
          </View>
        ) : (
          <View style={styles.loginPromptContainer}>
            <View style={styles.loginPrompt}>
              <Ionicons name="lock-closed-outline" size={48} color="#6366f1" />
              <Text style={styles.loginPromptTitle}>Login Required</Text>
              <Text style={styles.loginPromptText}>
                Please login to access all features and manage your account
              </Text>
              <View style={styles.authButtonsContainer}>
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={() => router.push("/Login")}
                >
                  <Text style={styles.loginButtonText}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.signupButtonSecondary}
                  onPress={() => router.push("/SignUp")}
                >
                  <Text style={styles.signupButtonSecondaryText}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Options List */}
        <View style={styles.optionsContainer}>
          {options.map((item, index) => {
            // Hide auth-required options if not logged in
            if (item.requiresAuth && !isLoggedIn) {
              return null;
            }

            return (
              <TouchableOpacity
                key={index}
                style={[styles.optionItem, { backgroundColor: item.bgColor }]}
                onPress={() => {
                  if (item.action === "logout") {
                    handleLogout();
                  } else if (item.route) {
                    // Check subscription for Live Chat
                    if (item.route === "/LiveChat" || item.label === "Live Chat") {
                      console.log("🔍 Settings: Live Chat clicked, checking subscription");
                      const hasActive = hasActiveSubscription(subscription);
                      console.log("  - Has active subscription:", hasActive);
                      
                      if (!hasActive) {
                        console.log("❌ Settings: No subscription - showing upgrade modal");
                        setShowUpgradeModal(true);
                        return; // Block navigation
                      }
                      
                      console.log("✅ Settings: Subscription check passed - navigating to Live Chat");
                    }
                    
                    router.push(item.route as any);
                  }
                }}
              >
                <View style={styles.optionIconContainer}>{item.icon}</View>
                <Text style={styles.optionText}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </TouchableOpacity>
            );
          })}

          {/* Disconnect From Meta - Only show if Meta is connected */}
          {isMetaConnected && (
            <TouchableOpacity
              style={[styles.optionItem, { backgroundColor: "#fff7ed" }]}
              onPress={handleDisconnectMeta}
            >
              <View style={styles.optionIconContainer}>
                <FontAwesome5 name="facebook" size={22} color="#f97316" />
              </View>
              <Text style={styles.optionText}>Disconnect From Meta</Text>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}

          {/* Log Out Option - Only show if logged in */}
          {isLoggedIn && (
            <TouchableOpacity
              style={[styles.optionItem, { backgroundColor: "#fef2f2" }]}
              onPress={handleLogout}
            >
              <View style={styles.optionIconContainer}>
                <MaterialIcons name="logout" size={22} color="#dc2626" />
              </View>
              <Text style={styles.optionText}>Log Out</Text>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* App Version */}
        <Text style={styles.versionText}>App Version 2.4.1</Text>
      </ScrollView>

      {/* Upgrade Modal */}
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => {
          console.log("🔒 Settings: Upgrade modal closed");
          setShowUpgradeModal(false);
        }}
        isPremiumFeature={false}
        featureName="Live Chat Support"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 10,
  },
  headerLine: {
    height: 4,
    width: 50,
    backgroundColor: "#6366f1",
    borderRadius: 2,
  },
  profileContainer: {
    alignItems: "center",
    marginBottom: 30,
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#e2e8f0",
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#e2e8f0",
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#22c55e",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: "#64748b",
  },
  loginPromptContainer: {
    marginBottom: 30,
  },
  loginPrompt: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  loginPromptTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginTop: 16,
    marginBottom: 8,
  },
  loginPromptText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 20,
  },
  authButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  loginButton: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  signupButtonSecondary: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#6366f1",
    flex: 1,
    alignItems: "center",
  },
  signupButtonSecondaryText: {
    color: "#6366f1",
    fontSize: 16,
    fontWeight: "600",
  },
  optionsContainer: {
    marginBottom: 30,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  optionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#334155",
    flex: 1,
  },
  versionText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 10,
  },
});

export default SettingsScreen;
