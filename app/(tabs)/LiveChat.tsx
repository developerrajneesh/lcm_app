import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Keyboard,
  Dimensions,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL, SOCKET_URL } from "../../config/api";
import { useSubscription } from "../../hooks/useSubscription";
import { hasActiveSubscription } from "../../utils/subscription";
import UpgradeModal from "../../Components/UpgradeModal";

interface Message {
  _id?: string;
  senderId?: string | {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  sender?: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  receiverId?: string | {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  receiver?: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  message: string;
  conversationId: string;
  createdAt: string;
  isRead: boolean;
}

const LiveChat = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const messagesEndRef = useRef<ScrollView>(null);
  const pendingMessagesRef = useRef(new Map<string, number>());
  
  // Subscription - get refresh function to manually refresh after payment
  const { subscription, refreshSubscription, loading: subscriptionLoading } = useSubscription();

  // Use a ref to store the latest refreshSubscription function and prevent multiple simultaneous refreshes
  const refreshSubscriptionRef = useRef(refreshSubscription);
  const isRefreshingRef = useRef(false);
  
  // Update ref when refreshSubscription changes
  useEffect(() => {
    refreshSubscriptionRef.current = refreshSubscription;
  }, [refreshSubscription]);

  // Refresh subscription when screen comes into focus (e.g., after payment)
  useFocusEffect(
    useCallback(() => {
      // Prevent multiple simultaneous refreshes
      if (isRefreshingRef.current) {
        return;
      }
      
      isRefreshingRef.current = true;
      console.log("🔍 LiveChat: Screen focused - refreshing subscription");
      refreshSubscriptionRef.current();
      
      // Reset ref after a short delay
      setTimeout(() => {
        isRefreshingRef.current = false;
      }, 1000);
    }, []) // Empty dependency array - only run on focus
  );

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } else {
        Alert.alert("Error", "Please login to use chat support");
        router.back();
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      Alert.alert("Error", "Failed to load user data");
    }
  };

  // Helper function to fetch subscription for check
  const fetchSubscriptionForCheck = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      const authToken = await AsyncStorage.getItem("authToken");
      
      if (!userData) return null;
      
      const user = JSON.parse(userData);
      const userId = user.id || user._id;
      
      const config: any = {
        params: { userId },
      };
      
      if (authToken) {
        config.headers = {
          Authorization: `Bearer ${authToken}`,
        };
      }
      
      const response = await axios.get(
        `${API_BASE_URL}/subscription/active-subscription`,
        config
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching subscription:", error);
      return null;
    }
  };

  useEffect(() => {
    if (!user) return;

    // Wait for subscription to finish loading before checking
    // This prevents false negatives when subscription is still loading
    if (subscriptionLoading) {
      console.log("⏳ LiveChat: Waiting for subscription to load...");
      return;
    }

    // Check subscription before initializing socket
    console.log("🔍 LiveChat: Checking subscription");
    console.log("  - Loading:", subscriptionLoading);
    console.log("  - Subscription:", subscription ? JSON.stringify(subscription, null, 2) : "null");
    
    const hasActive = hasActiveSubscription(subscription);
    console.log("  - Has active subscription:", hasActive);
    
    if (!hasActive) {
      console.log("❌ LiveChat: No active subscription - showing upgrade modal");
      setShowUpgradeModal(true);
      setLoading(false);
      // Disconnect socket if it exists
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return; // Block socket connection
    }
    
    // If subscription is active, hide upgrade modal and initialize socket
    if (hasActive) {
      console.log("✅ LiveChat: Subscription check passed - hiding modal and initializing socket");
      setShowUpgradeModal(false); // Hide modal if subscription becomes active
      
      // If socket is not connected, initialize it
      if (!socket) {
        initializeSocket();
      }
    }
  }, [user, subscription, subscriptionLoading]);

  const initializeSocket = () => {
    if (!user) return;
    
    console.log("🔌 LiveChat: Initializing socket connection");

    // Initialize socket connection
    const newSocket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("✅ LiveChat: Connected to server");
      newSocket.emit("join", user.id);
    });

    newSocket.on("receive_message", (data: any) => {
      if (data.success && data.data) {
        const message = data.data;
        
        // Ignore messages from the current user (they should be handled by message_sent)
        // Handle both populated senderId (object) and unpopulated senderId (string)
        const senderId = (typeof message.senderId === 'object' ? message.senderId?._id : message.senderId) || message.sender?._id || message.sender;
        const userId = user?.id || user?._id;
        if (String(senderId) === String(userId)) {
          return;
        }
        
        setMessages((prev) => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some((m) => {
            if (m._id && message._id) {
              return String(m._id) === String(message._id);
            }
            const mSenderId = (typeof m.senderId === 'object' ? m.senderId?._id : m.senderId) || m.sender?._id || m.sender;
            const msgSenderId = (typeof message.senderId === 'object' ? message.senderId?._id : message.senderId) || message.sender?._id || message.sender;
            return (
              m.message === message.message &&
              String(mSenderId) === String(msgSenderId) &&
              Math.abs(
                new Date(m.createdAt).getTime() -
                  new Date(message.createdAt).getTime()
              ) < 5000
            );
          });
          if (exists) return prev;
          return [...prev, message];
        });
        setTimeout(scrollToBottom, 100);
      }
    });

    newSocket.on("message_sent", (data: any) => {
      if (data.success && data.data) {
        const message = data.data;
        
        // Only process messages sent by the current user
        // Handle both populated senderId (object) and unpopulated senderId (string)
        const senderId = (typeof message.senderId === 'object' ? message.senderId?._id : message.senderId) || message.sender?._id || message.sender;
        const userId = user?.id || user?._id;
        if (String(senderId) !== String(userId)) {
          return;
        }
        
        setMessages((prev) => {
          // Remove any temporary messages with the same content from the current user
          const filtered = prev.filter((m) => {
            const mSenderId = (typeof m.senderId === 'object' ? m.senderId?._id : m.senderId) || m.sender?._id || m.sender;
            const userId = user?.id || user?._id;
            const isOwnTemp = m._id?.startsWith("temp_") && String(mSenderId) === String(userId);
            
            // Remove temp messages that match this confirmed message
            if (isOwnTemp) {
              return !(
                m.message === message.message &&
                Math.abs(
                  new Date(m.createdAt).getTime() -
                    new Date(message.createdAt).getTime()
                ) < 5000
              );
            }
            
            // Keep all non-temp messages and temp messages from others
            return true;
          });

          // Check if this confirmed message already exists
          const exists = filtered.some((m) => {
            if (m._id && message._id) {
              return String(m._id) === String(message._id);
            }
            return false;
          });

          if (exists) return filtered;

          // Remove from pending messages
          pendingMessagesRef.current.delete(message.message);

          // Add the confirmed message
          return [...filtered, message];
        });
        setTimeout(scrollToBottom, 100);
      }
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    setSocket(newSocket);

    // Fetch admin info and create/get conversation
    fetchAdminAndConversation();

    // Return cleanup function
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  };

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  const fetchAdminAndConversation = async () => {
    try {
      setLoading(true);

      // Get admin user
      const usersResponse = await axios.get(`${API_BASE_URL}/user/all`, {
        headers: {
          "user-id": user.id,
        },
      });

      if (usersResponse.data.success) {
        const admin = usersResponse.data.data.find(
          (u: any) => u.role === "admin"
        );
        if (admin) {
          setAdminInfo(admin);
          const convId = [user.id, admin.id].sort().join("_");
          setConversationId(convId);

          // Fetch existing messages
          await fetchMessages(convId);
        } else {
          Alert.alert("Error", "Admin not found");
        }
      }
    } catch (error) {
      console.error("Error fetching admin:", error);
      Alert.alert("Error", "Failed to connect to chat support");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/chat/messages/${convId}`,
        {
          headers: {
            "user-id": user.id,
          },
        }
      );

      if (response.data.success) {
        setMessages(response.data.data || []);
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollToEnd({ animated: true });
  };

  // Handle keyboard show/hide to scroll messages and track keyboard height
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleSend = () => {
    // Wait for subscription to finish loading
    if (subscriptionLoading) {
      // Show loader - subscription loading state will be handled by the component
      // Wait for subscription to load, then proceed
      const checkSubscription = setInterval(() => {
        if (!subscriptionLoading) {
          clearInterval(checkSubscription);
          // Retry the action after subscription loads
          setTimeout(() => handleSend(), 100);
        }
      }, 100);
      return;
    }

    // Check subscription before sending message
    console.log("🔍 LiveChat: Checking subscription before sending message");
    console.log("  - Loading:", subscriptionLoading);
    console.log("  - Subscription:", subscription ? JSON.stringify(subscription, null, 2) : "null");
    
    const hasActive = hasActiveSubscription(subscription);
    console.log("  - Has active subscription:", hasActive);
    
    if (!hasActive) {
      console.log("❌ LiveChat: No subscription - blocking message send");
      setShowUpgradeModal(true);
      return;
    }
    
    console.log("✅ LiveChat: Subscription check passed - allowing message send");
    
    if (!newMessage.trim() || !socket || !conversationId || !adminInfo) return;

    const messageText = newMessage.trim();

    // Check if this message is already pending
    if (pendingMessagesRef.current.has(messageText)) {
      return; // Don't send duplicate
    }

    const messageData = {
      senderId: user.id,
      receiverId: adminInfo.id,
      message: messageText,
      conversationId: conversationId,
    };

    // Track this as pending
    pendingMessagesRef.current.set(messageText, Date.now());

    // Optimistically add message to UI immediately
    const tempMessage: Message = {
      _id: `temp_${Date.now()}_${Math.random()}`,
      sender: {
        _id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
      },
      receiver: adminInfo,
      message: messageText,
      conversationId: conversationId,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    setMessages((prev) => {
      // Check if message already exists (prevent double sending)
      const userId = user?.id || user?._id;
      const exists = prev.some((m) => {
        const mSenderId = (typeof m.senderId === 'object' ? m.senderId?._id : m.senderId) || m.sender?._id || m.sender;
        return (
          m.message === messageText &&
          String(mSenderId) === String(userId) &&
          Math.abs(new Date(m.createdAt).getTime() - Date.now()) < 2000
        );
      });
      if (exists) return prev;
      return [...prev, tempMessage];
    });

    setNewMessage("");
    setTimeout(scrollToBottom, 100);

    // Send via socket
    socket.emit("send_message", messageData);

    // Clean up pending message after 10 seconds if not confirmed
    setTimeout(() => {
      pendingMessagesRef.current.delete(messageText);
    }, 10000);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Connecting to support...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        // behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.onlineIndicator} />
            <Text style={styles.headerTitle}>
              {adminInfo?.name || "Support Team"}
            </Text>
          </View>
          <View style={styles.moreButton} />
        </View>

        {/* Messages */}
        <ScrollView
          ref={messagesEndRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onContentSizeChange={() => scrollToBottom()}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>
                No messages yet. Start the conversation!
              </Text>
            </View>
          ) : (
            messages.map((msg, index) => {
              // Check multiple ways the sender ID might be stored
              // Handle both populated senderId (object) and unpopulated senderId (string)
              const msgSenderId = (typeof msg.senderId === 'object' ? msg.senderId?._id : msg.senderId) || msg.sender?._id || msg.sender;
              const userId = user?.id || user?._id;
              const isOwnMessage = String(msgSenderId) === String(userId);
              
              console.log("🔍 Message ownership check:", {
                msgId: msg._id,
                msgSenderId,
                userId,
                isOwnMessage,
                hasSender: !!msg.sender,
                hasSenderId: !!msg.senderId,
              });
              
              return (
                <View
                  key={msg._id || `msg-${index}`}
                  style={[
                    styles.messageContainer,
                    isOwnMessage ? styles.userMessage : styles.supportMessage,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      isOwnMessage
                        ? styles.userBubble
                        : styles.supportBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        isOwnMessage ? styles.userText : styles.supportText,
                      ]}
                    >
                      {msg.message}
                    </Text>
                    <Text
                      style={[
                        styles.messageTime,
                        isOwnMessage ? styles.userTime : styles.supportTime,
                      ]}
                    >
                      {formatTime(msg.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputContainer, Platform.OS === "android" && keyboardHeight > 0 && { paddingBottom: keyboardHeight - 55 }]}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor="#94a3b8"
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
            onFocus={() => {
              setTimeout(() => {
                scrollToBottom();
              }, 100);
            }}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || !socket) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!newMessage.trim() || !socket}
          >
            <Ionicons
              name="send"
              size={20}
              color={newMessage.trim() && socket ? "#ffffff" : "#94a3b8"}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Loading Overlay */}
      <Modal
        visible={subscriptionLoading}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingModalContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingModalText}>Checking subscription...</Text>
          </View>
        </View>
      </Modal>

      {/* Upgrade Modal */}
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={async () => {
          console.log("🔒 LiveChat: Upgrade modal closed");
          setShowUpgradeModal(false);
          
          // Refresh subscription when modal closes (in case user just made payment)
          console.log("🔄 LiveChat: Refreshing subscription after modal close");
          await refreshSubscription();
          
          // Wait a moment for subscription state to update
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Re-check subscription after refresh
          const updatedSubscription = await fetchSubscriptionForCheck();
          const hasActive = hasActiveSubscription(updatedSubscription);
          
          if (hasActive) {
            console.log("✅ LiveChat: Subscription now active - initializing socket");
            initializeSocket();
          } else {
            console.log("❌ LiveChat: Still no subscription - navigating back");
            // Navigate back if still no subscription
            router.back();
          }
        }}
        isPremiumFeature={false}
        featureName="Live Chat Support"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22c55e",
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  moreButton: {
    width: 40,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: "flex-end",
  },
  supportMessage: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: "#6366f1",
    borderBottomRightRadius: 4,
  },
  supportBubble: {
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: "#ffffff",
  },
  supportText: {
    color: "#1e293b",
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  userTime: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  supportTime: {
    color: "#94a3b8",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingBottom: Platform.OS === "ios" ? 12 : 12,
  },
  input: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#1e293b",
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#e2e8f0",
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingModalContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    minWidth: 200,
  },
  loadingModalText: {
    marginTop: 16,
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
  },
});

export default LiveChat;
