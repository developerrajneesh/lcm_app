import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import NotificationModal from "./NotificationModal";
import { connectSocket, getSocket } from "../utils/socket";

const NotificationBadge = ({ userId, iconSize = 24, iconColor = "#6366f1" }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    fetchUnreadCount();

    // Connect to socket
    const socket = connectSocket(userId);

    // Listen for new notifications
    socket.on("new_notification", (data) => {
      if (data.success && data.data) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    // Listen for unread count updates
    socket.on("unread_count_update", (data) => {
      if (data.success) {
        setUnreadCount(data.count || 0);
      }
    });

    // Cleanup
    return () => {
      socket.off("new_notification");
      socket.off("unread_count_update");
    };
  }, [userId]);

  const fetchUnreadCount = async () => {
    if (!userId) return;

    try {
      const authToken = await AsyncStorage.getItem("authToken");

      const response = await axios.get(`${API_BASE_URL}/notifications/unread-count`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "user-id": userId,
        },
      });

      if (response.data.success) {
        setUnreadCount(response.data.count || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        style={styles.container}
      >
        <Ionicons name="notifications" size={iconSize} color={iconColor} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <NotificationModal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          fetchUnreadCount(); // Refresh count when modal closes
        }}
        userId={userId}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    padding: 8,
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
});

export default NotificationBadge;

