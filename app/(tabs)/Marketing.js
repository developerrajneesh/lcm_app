import {
  Feather,
  FontAwesome6,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const MarketingOptionsScreen = () => {
  const [selectedOption, setSelectedOption] = useState(null);
  const fadeAnim = new Animated.Value(0);

  const marketingOptions = [
    {
      id: 1,
      title: "Meta Ads",
      description:
        "Reach your target audience with precision targeting and powerful analytics",
      icon: <FontAwesome6 name="meta" size={24} color="#1877F2" />,
      color: "#1877F2",
      gradient: ["#1877F2", "#0A5BC4"],
      stats: { engagement: "92%", roi: "3.5x", time: "24h" },
    },
    // {
    //   id: 2,
    //   title: "WhatsApp Marketing",
    //   description:
    //     "Engage customers directly with personalized messages and updates",
    //   icon: <FontAwesome5 name="whatsapp" size={24} color="#25D366" />,
    //   color: "#25D366",
    //   gradient: ["#25D366", "#128C7E"],
    //   stats: { engagement: "98%", roi: "4.2x", time: "2h" },
    // },
    {
      id: 3,
      title: "Email Marketing",
      description:
        "Create effective email campaigns that convert with our templates",
      icon: <MaterialIcons name="email" size={24} color="#EA4335" />,
      color: "#EA4335",
      gradient: ["#EA4335", "#D14836"],
      stats: { engagement: "85%", roi: "2.8x", time: "12h" },
    },
    {
      id: 4,
      title: "SMS Marketing",
      description: "Send targeted text messages with high open rates",
      icon: <Ionicons name="chatbubble" size={24} color="#8E44AD" />,
      color: "#8E44AD",
      gradient: ["#8E44AD", "#6C3483"],
      stats: { engagement: "95%", roi: "3.2x", time: "1h" },
    },
    // {
    //   id: 5,
    //   title: "Instagram Ads",
    //   description: "Leverage visual storytelling to connect with your audience",
    //   icon: <FontAwesome5 name="instagram" size={24} color="#E1306C" />,
    //   color: "#E1306C",
    //   gradient: ["#E1306C", "#C13584"],
    //   stats: { engagement: "89%", roi: "3.8x", time: "18h" },
    // },
  ];

  const handleOptionPress = (option) => {
    setSelectedOption(option);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    router.push("/MetaWorker");
  };

  const handleCloseDetail = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSelectedOption(null));
  };

  const renderOptionCard = (option) => (
    <TouchableOpacity
      key={option.id}
      style={[styles.optionCard, { borderLeftColor: option.color }]}
      onPress={() => handleOptionPress(option)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${option.color}15` },
          ]}
        >
          {option.icon}
        </View>
        <Text style={styles.cardTitle}>{option.title}</Text>
      </View>
      <Text style={styles.cardDescription}>{option.description}</Text>
      <View style={styles.cardFooter}>
        <Text style={[styles.learnMore, { color: option.color }]}></Text>
        <Ionicons name="chevron-forward" size={20} color={option.color} />
      </View>
    </TouchableOpacity>
  );

  const renderDetailView = () => {
    if (!selectedOption) return null;

    return (
      <Animated.View
        style={[
          styles.detailContainer,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View
          style={[
            styles.detailHeader,
            { backgroundColor: selectedOption.color },
          ]}
        >
          <TouchableOpacity
            onPress={handleCloseDetail}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.detailTitleContainer}>
            {selectedOption.icon}
            <Text style={styles.detailTitle}>{selectedOption.title}</Text>
          </View>
        </View>

        <View style={styles.detailContent}>
          <Text style={styles.detailDescription}>
            {selectedOption.description}
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: selectedOption.color }]}>
                {selectedOption?.stats.engagement}
              </Text>
              <Text style={styles.statLabel}>Engagement Rate</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: selectedOption.color }]}>
                {selectedOption.stats.roi}
              </Text>
              <Text style={styles.statLabel}>Higher ROI</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: selectedOption.color }]}>
                {selectedOption.stats.time}
              </Text>
              <Text style={styles.statLabel}>Setup Time</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.getStartedButton,
              { backgroundColor: selectedOption.color },
            ]}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
            <Feather
              name="arrow-right"
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFD" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Marketing Options</Text>
        <Text style={styles.headerSubtitle}>
          Choose the right channel for your campaign
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.optionsGrid}>
          {marketingOptions.map(renderOptionCard)}
        </View>

        {/* <View style={styles.footer}>
          <Text style={styles.footerText}>Need help choosing? </Text>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Contact our experts</Text>
          </TouchableOpacity>
        </View> */}
      </ScrollView>

      {/* {selectedOption && renderDetailView()} */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFD",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2D3748",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#718096",
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  optionsGrid: {
    padding: 16,
  },
  optionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3748",
  },
  cardDescription: {
    fontSize: 14,
    color: "#718096",
    marginBottom: 16,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  learnMore: {
    fontSize: 14,
    fontWeight: "600",
  },
  detailContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    zIndex: 10,
  },
  detailHeader: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 24,
    zIndex: 11,
  },
  detailTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginLeft: 12,
  },
  detailContent: {
    padding: 24,
  },
  detailDescription: {
    fontSize: 16,
    color: "#4A5568",
    lineHeight: 24,
    marginBottom: 32,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#718096",
    textAlign: "center",
  },
  getStartedButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  getStartedText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 14,
    color: "#718096",
  },
  footerLink: {
    fontSize: 14,
    color: "#4299E1",
    fontWeight: "600",
  },
});

export default MarketingOptionsScreen;
