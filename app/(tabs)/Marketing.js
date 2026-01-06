import {
  Feather,
  FontAwesome6,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import FacebookConnectButton from "../../Components/FacebookConnectButton";
import { useSubscription } from "../../hooks/useSubscription";
import { hasFeatureAccess, hasActiveSubscription, isPremiumFeature } from "../../utils/subscription";
import UpgradeModal from "../../Components/UpgradeModal";

const { width } = Dimensions.get("window");

const MarketingOptionsScreen = () => {
  const [selectedOption, setSelectedOption] = useState(null);
  const fadeAnim = new Animated.Value(0);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectMethod, setConnectMethod] = useState(null); // 'facebook' or 'token'
  const [accessToken, setAccessToken] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [adAccounts, setAdAccounts] = useState([]);
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeatureName, setUpgradeFeatureName] = useState("");
  
  // Subscription
  const { subscription, loading: subscriptionLoading, refreshSubscription } = useSubscription();

  // Use a ref to store the latest refreshSubscription function and prevent multiple simultaneous refreshes
  const refreshSubscriptionRef = useRef(refreshSubscription);
  const isRefreshingRef = useRef(false);
  
  // Update ref when refreshSubscription changes
  useEffect(() => {
    refreshSubscriptionRef.current = refreshSubscription;
  }, [refreshSubscription]);

  // Refresh subscription when screen comes into focus (e.g., after subscription payment)
  useFocusEffect(
    useCallback(() => {
      // Prevent multiple simultaneous refreshes
      if (isRefreshingRef.current) {
        return;
      }
      
      isRefreshingRef.current = true;
      console.log("🔄 Marketing: Screen focused - refreshing subscription");
      refreshSubscriptionRef.current();
      
      // Reset ref after a short delay
      setTimeout(() => {
        isRefreshingRef.current = false;
      }, 1000);
    }, []) // Empty dependency array - only run on focus
  );

  // Debug subscription state changes and auto-hide modal when subscription becomes active
  useEffect(() => {
    console.log("📊 Marketing: Subscription state changed");
    console.log("  - Loading:", subscriptionLoading);
    console.log("  - Subscription:", subscription ? JSON.stringify(subscription, null, 2) : "null");
    if (subscription) {
      console.log("  - Plan ID:", subscription.planId);
      console.log("  - Status:", subscription.subscriptionStatus);
      console.log("  - End Date:", subscription.endDate);
      
      // Auto-hide upgrade modal if subscription becomes active
      if (!subscriptionLoading && hasActiveSubscription(subscription)) {
        const featureToCheck = upgradeFeatureName === "IVR Call marketing" ? "ivr-campaign" : "meta-ads";
        const hasAccess = hasFeatureAccess(subscription, featureToCheck);
        
        if (hasAccess) {
          console.log("✅ Marketing: Subscription is now active - hiding upgrade modal");
          setShowUpgradeModal(false);
        }
      }
    }
  }, [subscription, subscriptionLoading, upgradeFeatureName]);

  // Check token on component mount for debugging
  useEffect(() => {
    const checkTokenOnMount = async () => {
      try {
        const token = await AsyncStorage.getItem("fb_access_token");
        const accountId = await AsyncStorage.getItem("fb_ad_account_id");
        console.log("🔍 Marketing: Component mounted - Token check");
        console.log("  - Has token:", !!token);
        console.log("  - Token length:", token?.length || 0);
        console.log("  - Has account ID:", !!accountId);
      } catch (error) {
        console.error("❌ Marketing: Error checking token on mount:", error);
      }
    };
    checkTokenOnMount();
  }, []);

  const marketingOptions = [
    {
      id: 1,
      title: "Meta Ads",
      description:
        "Reach your target audience with precision targeting and powerful analytics",
      icon: <FontAwesome6 name="meta" size={24} color="#1877F2" />,
      color: "#1877F2",
      gradient: ["#1877F2", "#0A5BC4"],
      stats: { engagement: "92%", roi: "3.5x", time: "24h" },
      route: null, // Route handled manually after subscription check
      requiredFeature: "meta-ads",
    },
    {
      id: 2,
      title: "IVR Call marketing",
      description:
        "Interactive Voice Response system for automated customer engagement",
      icon: <Ionicons name="call-outline" size={24} color="#10B981" />,
      color: "#10B981",
      gradient: ["#10B981", "#059669"],
      stats: { engagement: "90%", roi: "3.0x", time: "48h" },
      route: "/IvrForm",
      requiredFeature: "ivr-campaign",
      isPremium: true,
    },
    {
      id: 3,
      title: "WhatsApp Marketing",
      description:
        "Reach customers directly on WhatsApp with personalized messages and campaigns",
      icon: <Ionicons name="logo-whatsapp" size={24} color="#25D366" />,
      color: "#25D366",
      gradient: ["#25D366", "#128C7E"],
      stats: { engagement: "98%", roi: "4.0x", time: "30m" },
      route: null,
      comingSoon: true,
    },
    {
      id: 4,
      title: "Email Marketing",
      description:
        "Create effective email campaigns that convert with our templates",
      icon: <MaterialIcons name="email" size={24} color="#EA4335" />,
      color: "#EA4335",
      gradient: ["#EA4335", "#D14836"],
      stats: { engagement: "85%", roi: "2.8x", time: "12h" },
      route: null,
      comingSoon: true,
    },
    {
      id: 5,
      title: "SMS Marketing",
      description: "Send targeted text messages with high open rates",
      icon: <Ionicons name="chatbubble" size={24} color="#8E44AD" />,
      color: "#8E44AD",
      gradient: ["#8E44AD", "#6C3483"],
      stats: { engagement: "95%", roi: "3.2x", time: "1h" },
      route: null,
      comingSoon: true,
    },
    {
      id: 6,
      title: "UGC Pro Video",
      description: "Professional UGC video editing services for your marketing campaigns",
      icon: <Ionicons name="videocam" size={24} color="#FF6B6B" />,
      color: "#FF6B6B",
      gradient: ["#FF6B6B", "#EE5A6F"],
      stats: { engagement: "88%", roi: "3.8x", time: "72h" },
      route: "/UgcProVideo",
      comingSoon: false,
      requiredFeature: null,
      isPremium: false,
    },
  ];

  const handleOptionPress = async (option) => {
    if (option.comingSoon) {
      Alert.alert("Coming Soon", `${option.title} is currently under development. We're working hard to bring you this amazing feature soon!`);
      return;
    }
    
    // CRITICAL: Check subscription FIRST for ALL features, especially Meta Ads
    // Meta Ads (id === 1) MUST have subscription check before ANY navigation
    const needsSubscriptionCheck = option.id === 1 || option.requiredFeature;
    
    if (needsSubscriptionCheck) {
      console.log("🔍 Marketing: Checking subscription for", option.title, "(ID:", option.id, ")");
      console.log("  - Subscription loading:", subscriptionLoading);
      console.log("  - Subscription:", subscription ? JSON.stringify(subscription, null, 2) : "null");
      console.log("  - Required feature:", option.requiredFeature || "meta-ads");
      
      // Wait for subscription to finish loading before checking
      if (subscriptionLoading) {
        console.log("⏳ Marketing: Subscription still loading, waiting...");
        // Wait for subscription to load, then proceed
        const checkSubscription = setInterval(() => {
          if (!subscriptionLoading) {
            clearInterval(checkSubscription);
            // Retry the action after subscription loads
            setTimeout(() => handleOptionPress(option), 100);
          }
        }, 100);
        return;
      }
      
      // Check if user has active subscription and feature access
      const hasActive = hasActiveSubscription(subscription);
      const featureToCheck = option.requiredFeature || "meta-ads";
      const hasAccess = hasFeatureAccess(subscription, featureToCheck);
      
      console.log("  - Has active subscription:", hasActive);
      console.log("  - Has feature access:", hasAccess);
      console.log("  - Subscription object:", subscription);
      
      // Show upgrade modal if no subscription or no access
      // This MUST block ALL navigation for Meta Ads
      if (!hasActive || !hasAccess) {
        console.log("❌ Marketing: Subscription check FAILED - BLOCKING ALL NAVIGATION");
        console.log("  - Setting upgradeFeatureName to:", option.title);
        console.log("  - Setting showUpgradeModal to: true");
        setUpgradeFeatureName(option.title);
        setShowUpgradeModal(true);
        console.log("  - Modal state updated, should be visible now");
        console.log("  - RETURNING EARLY - NO NAVIGATION ALLOWED");
        console.log("  - This return prevents token check and route navigation");
        return; // CRITICAL: Return early to prevent ANY navigation or token check
      }
      
      console.log("✅ Marketing: Subscription check PASSED - allowing navigation");
    }
    
    // Only proceed with token check if subscription is valid AND check passed
    // This block should NOT execute if subscription check failed (due to return above)
    if (option.id === 1) {
      // Meta Ads - check if token exists first
      try {
        const token = await AsyncStorage.getItem("fb_access_token");
        const accountId = await AsyncStorage.getItem("fb_ad_account_id");
        
        // Debug logging
        console.log("🔍 Marketing: Checking token");
        console.log("  - Token exists:", !!token);
        console.log("  - Token length:", token?.length || 0);
        console.log("  - Token value (first 20 chars):", token ? token.substring(0, 20) + "..." : "null");
        console.log("  - Account ID exists:", !!accountId);
        
        // Validate token - check if it's a valid non-empty string
        const isValidToken = token && 
                            typeof token === "string" && 
                            token.trim().length > 0 && 
                            token !== "null" && 
                            token !== "undefined" &&
                            token.trim() !== "";
        
        if (isValidToken) {
          // Token exists and is valid - navigate directly to MetaWorker
          console.log("✅ Marketing: Valid token found, navigating to MetaWorker");
          router.push("/MetaWorker");
        } else {
          // No valid token - show connect modal
          console.log("❌ Marketing: No valid token found");
          console.log("  - Token is:", token === null ? "null" : token === undefined ? "undefined" : `"${token}"`);
          setShowConnectModal(true);
        }
      } catch (error) {
        console.error("❌ Marketing: Error checking token:", error);
        // On error, show connect modal
        setShowConnectModal(true);
      }
      return; // IMPORTANT: Return after handling Meta Ads to prevent route navigation
    }
    
    // Handle other routes (only if not Meta Ads and subscription check passed)
    if (option.route && option.id !== 1) {
      // Double-check subscription if required
      if (option.requiredFeature) {
        const hasActive = hasActiveSubscription(subscription);
        const hasAccess = hasFeatureAccess(subscription, option.requiredFeature);
        if (!hasActive || !hasAccess) {
          console.log("❌ Marketing: Route navigation blocked - no subscription");
          setUpgradeFeatureName(option.title);
          setShowUpgradeModal(true);
          return;
        }
      }
      console.log("📍 Marketing: Navigating to route:", option.route);
      router.push(option.route);
    } else {
      setSelectedOption(option);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleFacebookConnectSuccess = async (token, accountId) => {
    try {
      console.log("✅ Marketing: Facebook connect success callback");
      console.log("  - Token received:", token ? token.substring(0, 20) + "..." : "null");
      console.log("  - Account ID received:", accountId || "null");
      
      if (token && typeof token === "string" && token.trim().length > 0) {
        await AsyncStorage.setItem("fb_access_token", token.trim());
        console.log("✅ Marketing: Token saved to AsyncStorage");
        
        // Verify it was saved
        const savedToken = await AsyncStorage.getItem("fb_access_token");
        console.log("✅ Marketing: Verified saved token:", savedToken ? savedToken.substring(0, 20) + "..." : "null");
      } else {
        console.warn("⚠️ Marketing: Invalid token received in handleFacebookConnectSuccess");
      }
      
      if (accountId && typeof accountId === "string" && accountId.trim().length > 0) {
        await AsyncStorage.setItem("fb_ad_account_id", accountId.trim());
        console.log("✅ Marketing: Account ID saved to AsyncStorage");
      }
      
      setShowConnectModal(false);
      setConnectMethod(null);
      setAccessToken("");
      router.push("/MetaWorker");
    } catch (error) {
      console.error("❌ Marketing: Error saving token in handleFacebookConnectSuccess:", error);
      Alert.alert("Error", "Failed to save connection. Please try again.");
    }
  };

  const handleFacebookConnectError = (error) => {
    console.error("Facebook connection error:", error);
    setIsConnecting(false);
  };

  const handleTokenConnection = async (token = null) => {
    const tokenToUse = token || accessToken;
    
    if (!tokenToUse?.trim()) {
      Alert.alert("Error", "Please enter your Facebook Access Token");
      return;
    }

    setIsConnecting(true);

    try {
      const { API_BASE_URL } = require("../../config/api");
      
      // Fetch ad accounts using the dedicated endpoint
      const response = await axios.get(`${API_BASE_URL}/campaigns`, {
        headers: {
          "x-fb-access-token": tokenToUse,
        },
      });

      if (response.data.success) {
        console.log("✅ Marketing: Token validated, saving to AsyncStorage");
        const tokenToSave = tokenToUse.trim();
        await AsyncStorage.setItem("fb_access_token", tokenToSave);
        console.log("✅ Marketing: Token saved successfully");
        
        // Verify it was saved
        const savedToken = await AsyncStorage.getItem("fb_access_token");
        console.log("✅ Marketing: Verified saved token:", savedToken ? savedToken.substring(0, 20) + "..." : "null");
        
        // Get ad accounts from response
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
          console.log("✅ Marketing: Saving account ID:", accountId);
          await AsyncStorage.setItem("fb_ad_account_id", accountId);
          console.log("✅ Marketing: Account ID saved successfully");
          Alert.alert(
            "Success",
            "Your Meta account has been connected successfully!"
          );
          setShowConnectModal(false);
          setAccessToken("");
          setConnectMethod(null);
          router.push("/MetaWorker");
        } else {
          // Multiple accounts - show selection modal
          console.log("✅ Marketing: Multiple accounts found, showing selector");
          setAdAccounts(validAccounts);
          setShowAccountSelector(true);
        }
      } else {
        throw new Error("Invalid access token");
      }
    } catch (error) {
      console.error("Connection error:", error);
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
      console.log("✅ Marketing: Saving selected account ID:", accountId);
      await AsyncStorage.setItem("fb_ad_account_id", accountId);
      console.log("✅ Marketing: Account ID saved successfully");
      setShowAccountSelector(false);
      setShowConnectModal(false);
      setAccessToken("");
      setConnectMethod(null);
      Alert.alert(
        "Success",
        "Your Meta account has been connected successfully!"
      );
      router.push("/MetaWorker");
    } catch (error) {
      console.error("❌ Marketing: Error saving ad account:", error);
      Alert.alert("Error", "Failed to save ad account selection");
    }
  };

  const handleCloseDetail = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSelectedOption(null));
  };

  const renderOptionCard = (option) => (
    <TouchableOpacity
      key={option.id}
      style={[styles.optionCard, { borderLeftColor: option.color }]}
      onPress={() => handleOptionPress(option)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${option.color}15` },
          ]}
        >
          {option.icon}
        </View>
        <Text style={styles.cardTitle}>{option.title}</Text>
      </View>
      <Text style={styles.cardDescription}>{option.description}</Text>
      <View style={styles.cardFooter}>
        {option.comingSoon && (
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color={option.color} />
      </View>
    </TouchableOpacity>
  );

  const renderDetailView = () => {
    if (!selectedOption) return null;

    return (
      <Animated.View
        style={[
          styles.detailContainer,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View
          style={[
            styles.detailHeader,
            { backgroundColor: selectedOption.color },
          ]}
        >
          <TouchableOpacity
            onPress={handleCloseDetail}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.detailTitleContainer}>
            {selectedOption.icon}
            <Text style={styles.detailTitle}>{selectedOption.title}</Text>
          </View>
        </View>

        <View style={styles.detailContent}>
          <Text style={styles.detailDescription}>
            {selectedOption.description}
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: selectedOption.color }]}>
                {selectedOption?.stats.engagement}
              </Text>
              <Text style={styles.statLabel}>Engagement Rate</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: selectedOption.color }]}>
                {selectedOption.stats.roi}
              </Text>
              <Text style={styles.statLabel}>Higher ROI</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: selectedOption.color }]}>
                {selectedOption.stats.time}
              </Text>
              <Text style={styles.statLabel}>Setup Time</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.getStartedButton,
              { backgroundColor: selectedOption.color },
            ]}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
            <Feather
              name="arrow-right"
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFD" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Marketing Options</Text>
        <Text style={styles.headerSubtitle}>
          Choose the right channel for your campaign
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.optionsGrid}>
          {marketingOptions.map(renderOptionCard)}
        </View>

        {/* <View style={styles.footer}>
          <Text style={styles.footerText}>Need help choosing? </Text>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Contact our experts</Text>
          </TouchableOpacity>
        </View> */}
      </ScrollView>

      {/* {selectedOption && renderDetailView()} */}

      {/* Connect with Facebook Modal */}
      <Modal
        visible={showConnectModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowConnectModal(false);
          setConnectMethod(null);
          setAccessToken("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Connect Meta Account</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowConnectModal(false);
                  setConnectMethod(null);
                  setAccessToken("");
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {!connectMethod ? (
              <View style={styles.connectOptionsContainer}>
                <Text style={styles.connectOptionsTitle}>
                  Choose connection method:
                </Text>
                
                <FacebookConnectButton
                  onSuccess={handleFacebookConnectSuccess}
                  onError={handleFacebookConnectError}
                  buttonText="Connect with Facebook"
                  disabled={isConnecting}
                  style={[styles.connectOptionButton, { backgroundColor: "#1877F2" }]}
                  API_BASE_URL={require("../../config/api").API_BASE_URL}
                />

                <TouchableOpacity
                  style={[styles.connectOptionButton, { backgroundColor: "#6366f1" }]}
                  onPress={() => setConnectMethod("token")}
                >
                  <Ionicons name="key-outline" size={20} color="#fff" />
                  <Text style={styles.connectOptionText}>
                    Use Access Token
                  </Text>
                </TouchableOpacity>
              </View>
            ) : connectMethod === "token" ? (
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
                <View style={styles.tokenButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.tokenButton, styles.cancelButton]}
                    onPress={() => {
                      setConnectMethod(null);
                      setAccessToken("");
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.tokenButton,
                      styles.connectButton,
                      (!accessToken.trim() || isConnecting) && styles.connectButtonDisabled,
                    ]}
                    onPress={() => handleTokenConnection()}
                    disabled={!accessToken.trim() || isConnecting}
                  >
                    {isConnecting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.connectButtonText}>Connect</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

          </View>
        </View>
      </Modal>

      {/* Ad Account Selector Modal */}
      <Modal
        visible={showAccountSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAccountSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Ad Account</Text>
              <TouchableOpacity
                onPress={() => setShowAccountSelector(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.accountsList}>
              {adAccounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={styles.accountItem}
                  onPress={() => handleAccountSelect(account.id)}
                >
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>
                      {account.name || account.id}
                    </Text>
                    <Text style={styles.accountId}>ID: {account.id}</Text>
                    {account.currency && (
                      <Text style={styles.accountCurrency}>
                        Currency: {account.currency}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Loading Overlay */}
      <Modal
        visible={subscriptionLoading}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingModalContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingModalText}>Checking subscription...</Text>
          </View>
        </View>
      </Modal>

      {/* Loading Overlay */}
      <Modal
        visible={subscriptionLoading}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingModalContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingModalText}>Checking subscription...</Text>
          </View>
        </View>
      </Modal>

      {/* Upgrade Modal */}
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={async () => {
          console.log("🔒 Marketing: Upgrade modal closed");
          setShowUpgradeModal(false);
          
          // Refresh subscription when modal closes (in case user just made payment)
          console.log("🔄 Marketing: Refreshing subscription after modal close");
          await refreshSubscription();
          
          // Wait a moment for subscription state to update
          await new Promise(resolve => setTimeout(resolve, 500));
          
          console.log("✅ Marketing: Subscription refreshed - user can now access features");
        }}
        isPremiumFeature={upgradeFeatureName === "IVR Call marketing"}
        featureName={upgradeFeatureName || "Meta Ads"}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFD",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2D3748",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#718096",
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  optionsGrid: {
    padding: 16,
  },
  optionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3748",
  },
  cardDescription: {
    fontSize: 14,
    color: "#718096",
    marginBottom: 16,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  learnMore: {
    fontSize: 14,
    fontWeight: "600",
  },
  detailContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    zIndex: 10,
  },
  detailHeader: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 24,
    zIndex: 11,
  },
  detailTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginLeft: 12,
  },
  detailContent: {
    padding: 24,
  },
  detailDescription: {
    fontSize: 16,
    color: "#4A5568",
    lineHeight: 24,
    marginBottom: 32,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#718096",
    textAlign: "center",
  },
  getStartedButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  getStartedText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 14,
    color: "#718096",
  },
  footerLink: {
    fontSize: 14,
    color: "#4299E1",
    fontWeight: "600",
  },
  comingSoonBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#d97706",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "90%",
    maxHeight: "80%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2D3748",
  },
  modalCloseButton: {
    padding: 4,
  },
  connectOptionsContainer: {
    gap: 16,
  },
  connectOptionsTitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  connectOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
  },
  connectOptionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  tokenInputContainer: {
    gap: 12,
  },
  tokenLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  tokenInput: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#D8DEE6",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#1C1E21",
    minHeight: 100,
    textAlignVertical: "top",
  },
  tokenHint: {
    fontSize: 12,
    color: "#606770",
    fontStyle: "italic",
  },
  tokenButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  tokenButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#e2e8f0",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  connectButton: {
    backgroundColor: "#1877F2",
  },
  connectButtonDisabled: {
    opacity: 0.5,
  },
  connectButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    padding: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
  },
  accountsList: {
    maxHeight: 400,
  },
  accountItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3748",
    marginBottom: 4,
  },
  accountId: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  accountCurrency: {
    fontSize: 12,
    color: "#666",
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingModalContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    minWidth: 200,
  },
  loadingModalText: {
    marginTop: 16,
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
  },
});

export default MarketingOptionsScreen;
