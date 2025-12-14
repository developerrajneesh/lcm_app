import {
  Feather,
  FontAwesome6,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { router } from "expo-router";
import { useState, useEffect } from "react";
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
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import axios from "axios";

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

  // Set up deep link listener for Facebook OAuth callback
  useEffect(() => {
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = async ({ url }) => {
    console.log("Deep link received:", url);
    
    // Check if this is a Facebook OAuth callback
    if (url.includes('facebook-callback')) {
      setIsConnecting(true);
      
      // Check for error first
      const errorMatch = url.match(/[?&#]error=([^&]+)/);
      if (errorMatch) {
        const error = decodeURIComponent(errorMatch[1]);
        const errorDescMatch = url.match(/[?&#]error_description=([^&]+)/);
        const errorDesc = errorDescMatch ? decodeURIComponent(errorDescMatch[1]) : '';
        
        Alert.alert("Facebook Login Error", errorDesc || error);
        setIsConnecting(false);
        setShowConnectModal(false);
        return;
      }
      
      // Extract access token from URL
      let accessToken = null;
      
      // Try to extract from hash fragment (preferred method)
      const hashIndex = url.indexOf('#');
      if (hashIndex !== -1) {
        const hash = url.substring(hashIndex + 1);
        const params = hash.split('&');
        
        for (const param of params) {
          const [key, value] = param.split('=');
          if (key === 'access_token') {
            accessToken = decodeURIComponent(value);
            break;
          }
        }
      }
      
      // If not found in hash, try query params
      if (!accessToken) {
        const queryIndex = url.indexOf('?');
        if (queryIndex !== -1) {
          const query = url.substring(queryIndex + 1);
          const params = query.split('&');
          
          for (const param of params) {
            const [key, value] = param.split('=');
            if (key === 'access_token') {
              accessToken = decodeURIComponent(value);
              break;
            }
          }
        }
      }
      
      // If still not found, try regex
      if (!accessToken) {
        const match = url.match(/access_token=([^&]+)/);
        if (match && match[1]) {
          accessToken = decodeURIComponent(match[1]);
        }
      }
      
      if (accessToken) {
        await handleTokenConnection(accessToken);
      } else {
        Alert.alert("Error", "Could not extract access token from callback URL.");
        setIsConnecting(false);
      }
    }
  };

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
      route: "/MetaWorker",
    },
    {
      id: 2,
      title: "IVR",
      description:
        "Interactive Voice Response system for automated customer engagement",
      icon: <Ionicons name="call-outline" size={24} color="#10B981" />,
      color: "#10B981",
      gradient: ["#10B981", "#059669"],
      stats: { engagement: "90%", roi: "3.0x", time: "48h" },
      route: "/IvrForm",
    },
    {
      id: 3,
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
      id: 4,
      title: "SMS Marketing",
      description: "Send targeted text messages with high open rates",
      icon: <Ionicons name="chatbubble" size={24} color="#8E44AD" />,
      color: "#8E44AD",
      gradient: ["#8E44AD", "#6C3483"],
      stats: { engagement: "95%", roi: "3.2x", time: "1h" },
      route: null,
      comingSoon: true,
    },
  ];

  const handleOptionPress = (option) => {
    if (option.comingSoon) {
      Alert.alert("Coming Soon", `${option.title} is currently under development. We're working hard to bring you this amazing feature soon!`);
      return;
    }
    if (option.id === 1) {
      // Meta Ads - show connect modal
      setShowConnectModal(true);
    } else if (option.route) {
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

  const handleConnectWithFacebook = async () => {
    setIsConnecting(true);
    try {
      const FACEBOOK_APP_ID = "925493953121496";
      // Use web redirect URI - backend will handle callback and redirect to app
      const REDIRECT_URI = "https://api.leadscraftmarketing.com/facebook-callback";
      
      // Facebook OAuth URL with required permissions
      // Using response_type=token for implicit flow (returns token in URL fragment)
      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=ads_management,ads_read,business_management,public_profile,email&display=popup`;
      
      console.log("Opening Facebook OAuth in external browser:", authUrl);
      
      // Open Facebook OAuth in external browser (not in-app browser)
      await WebBrowser.openBrowserAsync(authUrl, {
        showInRecents: true,
        enableBarCollapsing: false,
      });
      
      // Show instruction to user
      Alert.alert(
        "Facebook Login",
        "Please complete the login in the browser. After logging in, you will be redirected back to the app.",
        [{ text: "OK" }]
      );
      
      // Note: The deep link handler (handleDeepLink) will catch the callback
      // when Facebook redirects to lcm://facebook-callback
      // Don't set isConnecting to false here - it will be handled in handleDeepLink
    } catch (error) {
      console.error("Facebook OAuth error:", error);
      Alert.alert("Error", "Failed to connect with Facebook. Please try using access token method.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTokenConnection = async (token = null) => {
    const tokenToUse = token || accessToken;
    
    if (!tokenToUse?.trim()) {
      Alert.alert("Error", "Please enter your Facebook Access Token");
      return;
    }

    setIsConnecting(true);

    try {
      const API_BASE_URL = "http://192.168.1.9:5000/api/v1";
      
      // Fetch ad accounts using the dedicated endpoint
      const response = await axios.get(`${API_BASE_URL}/campaigns`, {
        headers: {
          "x-fb-access-token": tokenToUse,
        },
      });

      if (response.data.success) {
        await AsyncStorage.setItem("fb_access_token", tokenToUse);
        
        // Get ad accounts from response
        const accounts = response.data.adAccounts?.data || [];
        const validAccounts = accounts.filter(
          (account) => account && account.id && typeof account.id === "string" && account.id.trim() !== ""
        );

        if (validAccounts.length === 0) {
          Alert.alert(
            "No Ad Accounts",
            "No valid ad accounts found. Please make sure you have ad accounts in your Meta Business Manager."
          );
          setIsConnecting(false);
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
          setShowConnectModal(false);
          setAccessToken("");
          setConnectMethod(null);
          router.push("/MetaWorker");
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
      setShowConnectModal(false);
      setAccessToken("");
      setConnectMethod(null);
      Alert.alert(
        "Success",
        "Your Meta account has been connected successfully!"
      );
      router.push("/MetaWorker");
    } catch (error) {
      console.error("Error saving ad account:", error);
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
                
                <TouchableOpacity
                  style={[styles.connectOptionButton, { backgroundColor: "#1877F2" }]}
                  onPress={handleConnectWithFacebook}
                  disabled={isConnecting}
                >
                  <FontAwesome6 name="facebook" size={20} color="#fff" />
                  <Text style={styles.connectOptionText}>
                    Connect with Facebook
                  </Text>
                </TouchableOpacity>

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

            {isConnecting && connectMethod === "facebook" && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1877F2" />
                <Text style={styles.loadingText}>Connecting to Facebook...</Text>
              </View>
            )}
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
});

export default MarketingOptionsScreen;
