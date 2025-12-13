import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function MetaCompaigns() {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Sample campaign data
  const [campaigns, setCampaigns] = useState([
    {
      id: "1",
      name: "Summer Sale Campaign",
      status: "active",
      budget: "$500",
      spent: "$320",
      impressions: "45.2K",
      clicks: "2.1K",
      ctr: "4.6%",
      startDate: "Jun 15, 2023",
      endDate: "Jul 15, 2023",
    },
    {
      id: "2",
      name: "New Product Launch",
      status: "paused",
      budget: "$1200",
      spent: "$850",
      impressions: "78.5K",
      clicks: "3.8K",
      ctr: "4.8%",
      startDate: "Jul 1, 2023",
      endDate: "Aug 1, 2023",
    },
    {
      id: "3",
      name: "Holiday Promotion",
      status: "completed",
      budget: "$2000",
      spent: "$2000",
      impressions: "120.4K",
      clicks: "5.6K",
      ctr: "4.7%",
      startDate: "Dec 1, 2022",
      endDate: "Dec 31, 2022",
    },
    {
      id: "4",
      name: "Brand Awareness",
      status: "active",
      budget: "$800",
      spent: "$420",
      impressions: "65.3K",
      clicks: "1.8K",
      ctr: "2.8%",
      startDate: "Jul 10, 2023",
      endDate: "Aug 10, 2023",
    },
  ]);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "active")
      return matchesSearch && campaign.status === "active";
    if (activeTab === "paused")
      return matchesSearch && campaign.status === "paused";
    if (activeTab === "completed")
      return matchesSearch && campaign.status === "completed";

    return matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "#4CAF50";
      case "paused":
        return "#FF9800";
      case "completed":
        return "#9E9E9E";
      default:
        return "#9E9E9E";
    }
  };

  const renderCampaignItem = ({ item }) => (
    <View style={styles.campaignCard}>
      <View style={styles.campaignHeader}>
        <Text style={styles.campaignName}>{item.name}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.campaignDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Budget</Text>
            <Text style={styles.detailValue}>{item.budget}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Spent</Text>
            <Text style={styles.detailValue}>{item.spent}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>CTR</Text>
            <Text style={styles.detailValue}>{item.ctr}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Impressions</Text>
            <Text style={styles.detailValue}>{item.impressions}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Clicks</Text>
            <Text style={styles.detailValue}>{item.clicks}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>
              {item.startDate} - {item.endDate}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.campaignActions}>
        <TouchableOpacity
          onPress={() => router.push("/AdSetsScreen")}
          style={styles.actionButton}
        >
          <Ionicons name="stats-chart" size={16} color="#4361EE" />
          <Text style={[styles.actionText, { color: "#4361EE" }]}>
            View Stats
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="create-outline" size={16} color="#666" />
          <Text style={[styles.actionText, { color: "#666" }]}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <MaterialCommunityIcons
            name={item.status === "paused" ? "play" : "pause"}
            size={16}
            color={item.status === "paused" ? "#4CAF50" : "#FF9800"}
          />
          <Text
            style={[
              styles.actionText,
              {
                color: item.status === "paused" ? "#4CAF50" : "#FF9800",
              },
            ]}
          >
            {item.status === "paused" ? "Resume" : "Pause"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
});
