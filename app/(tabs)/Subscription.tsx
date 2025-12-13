import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Subscription = () => {
  const [selectedPlan, setSelectedPlan] = useState("premium");

  const plans = [
    {
      id: "basic",
      name: "Basic",
      price: 299,
      period: "month",
      features: [
        "5 Ad Campaigns",
        "Basic Analytics",
        "Email Support",
        "1 Ad Account",
      ],
      popular: false,
    },
    {
      id: "premium",
      name: "Premium",
      price: 599,
      period: "month",
      features: [
        "Unlimited Ad Campaigns",
        "Advanced Analytics",
        "Priority Support",
        "5 Ad Accounts",
        "AI-Powered Insights",
        "Custom Reports",
      ],
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 1499,
      period: "month",
      features: [
        "Everything in Premium",
        "Dedicated Account Manager",
        "24/7 Phone Support",
        "Unlimited Ad Accounts",
        "API Access",
        "Custom Integrations",
      ],
      popular: false,
    },
  ];

  const handleSubscribe = (planId: string) => {
    Alert.alert("Subscribe", `You selected the ${planId} plan. Proceed to payment?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Subscribe", onPress: () => Alert.alert("Success", "Subscription activated!") },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subscription</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Current Plan */}
        <View style={styles.currentPlanCard}>
          <View style={styles.currentPlanHeader}>
            <FontAwesome5 name="crown" size={24} color="#f59e0b" />
            <Text style={styles.currentPlanTitle}>Current Plan</Text>
          </View>
          <Text style={styles.currentPlanName}>Premium</Text>
          <Text style={styles.currentPlanPrice}>₹599/month</Text>
          <Text style={styles.currentPlanDate}>Renews on Jan 15, 2025</Text>
        </View>

        {/* Plans */}
        <View style={styles.plansSection}>
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>
          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
                plan.popular && styles.planCardPopular,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Most Popular</Text>
                </View>
              )}
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.planPriceContainer}>
                  <Text style={styles.planPrice}>₹{plan.price}</Text>
                  <Text style={styles.planPeriod}>/{plan.period}</Text>
                </View>
              </View>
              <View style={styles.planFeatures}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={[
                  styles.subscribeButton,
                  selectedPlan === plan.id && styles.subscribeButtonSelected,
                ]}
                onPress={() => handleSubscribe(plan.id)}
              >
                <Text
                  style={[
                    styles.subscribeButtonText,
                    selectedPlan === plan.id && styles.subscribeButtonTextSelected,
                  ]}
                >
                  {selectedPlan === plan.id ? "Current Plan" : "Subscribe"}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark" size={24} color="#22c55e" />
            <Text style={styles.infoText}>Cancel anytime</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="card-outline" size={24} color="#6366f1" />
            <Text style={styles.infoText}>Secure payment</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="refresh-outline" size={24} color="#0ea5e9" />
            <Text style={styles.infoText}>Auto-renewal</Text>
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
  currentPlanCard: {
    backgroundColor: "#ffffff",
    margin: 20,
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#f59e0b",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  currentPlanHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  currentPlanTitle: {
    fontSize: 14,
    color: "#64748b",
    marginLeft: 8,
  },
  currentPlanName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  currentPlanPrice: {
    fontSize: 20,
    fontWeight: "600",
    color: "#f59e0b",
    marginBottom: 4,
  },
  currentPlanDate: {
    fontSize: 12,
    color: "#94a3b8",
  },
  plansSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    position: "relative",
  },
  planCardSelected: {
    borderColor: "#6366f1",
  },
  planCardPopular: {
    borderColor: "#f59e0b",
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    right: 20,
    backgroundColor: "#f59e0b",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  planName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
  },
  planPriceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  planPrice: {
    fontSize: 28,
    fontWeight: "700",
    color: "#6366f1",
  },
  planPeriod: {
    fontSize: 14,
    color: "#94a3b8",
    marginLeft: 4,
  },
  planFeatures: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    color: "#334155",
    marginLeft: 12,
    flex: 1,
  },
  subscribeButton: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  subscribeButtonSelected: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
  },
  subscribeButtonTextSelected: {
    color: "#ffffff",
  },
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    backgroundColor: "#ffffff",
    marginTop: 10,
  },
  infoItem: {
    alignItems: "center",
  },
  infoText: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 8,
    textAlign: "center",
  },
});

export default Subscription;

