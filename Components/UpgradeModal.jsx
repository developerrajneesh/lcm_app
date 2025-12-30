import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

const UpgradeModal = ({ visible, onClose, isPremiumFeature = false, featureName = "" }) => {
  const handleUpgrade = () => {
    onClose();
    router.push("/(tabs)/Subscription");
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name="lock-closed"
                  size={40}
                  color={isPremiumFeature ? "#9333EA" : "#3B82F6"}
                />
              </View>
              <Text style={styles.title}>Feature Locked</Text>
              <Text style={styles.subtitle}>
                {isPremiumFeature
                  ? `${featureName} is only available in Premium Plan`
                  : "You need an active subscription to access this feature"}
              </Text>
            </View>

            {/* Premium Features List */}
            {isPremiumFeature && (
              <View style={styles.featuresContainer}>
                <Text style={styles.featuresTitle}>Upgrade to Premium Plan to unlock:</Text>
                <View style={styles.featureList}>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    <Text style={styles.featureText}>SMS Marketing</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    <Text style={styles.featureText}>IVR Voice Campaign</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    <Text style={styles.featureText}>24x7 Priority Support</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    <Text style={styles.featureText}>All Basic Plan Features</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Plan Info */}
            <View style={styles.planInfo}>
              {isPremiumFeature ? (
                <View style={styles.planHeader}>
                  <View>
                    <Text style={styles.planName}>Premium Plan</Text>
                    <Text style={styles.planPrice}>₹2,999/month</Text>
                  </View>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>40% OFF</Text>
                    <Text style={styles.originalPrice}>₹5,000</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.plansContainer}>
                  <View style={styles.planCard}>
                    <Text style={styles.planName}>Basic Plan</Text>
                    <Text style={styles.planPrice}>₹999/month</Text>
                    <Text style={styles.planOriginalPrice}>₹2,000</Text>
                  </View>
                  <Text style={styles.orText}>or</Text>
                  <View style={styles.planCard}>
                    <Text style={styles.planName}>Premium Plan</Text>
                    <Text style={styles.planPrice}>₹2,999/month</Text>
                    <Text style={styles.planOriginalPrice}>₹5,000</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={handleUpgrade}
                activeOpacity={0.8}
              >
                <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Maybe Later</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: width * 0.9,
    maxHeight: "80%",
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    color: "#374151",
  },
  planInfo: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  planPrice: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  discountBadge: {
    alignItems: "flex-end",
  },
  discountText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#9333EA",
  },
  originalPrice: {
    fontSize: 12,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
    marginTop: 2,
  },
  plansContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    gap: 12,
  },
  planCard: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
  },
  planOriginalPrice: {
    fontSize: 11,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
    marginTop: 2,
  },
  orText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  actions: {
    gap: 12,
  },
  upgradeButton: {
    backgroundColor: "#9333EA",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  upgradeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default UpgradeModal;

