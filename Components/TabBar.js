import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const TabBar = () => {
  const [activeTab, setActiveTab] = useState("Home");

  const tabs = [
    { name: "Settings", icon: "settings-outline" },
    { name: "Subscription", icon: "card-outline" },
    { name: "Home", icon: "home" },
    { name: "Creatives", icon: "image-outline" },
    { name: "Marketing", icon: "megaphone-outline" },
  ];

  return (
    <View style={styles.tabBar}>
      {/* Left 2 tabs */}
      {tabs.slice(0, 2).map((tab) => (
        <TouchableOpacity
          key={tab.name}
          onPress={() => {
            setActiveTab(tab.name);
            console.log(`${tab.name} pressed`);
            if (tab.name == "Settings") {
              //   console.log(`${tab.name} pressed`);
              router.push("/Settings");
            }
            if (tab.name == "Subscription") {
              //   console.log(`${tab.name} pressed`);
              router.push("/Subscription");
            }
          }}
          style={styles.tabItem}
        >
          <Ionicons
            name={tab.icon}
            size={24}
            color={activeTab === tab.name ? "#2F80ED" : "#666"}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === tab.name ? "#2F80ED" : "#666" },
            ]}
          >
            {tab.name}
          </Text>
        </TouchableOpacity>
      ))}

      {/* Center Home Button (styled like the previous Add button) */}
      <TouchableOpacity
        onPress={() => {
          setActiveTab("Home");
          console.log("Home pressed");
          router.push("/Home");
        }}
        style={[
          styles.centerButton,
          activeTab === "Home" && styles.centerButtonActive,
        ]}
      >
        <Ionicons
          name="home"
          size={24}
          color={activeTab === "Home" ? "#fff" : "#2F80ED"}
        />
      </TouchableOpacity>

      {/* Right 2 tabs */}
      {tabs.slice(3).map((tab) => (
        <TouchableOpacity
          key={tab.name}
          onPress={() => {
            setActiveTab(tab.name);
            if (tab.name == "Marketing") {
              //   console.log(`${tab.name} pressed`);
              router.push("/Marketing");
            }
            if (tab.name == "Creatives") {
              router.push("/Creatives");
            }
          }}
          style={styles.tabItem}
        >
          <Ionicons
            name={tab.icon}
            size={24}
            color={activeTab === tab.name ? "#2F80ED" : "#666"}
          />

          <Text
            style={[
              styles.tabText,
              { color: activeTab === tab.name ? "#2F80ED" : "#666" },
            ]}
          >
            {tab.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 70,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#deebff",
    position: "relative",
  },
  tabItem: {
    alignItems: "center",
    flex: 1,
    paddingTop: 8,
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  centerButtonActive: {
    backgroundColor: "#2F80ED",
  },
});

export default TabBar;
