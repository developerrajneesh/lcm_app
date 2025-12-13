import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const ShareApp = () => {
  const shareOptions = [
    {
      id: 1,
      label: "Share via WhatsApp",
      icon: "logo-whatsapp",
      color: "#25D366",
      bgColor: "#dcfce7",
    },
    {
      id: 2,
      label: "Share via Email",
      icon: "mail-outline",
      color: "#6366f1",
      bgColor: "#e0e7ff",
    },
    {
      id: 3,
      label: "Copy Link",
      icon: "copy-outline",
      color: "#0ea5e9",
      bgColor: "#e0f2fe",
    },
    {
      id: 4,
      label: "Share via SMS",
      icon: "chatbubble-outline",
      color: "#22c55e",
      bgColor: "#dcfce7",
    },
    {
      id: 5,
      label: "More Options",
      icon: "ellipsis-horizontal",
      color: "#64748b",
      bgColor: "#f1f5f9",
    },
  ];

  const referralCode = "LCM2024";
  const referralLink = `https://lcm.app/referral/${referralCode}`;

  const handleShare = async (option: { label: string }) => {
    const message = `Join LCM - The Ultimate Marketing Platform!\n\nUse my referral code: ${referralCode}\n\nGet started: ${referralLink}`;

    try {
      if (option.label === "Copy Link") {
        // You would use Clipboard here
        Alert.alert("Copied!", "Referral link copied to clipboard");
      } else if (option.label === "Share via WhatsApp") {
        // WhatsApp sharing logic
        Alert.alert("Share", `Sharing via ${option.label}...`);
      } else {
        try {
          await Share.share({
            message: message,
            title: "Join LCM",
          });
        } catch (error) {
          Alert.alert("Error", "Sharing is not available on this device");
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to share");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Share App</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Referral Code Card */}
        <View style={styles.referralCard}>
          <View style={styles.referralIconContainer}>
            <Ionicons name="gift" size={48} color="#6366f1" />
          </View>
          <Text style={styles.referralTitle}>Invite Friends & Earn Rewards</Text>
          <Text style={styles.referralDescription}>
            Share your referral code and earn rewards when your friends join!
          </Text>
          <View style={styles.referralCodeContainer}>
            <Text style={styles.referralCodeLabel}>Your Referral Code</Text>
            <Text style={styles.referralCode}>{referralCode}</Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => Alert.alert("Copied!", "Referral code copied")}
            >
              <Ionicons name="copy-outline" size={20} color="#6366f1" />
              <Text style={styles.copyButtonText}>Copy Code</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Share Options */}
        <View style={styles.shareOptionsSection}>
          <Text style={styles.sectionTitle}>Share via</Text>
          {shareOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.shareOption, { backgroundColor: option.bgColor }]}
              onPress={() => handleShare(option)}
            >
              <View style={styles.shareOptionLeft}>
                <View style={[styles.shareOptionIcon, { backgroundColor: option.bgColor }]}>
                  <Ionicons name={option.icon as any} size={24} color={option.color} />
                </View>
                <Text style={styles.shareOptionText}>{option.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Benefits</Text>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
            <Text style={styles.benefitText}>Earn ₹100 for each successful referral</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
            <Text style={styles.benefitText}>Your friend gets ₹50 bonus on signup</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
            <Text style={styles.benefitText}>Unlimited referrals</Text>
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
  referralCard: {
    backgroundColor: "#ffffff",
    margin: 20,
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  referralIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e0e7ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  referralTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
    textAlign: "center",
  },
  referralDescription: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  referralCodeContainer: {
    width: "100%",
    alignItems: "center",
  },
  referralCodeLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 8,
  },
  referralCode: {
    fontSize: 32,
    fontWeight: "700",
    color: "#6366f1",
    letterSpacing: 4,
    marginBottom: 16,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0e7ff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6366f1",
    marginLeft: 8,
  },
  shareOptionsSection: {
    padding: 20,
    backgroundColor: "#ffffff",
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
  },
  shareOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  shareOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  shareOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  shareOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#334155",
  },
  benefitsSection: {
    padding: 20,
    backgroundColor: "#ffffff",
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  benefitText: {
    fontSize: 15,
    color: "#334155",
    marginLeft: 12,
    flex: 1,
  },
});

export default ShareApp;

