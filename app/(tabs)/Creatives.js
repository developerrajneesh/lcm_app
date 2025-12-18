import axios from "axios";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  SectionList,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 40) / 2 - 10; // 2 columns with spacing
import { API_BASE_URL } from "../../config/api";

const MyCreatives = () => {
  const [workshops, setWorkshops] = useState([]);
  const [groupedSections, setGroupedSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchWorkshops();
  }, []);

  useEffect(() => {
    // Group workshops by category
    const grouped = {};
    workshops.forEach((workshop) => {
      const categoryName = workshop.category?.name || "Uncategorized";
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(workshop);
    });

    // Convert to SectionList format
    const sections = Object.keys(grouped).map((categoryName) => ({
      title: categoryName,
      data: grouped[categoryName],
    }));

    // Sort sections alphabetically (Uncategorized at the end)
    sections.sort((a, b) => {
      if (a.title === "Uncategorized") return 1;
      if (b.title === "Uncategorized") return -1;
      return a.title.localeCompare(b.title);
    });

    setGroupedSections(sections);
  }, [workshops]);

  const fetchWorkshops = async () => {
    try {
      setRefreshing(true);
      const response = await axios.get(`${API_BASE_URL}/image-texts`);
      
      if (response.data.success && response.data.data) {
        setWorkshops(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching workshops:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchWorkshops();
  };

  const handleWorkshopPress = (id) => {
    router.push({
      pathname: "/CreativeWorkShop",
      params: { id },
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading workshops...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* <View style={styles.header}>
        <Text style={styles.title}>📱 Workshop Gallery</Text>
        <Text style={styles.subtitle}>
          {workshops.length} {workshops.length === 1 ? "workshop" : "workshops"} available
        </Text>
      </View> */}

      {workshops.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No workshops yet</Text>
          <Text style={styles.emptyHint}>
            Admin needs to save images first
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {groupedSections.map((section) => (
            <View key={section.title} style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.sectionCountBadge}>
                  <Text style={styles.sectionCountText}>
                    {section.data.length} {section.data.length === 1 ? "workshop" : "workshops"}
                  </Text>
                </View>
              </View>
              <View style={styles.sectionGrid}>
                {section.data.map((item, index) => {
                  const isLeft = index % 2 === 0;
                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.cardWrapper,
                        isLeft && styles.cardWrapperLeft,
                        !isLeft && styles.cardWrapperRight,
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.card}
                        onPress={() => handleWorkshopPress(item.id)}
                        activeOpacity={0.7}
                      >
                        {item.thumbnail ? (
                          <Image
                            source={{ uri: item.thumbnail }}
                            style={styles.cardImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.cardImagePlaceholder}>
                            <Text style={styles.placeholderText}>No Image</Text>
                          </View>
                        )}
                        <View style={styles.cardContent}>
                          <Text style={styles.cardTitle} numberOfLines={1}>
                            Workshop
                          </Text>
                          <Text style={styles.cardSubtitle}>
                            {item.imageCount} {item.imageCount === 1 ? "image" : "images"}
                          </Text>
                          <Text style={styles.cardDate}>
                            {formatDate(item.createdAt)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  contentContainer: {
    paddingBottom: 15,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 15,
  },
  cardWrapper: {
    width: "50%",
    marginBottom: 15,
  },
  cardWrapperLeft: {
    paddingRight: 7.5,
  },
  cardWrapperRight: {
    paddingLeft: 7.5,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: "100%",
    height: CARD_WIDTH,
    backgroundColor: "#f0f0f0",
  },
  cardImagePlaceholder: {
    width: "100%",
    height: CARD_WIDTH,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#9ca3af",
    fontSize: 14,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#667eea",
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 11,
    color: "#9ca3af",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 8,
    fontWeight: "600",
  },
  emptyHint: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginHorizontal: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#667eea",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  sectionCountBadge: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionCountText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  sectionFooter: {
    height: 10,
  },
});

export default MyCreatives;
