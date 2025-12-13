import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
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

const Referrals = () => {
  const [copied, setCopied] = useState(false);

  const referralCode = "LCM2024";
  const referralLink = `https://lcm.app/referral/${referralCode}`;

  const stats = {
    totalReferrals: 12,
    activeReferrals: 8,
    totalEarnings: 1200,
    pendingEarnings: 300,
  };

  const referrals = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      status: "active",
      joinedDate: "Dec 1, 2024",
      earnings: 100,
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      status: "active",
      joinedDate: "Nov 28, 2024",
      earnings: 100,
    },
    {
      id: 3,
      name: "Mike Johnson",
      email: "mike@example.com",
      status: "pending",
      joinedDate: "Dec 10, 2024",
      earnings: 0,
    },
  ];

  const handleCopyCode = () => {
    // In a real app, you would use Clipboard here
    setCopied(true);
    Alert.alert("Copied!", "Referral code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      const message = `Join LCM - The Ultimate Marketing Platform!\n\nUse my referral code: ${referralCode}\n\nGet started: ${referralLink}`;
      await Share.share({
        message: message,
        title: "Join LCM",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Referrals</Text>
          <TouchableOpacity style={styles.infoButton}>
            <Ionicons name="information-circle-outline" size={24} color="#1e293b" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalReferrals}</Text>
            <Text style={styles.statLabel}>Total Referrals</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.activeReferrals}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.earningsCard]}>
            <Ionicons name="wallet" size={24} color="#22c55e" />
            <Text style={styles.earningsValue}>₹{stats.totalEarnings}</Text>
            <Text style={styles.earningsLabel}>Total Earnings</Text>
          </View>
          <View style={[styles.statCard, styles.earningsCard]}>
            <Ionicons name="time-outline" size={24} color="#f59e0b" />
            <Text style={styles.earningsValue}>₹{stats.pendingEarnings}</Text>
            <Text style={styles.earningsLabel}>Pending</Text>
          </View>
        </View>

        {/* Referral Code Card */}
        <View style={styles.referralCard}>
          <View style={styles.referralHeader}>
            <Ionicons name="gift" size={32} color="#6366f1" />
            <Text style={styles.referralTitle}>Your Referral Code</Text>
          </View>
          <View style={styles.referralCodeContainer}>
            <Text style={styles.referralCode}>{referralCode}</Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyCode}
            >
              <Ionicons
                name={copied ? "checkmark" : "copy-outline"}
                size={20}
                color="#6366f1"
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.referralLink}>{referralLink}</Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color="#ffffff" />
            <Text style={styles.shareButtonText}>Share Referral Link</Text>
          </TouchableOpacity>
        </View>

        {/* How It Works */}
        <View style={styles.howItWorksSection}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Share Your Code</Text>
              <Text style={styles.stepDescription}>
                Share your referral code with friends and family
              </Text>
            </View>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>They Sign Up</Text>
              <Text style={styles.stepDescription}>
                Your friend signs up using your referral code
              </Text>
            </View>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Earn Rewards</Text>
              <Text style={styles.stepDescription}>
                You both earn ₹100 when they make their first purchase
              </Text>
            </View>
          </View>
        </View>

        {/* Referrals List */}
        <View style={styles.referralsListSection}>
          <Text style={styles.sectionTitle}>Your Referrals</Text>
          {referrals.map((referral) => (
            <View key={referral.id} style={styles.referralItem}>
              <View style={styles.referralAvatar}>
                <Text style={styles.referralAvatarText}>
                  {referral.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.referralInfo}>
                <Text style={styles.referralName}>{referral.name}</Text>
                <Text style={styles.referralEmail}>{referral.email}</Text>
                <Text style={styles.referralDate}>Joined: {referral.joinedDate}</Text>
              </View>
              <View style={styles.referralEarnings}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        referral.status === "active" ? "#dcfce7" : "#fef3c7",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: referral.status === "active" ? "#22c55e" : "#f59e0b",
                      },
                    ]}
                  >
                    {referral.status}
                  </Text>
                </View>
                {referral.earnings > 0 && (
                  <Text style={styles.earningsText}>₹{referral.earnings}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Benefits */}
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
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
            <Text style={styles.benefitText}>Instant payouts to your wallet</Text>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
  },
  infoButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#6366f1",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: "#64748b",
  },
  earningsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 16,
  },
  earningsValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
    marginLeft: 12,
    marginRight: 8,
  },
  earningsLabel: {
    fontSize: 14,
    color: "#64748b",
  },
  referralCard: {
    backgroundColor: "#ffffff",
    margin: 20,
    marginTop: 0,
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  referralHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  referralTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginTop: 12,
  },
  referralCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  referralCode: {
    fontSize: 28,
    fontWeight: "700",
    color: "#6366f1",
    letterSpacing: 4,
    marginRight: 12,
  },
  copyButton: {
    padding: 8,
  },
  referralLink: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 16,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366f1",
    paddingVertical: 14,
    borderRadius: 12,
  },
  shareButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  howItWorksSection: {
    padding: 20,
    backgroundColor: "#ffffff",
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 20,
  },
  stepItem: {
    flexDirection: "row",
    marginBottom: 20,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  referralsListSection: {
    padding: 20,
    backgroundColor: "#ffffff",
  },
  referralItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  referralAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e0e7ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  referralAvatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#6366f1",
  },
  referralInfo: {
    flex: 1,
  },
  referralName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  referralEmail: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  referralDate: {
    fontSize: 12,
    color: "#94a3b8",
  },
  referralEarnings: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  earningsText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#22c55e",
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

export default Referrals;

