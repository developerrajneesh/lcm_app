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
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 40) / 2 - 10; // 2 columns with spacing

const API_BASE_URL = "http://192.168.1.9:5000/api/v1";

const MyCreatives = () => {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchWorkshops();
  }, []);

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
      <View style={styles.header}>
        <Text style={styles.title}>📱 Workshop Gallery</Text>
        <Text style={styles.subtitle}>
          {workshops.length} {workshops.length === 1 ? "workshop" : "workshops"} available
        </Text>
      </View>

      {workshops.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No workshops yet</Text>
          <Text style={styles.emptyHint}>
            Admin needs to save images first
          </Text>
        </View>
      ) : (
        <FlatList
          data={workshops}
          renderItem={({ item }) => (
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
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
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
    padding: 15,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 15,
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
});

export default MyCreatives;
