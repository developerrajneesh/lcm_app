import {
  Entypo,
  FontAwesome5,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const options = [
  {
    label: "Profile Setting",
    icon: <Entypo name="user" size={22} color="#6366f1" />,
    bgColor: "#e0e7ff",
    route: "/ProfileSetting",
  },
  {
    label: "Live Chat",
    icon: <Ionicons name="chatbubbles-outline" size={22} color="#0ea5e9" />,
    bgColor: "#e0f2fe",
    route: "/LiveChat",
  },
  {
    label: "Wallet",
    icon: <Ionicons name="wallet-outline" size={22} color="#22c55e" />,
    bgColor: "#dcfce7",
    route: "/Wallet",
  },
  {
    label: "Share App",
    icon: <Ionicons name="share-social-outline" size={22} color="#8b5cf6" />,
    bgColor: "#f3e8ff",
    route: "/ShareApp",
  },
  {
    label: "Subscription",
    icon: <FontAwesome5 name="crown" size={20} color="#f59e0b" />,
    bgColor: "#fef3c7",
    route: "/Subscription",
  },
  {
    label: "Payment History",
    icon: <Ionicons name="receipt-outline" size={22} color="#ef4444" />,
    bgColor: "#fee2e2",
    route: "/PaymentHistory",
  },
  {
    label: "Privacy Policy",
    icon: <Ionicons name="document-text-outline" size={22} color="#64748b" />,
    bgColor: "#f1f5f9",
    route: "/PrivacyPolicy",
  },
  {
    label: "Account Delete",
    icon: <MaterialIcons name="delete-outline" size={22} color="#dc2626" />,
    bgColor: "#fef2f2",
    route: "/AccountDelete",
  },
  {
    label: "Log Out",
    icon: <MaterialIcons name="logout" size={22} color="#dc2626" />,
    bgColor: "#fef2f2",
    route: null,
    action: "logout",
  },
];

const SettingsScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerLine} />
        </View>

        {/* Profile Section */}
        <View style={styles.profileContainer}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{
                uri: "https://randomuser.me/api/portraits/women/44.jpg",
              }}
              style={styles.profileImage}
            />
            <View style={styles.onlineIndicator} />
          </View>
          <Text style={styles.profileName}>Emily Smith</Text>
          <Text style={styles.profileEmail}>emily.smith@example.com</Text>
        </View>

        {/* Options List */}
        <View style={styles.optionsContainer}>
          {options.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.optionItem, { backgroundColor: item.bgColor }]}
              onPress={() => {
                if (item.action === "logout") {
                  Alert.alert(
                    "Log Out",
                    "Are you sure you want to log out?",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Log Out",
                        style: "destructive",
                        onPress: () => {
                          // Add logout logic here (clear tokens, etc.)
                          Alert.alert("Logged Out", "You have been logged out successfully.");
                          // router.push("/login"); // Navigate to login if you have one
                        },
                      },
                    ]
                  );
                } else if (item.route) {
                  // Navigate to the screen using Expo Router
                  router.push(item.route as any);
                }
              }}
            >
              <View style={styles.optionIconContainer}>{item.icon}</View>
              <Text style={styles.optionText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </TouchableOpacity>
          ))}
        </View>

        {/* App Version */}
        <Text style={styles.versionText}>App Version 2.4.1</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 10,
  },
  headerLine: {
    height: 4,
    width: 50,
    backgroundColor: "#6366f1",
    borderRadius: 2,
  },
  profileContainer: {
    alignItems: "center",
    marginBottom: 30,
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#e2e8f0",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#22c55e",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: "#64748b",
  },
  optionsContainer: {
    marginBottom: 30,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  optionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#334155",
    flex: 1,
  },
  versionText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 10,
  },
});

export default SettingsScreen;
