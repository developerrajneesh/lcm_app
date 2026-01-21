import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

export default function AdsScreen() {
  const { adsetId, adsetName, campaignId, campaignName } = useLocalSearchParams();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState([]);
  const [adInsights, setAdInsights] = useState({});

  useEffect(() => {
    if (adsetId) {
      fetchAds();
    } else {
      Alert.alert("Error", "Ad Set ID not provided");
      router.back();
    }
  }, [adsetId]);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const accessToken = await AsyncStorage.getItem("fb_access_token");
      if (!accessToken) {
        Alert.alert("Error", "Please connect your Meta account first");
        router.back();
        return;
      }

      // Fetch ads
      const response = await axios.get(`${API_BASE_URL}/ads/all`, {
        params: {
          adsetId: adsetId,
        },
        headers: {
          "x-fb-access-token": accessToken,
        },
      });

      if (response.data.success && response.data.ads?.data) {
        const adsData = response.data.ads.data;
        setAds(adsData);

        // Fetch insights for each ad
        const insightsPromises = adsData.map(async (ad) => {
          try {
            const insightsResponse = await axios.get(
              `${API_BASE_URL}/ads/${ad.id}/insights`,
              {
                params: {
                  datePreset: "last_30d",
                },
                headers: {
                  "x-fb-access-token": accessToken,
                },
              }
            );
            if (
              insightsResponse.data.success &&
              insightsResponse.data.insights?.data
            ) {
              return {
                adId: ad.id,
                insights: insightsResponse.data.insights.data[0] || null,
              };
            }
          } catch (error) {
            console.error(`Error fetching insights for ad ${ad.id}:`, error);
          }
          return { adId: ad.id, insights: null };
        });

        const insightsResults = await Promise.all(insightsPromises);
        const insightsMap = {};
        insightsResults.forEach(({ adId, insights }) => {
          insightsMap[adId] = insights;
        });
        setAdInsights(insightsMap);
      } else {
        setAds([]);
      }
    } catch (error) {
      console.error("Error fetching ads:", error);
      
      // Check for token expiration
      const { handleTokenExpiration } = require("../../utils/metaErrorHandler");
      const wasTokenExpired = await handleTokenExpiration(error, () => {
        router.replace("/MetaWorker");
      });
      
      if (!wasTokenExpired) {
        Alert.alert(
          "Error",
          error.response?.data?.fb?.message ||
            error.response?.data?.message ||
            "Failed to fetch ads"
        );
      }
      setAds([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAds();
  };

  const handlePauseResume = async (adId, currentStatus) => {
    try {
      const accessToken = await AsyncStorage.getItem("fb_access_token");
      if (!accessToken) {
        Alert.alert("Error", "Please connect your Meta account first");
        return;
      }

      const isPaused =
        currentStatus === "PAUSED" ||
        currentStatus === "paused" ||
        currentStatus === "ad_paused";

      const endpoint = isPaused ? "activate" : "pause";
      const response = await axios.post(
        `${API_BASE_URL}/ads/${adId}/${endpoint}`,
        {},
        {
          headers: {
            "x-fb-access-token": accessToken,
          },
        }
      );

      if (response.data.success) {
        Alert.alert("Success", `Ad ${isPaused ? "activated" : "paused"} successfully`);
        fetchAds();
      }
    } catch (error) {
      console.error("Error pausing/resuming ad:", error);
      Alert.alert(
        "Error",
        error.response?.data?.fb?.message ||
          error.response?.data?.message ||
          "Failed to update ad status"
      );
    }
  };

  const handleDelete = async (adId, adName) => {
    Alert.alert(
      "Delete Ad",
      `Are you sure you want to delete "${adName || adId}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const accessToken = await AsyncStorage.getItem("fb_access_token");
              if (!accessToken) {
                Alert.alert("Error", "Please connect your Meta account first");
                return;
              }

              const response = await axios.delete(
                `${API_BASE_URL}/ads/${adId}`,
                {
                  headers: {
                    "x-fb-access-token": accessToken,
                  },
                }
              );

              if (response.data.success) {
                Alert.alert("Success", "Ad deleted successfully");
                fetchAds();
              } else {
                throw new Error(response.data.message || "Failed to delete ad");
              }
            } catch (error) {
              console.error("Error deleting ad:", error);
              Alert.alert(
                "Error",
                error.response?.data?.fb?.message ||
                  error.response?.data?.message ||
                  "Failed to delete ad"
              );
            }
          },
        },
      ]
    );
  };


  const filteredAds = ads.filter((ad) => {
    const matchesSearch = (ad.name || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const status = (ad.status || "").toLowerCase();
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "active")
      return matchesSearch && (status === "active" || status === "ad_active");
    if (activeTab === "paused")
      return matchesSearch && (status === "paused" || status === "ad_paused");

    return matchesSearch;
  });

  const getStatusColor = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "active" || s === "ad_active") return "#4CAF50";
    if (s === "paused" || s === "ad_paused") return "#FF9800";
    return "#9E9E9E";
  };

  const getStatusText = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "active" || s === "ad_active") return "ACTIVE";
    if (s === "paused" || s === "ad_paused") return "PAUSED";
    return (status || "UNKNOWN").toUpperCase();
  };

  const formatNumber = (num) => {
    if (!num || num === "0") return "0";
    return parseFloat(num).toLocaleString();
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === "0") return "₹0.00";
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  const formatPercent = (value) => {
    if (!value || value === "0") return "0%";
    return `${parseFloat(value).toFixed(2)}%`;
  };

  // Helper function to safely get insight value, returns 0 if not exists
  const getInsightValue = (insights, key) => {
    if (!insights) return "0";
    const value = insights[key];
    if (value === null || value === undefined || value === "") return "0";
    return value;
  };

  // Helper to get action value
  const getActionValue = (insights, actionType) => {
    if (!insights || !insights.actions || !Array.isArray(insights.actions)) return "0";
    const action = insights.actions.find(a => a.action_type === actionType);
    return action ? action.value : "0";
  };

  const renderAdItem = ({ item, index }) => {
    const screenWidth = Dimensions.get("window").width;
    const cardPadding = 40; // 20px padding on each side of the card
    const gap = 10; // gap between items
    const availableWidth = screenWidth - cardPadding;
    const itemWidth = (availableWidth - gap) / 2;
    
    const status = item.status || "";
    const statusColor = getStatusColor(status);
    const statusText = getStatusText(status);
    const isPaused =
      status === "PAUSED" ||
      status === "paused" ||
      status === "ad_paused";
    const insights = adInsights[item.id];

    // Colorful gradient backgrounds matching web design
    const gradients = [
      { from: "#9333EA", to: "#EC4899" }, // purple to pink
      { from: "#3B82F6", to: "#06B6D4" }, // blue to cyan
      { from: "#10B981", to: "#059669" }, // green to emerald
      { from: "#F97316", to: "#EF4444" }, // orange to red
      { from: "#6366F1", to: "#9333EA" }, // indigo to purple
      { from: "#14B8A6", to: "#3B82F6" }, // teal to blue
      { from: "#EAB308", to: "#F97316" }, // yellow to orange
      { from: "#EC4899", to: "#F43F5E" }, // pink to rose
    ];
    const gradient = gradients[index % gradients.length];

    return (
      <View
        style={[
          styles.adCard,
          {
            backgroundColor: gradient.from,
          },
        ]}
      >
        {/* Gradient overlay effect */}
        <View
          style={[
            styles.gradientOverlay,
            {
              backgroundColor: gradient.to,
              opacity: 0.3,
            },
          ]}
        />
        {/* Decorative circles */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        
        <View style={styles.adContent}>
          <View style={styles.adHeader}>
            <View style={styles.adHeaderLeft}>
              <View style={styles.adNameContainer}>
                <Text style={styles.adName} numberOfLines={2}>
                  {item.name || "Unnamed Ad"}
                </Text>
                <Text style={styles.adId}>ID: {item.id}</Text>
                {item.effective_status && (
                  <Text style={styles.adStatusText}>
                    Status: {item.effective_status}
                  </Text>
                )}
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      statusText === "ACTIVE"
                        ? "#D1FAE5"
                        : statusText === "PAUSED"
                        ? "#FEF3C7"
                        : "#F3F4F6",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        statusText === "ACTIVE"
                          ? "#065F46"
                          : statusText === "PAUSED"
                          ? "#92400E"
                          : "#374151",
                    },
                  ]}
                >
                  {statusText}
                </Text>
              </View>
            </View>
          </View>

          {/* Analytics Section */}
          <View style={styles.analyticsSection}>
            <Text style={styles.analyticsTitle}>Analytics (Last 30 Days)</Text>
            <View style={styles.analyticsGrid}>
              {/* Row 1 */}
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsLabel}>Impressions</Text>
                <Text style={styles.analyticsValue}>
                  {formatNumber(getInsightValue(insights, "impressions"))}
                </Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsLabel}>Clicks</Text>
                <Text style={styles.analyticsValue}>
                  {formatNumber(getInsightValue(insights, "clicks"))}
                </Text>
              </View>
              
              {/* Row 2 */}
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsLabel}>CTR</Text>
                <Text style={styles.analyticsValue}>
                  {formatPercent(getInsightValue(insights, "ctr"))}
                </Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsLabel}>Spend</Text>
                <Text style={styles.analyticsValue}>
                  {formatCurrency(getInsightValue(insights, "spend"))}
                </Text>
              </View>
              
              {/* Row 3 */}
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsLabel}>Reach</Text>
                <Text style={styles.analyticsValue}>
                  {formatNumber(getInsightValue(insights, "reach"))}
                </Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsLabel}>Frequency</Text>
                <Text style={styles.analyticsValue}>
                  {parseFloat(getInsightValue(insights, "frequency")).toFixed(2)}
                </Text>
              </View>
              
              {/* Row 4 */}
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsLabel}>CPC</Text>
                <Text style={styles.analyticsValue}>
                  {formatCurrency(getInsightValue(insights, "cpc"))}
                </Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsLabel}>CPM</Text>
                <Text style={styles.analyticsValue}>
                  {formatCurrency(getInsightValue(insights, "cpm"))}
                </Text>
              </View>
              
              {/* Row 5 - Actions */}
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsLabel}>Leads</Text>
                <Text style={styles.analyticsValue}>
                  {formatNumber(getActionValue(insights, "lead"))}
                </Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsLabel}>Link Clicks</Text>
                <Text style={styles.analyticsValue}>
                  {formatNumber(getActionValue(insights, "link_click"))}
                </Text>
              </View>
              
              {/* Row 6 - More Actions */}
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsLabel}>Video Views</Text>
                <Text style={styles.analyticsValue}>
                  {formatNumber(getActionValue(insights, "video_view"))}
                </Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsLabel}>Page Engagement</Text>
                <Text style={styles.analyticsValue}>
                  {formatNumber(getActionValue(insights, "page_engagement"))}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.adActions}>
            {isPaused ? (
              <TouchableOpacity
                style={[styles.actionIconButton, styles.actionIconButtonSpacing]}
                onPress={() => handlePauseResume(item.id, status)}
              >
                <MaterialCommunityIcons
                  name="play"
                  size={20}
                  color="#059669"
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionIconButton, styles.actionIconButtonSpacing]}
                onPress={() => handlePauseResume(item.id, status)}
              >
                <MaterialCommunityIcons
                  name="pause"
                  size={20}
                  color="#F59E0B"
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionIconButton}
              onPress={() => handleDelete(item.id, item.name)}
            >
              <MaterialCommunityIcons
                name="delete"
                size={20}
                color="#EF4444"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Ads</Text>
          <Text style={styles.headerSubtitle}>
            {adsetName || "Ad Set"} • {campaignName || "Campaign"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => {
            router.push({
              pathname: "/MetaAdsScreen",
              params: {
                step: "3",
                adsetId: adsetId,
                adsetName: adsetName || "",
                campaignId: campaignId || "",
                campaignName: campaignName || "",
              },
            });
          }}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.createButtonText}>Create Ad</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search ads..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "all" && styles.activeTab]}
            onPress={() => setActiveTab("all")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "all" && styles.activeTabText,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "active" && styles.activeTab]}
            onPress={() => setActiveTab("active")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "active" && styles.activeTabText,
              ]}
            >
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "paused" && styles.activeTab]}
            onPress={() => setActiveTab("paused")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "paused" && styles.activeTabText,
              ]}
            >
              Paused
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1877F2" />
          <Text style={styles.loadingText}>Loading ads...</Text>
        </View>
      ) : (
        <>
          <View style={styles.statsOverview}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{ads.length}</Text>
              <Text style={styles.statLabel}>Total Ads</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {
                  ads.filter(
                    (a) =>
                      (a.status || "").toLowerCase() === "active" ||
                      (a.status || "").toLowerCase() === "ad_active"
                  ).length
                }
              </Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {
                  ads.filter(
                    (a) =>
                      (a.status || "").toLowerCase() === "paused" ||
                      (a.status || "").toLowerCase() === "ad_paused"
                  ).length
                }
              </Text>
              <Text style={styles.statLabel}>Paused</Text>
            </View>
          </View>

          <FlatList
            data={filteredAds}
            renderItem={({ item, index }) => renderAdItem({ item, index })}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="megaphone-outline" size={64} color="#CCCCCC" />
                <Text style={styles.emptyStateText}>No ads found</Text>
                <Text style={styles.emptyStateSubtext}>
                  {searchQuery
                    ? "Try a different search term"
                    : "This ad set has no ads yet"}
                </Text>
                <TouchableOpacity
                  style={styles.createFirstAdButton}
                  onPress={() => {
                    router.push({
                      pathname: "/MetaAdsScreen",
                      params: {
                        step: "3",
                        adsetId: adsetId,
                        adsetName: adsetName || "",
                        campaignId: campaignId || "",
                        campaignName: campaignName || "",
                      },
                    });
                  }}
                >
                  <Text style={styles.createFirstAdButtonText}>
                    Create Your First Ad
                  </Text>
                </TouchableOpacity>
              </View>
            }
          />
        </>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1877F2",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  createButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 6,
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f2f5",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  tabContainer: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: "#1877F2",
  },
  tabText: {
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "white",
  },
  statsOverview: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "white",
  },
  statCard: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1877F2",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
  },
  listContent: {
    padding: 16,
  },
  adCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden",
    position: "relative",
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderBottomRightRadius: 16,
  },
  decorativeCircle1: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  decorativeCircle2: {
    position: "absolute",
    bottom: -30,
    left: -30,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  adContent: {
    position: "relative",
    zIndex: 10,
  },
  adHeader: {
    marginBottom: 16,
  },
  adHeaderLeft: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  adNameContainer: {
    flex: 1,
    marginRight: 12,
  },
  adName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 6,
  },
  adId: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.75)",
    marginBottom: 4,
  },
  adStatusText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.75)",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 70,
    alignItems: "center",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  analyticsSection: {
    marginTop: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
    maxHeight: 400,
  },
  analyticsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
    marginBottom: 12,
  },
  analyticsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  analyticsItem: {
    backgroundColor: "#D1F2E5",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    flexBasis: "48%",
    maxWidth: "48%",
  },
  analyticsLabel: {
    fontSize: 11,
    color: "#374151",
    marginBottom: 4,
    opacity: 0.9,
  },
  analyticsValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#111827",
  },
  adActions: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  actionIconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  actionIconButtonSpacing: {
    marginRight: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  createFirstAdButton: {
    marginTop: 20,
    backgroundColor: "#1877F2",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  createFirstAdButtonText: {
    color: "white",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f8fafc",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#1877F2",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
