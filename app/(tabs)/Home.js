import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { WebView } from "react-native-webview";

// Try to import YoutubePlayer, but handle if it fails
let YoutubePlayer = null;
try {
  YoutubePlayer = require("react-native-youtube-iframe").default;
} catch (error) {
  console.log("YoutubePlayer not available, using WebView fallback");
}

const { width } = Dimensions.get("window");
const VIDEO_ID = "3gMOYZoMtEs";
const VIDEO_HEIGHT = (width - 40) * 0.5625; // 16:9 aspect ratio

const HomeScreen = () => {
  const [userName, setUserName] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Check if user is logged in and get user name
  useFocusEffect(
    React.useCallback(() => {
      const checkUserLogin = async () => {
        try {
          const userData = await AsyncStorage.getItem("user");
          const authToken = await AsyncStorage.getItem("authToken");
          
          if (userData && authToken) {
            const user = JSON.parse(userData);
            setUserName(user.name || null);
            setIsLoggedIn(true);
          } else {
            setUserName(null);
            setIsLoggedIn(false);
          }
        } catch (error) {
          console.error("Error checking user login:", error);
          setUserName(null);
          setIsLoggedIn(false);
        }
      };

      checkUserLogin();
    }, [])
  );

  // Mock data - replace with real data from API
  const stats = {
    totalCampaigns: 12,
    activeCampaigns: 8,
    totalSpend: 45600,
    impressions: 125000,
    clicks: 3200,
    ctr: 2.56,
  };

  const quickActions = [
    {
      id: 1,
      title: "Create Campaign",
      icon: "add-circle-outline",
      color: "#6366f1",
      bgColor: "#e0e7ff",
      route: "/Marketing",
    },
    {
      id: 2,
      title: "View Analytics",
      icon: "analytics-outline",
      color: "#22c55e",
      bgColor: "#dcfce7",
      route: "/MetaAdsScreen",
    },
    {
      id: 3,
      title: "Creative Workshop",
      icon: "color-palette-outline",
      color: "#f59e0b",
      bgColor: "#fef3c7",
      route: "/CreativeWorkShop",
    },
    {
      id: 4,
      title: "Manage Ads",
      icon: "settings-outline",
      color: "#8b5cf6",
      bgColor: "#f3e8ff",
      route: "/MetaAdsScreen",
    },
  ];

  const shortcuts = [
    {
      id: 1,
      title: "Meta Ads",
      subtitle: "8 Active campaigns",
      icon: "logo-facebook",
      color: "#1877f2",
      bgColor: "#e0f2fe",
      route: "/MetaAdsScreen",
    },
    {
      id: 2,
      title: "Analytics",
      subtitle: "View performance",
      icon: "stats-chart",
      color: "#22c55e",
      bgColor: "#dcfce7",
      route: "/MetaAdsScreen",
    },
    {
      id: 3,
      title: "Wallet",
      subtitle: "₹12,450.50",
      icon: "wallet",
      color: "#f59e0b",
      bgColor: "#fef3c7",
      route: "/Wallet",
    },
    {
      id: 4,
      title: "Referrals",
      subtitle: "Earn rewards",
      icon: "gift",
      color: "#ec4899",
      bgColor: "#fce7f3",
      route: "/Referrals",
    },
  ];

  const recentActivity = [
    {
      id: 1,
      title: "Campaign 'Summer Sale' Created",
      time: "2 hours ago",
      type: "campaign",
      icon: "megaphone",
      color: "#6366f1",
    },
    {
      id: 2,
      title: "Ad Set 'Target Audience' Paused",
      time: "5 hours ago",
      type: "adset",
      icon: "pause-circle",
      color: "#f59e0b",
    },
    {
      id: 3,
      title: "Payment of ₹5,000 Processed",
      time: "1 day ago",
      type: "payment",
      icon: "card",
      color: "#22c55e",
    },
    {
      id: 4,
      title: "New Referral: John Doe",
      time: "2 days ago",
      type: "referral",
      icon: "person-add",
      color: "#ec4899",
    },
  ];

  const handleActionPress = (action) => {
    if (action.route) {
      router.push(action.route);
    } else {
      Alert.alert(action.title, "Feature coming soon!");
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeText}>Welcome back! 👋</Text>
          {isLoggedIn && userName && (
            <Text style={styles.userName}>{userName}</Text>
          )}
          <Text style={styles.welcomeSubtext}>Ready to grow your business today?</Text>
        </View>
        <View style={styles.notificationBadge}>
          <Ionicons name="notifications" size={24} color="#6366f1" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </View>
      </View>

      {/* Video Section - How to use Our App */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="play-circle" size={24} color="#6366f1" />
            <Text style={styles.sectionTitle}>How to use Our App</Text>
          </View>
        </View>
        <View style={styles.videoContainer}>
          {YoutubePlayer && !videoError ? (
            <YoutubePlayer
              height={VIDEO_HEIGHT}
              width={width - 40}
              videoId={VIDEO_ID}
              play={false}
              onChangeState={(event) => {
                // Handle video state changes if needed
                if (event === "error") {
                  setVideoError(true);
                }
              }}
              onError={(error) => {
                console.error("YouTube player error:", error);
                setVideoError(true);
              }}
            />
          ) : (
            <WebView
              source={{
                uri: `https://www.youtube.com/embed/${VIDEO_ID}?rel=0&modestbranding=1&playsinline=1`,
              }}
              style={styles.videoWebView}
              allowsFullscreenVideo={true}
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error("WebView error: ", nativeEvent);
                setVideoError(true);
              }}
              onHttpError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error("WebView HTTP error: ", nativeEvent);
              }}
            />
          )}
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.statCardPrimary]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="megaphone" size={24} color="#ffffff" />
          </View>
          <Text style={styles.statValue}>{stats.activeCampaigns}</Text>
          <Text style={styles.statLabel}>Active Campaigns</Text>
        </View>
        <View style={[styles.statCard, styles.statCardSuccess]}>
          <View style={[styles.statIconContainer, { backgroundColor: "rgba(34, 197, 94, 0.2)" }]}>
            <Ionicons name="trending-up" size={24} color="#22c55e" />
          </View>
          <Text style={[styles.statValue, { color: "#22c55e" }]}>
            {stats.ctr}%
          </Text>
          <Text style={styles.statLabel}>CTR</Text>
        </View>
        <View style={[styles.statCard, styles.statCardWarning]}>
          <View style={[styles.statIconContainer, { backgroundColor: "rgba(245, 158, 11, 0.2)" }]}>
            <Ionicons name="eye" size={24} color="#f59e0b" />
          </View>
          <Text style={[styles.statValue, { color: "#f59e0b" }]}>
            {(stats.impressions / 1000).toFixed(0)}K
          </Text>
          <Text style={styles.statLabel}>Impressions</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[styles.actionCard, { backgroundColor: action.bgColor }]}
              onPress={() => handleActionPress(action)}
              activeOpacity={0.7}
            >
              <Ionicons name={action.icon} size={28} color={action.color} />
              <Text style={[styles.actionText, { color: action.color }]}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Shortcuts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shortcuts</Text>
        </View>
        <View style={styles.shortcutsContainer}>
          {shortcuts.map((shortcut) => (
            <TouchableOpacity
              key={shortcut.id}
              style={[styles.shortcutCard, { backgroundColor: shortcut.bgColor }]}
              onPress={() => handleActionPress(shortcut)}
              activeOpacity={0.7}
            >
              <View style={styles.shortcutIconContainer}>
                <Ionicons name={shortcut.icon} size={32} color={shortcut.color} />
              </View>
              <View style={styles.shortcutContent}>
                <Text style={styles.shortcutTitle}>{shortcut.title}</Text>
                <Text style={styles.shortcutSubtitle}>{shortcut.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={shortcut.color} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Performance Overview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Performance Overview</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>View Details</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.performanceCard}>
          <View style={styles.performanceRow}>
            <View style={styles.performanceItem}>
              <Ionicons name="cash-outline" size={20} color="#64748b" />
              <Text style={styles.performanceLabel}>Total Spend</Text>
              <Text style={styles.performanceValue}>₹{stats.totalSpend.toLocaleString()}</Text>
            </View>
            <View style={styles.performanceDivider} />
            <View style={styles.performanceItem}>
              <Ionicons name="hand-left-outline" size={20} color="#64748b" />
              <Text style={styles.performanceLabel}>Clicks</Text>
              <Text style={styles.performanceValue}>{stats.clicks.toLocaleString()}</Text>
            </View>
          </View>
          <View style={styles.performanceRow}>
            <View style={styles.performanceItem}>
              <Ionicons name="trending-up-outline" size={20} color="#64748b" />
              <Text style={styles.performanceLabel}>CTR</Text>
              <Text style={[styles.performanceValue, { color: "#22c55e" }]}>
                {stats.ctr}%
              </Text>
            </View>
            <View style={styles.performanceDivider} />
            <View style={styles.performanceItem}>
              <Ionicons name="eye-outline" size={20} color="#64748b" />
              <Text style={styles.performanceLabel}>Impressions</Text>
              <Text style={styles.performanceValue}>
                {(stats.impressions / 1000).toFixed(0)}K
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.activityContainer}>
          {recentActivity.map((activity) => (
            <TouchableOpacity
              key={activity.id}
              style={styles.activityItem}
              activeOpacity={0.7}
            >
              <View style={[styles.activityIcon, { backgroundColor: `${activity.color}15` }]}>
                <Ionicons name={activity.icon} size={20} color={activity.color} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tips Section */}
      <View style={styles.section}>
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Ionicons name="bulb" size={24} color="#f59e0b" />
            <Text style={styles.tipTitle}>Pro Tip</Text>
          </View>
          <Text style={styles.tipText}>
            Optimize your ad sets by testing different audiences. Campaigns with A/B testing show
            30% better performance.
          </Text>
          <TouchableOpacity style={styles.tipButton}>
            <Text style={styles.tipButtonText}>Learn More</Text>
            <Ionicons name="arrow-forward" size={16} color="#6366f1" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  welcomeSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: "#94a3b8",
  },
  notificationBadge: {
    position: "relative",
    padding: 8,
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  statsContainer: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statCardPrimary: {
    backgroundColor: "#6366f1",
  },
  statCardSuccess: {
    backgroundColor: "#ffffff",
  },
  statCardWarning: {
    backgroundColor: "#ffffff",
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#ffffff",
    opacity: 0.9,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6366f1",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionCard: {
    width: "47%",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
  shortcutsContainer: {
    gap: 12,
  },
  shortcutCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  shortcutIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  shortcutContent: {
    flex: 1,
  },
  shortcutTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  shortcutSubtitle: {
    fontSize: 13,
    color: "#64748b",
  },
  performanceCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  performanceRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  performanceItem: {
    flex: 1,
    alignItems: "center",
  },
  performanceDivider: {
    width: 1,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 16,
  },
  performanceLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 8,
    marginBottom: 4,
  },
  performanceValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
  activityContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: "#94a3b8",
  },
  tipCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginLeft: 8,
  },
  tipText: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
    marginBottom: 16,
  },
  tipButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  tipButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6366f1",
    marginRight: 4,
  },
  bottomSpacing: {
    height: 20,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  videoContainer: {
    backgroundColor: "#000000",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    height: VIDEO_HEIGHT,
  },
  videoWebView: {
    width: width - 40,
    height: VIDEO_HEIGHT,
    backgroundColor: "#000000",
  },
  videoErrorContainer: {
    height: VIDEO_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#1e293b",
  },
  videoErrorText: {
    color: "#ffffff",
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
  },
});

export default HomeScreen;
