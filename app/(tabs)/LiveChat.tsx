import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { io, Socket } from "socket.io-client";

const API_BASE_URL = "http://192.168.1.9:5000/api/v1";
const SOCKET_URL = "http://192.168.1.9:5000";

interface Message {
  _id?: string;
  sender?: {
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
  const messagesEndRef = useRef<ScrollView>(null);
  const pendingMessagesRef = useRef(new Map<string, number>());

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

  useEffect(() => {
    if (!user) return;

    // Initialize socket connection
    const newSocket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("Connected to server");
      newSocket.emit("join", user.id);
    });

    newSocket.on("receive_message", (data: any) => {
      if (data.success && data.data) {
        const message = data.data;
        setMessages((prev) => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some((m) => {
            if (m._id && message._id) {
              return String(m._id) === String(message._id);
            }
            return (
              m.message === message.message &&
              (m.sender?._id === message.sender?._id ||
                m.sender === message.sender?._id) &&
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
        setMessages((prev) => {
          // Remove any temporary messages with the same content
          const filtered = prev.filter((m) => {
            if (m._id && !m._id.startsWith("temp_")) {
              return !(
                String(m._id) === String(message._id) ||
                (m.message === message.message &&
                  m.sender?._id === message.sender?._id &&
                  Math.abs(
                    new Date(m.createdAt).getTime() -
                      new Date(message.createdAt).getTime()
                  ) < 5000)
              );
            }
            return !(
              m._id?.startsWith("temp_") &&
              m.message === message.message &&
              (m.sender?._id === message.sender?._id ||
                m.sender === message.sender?._id)
            );
          });

          // Check if message already exists
          const exists = filtered.some((m) => {
            if (m._id && message._id) {
              return String(m._id) === String(message._id);
            }
            return (
              m.message === message.message &&
              (m.sender?._id === message.sender?._id ||
                m.sender === message.sender?._id) &&
              Math.abs(
                new Date(m.createdAt).getTime() -
                  new Date(message.createdAt).getTime()
              ) < 5000
            );
          });

          if (exists) return filtered;

          // Remove from pending messages
          pendingMessagesRef.current.delete(message.message);

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

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

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

  const handleSend = () => {
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
      const exists = prev.some(
        (m) =>
          m.message === messageText &&
          (m.sender?._id === user.id || m.sender === user.id) &&
          Math.abs(new Date(m.createdAt).getTime() - Date.now()) < 2000
      );
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
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
          showsVerticalScrollIndicator={false}
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
              const isOwnMessage =
                msg.sender?._id === user.id || msg.sender === user.id;
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
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor="#94a3b8"
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
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
    padding: 16,
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
    alignItems: "center",
    padding: 12,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
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
});

export default LiveChat;
