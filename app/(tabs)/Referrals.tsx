import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Clipboard from "expo-clipboard";
import { API_BASE_URL } from "../../config/api";

interface Referral {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  createdAt: string;
}

const Referrals = () => {
  const [user, setUser] = useState<any>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchReferrals();
        fetchTotalEarnings();
      }
    }, [user])
  );

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } else {
        Alert.alert("Error", "Please login to view referrals");
        router.back();
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferrals = async () => {
    if (!user?.id) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/user/referrals/${user.id}`);
      if (response.data.success) {
        setReferrals(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching referrals:", error);
    }
  };

  const fetchTotalEarnings = async () => {
    if (!user?.id) return;

    try {
      const response = await axios.get(
        `${API_BASE_URL}/wallet/${user.id}/transactions`,
        {
          params: {
            page: 1,
            limit: 100,
          },
        }
      );

      if (response.data.success) {
        const referralTransactions = (response.data.data.transactions || []).filter(
          (t: any) => t.description?.includes("Referral bonus") && t.type === "credit"
        );
        const total = referralTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);
        setTotalEarnings(total);
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (user) {
      await Promise.all([fetchReferrals(), fetchTotalEarnings()]);
    }
    setRefreshing(false);
  }, [user]);

  const handleCopyCode = async () => {
    if (user?.referralCode) {
      await Clipboard.setStringAsync(user.referralCode);
      setCopied(true);
      Alert.alert("Copied!", "Referral code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    try {
      const referralCode = user?.referralCode || "";
      const referralLink = `https://lcm.app/signup?ref=${referralCode}`;
      const message = `Join LCM - The Ultimate Marketing Platform!\n\nUse my referral code: ${referralCode}\n\nGet started: ${referralLink}`;
      await Share.share({
        message: message,
        title: "Join LCM",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeAreaView>
    );
  }

  const referralCode = user?.referralCode || "N/A";
  const referralLink = `https://lcm.app/signup?ref=${referralCode}`;
  const stats = {
    totalReferrals: referrals.length,
    activeReferrals: referrals.length,
    totalEarnings: totalEarnings,
    pendingEarnings: 0,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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
              <Text style={styles.stepTitle}>You Earn ₹50</Text>
              <Text style={styles.stepDescription}>
                ₹50 is automatically credited to your wallet
              </Text>
            </View>
          </View>
        </View>

        {/* Referrals List */}
        <View style={styles.referralsListSection}>
          <Text style={styles.sectionTitle}>Your Referrals</Text>
          {referrals.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyStateText}>No referrals yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start sharing your referral code to earn rewards!
              </Text>
            </View>
          ) : (
            referrals.map((referral) => (
              <View key={referral._id} style={styles.referralItem}>
                {referral.profileImage ? (
                  <Image
                    source={{ uri: referral.profileImage }}
                    style={styles.referralAvatarImage}
                  />
                ) : (
                  <View style={styles.referralAvatar}>
                    <Text style={styles.referralAvatarText}>
                      {referral.name?.charAt(0).toUpperCase() || "U"}
                    </Text>
                  </View>
                )}
                <View style={styles.referralInfo}>
                  <Text style={styles.referralName}>{referral.name}</Text>
                  <Text style={styles.referralEmail}>{referral.email}</Text>
                  <Text style={styles.referralDate}>
                    Joined: {formatDate(referral.createdAt)}
                  </Text>
                </View>
                <View style={styles.referralEarnings}>
                  <View style={[styles.statusBadge, { backgroundColor: "#dcfce7" }]}>
                    <Text style={[styles.statusText, { color: "#22c55e" }]}>Active</Text>
                  </View>
                  <Text style={styles.earningsText}>₹50</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Benefits */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Benefits</Text>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
            <Text style={styles.benefitText}>Earn ₹50 for each successful referral</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
            <Text style={styles.benefitText}>Your friend signs up with your code</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
  },
  referralAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
});

export default Referrals;

