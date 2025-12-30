import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

const Subscription = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentHtml, setPaymentHtml] = useState("");
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Load user data on mount
  useEffect(() => {
    loadUserData();
  }, []);

  // Refresh user data when screen comes into focus (after login/logout)
  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("authToken");
      
      // Clear user state if no data found (logout scenario)
      if (!userData) {
        setUser(null);
        setAuthToken(null);
        return;
      }
      
      // Set user data if found (login scenario)
      if (userData) {
        setUser(JSON.parse(userData));
      }
      if (token) {
        setAuthToken(token);
      } else {
        setAuthToken(null);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      // On error, clear user state
      setUser(null);
      setAuthToken(null);
    }
  };

  const plans = [
    {
      id: 1,
      name: "BASIC PLAN",
      regularPrice: 2000,
      earlyBirdPrice: 999,
      discount: 50,
      period: "month",
      features: [
        "Meta Ads",
        "WhatsApp Marketing",
        "Email Marketing",
        "Premium Festival Creatives",
        "Basic Customer Support",
      ],
      popular: false,
    },
    {
      id: 2,
      name: "PREMIUM PLAN",
      regularPrice: 5000,
      earlyBirdPrice: 2999,
      discount: 40,
      period: "month",
      features: [
        "Meta Ads",
        "WhatsApp Marketing",
        "Email Marketing",
        "SMS Marketing",
        "IVR Voice Campaign",
        "24x7 Priority Support",
        "Premium Festival Creatives",
      ],
      popular: true,
    },
  ];

  const earlyBirdBenefits = [
    "Flat Discount (Till 10 Jan 2026)",
    "1 Month 100 Users Bonuses",
    "1 Month Extra Subscription Free",
    "5 Premium Bonus Creatives",
    "500 Free Voice Call Credits",
    'Exclusive "Founder Badge" in App',
  ];

  const whyChooseLCM = [
    "AI-Based Meta Ads Support",
    "Unlimited Premium Creative Designs",
    "Voice Campaign Automation",
    "Real-Time Performance Dashboard",
  ];

  const handleSubscribe = async (plan: typeof plans[0]) => {
    if (!user) {
      Alert.alert("Login Required", "Please login to subscribe", [
        { text: "OK", onPress: () => router.push("/Login") },
      ]);
      return;
    }

    setLoading(true);

    try {
      const authToken = await AsyncStorage.getItem("authToken");
      const userId = user.id || user._id;

      // Create order on backend
      const config: any = {};
      if (authToken) {
        config.headers = {
          Authorization: `Bearer ${authToken}`,
        };
      }

      const orderResponse = await axios.post(
        `${API_BASE_URL}/subscription/create-order`,
        {
          amount: plan.earlyBirdPrice,
          currency: "INR",
          planId: plan.id,
          planName: plan.name,
          userId: userId,
        },
        config
      );

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.message || "Failed to create order");
      }

      const { order, keyId } = orderResponse.data;

      // Create HTML for Razorpay checkout
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        </head>
        <body style="margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5;">
          <div id="razorpay-container"></div>
          <script>
            var options = {
              "key": "${keyId}",
              "amount": "${order.amount}",
              "currency": "INR",
              "name": "LCM",
              "description": "${plan.name} Subscription",
              "order_id": "${order.id}",
              "handler": function (response) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'success',
                  data: response
                }));
              },
              "prefill": {
                "name": "${user.name || ""}",
                "email": "${user.email || ""}",
                "contact": "${user.phoneNumber || ""}"
              },
              "theme": {
                "color": "#6366f1"
              },
              "modal": {
                "ondismiss": function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'cancelled'
                  }));
                }
              }
            };
            var rzp = new Razorpay(options);
            rzp.open();
          </script>
        </body>
        </html>
      `;

      setCurrentPlan(plan);
      setPaymentHtml(htmlContent);
      setShowPaymentWebView(true);
    } catch (error: any) {
      console.error("Subscription error:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || error.message || "Failed to process subscription"
      );
      setLoading(false);
    }
  };

  const handleWebViewMessage = async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      if (message.type === "cancelled") {
        setShowPaymentWebView(false);
        setLoading(false);
        return;
      }

      if (message.type === "success") {
        setShowPaymentWebView(false);
        
        // Verify payment on backend
        const verifyConfig: any = {};
        if (authToken) {
          verifyConfig.headers = {
            Authorization: `Bearer ${authToken}`,
          };
        }

        const verifyResponse = await axios.post(
          `${API_BASE_URL}/subscription/verify-payment`,
          {
            razorpay_order_id: message.data.razorpay_order_id,
            razorpay_payment_id: message.data.razorpay_payment_id,
            razorpay_signature: message.data.razorpay_signature,
            planId: currentPlan.id,
            planName: currentPlan.name,
            amount: currentPlan.earlyBirdPrice,
            userId: user?.id || user?._id,
          },
          verifyConfig
        );

        if (verifyResponse.data.success) {
          Alert.alert(
            "Success",
            "Payment successful! Your subscription is now active.",
            [{ text: "OK" }]
          );
        } else {
          Alert.alert("Error", "Payment verification failed. Please contact support.");
        }
        setLoading(false);
      }
    } catch (error: any) {
      console.error("Error handling payment response:", error);
      setShowPaymentWebView(false);
      setLoading(false);
      Alert.alert("Error", "Failed to process payment. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subscription</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Page Header */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>LCM - Launch Price Plans</Text>
            <Text style={styles.pageSubtitle}>
              Choose the perfect plan for your business needs
            </Text>
          </View>

          {/* Pricing Plans */}
          <View style={styles.plansContainer}>
            {plans.map((plan) => (
              <View key={plan.id} style={styles.planWrapper}>
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>Most Popular</Text>
                  </View>
                )}
                <View
                  style={[
                    styles.planCard,
                    plan.popular && styles.planCardPopular,
                  ]}
                >
                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    
                    <View style={styles.priceContainer}>
                      <View style={styles.priceRow}>
                        <Text style={styles.earlyBirdPrice}>
                          ₹{plan.earlyBirdPrice.toLocaleString()}
                        </Text>
                        <Text style={styles.period}>/{plan.period}</Text>
                        {plan.discount && (
                          <View style={styles.discountBadge}>
                            <Text style={styles.discountBadgeText}>
                              {plan.discount}% OFF
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.regularPriceRow}>
                        <Text style={styles.regularPrice}>
                          From ₹{plan.regularPrice.toLocaleString()}
                        </Text>
                        <View style={styles.earlyBirdTag}>
                          <Text style={styles.earlyBirdTagText}>Launching Offer</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.featuresContainer}>
                    {plan.features.map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <View style={styles.checkIcon}>
                          <Ionicons name="checkmark" size={14} color="#9333ea" />
                        </View>
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.subscribeButton,
                      plan.popular && styles.subscribeButtonPopular,
                      loading && styles.subscribeButtonDisabled,
                    ]}
                    onPress={() => handleSubscribe(plan)}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text
                        style={[
                          styles.subscribeButtonText,
                          plan.popular && styles.subscribeButtonTextPopular,
                        ]}
                      >
                        Get Started
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Early Bird Benefits */}
          <View style={styles.benefitsCard}>
            <View style={styles.benefitsHeader}>
              <View style={styles.benefitsIconContainer}>
                <Ionicons name="flash" size={24} color="#f97316" />
              </View>
              <Text style={styles.benefitsTitle}>Early Bird Benefits</Text>
            </View>
            <View style={styles.benefitsGrid}>
              {earlyBirdBenefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <View style={styles.benefitCheckIcon}>
                    <Ionicons name="checkmark" size={12} color="#f97316" />
                  </View>
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Why Choose LCM */}
          <View style={styles.whyChooseCard}>
            <View style={styles.whyChooseContent}>
              <View style={styles.whyChooseHeader}>
                <View>
                  <Text style={styles.whyChooseTitle}>Why Choose LCM?</Text>
                  <Text style={styles.whyChooseSubtitle}>
                    Discover what makes us the best choice for your business
                  </Text>
                </View>
                <View style={styles.starIconContainer}>
                  <View style={styles.starIcon}>
                    <Ionicons name="star" size={32} color="#fbbf24" />
                  </View>
                </View>
              </View>
              <View style={styles.whyChooseList}>
                {whyChooseLCM.map((reason, index) => (
                  <View key={index} style={styles.whyChooseItem}>
                    <View style={styles.whyChooseCheckBox} />
                    <Text style={styles.whyChooseText}>{reason}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Trust Indicators */}
          <View style={styles.trustSection}>
            <View style={styles.trustItem}>
              <View style={[styles.trustIcon, { backgroundColor: "#22c55e" }]}>
                <Ionicons name="shield-checkmark" size={28} color="#ffffff" />
              </View>
              <Text style={styles.trustText}>Secure Payment</Text>
            </View>
            <View style={styles.trustItem}>
              <View style={[styles.trustIcon, { backgroundColor: "#3b82f6" }]}>
                <Ionicons name="refresh" size={28} color="#ffffff" />
              </View>
              <Text style={styles.trustText}>Cancel Anytime</Text>
            </View>
            <View style={styles.trustItem}>
              <View style={[styles.trustIcon, { backgroundColor: "#a855f7" }]}>
                <Ionicons name="trophy" size={28} color="#ffffff" />
              </View>
              <Text style={styles.trustText}>Premium Support</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Razorpay Payment WebView Modal */}
      <Modal
        visible={showPaymentWebView}
        animationType="slide"
        onRequestClose={() => {
          setShowPaymentWebView(false);
          setLoading(false);
        }}
      >
        <SafeAreaView style={styles.webViewContainer}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowPaymentWebView(false);
                setLoading(false);
              }}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
            <Text style={styles.webViewTitle}>Complete Payment</Text>
            <View style={styles.placeholder} />
          </View>
          <WebView
            source={{ html: paymentHtml }}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color="#6366f1" />
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  pageHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
    textAlign: "center",
  },
  pageSubtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
  },
  plansContainer: {
    marginBottom: 32,
  },
  planWrapper: {
    marginBottom: 24,
    position: "relative",
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    left: "50%",
    transform: [{ translateX: -60 }],
    backgroundColor: "#9333ea",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  popularBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  planCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  planCardPopular: {
    borderColor: "#e9d5ff",
    transform: [{ scale: 1.02 }],
  },
  planHeader: {
    marginBottom: 24,
  },
  planName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
  },
  priceContainer: {
    marginTop: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  earlyBirdPrice: {
    fontSize: 36,
    fontWeight: "700",
    color: "#1e293b",
  },
  period: {
    fontSize: 16,
    color: "#64748b",
    marginLeft: 4,
  },
  regularPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  regularPrice: {
    fontSize: 14,
    color: "#94a3b8",
    textDecorationLine: "line-through",
  },
  earlyBirdTag: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  earlyBirdTagText: {
    color: "#166534",
    fontSize: 11,
    fontWeight: "600",
  },
  featuresContainer: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 20,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  checkIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#f3e8ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  featureText: {
    fontSize: 14,
    color: "#475569",
    flex: 1,
  },
  subscribeButton: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  subscribeButtonPopular: {
    backgroundColor: "#9333ea",
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  subscribeButtonTextPopular: {
    color: "#ffffff",
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  discountBadge: {
    backgroundColor: "#fbbf24",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  discountBadgeText: {
    color: "#92400e",
    fontSize: 11,
    fontWeight: "700",
  },
  benefitsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  benefitsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  benefitsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  benefitsGrid: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff7ed",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  benefitCheckIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  benefitText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#475569",
    flex: 1,
  },
  whyChooseCard: {
    backgroundColor: "#9333ea",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  whyChooseContent: {
    position: "relative",
    zIndex: 1,
  },
  whyChooseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  whyChooseTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 8,
  },
  whyChooseSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#ffffff",
    opacity: 0.95,
  },
  starIconContainer: {
    alignItems: "center",
  },
  starIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fbbf24",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  whyChooseList: {
    gap: 12,
  },
  whyChooseItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  whyChooseCheckBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.6)",
    marginRight: 12,
  },
  whyChooseText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#ffffff",
    flex: 1,
  },
  trustSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 24,
  },
  trustItem: {
    alignItems: "center",
    flex: 1,
  },
  trustIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  trustText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  webViewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  closeButton: {
    padding: 8,
  },
  webViewTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
  webViewLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
});

export default Subscription;
