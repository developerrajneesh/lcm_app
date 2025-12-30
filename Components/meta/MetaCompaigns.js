import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
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

export default function MetaCompaigns() {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adAccountId, setAdAccountId] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);

  useEffect(() => {
    loadAdAccountId();
    fetchCampaigns();
  }, []);

  const loadAdAccountId = async () => {
    try {
      const accountId = await AsyncStorage.getItem("fb_ad_account_id");
      setAdAccountId(accountId);
    } catch (error) {
      console.error("Error loading ad account ID:", error);
    }
  };

  const fetchCampaigns = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setCampaigns([]); // Clear existing campaigns on refresh
        setHasMore(true);
        setNextCursor(null);
      }

      const accessToken = await AsyncStorage.getItem("fb_access_token");
      if (!accessToken) {
        // Token not found - user disconnected, go back to connect screen
        setIsConnected(false);
        Alert.alert("Disconnected", "Your Meta account has been disconnected. Please reconnect to continue.");
        router.replace("/MetaWorker");
        return;
      }
      setIsConnected(true);

      const accountId = adAccountId || (await AsyncStorage.getItem("fb_ad_account_id"));
      if (!accountId) {
        // Try to get ad accounts first
        const accountsResponse = await axios.get(`${API_BASE_URL}/campaigns`, {
          headers: {
            "x-fb-access-token": accessToken,
          },
        });

        if (accountsResponse.data.success && accountsResponse.data.adAccounts?.data?.[0]?.id) {
          const firstAccountId = accountsResponse.data.adAccounts.data[0].id;
          await AsyncStorage.setItem("fb_ad_account_id", firstAccountId);
          setAdAccountId(firstAccountId);
          await fetchCampaignsForAccount(firstAccountId, accessToken, loadMore);
        } else {
          setCampaigns([]);
        }
      } else {
        await fetchCampaignsForAccount(accountId, accessToken, loadMore);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      
      // Check for token expiration
      const { handleTokenExpiration } = require("../../utils/metaErrorHandler");
      const wasTokenExpired = await handleTokenExpiration(error, () => {
        setIsConnected(false);
        router.replace("/MetaWorker");
      });
      
      if (!wasTokenExpired) {
        Alert.alert(
          "Error",
          error.response?.data?.fb?.message ||
            error.response?.data?.message ||
            "Failed to fetch campaigns"
        );
      }
      if (!loadMore) {
        setCampaigns([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const fetchCampaignsForAccount = async (accountId, accessToken, loadMore = false) => {
    try {
      const params = {
        adAccountId: accountId,
        limit: 25, // Fetch 25 campaigns per page
      };

      // Add pagination cursor if loading more
      if (loadMore && nextCursor) {
        params.after = nextCursor;
      }

      const response = await axios.get(`${API_BASE_URL}/campaigns/all`, {
        params,
        headers: {
          "x-fb-access-token": accessToken,
        },
      });

      if (response.data.success && response.data.campaigns?.data) {
        const formattedCampaigns = response.data.campaigns.data.map((campaign) => ({
          id: campaign.id,
          name: campaign.name || "Unnamed Campaign",
          status: campaign.status?.toLowerCase() || "unknown",
          effectiveStatus: campaign.effective_status?.toLowerCase() || campaign.status?.toLowerCase() || "unknown",
          objective: campaign.objective || "N/A",
          createdTime: campaign.created_time,
          updatedTime: campaign.updated_time,
        }));

        if (loadMore) {
          // Append new campaigns to existing list
          setCampaigns((prevCampaigns) => [...prevCampaigns, ...formattedCampaigns]);
        } else {
          // Replace campaigns on initial load or refresh
          setCampaigns(formattedCampaigns);
        }

        // Check if there are more pages
        const paging = response.data.campaigns?.paging;
        if (paging?.cursors?.after) {
          setNextCursor(paging.cursors.after);
          setHasMore(true);
        } else {
          setNextCursor(null);
          setHasMore(false);
        }
      } else {
        if (!loadMore) {
          setCampaigns([]);
        }
        setHasMore(false);
        setNextCursor(null);
      }
    } catch (error) {
      console.error("Error fetching campaigns for account:", error);
      throw error;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Check token before refreshing
    const token = await AsyncStorage.getItem("fb_access_token");
    if (!token) {
      setIsConnected(false);
      setRefreshing(false);
      Alert.alert("Disconnected", "Your Meta account has been disconnected. Please reconnect to continue.");
      router.replace("/MetaWorker");
      return;
    }
    fetchCampaigns(false); // Reset pagination on refresh
  };

  const loadMoreCampaigns = () => {
    if (!loadingMore && hasMore && !loading) {
      fetchCampaigns(true);
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const status = campaign.effectiveStatus || campaign.status;

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "active")
      return matchesSearch && (status === "active" || status === "campaign_active");
    if (activeTab === "paused")
      return matchesSearch && (status === "paused" || status === "campaign_paused");
    if (activeTab === "completed")
      return matchesSearch && (status === "archived" || status === "deleted");

    return matchesSearch;
  });

  const getStatusColor = (status) => {
    const normalizedStatus = (status || "").toLowerCase();
    if (normalizedStatus === "active" || normalizedStatus === "campaign_active") {
      return "#4CAF50";
    }
    if (normalizedStatus === "paused" || normalizedStatus === "campaign_paused") {
      return "#FF9800";
    }
    if (normalizedStatus === "archived" || normalizedStatus === "deleted" || normalizedStatus === "completed") {
      return "#9E9E9E";
    }
    return "#9E9E9E";
  };

  const getStatusText = (status) => {
    const normalizedStatus = (status || "").toLowerCase();
    if (normalizedStatus === "active" || normalizedStatus === "campaign_active") {
      return "ACTIVE";
    }
    if (normalizedStatus === "paused" || normalizedStatus === "campaign_paused") {
      return "PAUSED";
    }
    if (normalizedStatus === "archived" || normalizedStatus === "deleted") {
      return "ARCHIVED";
    }
    return normalizedStatus.toUpperCase();
  };

  const handlePauseResume = async (campaignId, currentStatus) => {
    try {
      const accessToken = await AsyncStorage.getItem("fb_access_token");
      const normalizedStatus = (currentStatus || "").toLowerCase();
      const isPaused = normalizedStatus === "paused" || normalizedStatus === "campaign_paused";

      const endpoint = isPaused
        ? `${API_BASE_URL}/campaigns/${campaignId}/activate`
        : `${API_BASE_URL}/campaigns/${campaignId}/pause`;

      await axios.post(
        endpoint,
        {},
        {
          headers: {
            "x-fb-access-token": accessToken,
          },
        }
      );

      Alert.alert("Success", `Campaign ${isPaused ? "activated" : "paused"} successfully`);
      fetchCampaigns(false); // Reset pagination
    } catch (error) {
      console.error("Error pausing/resuming campaign:", error);
      Alert.alert(
        "Error",
        error.response?.data?.fb?.message ||
          error.response?.data?.message ||
          "Failed to update campaign status"
      );
    }
  };

  const handleDelete = async (campaignId, campaignName) => {
    Alert.alert(
      "Delete Campaign",
      `Are you sure you want to delete "${campaignName}"? This action cannot be undone.`,
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
              await axios.delete(`${API_BASE_URL}/campaigns/${campaignId}`, {
                headers: {
                  "x-fb-access-token": accessToken,
                },
              });

              Alert.alert("Success", "Campaign deleted successfully");
              fetchCampaigns(false); // Reset pagination
            } catch (error) {
              console.error("Error deleting campaign:", error);
              Alert.alert(
                "Error",
                error.response?.data?.fb?.message ||
                  error.response?.data?.message ||
                  "Failed to delete campaign"
              );
            }
          },
        },
      ]
    );
  };

  const renderCampaignItem = ({ item }) => {
    const status = item.effectiveStatus || item.status;
    const statusColor = getStatusColor(status);
    const statusText = getStatusText(status);
    const isPaused = status === "paused" || status === "campaign_paused";

    return (
      <View style={styles.campaignCard}>
        <View style={styles.campaignHeader}>
          <View style={styles.campaignNameContainer}>
            <Text style={styles.campaignName}>{item.name}</Text>
            <Text style={styles.campaignObjective}>{item.objective || "N/A"}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor },
            ]}
          >
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>

        <View style={styles.campaignActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push({
              pathname: "/AdSetsScreen",
              params: { campaignId: item.id, campaignName: item.name }
            })}
          >
            <Ionicons name="layers-outline" size={18} color="#1877F2" />
            <Text style={[styles.actionText, { color: "#1877F2" }]}>
              View Ad Sets
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handlePauseResume(item.id, status)}
          >
            <MaterialCommunityIcons
              name={isPaused ? "play" : "pause"}
              size={18}
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
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item.id, item.name)}
          >
            <Ionicons name="trash-outline" size={18} color="#E53935" />
            <Text style={[styles.actionText, { color: "#E53935" }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Campaign Management</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push("/MetaAdsScreen")}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.createButtonText}>Create Campaign</Text>
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
          placeholder="Search campaigns..."
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
          <Text style={styles.loadingText}>Loading campaigns...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCampaigns}
          renderItem={renderCampaignItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMoreCampaigns}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={64} color="#CCCCCC" />
              <Text style={styles.emptyStateText}>No campaigns found</Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery
                  ? "Try a different search term"
                  : "Create your first campaign to get started"}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color="#1877F2" />
                <Text style={styles.loadingMoreText}>Loading more campaigns...</Text>
              </View>
            ) : null
          }
        />
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
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    flex: 1,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1877F2",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: "#1877F2",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  createButtonText: {
    color: "white",
    fontWeight: "700",
    marginLeft: 6,
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    margin: 16,
    marginTop: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
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
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    backgroundColor: "#1877F2",
  },
  tabText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 14,
  },
  activeTabText: {
    color: "white",
    fontWeight: "700",
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  campaignCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  campaignHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  campaignNameContainer: {
    flex: 1,
    marginRight: 12,
  },
  campaignName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 6,
  },
  campaignObjective: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 70,
    alignItems: "center",
  },
  statusText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  campaignActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingVertical: 8,
    marginHorizontal: 2,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 13,
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
  loadingMoreContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },
});
