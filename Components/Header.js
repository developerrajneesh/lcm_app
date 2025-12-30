import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useState, useEffect, useRef, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import NotificationBadge from "./NotificationBadge";

const Header = () => {
  const [userProfileImage, setUserProfileImage] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const intervalRef = useRef(null);

  // Function to check user login status
  const checkUserLogin = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      const authToken = await AsyncStorage.getItem("authToken");
      
      if (userData && authToken) {
        const user = JSON.parse(userData);
        setUserProfileImage(user.profileImage || null);
        setUserId(user.id || user._id || null);
        setIsLoggedIn(true);
      } else {
        setUserProfileImage(null);
        setUserId(null);
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("Error checking user login:", error);
      setUserProfileImage(null);
      setIsLoggedIn(false);
    }
  }, []);

  // Check login status when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      checkUserLogin();
    }, [])
  );

  // Periodically check login status to catch logout events
  useEffect(() => {
    // Initial check
    checkUserLogin();

    // Set up interval to check every 2 seconds to catch logout events
    intervalRef.current = setInterval(() => {
      checkUserLogin();
    }, 2000);

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>LCM</Text>
      <View style={styles.headerIcons}>
        {/* Notifications */}
        {isLoggedIn && userId ? (
          <NotificationBadge userId={userId} iconSize={24} iconColor="#000" />
        ) : (
          <Ionicons name="notifications-outline" size={24} color="#000" />
        )}

        {/* Profile Image - Only show if user is logged in */}
        {isLoggedIn && userProfileImage && (
          <TouchableOpacity style={{ marginLeft: 15 }}>
            <Image
              source={{
                uri: userProfileImage,
              }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#deebff",
    // marginBottom: 10,
    paddingBottom: 10,
    // paddingTop: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "600",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
});

export default Header;
