import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Subscription = () => {
  const plans = [
    {
      id: 1,
      name: "BASIC PLAN",
      regularPrice: "₹999",
      earlyBirdPrice: "₹79",
      period: "month",
      features: [
        "Unlimited Creatives",
        "Meta Ads Access",
        "No Hidden Fees",
      ],
      popular: false,
    },
    {
      id: 2,
      name: "PREMIUM PLAN",
      regularPrice: "₹1,999",
      earlyBirdPrice: "₹1,499",
      period: "month",
      features: [
        "Meta Ads - Full Access",
        "Unlimited Creatives",
        "IVR / Voice Campaigns - Full Access",
        "24x7 Priority Support",
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

  const handleSubscribe = (planId: number) => {
    // Handle subscription logic
    console.log(`Subscribing to plan ${planId}`);
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
                          {plan.earlyBirdPrice}
                        </Text>
                        <Text style={styles.period}>/{plan.period}</Text>
                      </View>
                      <View style={styles.regularPriceRow}>
                        <Text style={styles.regularPrice}>
                          {plan.regularPrice}/{plan.period}
                        </Text>
                        <View style={styles.earlyBirdTag}>
                          <Text style={styles.earlyBirdTagText}>Early Bird</Text>
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
                    ]}
                    onPress={() => handleSubscribe(plan.id)}
                  >
                    <Text
                      style={[
                        styles.subscribeButtonText,
                        plan.popular && styles.subscribeButtonTextPopular,
                      ]}
                    >
                      Get Started
                    </Text>
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
});

export default Subscription;
