import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AdsScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showSortOptions, setShowSortOptions] = useState(false);

  // Sample ads data
  const [ads, setAds] = useState([
    {
      id: "1",
      name: "Summer Sale - 50% Off",
      status: "active",
      budget: "$50",
      spent: "$32.50",
      impressions: "12.5K",
      clicks: "850",
      ctr: "6.8%",
      result: "245 Purchases",
      costPerResult: "$0.13",
      startDate: "Jun 15, 2023",
      endDate: "Jul 15, 2023",
      audience: "Women, 25-40",
      image: "https://placehold.co/600x400/FF6B6B/white?text=Summer+Sale",
      objective: "Conversions",
    },
    {
      id: "2",
      name: "New Product Launch",
      status: "paused",
      budget: "$75",
      spent: "$48.20",
      impressions: "15.2K",
      clicks: "920",
      ctr: "6.1%",
      result: "180 Leads",
      costPerResult: "$0.27",
      startDate: "Jul 1, 2023",
      endDate: "Aug 1, 2023",
      audience: "Men, 30-45",
      image: "https://placehold.co/600x400/4ECDC4/white?text=New+Product",
      objective: "Lead Generation",
    },
    {
      id: "3",
      name: "Holiday Promotion",
      status: "completed",
      budget: "$100",
      spent: "$100.00",
      impressions: "28.7K",
      clicks: "1.8K",
      ctr: "6.3%",
      result: "420 Website Visits",
      costPerResult: "$0.24",
      startDate: "Dec 1, 2022",
      endDate: "Dec 31, 2022",
      audience: "All, 18-65",
      image: "https://placehold.co/600x400/45B7D1/white?text=Holiday+Promo",
      objective: "Traffic",
    },
    {
      id: "4",
      name: "Brand Awareness Campaign",
      status: "active",
      budget: "$60",
      spent: "$28.75",
      impressions: "18.3K",
      clicks: "720",
      ctr: "3.9%",
      result: "12K Reach",
      costPerResult: "$0.002",
      startDate: "Jul 10, 2023",
      endDate: "Aug 10, 2023",
      audience: "All, 18+",
      image: "https://placehold.co/600x400/F9C80E/white?text=Brand+Awareness",
      objective: "Reach",
    },
    {
      id: "5",
      name: "Back to School Offer",
      status: "pending",
      budget: "$45",
      spent: "$0",
      impressions: "0",
      clicks: "0",
      ctr: "0%",
      result: "0",
      costPerResult: "$0",
      startDate: "Aug 15, 2023",
      endDate: "Sep 15, 2023",
      audience: "Parents, 25-45",
      image: "https://placehold.co/600x400/F26A8D/white?text=Back+to+School",
      objective: "Conversions",
    },
    {
      id: "6",
      name: "Clearance Event",
      status: "active",
      budget: "$80",
      spent: "$62.40",
      impressions: "22.1K",
      clicks: "1.4K",
      ctr: "6.3%",
      result: "320 Purchases",
      costPerResult: "$0.20",
      startDate: "Jun 25, 2023",
      endDate: "Jul 25, 2023",
      audience: "All, 18+",
      image: "https://placehold.co/600x400/CB769E/white?text=Clearance+Event",
      objective: "Conversions",
    },
  ]);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const filteredAds = ads.filter((ad) => {
    const matchesSearch = ad.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "active") return matchesSearch && ad.status === "active";
    if (activeTab === "paused") return matchesSearch && ad.status === "paused";
    if (activeTab === "completed")
      return matchesSearch && ad.status === "completed";
    if (activeTab === "pending")
      return matchesSearch && ad.status === "pending";

    return matchesSearch;
  });

  // Sort ads based on selected option
  const sortedAds = [...filteredAds].sort((a, b) => {
    if (sortBy === "date") return new Date(b.startDate) - new Date(a.startDate);
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "spent")
      return (
        parseFloat(b.spent.replace("$", "")) -
        parseFloat(a.spent.replace("$", ""))
      );
    if (sortBy === "clicks")
      return (
        parseInt(b.clicks.replace("K", "000")) -
        parseInt(a.clicks.replace("K", "000"))
      );
    return 0;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "#4CAF50";
      case "paused":
        return "#FF9800";
      case "completed":
        return "#9E9E9E";
      case "pending":
        return "#2196F3";
      default:
        return "#9E9E9E";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return "play-circle";
      case "paused":
        return "pause-circle";
      case "completed":
        return "check-circle";
      case "pending":
        return "clock";
      default:
        return "help-circle";
    }
  };

  const toggleAdStatus = (id) => {
    setAds(
      ads.map((ad) => {
        if (ad.id === id) {
          const newStatus = ad.status === "active" ? "paused" : "active";
          return { ...ad, status: newStatus };
        }
        return ad;
      })
    );
  };

  const renderAdItem = ({ item }) => (
    <TouchableOpacity
      style={styles.adCard}
      //   onPress={() => navigation.navigate("AdDetails", { ad: item })}
    >
      <View style={styles.adImageContainer}>
        <Image source={{ uri: item.image }} style={styles.adImage} />
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Ionicons name={getStatusIcon(item.status)} size={14} color="white" />
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.adContent}>
        <Text style={styles.adName}>{item.name}</Text>

        <View style={styles.adObjective}>
          <Ionicons name="ribbon-outline" size={14} color="#666" />
          <Text style={styles.adObjectiveText}>{item.objective}</Text>
        </View>

        <View style={styles.adAudience}>
          <Ionicons name="people-outline" size={14} color="#666" />
          <Text style={styles.adAudienceText}>{item.audience}</Text>
        </View>

        <View style={styles.adDates}>
          <Ionicons name="calendar-outline" size={14} color="#666" />
          <Text style={styles.adDatesText}>
            {item.startDate} - {item.endDate}
          </Text>
        </View>

        <View style={styles.adStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.spent}</Text>
            <Text style={styles.statLabel}>Spent</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.impressions}</Text>
            <Text style={styles.statLabel}>Impressions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.clicks}</Text>
            <Text style={styles.statLabel}>Clicks</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.ctr}</Text>
            <Text style={styles.statLabel}>CTR</Text>
          </View>
        </View>
      </View>

      <View style={styles.adActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            toggleAdStatus(item.id);
          }}
        >
          <Ionicons
            name={item.status === "active" ? "pause" : "play"}
            size={20}
            color={item.status === "active" ? "#FF9800" : "#4CAF50"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            // navigation.navigate("EditAd", { ad: item });
          }}
        >
          <Ionicons name="create-outline" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            // navigation.navigate("AdPerformance", { ad: item });
          }}
        >
          <Ionicons name="stats-chart" size={20} color="#4361EE" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Your Ads</Text>
          <Text style={styles.headerSubtitle}>
            Manage and track your advertising campaigns
          </Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          //   onPress={() => navigation.navigate("CreateAd")}
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

        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortOptions(!showSortOptions)}
        >
          <Ionicons name="filter" size={20} color="#666" />
          <Text style={styles.sortButtonText}>Sort</Text>
        </TouchableOpacity>
      </View>

      {showSortOptions && (
        <View style={styles.sortOptions}>
          <Text style={styles.sortTitle}>Sort by</Text>
          <View style={styles.sortOptionsRow}>
            <TouchableOpacity
              style={[
                styles.sortOption,
                sortBy === "date" && styles.activeSortOption,
              ]}
              onPress={() => {
                setSortBy("date");
                setShowSortOptions(false);
              }}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  sortBy === "date" && styles.activeSortOptionText,
                ]}
              >
                Date
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sortOption,
                sortBy === "name" && styles.activeSortOption,
              ]}
              onPress={() => {
                setSortBy("name");
                setShowSortOptions(false);
              }}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  sortBy === "name" && styles.activeSortOptionText,
                ]}
              >
                Name
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sortOption,
                sortBy === "spent" && styles.activeSortOption,
              ]}
              onPress={() => {
                setSortBy("spent");
                setShowSortOptions(false);
              }}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  sortBy === "spent" && styles.activeSortOptionText,
                ]}
              >
                Amount Spent
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sortOption,
                sortBy === "clicks" && styles.activeSortOption,
              ]}
              onPress={() => {
                setSortBy("clicks");
                setShowSortOptions(false);
              }}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  sortBy === "clicks" && styles.activeSortOptionText,
                ]}
              >
                Clicks
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
          <TouchableOpacity
            style={[styles.tab, activeTab === "pending" && styles.activeTab]}
            onPress={() => setActiveTab("pending")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "pending" && styles.activeTabText,
              ]}
            >
              Pending
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.statsOverview}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{ads.length}</Text>
          <Text style={styles.statLabel}>Total Ads</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {ads.filter((a) => a.status === "active").length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            $
            {ads
              .reduce(
                (sum, ad) => sum + parseFloat(ad.spent.replace("$", "")),
                0
              )
              .toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {ads
              .reduce(
                (sum, ad) => sum + parseInt(ad.clicks.replace("K", "000")),
                0
              )
              .toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Total Clicks</Text>
        </View>
      </View>

      <FlatList
        data={sortedAds}
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
                : "Create your first ad to get started"}
            </Text>
            <TouchableOpacity
              style={styles.createFirstAdButton}
              //   onPress={() => navigation.navigate("CreateAd")}
            >
              <Text style={styles.createFirstAdButtonText}>
                Create Your First Ad
              </Text>
            </TouchableOpacity>
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
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f2f5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  sortButtonText: {
    marginLeft: 6,
    color: "#666",
  },
  sortOptions: {
    backgroundColor: "white",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  sortTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
  },
  sortOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  sortOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 8,
    marginBottom: 8,
  },
  activeSortOption: {
    backgroundColor: "#1877F2",
    borderColor: "#1877F2",
  },
  sortOptionText: {
    color: "#666",
  },
  activeSortOptionText: {
    color: "white",
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
  listContent: {
    padding: 16,
  },
  adCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  adImageContainer: {
    position: "relative",
  },
  adImage: {
    width: "100%",
    height: 160,
  },
  statusBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
  },
  adContent: {
    padding: 16,
  },
  adName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  adObjective: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  adObjectiveText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#666",
  },
  adAudience: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  adAudienceText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#666",
  },
  adDates: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  adDatesText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#666",
  },
  adStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  adActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingVertical: 12,
  },
  actionButton: {
    padding: 8,
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
});
