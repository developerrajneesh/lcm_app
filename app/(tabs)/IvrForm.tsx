import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Linking from "expo-linking";
import * as Clipboard from "expo-clipboard";
import { WebView } from "react-native-webview";
import { API_BASE_URL } from "../../config/api";
import { useSubscription } from "../../hooks/useSubscription";
import {
  hasFeatureAccess,
  hasActiveSubscription,
} from "../../utils/subscription";
import UpgradeModal from "../../Components/UpgradeModal";

const IvrForm = () => {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [existingRequest, setExistingRequest] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [creditsAmount, setCreditsAmount] = useState("");
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentHtml, setPaymentHtml] = useState("");
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Subscription
  const { subscription, refreshSubscription, loading: subscriptionLoading } = useSubscription();

  // Use a ref to store the latest refreshSubscription function and prevent multiple simultaneous refreshes
  const refreshSubscriptionRef = useRef(refreshSubscription);
  const isRefreshingRef = useRef(false);
  
  // Update ref when refreshSubscription changes
  useEffect(() => {
    refreshSubscriptionRef.current = refreshSubscription;
  }, [refreshSubscription]);

  // Refresh subscription when screen comes into focus (e.g., after payment)
  useFocusEffect(
    useCallback(() => {
      // Prevent multiple simultaneous refreshes
      if (isRefreshingRef.current) {
        return;
      }
      
      isRefreshingRef.current = true;
      console.log("🔄 IvrForm: Screen focused - refreshing subscription");
      refreshSubscriptionRef.current();
      
      // Reset ref after a short delay
      setTimeout(() => {
        isRefreshingRef.current = false;
      }, 1000);
    }, []) // Empty dependency array - only run on focus
  );

  // Auto-hide upgrade modal when subscription becomes active
  useEffect(() => {
    if (!subscriptionLoading && subscription) {
      const hasActive = hasActiveSubscription(subscription);
      const hasAccess = hasFeatureAccess(subscription, "ivr-campaign");
      
      if (hasActive && hasAccess) {
        console.log("✅ IvrForm: Subscription is now active - hiding upgrade modal");
        setShowUpgradeModal(false);
      }
    }
  }, [subscription, subscriptionLoading]);

  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    emailId: "",
    userId: "",
    password: "",
    companyName: "",
    businessType: "",
    state: "",
    ivrType: "",
  });

  const businessTypes = [
    "Individual",
    "Proprietorship",
    "Partnership",
    "Pvt Ltd",
    "Other",
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("authToken");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setAuthToken(token);
        checkExistingRequest(parsedUser.id);
      } else {
        Alert.alert("Error", "Please login to apply for IVR");
        router.back();
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      setCheckingStatus(false);
    }
  };

  const checkExistingRequest = async (userId: string) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/ivr-requests/my-requests`,
        {
          headers: {
            "user-id": userId,
          },
        }
      );

      if (response.data.success && response.data.data.length > 0) {
        const latestRequest = response.data.data[0];
        setExistingRequest(latestRequest);
      }
    } catch (err) {
      console.error("Error checking existing request:", err);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSubmit = async () => {
    setError("");

    // Check subscription first - wait if still loading
    if (subscriptionLoading) {
      // Show loader - subscription loading state will be handled by the component
      // Wait for subscription to load, then proceed
      const checkSubscription = setInterval(() => {
        if (!subscriptionLoading) {
          clearInterval(checkSubscription);
          // Retry the action after subscription loads
          setTimeout(() => handleSubmit(), 100);
        }
      }, 100);
      return;
    }

    console.log("🔍 IvrForm: Checking subscription for IVR campaign");
    console.log("  - Loading:", subscriptionLoading);
    console.log("  - Subscription:", subscription ? JSON.stringify(subscription, null, 2) : "null");
    
    const hasActive = hasActiveSubscription(subscription);
    const hasAccess = hasFeatureAccess(subscription, "ivr-campaign");
    
    console.log("  - Has active subscription:", hasActive);
    console.log("  - Has IVR access:", hasAccess);

    if (!hasActive || !hasAccess) {
      console.log("❌ IvrForm: Subscription check failed - showing upgrade modal");
      setShowUpgradeModal(true);
      return;
    }
    
    console.log("✅ IvrForm: Subscription check passed - proceeding with submission");

    setLoading(true);

    // Check if user already has a pending or approved request
    if (existingRequest && existingRequest.status !== "rejected") {
      setError(
        "You have already submitted an IVR request. Please wait for admin approval."
      );
      setLoading(false);
      return;
    }

    // Validation
    if (
      !formData.fullName ||
      !formData.mobileNumber ||
      !formData.emailId ||
      !formData.userId ||
      !formData.password ||
      !formData.companyName ||
      !formData.state ||
      !formData.ivrType
    ) {
      setError("Please fill all required fields");
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.emailId)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    // Password validation
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    // Mobile validation
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(formData.mobileNumber.replace(/\D/g, ""))) {
      setError("Please enter a valid 10-digit mobile number");
      setLoading(false);
      return;
    }

    try {
      // Clean and format the payload to match web form
      const payload = {
        fullName: formData.fullName.trim(),
        mobileNumber: formData.mobileNumber.replace(/\D/g, ""), // Remove non-digits
        emailId: formData.emailId.trim().toLowerCase(),
        userId: formData.userId.trim(),
        password: formData.password,
        companyName: formData.companyName.trim(),
        businessType: formData.businessType.trim(),
        state: formData.state.trim(),
        ivrType: formData.ivrType.trim() || "15s", // Default to "15s" if empty
      };

      const response = await axios.post(
        `${API_BASE_URL}/ivr-requests`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "user-id": user.id,
          },
        }
      );

      if (response.data.success) {
        setSuccess(true);
        // Refresh existing request status
        await checkExistingRequest(user.id);
        // Reset form
        setFormData({
          fullName: "",
          mobileNumber: "",
          emailId: "",
          userId: "",
          password: "",
          companyName: "",
          businessType: "",
          state: "",
          ivrType: "",
        });
        Alert.alert("Success", "IVR request submitted successfully!");
      } else {
        setError(response.data.error || "Failed to submit request");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Network error. Please try again."
      );
      console.error("Error submitting IVR request:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied", `${label} copied to clipboard!`);
  };

  const openIvrPlatform = () => {
    Linking.openURL("https://voice.whatsupninja.in/");
  };

  const handleBuyCredits = async () => {
    if (!creditsAmount || parseInt(creditsAmount) < 5000) {
      Alert.alert("Error", "Minimum 5000 credits required");
      return;
    }

    if (!existingRequest || !existingRequest.ivrType) {
      Alert.alert("Error", "IVR Type not found. Please contact support.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const ivrType = existingRequest.ivrType || "15s";
      const pricePerCredit = ivrType === "30s" ? 0.24 : 0.15;
      const totalAmount = pricePerCredit * parseInt(creditsAmount);

      // Create order on backend
      const config: any = {
        headers: {
          "Content-Type": "application/json",
          "user-id": user.id,
        },
      };

      if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
      }

      const orderResponse = await axios.post(
        `${API_BASE_URL}/ivr-credits/create-order`,
        {
          amount: totalAmount,
          credits: parseInt(creditsAmount),
          ivrType: ivrType,
          ivrRequestId: existingRequest._id,
        },
        config
      );

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.error || "Failed to create order");
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
              "description": "IVR Credits - ${creditsAmount} credits (${ivrType})",
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

      setPaymentHtml(htmlContent);
      setShowPaymentWebView(true);
      setShowCreditsModal(false);
      setLoading(false);
    } catch (err: any) {
      console.error("Error processing payment:", err);
      Alert.alert(
        "Error",
        err.response?.data?.error ||
          err.message ||
          "Failed to process payment. Please try again."
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
        const verifyConfig: any = {
          headers: {
            "Content-Type": "application/json",
            "user-id": user.id,
          },
        };

        if (authToken) {
          verifyConfig.headers.Authorization = `Bearer ${authToken}`;
        }

        const ivrType = existingRequest.ivrType || "15s";
        const pricePerCredit = ivrType === "30s" ? 0.24 : 0.15;
        const totalAmount = pricePerCredit * parseInt(creditsAmount);

        const verifyResponse = await axios.post(
          `${API_BASE_URL}/ivr-credits/verify-payment`,
          {
            razorpay_order_id: message.data.razorpay_order_id,
            razorpay_payment_id: message.data.razorpay_payment_id,
            razorpay_signature: message.data.razorpay_signature,
            credits: parseInt(creditsAmount),
            ivrType: ivrType,
            ivrRequestId: existingRequest._id,
            amount: totalAmount,
          },
          verifyConfig
        );

        if (verifyResponse.data.success) {
          Alert.alert(
            "Success",
            "Payment successful! Credits have been added to your account.",
            [
              {
                text: "OK",
                onPress: () => {
                  setCreditsAmount("");
                  setError("");
                },
              },
            ]
          );
        } else {
          Alert.alert(
            "Error",
            verifyResponse.data.error ||
              "Payment verification failed. Please contact support."
          );
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

  // Show loading state while checking existing request
  if (checkingStatus) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>
            Checking your application status...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show pending status
  if (existingRequest && existingRequest.status === "pending") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#1e293b" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>IVR Application</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.statusContainer}>
            <View style={styles.statusIconContainer}>
              <Ionicons name="time-outline" size={48} color="#f59e0b" />
            </View>
            <Text style={styles.statusTitle}>Application Pending</Text>
            <Text style={styles.statusText}>
              Your application is pending. Please wait for admin approval.
            </Text>
            <Text style={styles.statusDate}>
              Submitted on:{" "}
              {new Date(existingRequest.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Show approved status with credentials
  if (existingRequest && existingRequest.status === "approved") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#1e293b" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>IVR Application</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.approvedContainer}>
            <View style={styles.approvedIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
            </View>
            <Text style={styles.approvedTitle}>Application Approved!</Text>
            <Text style={styles.approvedText}>
              Your IVR account has been approved. Use the credentials below to
              access the IVR platform.
            </Text>

            <View style={styles.credentialsContainer}>
              <Text style={styles.credentialsTitle}>
                Your Login Credentials
              </Text>

              <View style={styles.credentialItem}>
                <Text style={styles.credentialLabel}>User ID</Text>
                <View style={styles.credentialRow}>
                  <TextInput
                    style={styles.credentialInput}
                    value={
                      existingRequest.accountUserId ||
                      existingRequest.userId ||
                      ""
                    }
                    editable={false}
                  />
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() =>
                      copyToClipboard(
                        existingRequest.accountUserId ||
                          existingRequest.userId ||
                          "",
                        "User ID"
                      )
                    }
                  >
                    <Ionicons name="copy-outline" size={20} color="#6366f1" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.credentialItem}>
                <Text style={styles.credentialLabel}>Password</Text>
                <View style={styles.credentialRow}>
                  <TextInput
                    style={styles.credentialInput}
                    value={
                      existingRequest.accountPassword ||
                      existingRequest.password ||
                      ""
                    }
                    editable={false}
                    secureTextEntry={false}
                  />
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() =>
                      copyToClipboard(
                        existingRequest.accountPassword ||
                          existingRequest.password ||
                          "",
                        "Password"
                      )
                    }
                  >
                    <Ionicons name="copy-outline" size={20} color="#6366f1" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.ivrButton, styles.buttonHalf]}
                onPress={openIvrPlatform}
              >
                <Ionicons name="call-outline" size={20} color="#ffffff" />
                <Text style={styles.ivrButtonText}>Go to IVR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.creditsButton, styles.buttonHalf]}
                onPress={() => setShowCreditsModal(true)}
              >
                <Ionicons name="card-outline" size={20} color="#ffffff" />
                <Text style={styles.creditsButtonText}>Buy Credits</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Buy Credits Modal */}
        <Modal
          visible={showCreditsModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setShowCreditsModal(false);
            setCreditsAmount("");
            setError("");
          }}
        >
          <SafeAreaView style={styles.modalOverlayContainer}>
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => {
                setShowCreditsModal(false);
                setCreditsAmount("");
                setError("");
              }}
            >
              <TouchableOpacity
                style={styles.modalContent}
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Buy IVR Credits</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowCreditsModal(false);
                      setCreditsAmount("");
                      setError("");
                    }}
                  >
                    <Ionicons name="close" size={24} color="#1e293b" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.modalBody}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Enter Credits Amount *</Text>
                    <TextInput
                      style={styles.input}
                      value={creditsAmount}
                      onChangeText={(text) => {
                        setCreditsAmount(text);
                        setError("");
                      }}
                      placeholder="Minimum 5000 credits"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                    />
                    <Text style={styles.helperText}>Minimum: 5000 credits</Text>
                  </View>

                  {creditsAmount && parseInt(creditsAmount) >= 5000 && (
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceTitle}>Price Details</Text>
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>IVR Type:</Text>
                        <Text style={styles.priceValue}>
                          {existingRequest?.ivrType || "15s"}
                        </Text>
                      </View>
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Price per Credit:</Text>
                        <Text style={styles.priceValue}>
                          ₹
                          {existingRequest?.ivrType === "30s" ? "0.24" : "0.15"}
                        </Text>
                      </View>
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Total Credits:</Text>
                        <Text style={styles.priceValue}>
                          {parseInt(creditsAmount).toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.priceDivider} />
                      <View style={styles.priceRow}>
                        <Text style={styles.totalLabel}>Total Amount:</Text>
                        <Text style={styles.totalValue}>
                          ₹
                          {(
                            (existingRequest?.ivrType === "30s" ? 0.24 : 0.15) *
                            parseInt(creditsAmount)
                          ).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {error ? (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[
                      styles.payButton,
                      (!creditsAmount ||
                        parseInt(creditsAmount) < 5000 ||
                        loading) &&
                        styles.payButtonDisabled,
                    ]}
                    onPress={handleBuyCredits}
                    disabled={
                      !creditsAmount ||
                      parseInt(creditsAmount) < 5000 ||
                      loading
                    }
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Ionicons
                          name="card-outline"
                          size={20}
                          color="#ffffff"
                        />
                        <Text style={styles.payButtonText}>
                          Proceed to Payment
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </SafeAreaView>
        </Modal>

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
  }

  // Show rejected status
  if (existingRequest && existingRequest.status === "rejected") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#1e293b" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>IVR Application</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.rejectedContainer}>
            <View style={styles.rejectedIconContainer}>
              <Ionicons name="close-circle" size={64} color="#ef4444" />
            </View>
            <Text style={styles.rejectedTitle}>Application Rejected</Text>
            {existingRequest.adminNotes && (
              <View style={styles.rejectionNotesContainer}>
                <Text style={styles.rejectionNotesTitle}>
                  Rejection Reason:
                </Text>
                <Text style={styles.rejectionNotesText}>
                  {existingRequest.adminNotes}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.reapplyButton}
              onPress={() => {
                setExistingRequest(null);
                setError("");
              }}
            >
              <Text style={styles.reapplyButtonText}>Re-apply</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Show form
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>IVR Application</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                Request submitted successfully!
              </Text>
            </View>
          ) : null}

          {/* User Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.fullName}
                onChangeText={(text) => {
                  setFormData({ ...formData, fullName: text });
                  setError("");
                }}
                placeholder="Enter your full name"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Number *</Text>
              <TextInput
                style={styles.input}
                value={formData.mobileNumber}
                onChangeText={(text) => {
                  setFormData({ ...formData, mobileNumber: text });
                  setError("");
                }}
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email ID *</Text>
              <TextInput
                style={styles.input}
                value={formData.emailId}
                onChangeText={(text) => {
                  setFormData({ ...formData, emailId: text });
                  setError("");
                }}
                placeholder="Enter your email"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Account Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Create User ID *</Text>
              <TextInput
                style={styles.input}
                value={formData.userId}
                onChangeText={(text) => {
                  setFormData({ ...formData, userId: text });
                  setError("");
                }}
                placeholder="Enter desired user ID"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Create Password *</Text>
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={(text) => {
                  setFormData({ ...formData, password: text });
                  setError("");
                }}
                placeholder="Enter password (min 8 characters)"
                placeholderTextColor="#94a3b8"
                secureTextEntry
              />
            </View>
          </View>

          {/* Business Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.companyName}
                onChangeText={(text) => {
                  setFormData({ ...formData, companyName: text });
                  setError("");
                }}
                placeholder="Enter company name"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Type</Text>
              <View style={styles.pickerContainer}>
                {businessTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.pickerOption,
                      formData.businessType === type &&
                        styles.pickerOptionSelected,
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, businessType: type });
                      setError("");
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        formData.businessType === type &&
                          styles.pickerOptionTextSelected,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>State *</Text>
              <TextInput
                style={styles.input}
                value={formData.state}
                onChangeText={(text) => {
                  setFormData({ ...formData, state: text });
                  setError("");
                }}
                placeholder="Enter state"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>IVR Type *</Text>
              <View style={styles.pickerContainer}>
                {["15s", "30s"].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.pickerOption,
                      formData.ivrType === type && styles.pickerOptionSelected,
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, ivrType: type });
                      setError("");
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        formData.ivrType === type &&
                          styles.pickerOptionTextSelected,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                <Text style={styles.submitButtonText}>
                  Create Account & Submit for Verification
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

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
          setShowUpgradeModal(false);
          
          // Refresh subscription when modal closes (in case user just made payment)
          console.log("🔄 IvrForm: Refreshing subscription after modal close");
          await refreshSubscription();
          
          // Wait a moment for subscription state to update
          await new Promise(resolve => setTimeout(resolve, 500));
          
          console.log("✅ IvrForm: Subscription refreshed - user can now access IVR features");
        }}
        isPremiumFeature={true}
        featureName="IVR Campaign"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
  },
  errorContainer: {
    backgroundColor: "#fee2e2",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
    marginBottom: 20,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
  },
  successContainer: {
    backgroundColor: "#dcfce7",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    marginBottom: 20,
  },
  successText: {
    color: "#16a34a",
    fontSize: 14,
  },
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#1e293b",
  },
  pickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  pickerOptionSelected: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  pickerOptionText: {
    fontSize: 14,
    color: "#64748b",
  },
  pickerOptionTextSelected: {
    color: "#ffffff",
    fontWeight: "600",
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
  uploadButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "500",
  },
  filePreviewContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filePreviewText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "500",
  },
  removeFileButton: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Status screens
  statusContainer: {
    backgroundColor: "#fef3c7",
    borderRadius: 16,
    padding: 24,
    margin: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fde047",
  },
  statusIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 12,
  },
  statusDate: {
    fontSize: 12,
    color: "#94a3b8",
  },
  approvedContainer: {
    padding: 20,
  },
  approvedIconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  approvedTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 8,
  },
  approvedText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
  },
  credentialsContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  credentialsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 16,
  },
  credentialItem: {
    marginBottom: 16,
  },
  credentialLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },
  credentialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  credentialInput: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: "monospace",
  },
  copyButton: {
    padding: 12,
    backgroundColor: "#e0e7ff",
    borderRadius: 8,
  },
  ivrButton: {
    backgroundColor: "#22c55e",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  ivrButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  rejectedContainer: {
    padding: 20,
    alignItems: "center",
  },
  rejectedIconContainer: {
    marginBottom: 16,
  },
  rejectedTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
  },
  rejectionNotesContainer: {
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: "100%",
  },
  rejectionNotesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#991b1b",
    marginBottom: 8,
  },
  rejectionNotesText: {
    fontSize: 14,
    color: "#7f1d1d",
  },
  reapplyButton: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  reapplyButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  buttonHalf: {
    flex: 1,
  },
  creditsButton: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  creditsButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Modal Styles
  modalOverlayContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-start",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    maxHeight: "90%",
    paddingBottom: 20,
    paddingTop: 30,
    marginTop: 0,
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  priceContainer: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  priceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: "#64748b",
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1e293b",
  },
  priceDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6366f1",
  },
  payButton: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  payButtonDisabled: {
    backgroundColor: "#94a3b8",
    opacity: 0.6,
  },
  payButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
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
    marginTop: 35,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  webViewTitle: {
    fontSize: 18,
    fontWeight: "600",
    // marginTop: 35,
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

export default IvrForm;
