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

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
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
          await fetchCampaignsForAccount(firstAccountId, accessToken);
        } else {
          setCampaigns([]);
        }
      } else {
        await fetchCampaignsForAccount(accountId, accessToken);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      Alert.alert(
        "Error",
        error.response?.data?.fb?.message ||
          error.response?.data?.message ||
          "Failed to fetch campaigns"
      );
      setCampaigns([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCampaignsForAccount = async (accountId, accessToken) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/campaigns/all`, {
        params: {
          adAccountId: accountId,
        },
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
        setCampaigns(formattedCampaigns);
      } else {
        setCampaigns([]);
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
    fetchCampaigns();
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
      fetchCampaigns();
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

  const renderCampaignItem = ({ item }) => {
    const status = item.effectiveStatus || item.status;
    const statusColor = getStatusColor(status);
    const statusText = getStatusText(status);
    const isPaused = status === "paused" || status === "campaign_paused";

    return (
      <View style={styles.campaignCard}>
        <View style={styles.campaignHeader}>
          <Text style={styles.campaignName}>{item.name}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor },
            ]}
          >
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>

        <View style={styles.campaignDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Objective</Text>
              <Text style={styles.detailValue}>{item.objective || "N/A"}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={styles.detailValue}>{statusText}</Text>
            </View>
          </View>

          {item.createdTime && (
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>
                  {new Date(item.createdTime).toLocaleDateString()}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.campaignActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push({
              pathname: "/AdSetsScreen",
              params: { campaignId: item.id, campaignName: item.name }
            })}
          >
            <Ionicons name="layers-outline" size={16} color="#4361EE" />
            <Text style={[styles.actionText, { color: "#4361EE" }]}>
              View Ad Sets
            </Text>
          </TouchableOpacity>
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
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a1a1a",
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
    backgroundColor: "white",
    margin: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
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
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  campaignCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  campaignHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  campaignName: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  campaignDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  campaignActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
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
});
