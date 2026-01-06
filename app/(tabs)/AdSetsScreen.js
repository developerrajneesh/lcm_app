import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

export default function AdSetsScreen() {
  const { campaignId, campaignName } = useLocalSearchParams();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [adSets, setAdSets] = useState([]);
  const [adAccountId, setAdAccountId] = useState(null);

  useEffect(() => {
    if (campaignId) {
      loadAdAccountId();
      fetchAdSets();
    } else {
      Alert.alert("Error", "Campaign ID not provided");
      router.back();
    }
  }, [campaignId]);

  const loadAdAccountId = async () => {
    try {
      const accountId = await AsyncStorage.getItem("fb_ad_account_id");
      setAdAccountId(accountId);
    } catch (error) {
      console.error("Error loading ad account ID:", error);
    }
  };

  const fetchAdSets = async () => {
    try {
      setLoading(true);
      const accessToken = await AsyncStorage.getItem("fb_access_token");
      if (!accessToken) {
        Alert.alert("Error", "Please connect your Meta account first");
        router.back();
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/adsets/all`, {
        params: {
          campaignId: campaignId,
        },
        headers: {
          "x-fb-access-token": accessToken,
        },
      });

      if (response.data.success && response.data.adsets?.data) {
        const formattedAdSets = response.data.adsets.data.map((adSet) => ({
          id: adSet.id,
          name: adSet.name || "Unnamed Ad Set",
          status: adSet.status?.toLowerCase() || "unknown",
          effectiveStatus: adSet.effective_status?.toLowerCase() || adSet.status?.toLowerCase() || "unknown",
          dailyBudget: adSet.daily_budget ? `$${(adSet.daily_budget / 100).toFixed(2)}` : "N/A",
          lifetimeBudget: adSet.lifetime_budget ? `$${(adSet.lifetime_budget / 100).toFixed(2)}` : null,
          optimizationGoal: adSet.optimization_goal || "N/A",
          billingEvent: adSet.billing_event || "N/A",
          createdTime: adSet.created_time,
          updatedTime: adSet.updated_time,
        }));
        setAdSets(formattedAdSets);
      } else {
        setAdSets([]);
      }
    } catch (error) {
      console.error("Error fetching ad sets:", error);
      
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
            "Failed to fetch ad sets"
        );
      }
      setAdSets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAdSets();
  };

  const filteredAdSets = adSets.filter((adSet) => {
    const matchesSearch = adSet.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const status = adSet.effectiveStatus || adSet.status;

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "active")
      return matchesSearch && (status === "active" || status === "adset_active");
    if (activeTab === "paused")
      return matchesSearch && (status === "paused" || status === "adset_paused");
    if (activeTab === "completed")
      return matchesSearch && (status === "archived" || status === "deleted");

    return matchesSearch;
  });

  const getStatusColor = (status) => {
    const normalizedStatus = (status || "").toLowerCase();
    if (normalizedStatus === "active" || normalizedStatus === "adset_active") {
      return "#4CAF50";
    }
    if (normalizedStatus === "paused" || normalizedStatus === "adset_paused") {
      return "#FF9800";
    }
    if (normalizedStatus === "archived" || normalizedStatus === "deleted") {
      return "#9E9E9E";
    }
    return "#9E9E9E";
  };

  const getStatusText = (status) => {
    const normalizedStatus = (status || "").toLowerCase();
    if (normalizedStatus === "active" || normalizedStatus === "adset_active") {
      return "ACTIVE";
    }
    if (normalizedStatus === "paused" || normalizedStatus === "adset_paused") {
      return "PAUSED";
    }
    if (normalizedStatus === "archived" || normalizedStatus === "deleted") {
      return "ARCHIVED";
    }
    return normalizedStatus.toUpperCase();
  };

  const handlePauseResume = async (adSetId, currentStatus) => {
    try {
      const accessToken = await AsyncStorage.getItem("fb_access_token");
      const normalizedStatus = (currentStatus || "").toLowerCase();
      const isPaused = normalizedStatus === "paused" || normalizedStatus === "adset_paused";

      const endpoint = isPaused
        ? `${API_BASE_URL}/adsets/${adSetId}/activate`
        : `${API_BASE_URL}/adsets/${adSetId}/pause`;

      await axios.post(
        endpoint,
        {},
        {
          headers: {
            "x-fb-access-token": accessToken,
          },
        }
      );

      Alert.alert("Success", `Ad Set ${isPaused ? "activated" : "paused"} successfully`);
      fetchAdSets();
    } catch (error) {
      console.error("Error pausing/resuming ad set:", error);
      Alert.alert(
        "Error",
        error.response?.data?.fb?.message ||
          error.response?.data?.message ||
          "Failed to update ad set status"
      );
    }
  };

  const handleDelete = async (adSetId, adSetName) => {
    Alert.alert(
      "Delete Ad Set",
      `Are you sure you want to delete "${adSetName}"? This action cannot be undone.`,
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
              await axios.delete(`${API_BASE_URL}/adsets/${adSetId}`, {
                headers: {
                  "x-fb-access-token": accessToken,
                },
              });

              Alert.alert("Success", "Ad Set deleted successfully");
              fetchAdSets();
            } catch (error) {
              console.error("Error deleting ad set:", error);
              Alert.alert(
                "Error",
                error.response?.data?.fb?.message ||
                  error.response?.data?.message ||
                  "Failed to delete ad set"
              );
            }
          },
        },
      ]
    );
  };


  const renderAdSetItem = ({ item, index }) => {
    const status = item.effectiveStatus || item.status;
    const statusColor = getStatusColor(status);
    const statusText = getStatusText(status);
    const isPaused = status === "paused" || status === "adset_paused";
    const budget = item.lifetimeBudget || item.dailyBudget;

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
      <TouchableOpacity
        style={[
          styles.adSetCard,
          {
            backgroundColor: gradient.from,
          },
        ]}
        onPress={() => {
          router.push({
            pathname: "/AdsScreen",
            params: {
              adsetId: item.id,
              adsetName: item.name,
              campaignId: campaignId,
              campaignName: campaignName || "Campaign",
            },
          });
        }}
        activeOpacity={0.9}
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
        
        <View style={styles.adSetContent}>
          <View style={styles.adSetHeader}>
            <View style={styles.adSetNameContainer}>
              <Text style={styles.adSetName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.adSetId}>ID: {item.id}</Text>
              {budget && (
                <Text style={styles.adSetBudget}>
                  Budget: {budget}
                </Text>
              )}
              {item.optimizationGoal && (
                <View style={styles.optimizationBadge}>
                  <Text style={styles.optimizationText}>
                    {item.optimizationGoal}
                  </Text>
                </View>
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

          <View style={styles.adSetActions}>
            <View style={styles.actionButtonsContainer}>
              {isPaused ? (
                <TouchableOpacity
                  style={styles.actionIconButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handlePauseResume(item.id, status);
                  }}
                >
                  <MaterialCommunityIcons
                    name="play"
                    size={20}
                    color="#059669"
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.actionIconButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handlePauseResume(item.id, status);
                  }}
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
                onPress={(e) => {
                  e.stopPropagation();
                  handleDelete(item.id, item.name);
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#DC2626" />
              </TouchableOpacity>
            </View>
            <View style={styles.viewAdsContainer}>
              <Text style={styles.viewAdsText}>View Ads</Text>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {campaignName ? `Ad Sets - ${campaignName}` : "Ad Sets"}
          </Text>
          <Text style={styles.headerSubtitle}>
            Campaign ID: {campaignId}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => {
            router.push({
              pathname: "/MetaAdsScreen",
              params: {
                step: "2",
                campaignId: campaignId,
                campaignName: campaignName || "",
              },
            });
          }}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#666"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search ad sets..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.tabContainer}>
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
        <TouchableOpacity
          style={[styles.tab, activeTab === "completed" && styles.activeTab]}
          onPress={() => setActiveTab("completed")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "completed" && styles.activeTabText,
            ]}
          >
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1877F2" />
          <Text style={styles.loadingText}>Loading ad sets...</Text>
        </View>
      ) : (
        <>
          <View style={styles.statsOverview}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{adSets.length}</Text>
              <Text style={styles.statLabel}>Total Ad Sets</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {adSets.filter((a) => (a.effectiveStatus || a.status) === "active" || (a.effectiveStatus || a.status) === "adset_active").length}
              </Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {adSets.filter((a) => (a.effectiveStatus || a.status) === "paused" || (a.effectiveStatus || a.status) === "adset_paused").length}
              </Text>
              <Text style={styles.statLabel}>Paused</Text>
            </View>
          </View>

          <FlatList
            data={filteredAdSets}
            renderItem={({ item, index }) => renderAdSetItem({ item, index })}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="layers-outline" size={64} color="#CCCCCC" />
                <Text style={styles.emptyStateText}>No ad sets found</Text>
                <Text style={styles.emptyStateSubtext}>
                  {searchQuery
                    ? "Try a different search term"
                    : "This campaign has no ad sets yet"}
                </Text>
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
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  placeholder: {
    width: 40,
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f2f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    height: 45,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  budgetToggle: {
    flexDirection: "row",
    alignItems: "center",
  },
  toggleLabel: {
    marginRight: 8,
    color: "#666",
    fontWeight: "500",
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#f0f2f5",
    borderRadius: 6,
    overflow: "hidden",
  },
  toggleOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  activeToggle: {
    backgroundColor: "#1877F2",
  },
  toggleText: {
    color: "#666",
    fontSize: 14,
  },
  activeToggleText: {
    color: "white",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 16,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
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
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1877F2",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  adSetCard: {
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
  adSetContent: {
    position: "relative",
    zIndex: 10,
  },
  adSetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  adSetNameContainer: {
    flex: 1,
    marginRight: 12,
  },
  adSetName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 6,
  },
  adSetId: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.75)",
    marginBottom: 4,
  },
  adSetBudget: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
    marginBottom: 8,
  },
  optimizationBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(220, 38, 38, 1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  optimizationText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
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
  adSetActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
    paddingTop: 16,
    marginTop: 16,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  actionIconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  viewAdsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAdsText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1877F2",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  createButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 4,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#ffffff",
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
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
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
    color: "#334155",
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#1e293b",
  },
  formHint: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  formRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  selectContainer: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
  },
  selectText: {
    fontSize: 16,
    color: "#1e293b",
  },
  submitButton: {
    backgroundColor: "#1877F2",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
