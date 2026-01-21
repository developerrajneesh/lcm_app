import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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

export default function AdSetsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [budgetType, setBudgetType] = useState("daily"); // 'daily' or 'lifetime'

  // Sample ad sets data
  const [adSets, setAdSets] = useState([
    {
      id: "1",
      name: "Summer Sale - Women 25-40",
      status: "active",
      budget: "₹50",
      spent: "₹32",
      impressions: "12.5K",
      clicks: "850",
      ctr: "6.8%",
      result: "245 Purchases",
      costPerResult: "₹0.13",
      startDate: "Jun 15, 2023",
      endDate: "Jul 15, 2023",
      audience: "Women, 25-40, Interest: Fashion",
      placements: "Facebook Feed, Instagram Stories",
      optimization: "Conversions",
    },
    {
      id: "2",
      name: "New Product Launch - Men 30-45",
      status: "paused",
      budget: "₹75",
      spent: "₹48",
      impressions: "15.2K",
      clicks: "920",
      ctr: "6.1%",
      result: "180 Leads",
      costPerResult: "₹0.27",
      startDate: "Jul 1, 2023",
      endDate: "Aug 1, 2023",
      audience: "Men, 30-45, Interest: Tech",
      placements: "Facebook Feed, Audience Network",
      optimization: "Lead Generation",
    },
    {
      id: "3",
      name: "Holiday Promotion - Broad Audience",
      status: "completed",
      budget: "₹100",
      spent: "₹100",
      impressions: "28.7K",
      clicks: "1.8K",
      ctr: "6.3%",
      result: "420 Website Visits",
      costPerResult: "₹0.24",
      startDate: "Dec 1, 2022",
      endDate: "Dec 31, 2022",
      audience: "All, 18-65",
      placements: "Facebook Feed, Instagram Feed",
      optimization: "Link Clicks",
    },
    {
      id: "4",
      name: "Brand Awareness - Interest Based",
      status: "active",
      budget: "₹60",
      spent: "₹28",
      impressions: "18.3K",
      clicks: "720",
      ctr: "3.9%",
      result: "12K Reach",
      costPerResult: "₹0.002",
      startDate: "Jul 10, 2023",
      endDate: "Aug 10, 2023",
      audience: "All, 18+, Interest: Shopping",
      placements: "Facebook Right Column",
      optimization: "Reach",
    },
  ]);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const filteredAdSets = adSets.filter((adSet) => {
    const matchesSearch = adSet.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "active")
      return matchesSearch && adSet.status === "active";
    if (activeTab === "paused")
      return matchesSearch && adSet.status === "paused";
    if (activeTab === "completed")
      return matchesSearch && adSet.status === "completed";

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

  const toggleAdSetStatus = (id) => {
    setAdSets(
      adSets.map((adSet) => {
        if (adSet.id === id) {
          const newStatus = adSet.status === "active" ? "paused" : "active";
          return { ...adSet, status: newStatus };
        }
        return adSet;
      })
    );
  };

  const renderAdSetItem = ({ item }) => (
    <View style={styles.adSetCard}>
      <View style={styles.adSetHeader}>
        <Text style={styles.adSetName}>{item.name}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.adSetDetails}>
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
            <Text style={styles.detailLabel}>Results</Text>
            <Text style={styles.detailValue}>{item.result}</Text>
          </View>
        </View>

        <View style={styles.additionalInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="people" size={16} color="#666" />
            <Text style={styles.infoText}>{item.audience}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="cellphone" size={16} color="#666" />
            <Text style={styles.infoText}>{item.placements}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="trending-up" size={16} color="#666" />
            <Text style={styles.infoText}>
              Optimization: {item.optimization}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={16} color="#666" />
            <Text style={styles.infoText}>
              {item.startDate} - {item.endDate}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.adSetActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="stats-chart" size={16} color="#4361EE" />
          <Text style={[styles.actionText, { color: "#4361EE" }]}>
            Performance
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="create-outline" size={16} color="#666" />
          <Text style={[styles.actionText, { color: "#666" }]}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => toggleAdSetStatus(item.id)}
        >
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
            {item.status === "paused" ? "Enable" : "Pause"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Ad Sets Management</Text>
          <Text style={styles.headerSubtitle}>
            Manage your Meta advertising sets
          </Text>
        </View>
        <TouchableOpacity style={styles.createButton}>
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.createButtonText}>Create Ad Set</Text>
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
            placeholder="Search ad sets..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.budgetToggle}>
          <Text style={styles.toggleLabel}>Budget Type:</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                budgetType === "daily" && styles.activeToggle,
              ]}
              onPress={() => setBudgetType("daily")}
            >
              <Text
                style={[
                  styles.toggleText,
                  budgetType === "daily" && styles.activeToggleText,
                ]}
              >
                Daily
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                budgetType === "lifetime" && styles.activeToggle,
              ]}
              onPress={() => setBudgetType("lifetime")}
            >
              <Text
                style={[
                  styles.toggleText,
                  budgetType === "lifetime" && styles.activeToggleText,
                ]}
              >
                Lifetime
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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

      <View style={styles.statsOverview}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>4</Text>
          <Text style={styles.statLabel}>Total Ad Sets</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>2</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>₹208</Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>6.3%</Text>
          <Text style={styles.statLabel}>Avg. CTR</Text>
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
                : "Create your first ad set to get started"}
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
    marginRight: 12,
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
