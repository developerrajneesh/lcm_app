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

export default function AdSetsScreen() {
  const { campaignId, campaignName } = useLocalSearchParams();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [adSets, setAdSets] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [adAccountId, setAdAccountId] = useState(null);
  
  // Create Ad Set Form State
  const [adSetForm, setAdSetForm] = useState({
    name: "",
    dailyBudget: "",
    optimizationGoal: "LINK_CLICKS",
    billingEvent: "IMPRESSIONS",
    location: "US",
    ageMin: "18",
    ageMax: "65",
  });

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
      Alert.alert(
        "Error",
        error.response?.data?.fb?.message ||
          error.response?.data?.message ||
          "Failed to fetch ad sets"
      );
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

  const handleCreateAdSet = async () => {
    if (!adSetForm.name.trim()) {
      Alert.alert("Error", "Please enter an ad set name");
      return;
    }
    if (!adSetForm.dailyBudget || parseFloat(adSetForm.dailyBudget) < 225) {
      Alert.alert("Error", "Daily budget must be at least ₹225.00");
      return;
    }
    if (!adAccountId) {
      Alert.alert("Error", "Ad account ID not found. Please reconnect your Meta account.");
      return;
    }

    setCreating(true);

    try {
      const accessToken = await AsyncStorage.getItem("fb_access_token");
      
      // Convert budget to paise (×100) - Meta uses paise for INR
      const dailyBudgetPaise = Math.round(parseFloat(adSetForm.dailyBudget) * 100);

      const targetingData = {
        geo_locations: {
          countries: [adSetForm.location],
        },
        age_min: parseInt(adSetForm.ageMin) || 18,
        age_max: parseInt(adSetForm.ageMax) || 65,
        interests: [],
      };

      const response = await axios.post(
        `${API_BASE_URL}/adsets`,
        {
          campaignId: campaignId,
          adAccountId: adAccountId,
          name: adSetForm.name.trim(),
          optimizationGoal: adSetForm.optimizationGoal,
          billingEvent: adSetForm.billingEvent,
          dailyBudget: dailyBudgetPaise,
          targeting: targetingData,
          status: "PAUSED",
          autoFixBudget: false,
        },
        {
          headers: {
            "x-fb-access-token": accessToken,
          },
        }
      );

      if (response.data.success) {
        Alert.alert("Success", "Ad Set created successfully!");
        setShowCreateModal(false);
        setAdSetForm({
          name: "",
          dailyBudget: "",
          optimizationGoal: "LINK_CLICKS",
          billingEvent: "IMPRESSIONS",
          location: "US",
          ageMin: "18",
          ageMax: "65",
        });
        fetchAdSets();
      } else {
        throw new Error(response.data.message || "Failed to create ad set");
      }
    } catch (error) {
      console.error("Error creating ad set:", error);
      Alert.alert(
        "Error",
        error.response?.data?.fb?.message ||
          error.response?.data?.message ||
          error.message ||
          "Failed to create ad set. Please try again."
      );
    } finally {
      setCreating(false);
    }
  };

  const renderAdSetItem = ({ item }) => {
    const status = item.effectiveStatus || item.status;
    const statusColor = getStatusColor(status);
    const statusText = getStatusText(status);
    const isPaused = status === "paused" || status === "adset_paused";
    const budget = item.lifetimeBudget || item.dailyBudget;

    return (
      <View style={styles.adSetCard}>
        <View style={styles.adSetHeader}>
          <Text style={styles.adSetName}>{item.name}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor },
            ]}
          >
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>

        <View style={styles.adSetDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Budget</Text>
              <Text style={styles.detailValue}>{budget}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={styles.detailValue}>{statusText}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Optimization</Text>
              <Text style={styles.detailValue}>{item.optimizationGoal}</Text>
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

        <View style={styles.adSetActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewAdsButton]}
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
          >
            <Ionicons name="eye-outline" size={16} color="#1877F2" />
            <Text style={[styles.actionText, { color: "#1877F2" }]}>
              View Ads
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
          onPress={() => setShowCreateModal(true)}
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
            renderItem={renderAdSetItem}
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

      {/* Create Ad Set Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Ad Set</Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#1e293b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Ad Set Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Summer Sale - AdSet"
                  value={adSetForm.name}
                  onChangeText={(text) =>
                    setAdSetForm({ ...adSetForm, name: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Daily Budget (₹) *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Minimum: 225"
                  value={adSetForm.dailyBudget}
                  onChangeText={(text) =>
                    setAdSetForm({ ...adSetForm, dailyBudget: text })
                  }
                  keyboardType="numeric"
                />
                <Text style={styles.formHint}>Minimum: ₹225.00 per day</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Optimization Goal</Text>
                <View style={styles.selectContainer}>
                  <Text style={styles.selectText}>{adSetForm.optimizationGoal}</Text>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Billing Event</Text>
                <View style={styles.selectContainer}>
                  <Text style={styles.selectText}>{adSetForm.billingEvent}</Text>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Location</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., US, IN"
                  value={adSetForm.location}
                  onChangeText={(text) =>
                    setAdSetForm({ ...adSetForm, location: text.toUpperCase() })
                  }
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.formLabel}>Min Age</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="18"
                    value={adSetForm.ageMin}
                    onChangeText={(text) =>
                      setAdSetForm({ ...adSetForm, ageMin: text })
                    }
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.formLabel}>Max Age</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="65"
                    value={adSetForm.ageMax}
                    onChangeText={(text) =>
                      setAdSetForm({ ...adSetForm, ageMax: text })
                    }
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, creating && styles.submitButtonDisabled]}
                onPress={handleCreateAdSet}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitButtonText}>Create Ad Set</Text>
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
  adSetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  adSetName: {
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
  adSetDetails: {
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
  additionalInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  adSetActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#f0f2f5",
  },
  viewAdsButton: {
    backgroundColor: "#e3f2fd",
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
