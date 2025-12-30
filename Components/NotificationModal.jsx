import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { router } from "expo-router";
import { connectSocket, getSocket } from "../utils/socket";

const { width } = Dimensions.get("window");

const NotificationModal = ({ visible, onClose, userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (visible && userId) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [visible, userId]);

  // Set up socket listeners when modal is visible
  useEffect(() => {
    if (!visible || !userId) return;

    const socket = getSocket() || connectSocket(userId);

    // Listen for new notifications
    const handleNewNotification = (data) => {
      if (data.success && data.data) {
        setNotifications((prev) => [data.data, ...prev]);
        setUnreadCount((prev) => prev + 1);
      }
    };

    // Listen for unread count updates
    const handleUnreadCountUpdate = (data) => {
      if (data.success) {
        setUnreadCount(data.count || 0);
      }
    };

    socket.on("new_notification", handleNewNotification);
    socket.on("unread_count_update", handleUnreadCountUpdate);

    return () => {
      socket.off("new_notification", handleNewNotification);
      socket.off("unread_count_update", handleUnreadCountUpdate);
    };
  }, [visible, userId]);

  const fetchNotifications = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const authToken = await AsyncStorage.getItem("authToken");

      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "user-id": userId,
        },
        params: {
          limit: 50,
        },
      });

      if (response.data.success) {
        setNotifications(response.data.data || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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

  const markAsRead = async (notificationId) => {
    try {
      const authToken = await AsyncStorage.getItem("authToken");

      await axios.put(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "user-id": userId,
          },
        }
      );

      // Update local state (socket will also emit unread_count_update)
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      // Unread count will be updated via socket event
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const authToken = await AsyncStorage.getItem("authToken");

      await axios.put(
        `${API_BASE_URL}/notifications/read-all`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "user-id": userId,
          },
        }
      );

      // Update local state (socket will also emit unread_count_update)
      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
      // Unread count will be updated via socket event
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Map web routes to mobile app routes
  const mapWebRouteToMobile = (webRoute) => {
    if (!webRoute) return null;

    // Remove /user and /admin prefixes
    let route = webRoute.replace("/user", "").replace("/admin", "");
    
    // Map specific routes
    const routeMap = {
      "/ugc-pro-video": "/UgcProVideo",
      "/subscription": "/Subscription",
      "/marketing": "/Marketing",
      "/meta-ads": "/MetaAdsScreen",
      "/creative-workshop": "/CreativeWorkShop",
      "/referral": "/Referrals",
      "/referrals": "/Referrals",
      "/settings": "/Settings",
      "/chat-support": "/LiveChat",
      "/live-chat": "/LiveChat",
      "/ivr": "/IvrForm",
      "/": "/Home",
      "": "/Home",
    };

    // Check if route exists in map
    if (routeMap[route]) {
      return routeMap[route];
    }

    // If route starts with /, use it as is (might be a valid mobile route)
    if (route.startsWith("/")) {
      return route;
    }

    // Default to home if no match
    return "/Home";
  };

  const handleNotificationPress = async (notification) => {
    console.log("🔔 Notification pressed:", notification);
    
    // Mark as read if unread
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    // Close modal first
    onClose();

    // Then navigate if there's a link
    if (notification.link) {
      try {
        const mobileRoute = mapWebRouteToMobile(notification.link);
        console.log(`🔔 Mapping route: ${notification.link} -> ${mobileRoute}`);
        
        if (mobileRoute) {
          // Use setTimeout to ensure modal closes before navigation
          setTimeout(() => {
            try {
              router.push(mobileRoute);
              console.log(`✅ Navigated to: ${mobileRoute}`);
            } catch (navError) {
              console.error("❌ Navigation error:", navError);
            }
          }, 300);
        } else {
          console.warn(`⚠️ Could not map route: ${notification.link}`);
        }
      } catch (error) {
        console.error("❌ Error navigating from notification:", error);
      }
    } else {
      console.log("ℹ️ No link in notification");
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  const getNotificationIcon = (type) => {
    const icons = {
      ugc_request_created: "videocam",
      ugc_request_status_updated: "checkmark-circle",
      payment_success: "cash",
      payment_failed: "close-circle",
      subscription_activated: "gift",
      subscription_expired: "warning",
      referral_reward: "gift",
      general: "notifications",
    };
    return icons[type] || "notifications";
  };

  const getNotificationColor = (type) => {
    const colors = {
      ugc_request_created: "#3B82F6",
      ugc_request_status_updated: "#10B981",
      payment_success: "#10B981",
      payment_failed: "#EF4444",
      subscription_activated: "#8B5CF6",
      subscription_expired: "#F59E0B",
      referral_reward: "#EC4899",
      general: "#6366F1",
    };
    return colors[type] || "#6366F1";
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
    fetchUnreadCount();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={markAllAsRead}
                style={styles.markAllButton}
              >
                <Text style={styles.markAllText}>Mark all read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          {/* Notifications List */}
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366F1" />
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No notifications</Text>
              <Text style={styles.emptySubtext}>
                You're all caught up!
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              {notifications.map((notification) => (
                <TouchableOpacity
                  key={notification._id}
                  onPress={() => handleNotificationPress(notification)}
                  style={[
                    styles.notificationItem,
                    !notification.isRead && styles.unreadNotification,
                  ]}
                >
                  <View style={styles.notificationContent}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: `${getNotificationColor(notification.type)}20` },
                      ]}
                    >
                      <Ionicons
                        name={getNotificationIcon(notification.type)}
                        size={24}
                        color={getNotificationColor(notification.type)}
                      />
                    </View>
                    <View style={styles.notificationTextContainer}>
                      <View style={styles.notificationHeader}>
                        <Text
                          style={[
                            styles.notificationTitle,
                            !notification.isRead && styles.unreadTitle,
                          ]}
                        >
                          {notification.title}
                        </Text>
                        {!notification.isRead && (
                          <View style={styles.unreadDot} />
                        )}
                      </View>
                      <Text style={styles.notificationMessage}>
                        {notification.message}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {formatTime(notification.createdAt)}
                      </Text>
                    </View>
                    {notification.link && (
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#9CA3AF"
                      />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "85%",
    maxHeight: 700,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    fontSize: 14,
    color: "#6366F1",
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
  },
  notificationItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  unreadNotification: {
    backgroundColor: "#EFF6FF",
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
  },
  unreadTitle: {
    color: "#1F2937",
    fontWeight: "700",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
  },
  notificationMessage: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
});

export default NotificationModal;

