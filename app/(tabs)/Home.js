import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { WebView } from "react-native-webview";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

// Try to import YoutubePlayer, but handle if it fails
let YoutubePlayer = null;
try {
  YoutubePlayer = require("react-native-youtube-iframe").default;
} catch (error) {
  console.log("YoutubePlayer not available, using WebView fallback");
}

const { width } = Dimensions.get("window");
const VIDEO_ID = "R1urGySSR9Y";
const VIDEO_HEIGHT = (width - 40) * 0.5625; // 16:9 aspect ratio

const HomeScreen = () => {
  const [userName, setUserName] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [userId, setUserId] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalSpend: 0,
    impressions: 0,
    clicks: 0,
    ctr: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);

  // Check if user is logged in and get user name
  useFocusEffect(
    React.useCallback(() => {
      const checkUserLogin = async () => {
        try {
          const userData = await AsyncStorage.getItem("user");
          const token = await AsyncStorage.getItem("authToken");
          
          if (userData && token) {
            const user = JSON.parse(userData);
            setUserName(user.name || null);
            setUserId(user.id || user._id || null);
            setAuthToken(token);
            setIsLoggedIn(true);
            // Fetch dashboard data when user is logged in
            fetchDashboardData(user.id || user._id, token);
          } else {
            setUserName(null);
            setUserId(null);
            setAuthToken(null);
            setIsLoggedIn(false);
            setLoading(false);
          }
        } catch (error) {
          console.error("Error checking user login:", error);
          setUserName(null);
          setIsLoggedIn(false);
          setLoading(false);
        }
      };

      checkUserLogin();
    }, [])
  );

  // Fetch dashboard data
  const fetchDashboardData = async (userId, token) => {
    try {
      setLoading(true);
      
      // Fetch campaigns to get stats - only if user has connected Meta account
      let totalCampaigns = 0;
      let activeCampaigns = 0;
      let impressions = 0;
      let clicks = 0;
      let ctr = 0;
      let totalSpend = 0;
      
      try {
        // First, try to get ad account ID from storage
        let adAccountId = await AsyncStorage.getItem("fb_ad_account_id");
        
        // Get Facebook access token for insights API
        const fbAccessToken = await AsyncStorage.getItem("fb_access_token");
        
        // If no ad account ID in storage, try to fetch ad accounts from API
        if (!adAccountId && fbAccessToken) {
          const accountsResponse = await axios.get(`${API_BASE_URL}/campaigns`, {
            headers: {
              "x-fb-access-token": fbAccessToken,
            },
          });
          
          if (accountsResponse.data.success && accountsResponse.data.adAccounts?.data?.length > 0) {
            // Use the first ad account
            adAccountId = accountsResponse.data.adAccounts.data[0].id;
            // Save it for future use
            await AsyncStorage.setItem("fb_ad_account_id", adAccountId);
          }
        }
        
        // Only fetch campaigns if we have a valid ad account ID
        if (adAccountId && fbAccessToken) {
          const campaignsResponse = await axios.get(
            `${API_BASE_URL}/campaigns/all`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "x-fb-access-token": fbAccessToken || token,
              },
              params: {
                adAccountId: adAccountId,
              },
            }
          );

          if (campaignsResponse.data.success && campaignsResponse.data.campaigns?.data) {
            const campaigns = campaignsResponse.data.campaigns.data;
            totalCampaigns = campaigns.length;
            activeCampaigns = campaigns.filter(
              (c) => c.status === "ACTIVE" || c.effective_status === "ACTIVE"
            ).length;
            
            // Fetch insights for all campaigns to get Meta Ads spending
            // We fetch for all campaigns (not just active) to get total spend
            if (fbAccessToken && totalCampaigns > 0) {
              try {
                const allCampaignIds = campaigns.map((c) => c.id);
                
                // Fetch insights for all campaigns to get total Meta Ads spend
                const insightsPromises = allCampaignIds.map(async (campaignId) => {
                  try {
                    // Use Facebook Graph API directly to get campaign insights
                    const insightsResponse = await axios.get(
                      `https://graph.facebook.com/v23.0/${campaignId}/insights`,
                      {
                        params: {
                          fields: "impressions,clicks,ctr,spend",
                          date_preset: "last_30d",
                          access_token: fbAccessToken,
                        },
                      }
                    );
                    
                    if (insightsResponse.data?.data && insightsResponse.data.data.length > 0) {
                      return insightsResponse.data.data[0];
                    }
                    return null;
                  } catch (error) {
                    console.log(`Error fetching insights for campaign ${campaignId}:`, error.message);
                    return null;
                  }
                });
                
                const insightsResults = await Promise.all(insightsPromises);
                
                // Aggregate insights from all campaigns to get total Meta Ads spending
                insightsResults.forEach((insight) => {
                  if (insight) {
                    impressions += parseInt(insight.impressions || 0);
                    clicks += parseInt(insight.clicks || 0);
                    totalSpend += parseFloat(insight.spend || 0);
                  }
                });
                
                // Calculate CTR from aggregated data
                if (impressions > 0) {
                  ctr = (clicks / impressions) * 100;
                }
              } catch (insightsError) {
                console.log("Error fetching campaign insights:", insightsError.message);
                // If insights fail, totalSpend will remain 0 (Meta Ads spending only)
              }
            }
          }
        }
      } catch (campaignError) {
        // If campaigns fetch fails (e.g., no Meta account connected), just log and continue
        console.log("Campaigns not available (Meta account may not be connected):", campaignError.message);
        // Set default values - variables are already initialized to 0 at the top
        // No need to reassign, just continue
      }

      // Note: totalSpend is calculated from Meta Ads campaign insights only
      // We only show Meta Ads spending, not subscription spending
      // If no Meta account connected or no campaigns, totalSpend will be 0

      // Fetch recent notifications for activity
      let activity = [];
      try {
        const notificationsResponse = await axios.get(
          `${API_BASE_URL}/notifications/user/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              limit: 5,
            },
          }
        );

        if (notificationsResponse.data.success && notificationsResponse.data.data) {
          activity = notificationsResponse.data.data.slice(0, 4).map((notif, index) => {
            const timeAgo = getTimeAgo(new Date(notif.createdAt));
            let icon = "notifications";
            let color = "#6366f1";

            if (notif.type === "campaign") {
              icon = "megaphone";
              color = "#6366f1";
            } else if (notif.type === "payment") {
              icon = "card";
              color = "#22c55e";
            } else if (notif.type === "referral") {
              icon = "person-add";
              color = "#ec4899";
            } else if (notif.type === "adset") {
              icon = "pause-circle";
              color = "#f59e0b";
            }

            return {
              id: notif._id || index,
              title: notif.title || notif.message,
              time: timeAgo,
              type: notif.type || "notification",
              icon: icon,
              color: color,
            };
          });
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }

      // If no activity from notifications, use empty array
      if (activity.length === 0) {
        activity = [];
      }

      // Use real insights data (already calculated above from campaign insights)
      // If no insights available, set defaults
      if (impressions === 0 && clicks === 0 && ctr === 0) {
        // Only set defaults if we have campaigns but no insights
        if (totalCampaigns > 0) {
          impressions = 0;
          clicks = 0;
          ctr = 0;
        }
      }

      // Ensure all variables are numbers before setting stats
      const finalStats = {
        totalCampaigns: Number(totalCampaigns) || 0,
        activeCampaigns: Number(activeCampaigns) || 0,
        totalSpend: Number(totalSpend) || 0,
        impressions: Number(impressions) || 0,
        clicks: Number(clicks) || 0,
        ctr: Number(ctr) || 0,
      };
      
      setStats(finalStats);

      setRecentActivity(activity);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Set default values on error
      setStats({
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalSpend: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
      });
      setRecentActivity([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Helper function to get time ago
  const getTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? "day" : "days"} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Shimmer animation effect
  React.useEffect(() => {
    if (loading) {
      const shimmerAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      shimmerAnimation.start();
      return () => shimmerAnimation.stop();
    }
  }, [loading, shimmerAnim]);

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (userId && authToken) {
      fetchDashboardData(userId, authToken);
    }
  }, [userId, authToken]);

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

  // Dynamic shortcuts based on actual data
  const shortcuts = [
    {
      id: 1,
      title: "Meta Ads",
      subtitle: `${stats.activeCampaigns} Active campaign${stats.activeCampaigns !== 1 ? "s" : ""}`,
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
      title: "Referrals",
      subtitle: "Earn rewards",
      icon: "gift",
      color: "#ec4899",
      bgColor: "#fce7f3",
      route: "/Referrals",
    },
  ];

  const handleActionPress = (action) => {
    if (action.route) {
      router.push(action.route);
    } else {
      Alert.alert(action.title, "Feature coming soon!");
    }
  };

  if (loading && !isLoggedIn) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeText}>Welcome back! 👋</Text>
          {isLoggedIn && userName && (
            <Text style={styles.userName}>{userName}</Text>
          )}
          <Text style={styles.welcomeSubtext}>Ready to grow your business today?</Text>
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
      {loading ? (
        <View style={styles.statsContainer}>
          {/* Skeleton Loader for Stats Cards */}
          <Animated.View 
            style={[
              styles.statCard, 
              styles.statCardPrimary, 
              styles.skeletonCard,
              {
                opacity: shimmerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 0.8],
                }),
              }
            ]}
          >
            <Animated.View 
              style={[
                styles.statIconContainer, 
                styles.skeletonElement,
                {
                  opacity: shimmerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1],
                  }),
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.skeletonText, 
                { width: 40, height: 24, marginBottom: 8 },
                {
                  opacity: shimmerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1],
                  }),
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.skeletonText, 
                { width: 80, height: 12 },
                {
                  opacity: shimmerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1],
                  }),
                }
              ]} 
            />
          </Animated.View>
          <Animated.View 
            style={[
              styles.statCard, 
              styles.statCardSuccess, 
              styles.skeletonCard,
              {
                opacity: shimmerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 0.8],
                }),
              }
            ]}
          >
            <Animated.View 
              style={[
                styles.statIconContainer, 
                { backgroundColor: "rgba(34, 197, 94, 0.2)" }, 
                styles.skeletonElement,
                {
                  opacity: shimmerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1],
                  }),
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.skeletonText, 
                { width: 50, height: 24, marginBottom: 8, backgroundColor: "#e2e8f0" },
                {
                  opacity: shimmerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1],
                  }),
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.skeletonText, 
                { width: 30, height: 12, backgroundColor: "#e2e8f0" },
                {
                  opacity: shimmerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1],
                  }),
                }
              ]} 
            />
          </Animated.View>
          <Animated.View 
            style={[
              styles.statCard, 
              styles.statCardWarning, 
              styles.skeletonCard,
              {
                opacity: shimmerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 0.8],
                }),
              }
            ]}
          >
            <Animated.View 
              style={[
                styles.statIconContainer, 
                { backgroundColor: "rgba(245, 158, 11, 0.2)" }, 
                styles.skeletonElement,
                {
                  opacity: shimmerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1],
                  }),
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.skeletonText, 
                { width: 45, height: 24, marginBottom: 8, backgroundColor: "#e2e8f0" },
                {
                  opacity: shimmerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1],
                  }),
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.skeletonText, 
                { width: 70, height: 12, backgroundColor: "#e2e8f0" },
                {
                  opacity: shimmerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1],
                  }),
                }
              ]} 
            />
          </Animated.View>
        </View>
      ) : (
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
              {stats.ctr > 0 ? stats.ctr.toFixed(2) : "0"}%
            </Text>
            <Text style={[styles.statLabel, { color: "#64748b", opacity: 0.9 }]}>CTR</Text>
          </View>
          <View style={[styles.statCard, styles.statCardWarning]}>
            <View style={[styles.statIconContainer, { backgroundColor: "rgba(245, 158, 11, 0.2)" }]}>
              <Ionicons name="eye" size={24} color="#f59e0b" />
            </View>
            <Text style={[styles.statValue, { color: "#f59e0b" }]}>
              {stats.impressions > 0 ? (stats.impressions / 1000).toFixed(0) + "K" : "0"}
            </Text>
            <Text style={[styles.statLabel, { color: "#64748b", opacity: 0.9 }]}>Impressions</Text>
          </View>
        </View>
      )}

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
              <Text style={styles.performanceValue}>
                ₹{stats.totalSpend > 0 ? stats.totalSpend.toLocaleString() : "0"}
              </Text>
            </View>
            <View style={styles.performanceDivider} />
            <View style={styles.performanceItem}>
              <Ionicons name="hand-left-outline" size={20} color="#64748b" />
              <Text style={styles.performanceLabel}>Clicks</Text>
              <Text style={styles.performanceValue}>
                {stats.clicks > 0 ? stats.clicks.toLocaleString() : "0"}
              </Text>
            </View>
          </View>
          <View style={styles.performanceRow}>
            <View style={styles.performanceItem}>
              <Ionicons name="trending-up-outline" size={20} color="#64748b" />
              <Text style={styles.performanceLabel}>CTR</Text>
              <Text style={[styles.performanceValue, { color: "#22c55e" }]}>
                {stats.ctr > 0 ? stats.ctr.toFixed(2) : "0"}%
              </Text>
            </View>
            <View style={styles.performanceDivider} />
            <View style={styles.performanceItem}>
              <Ionicons name="eye-outline" size={20} color="#64748b" />
              <Text style={styles.performanceLabel}>Impressions</Text>
              <Text style={styles.performanceValue}>
                {stats.impressions > 0 ? (stats.impressions / 1000).toFixed(0) + "K" : "0"}
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
          {loading ? (
            <View style={styles.activityItem}>
              <ActivityIndicator size="small" color="#6366f1" />
            </View>
          ) : recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
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
            ))
          ) : (
            <View style={styles.activityItem}>
              <Text style={styles.emptyActivityText}>No recent activity</Text>
            </View>
          )}
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
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  emptyActivityText: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    padding: 20,
  },
  skeletonCard: {
    // Opacity handled by animation
  },
  skeletonElement: {
    backgroundColor: "#e2e8f0",
  },
  skeletonText: {
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
  },
});

export default HomeScreen;
