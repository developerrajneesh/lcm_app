import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
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

const API_BASE_URL = "http://192.168.1.9:5000/api/v1";

export default function AdsScreen() {
  const { adsetId, adsetName, campaignId, campaignName } = useLocalSearchParams();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState([]);
  const [adInsights, setAdInsights] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create Ad Form State
  const [adForm, setAdForm] = useState({
    name: "",
    primaryText: "",
    headline: "",
    description: "",
    link: "https://www.example.com",
  });

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
      Alert.alert(
        "Error",
        error.response?.data?.fb?.message ||
          error.response?.data?.message ||
          "Failed to fetch ads"
      );
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

  const handleCreateAd = async () => {
    if (!adForm.name.trim()) {
      Alert.alert("Error", "Please enter an ad name");
      return;
    }

    setCreating(true);

    try {
      const accessToken = await AsyncStorage.getItem("fb_access_token");
      if (!accessToken) {
        Alert.alert("Error", "Please connect your Meta account first");
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/ads`,
        {
          adsetId: adsetId,
          name: adForm.name.trim(),
          creative: {
            object_story_spec: {
              link_data: {
                message: adForm.primaryText || "Check out our offer!",
                link: adForm.link || "https://www.example.com",
                name: adForm.headline || adForm.name,
                description: adForm.description || "",
                call_to_action: {
                  type: "LEARN_MORE",
                },
              },
            },
          },
          status: "PAUSED",
        },
        {
          headers: {
            "x-fb-access-token": accessToken,
          },
        }
      );

      if (response.data.success) {
        Alert.alert("Success", "Ad created successfully!");
        setShowCreateModal(false);
        setAdForm({
          name: "",
          primaryText: "",
          headline: "",
          description: "",
          link: "https://www.example.com",
        });
        fetchAds();
      } else {
        throw new Error(response.data.message || "Failed to create ad");
      }
    } catch (error) {
      console.error("Error creating ad:", error);
      Alert.alert(
        "Error",
        error.response?.data?.fb?.message ||
          error.response?.data?.message ||
          error.message ||
          "Failed to create ad. Please try again."
      );
    } finally {
      setCreating(false);
    }
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

  const renderAdItem = ({ item }) => {
    const status = item.status || "";
    const statusColor = getStatusColor(status);
    const statusText = getStatusText(status);
    const isPaused =
      status === "PAUSED" ||
      status === "paused" ||
      status === "ad_paused";
    const insights = adInsights[item.id];

    return (
      <View style={styles.adCard}>
        <View style={styles.adHeader}>
          <View style={styles.adHeaderLeft}>
            <Text style={styles.adName}>{item.name || "Unnamed Ad"}</Text>
            <View
              style={[styles.statusBadge, { backgroundColor: statusColor }]}
            >
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          </View>
        </View>

        {/* Analytics Section */}
        {insights ? (
          <View style={styles.analyticsSection}>
            <Text style={styles.analyticsTitle}>Analytics (Last 30 Days)</Text>
            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsLabel}>Impressions</Text>
                <Text style={styles.analyticsValue}>
                  {formatNumber(insights.impressions)}
                </Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsLabel}>Clicks</Text>
                <Text style={styles.analyticsValue}>
                  {formatNumber(insights.clicks)}
                </Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsLabel}>CTR</Text>
                <Text style={styles.analyticsValue}>
                  {insights.ctr ? formatPercent(insights.ctr) : "0%"}
                </Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsLabel}>Spend</Text>
                <Text style={styles.analyticsValue}>
                  {formatCurrency(insights.spend)}
                </Text>
              </View>
              {insights.reach && (
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsLabel}>Reach</Text>
                  <Text style={styles.analyticsValue}>
                    {formatNumber(insights.reach)}
                  </Text>
                </View>
              )}
              {insights.cpc && (
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsLabel}>CPC</Text>
                  <Text style={styles.analyticsValue}>
                    {formatCurrency(insights.cpc)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.noAnalytics}>
            <Text style={styles.noAnalyticsText}>No analytics data available</Text>
          </View>
        )}

        <View style={styles.adActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handlePauseResume(item.id, status)}
          >
            <MaterialCommunityIcons
              name={isPaused ? "play" : "pause"}
              size={16}
              color={isPaused ? "#4CAF50" : "#FF9800"}
            />
            <Text
              style={[
                styles.actionText,
                {
                  color: isPaused ? "#4CAF50" : "#FF9800",
                },
              ]}
            >
              {isPaused ? "Resume" : "Pause"}
            </Text>
          </TouchableOpacity>
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
          onPress={() => setShowCreateModal(true)}
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
            renderItem={renderAdItem}
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
                  onPress={() => setShowCreateModal(true)}
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

      {/* Create Ad Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Ad</Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#1e293b" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Ad Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Summer Sale - Ad"
                  value={adForm.name}
                  onChangeText={(text) =>
                    setAdForm({ ...adForm, name: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Primary Text</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  placeholder="Main message for your ad"
                  value={adForm.primaryText}
                  onChangeText={(text) =>
                    setAdForm({ ...adForm, primaryText: text })
                  }
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Headline</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Ad headline"
                  value={adForm.headline}
                  onChangeText={(text) =>
                    setAdForm({ ...adForm, headline: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  placeholder="Ad description"
                  value={adForm.description}
                  onChangeText={(text) =>
                    setAdForm({ ...adForm, description: text })
                  }
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Link URL</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="https://www.example.com"
                  value={adForm.link}
                  onChangeText={(text) =>
                    setAdForm({ ...adForm, link: text })
                  }
                  keyboardType="url"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  creating && styles.submitButtonDisabled,
                ]}
                onPress={handleCreateAd}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Create Ad</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  adHeader: {
    marginBottom: 12,
  },
  adHeaderLeft: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  adName: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  analyticsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  analyticsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  analyticsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  analyticsItem: {
    width: "48%",
    marginBottom: 12,
  },
  analyticsLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  analyticsValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  noAnalytics: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  noAnalyticsText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  adActions: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#f0f2f5",
    marginRight: 8,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
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
