import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../../../config/api";

export default function WhatsAppCampaign({ onNext, onBack }) {
  const [campaignName, setCampaignName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!campaignName.trim()) {
      Alert.alert("Error", "Please enter campaign name");
      return;
    }

    // Get credentials from AsyncStorage
    const fbToken = await AsyncStorage.getItem("fb_access_token") || await AsyncStorage.getItem("fb_token");
    const actAdAccountId = await AsyncStorage.getItem("fb_ad_account_id") || await AsyncStorage.getItem("act_ad_account_id");

    if (!actAdAccountId || !fbToken) {
      Alert.alert("Error", "Please connect your Facebook account first");
      return;
    }

    setLoading(true);
    try {
      const campaignPayload = {
        act_ad_account_id: actAdAccountId,
        fb_token: fbToken,
        name: campaignName,
        objective: "OUTCOME_ENGAGEMENT",
        special_ad_categories: ["NONE"],
        status: "ACTIVE",
      };

      const response = await axios.post(
        `${API_BASE_URL}/click-to-whatsapp/campaigns`,
        campaignPayload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Backend returns { success: true, data: result }
      // The campaign ID is at response.data.data.id
      if (response.data && response.data.success && response.data.data && response.data.data.id) {
        onNext({
          campaign_id: response.data.data.id,
          name: campaignName,
          objective: "OUTCOME_ENGAGEMENT",
        });
      } else {
        console.error("Invalid response structure:", response.data);
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      Alert.alert("Error", error.response?.data?.error || error.message || "Failed to create campaign");
      console.error("Campaign creation error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Gradient Header */}
      <View style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="whatsapp" size={48} color="#fff" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>Create WhatsApp Campaign</Text>
            <Text style={styles.subtitle} numberOfLines={1}>Enable direct WhatsApp conversations from your ads</Text>
          </View>
        </View>
        {/* Decorative circles */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label} numberOfLines={1}>
            Campaign Name <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Enter campaign name"
              placeholderTextColor="#9CA3AF"
              value={campaignName}
              onChangeText={setCampaignName}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label} numberOfLines={1}>
            Objective <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.objectiveBox}>
            <View style={styles.objectiveContent}>
              <Text style={styles.objectiveText} numberOfLines={1}>Engagement</Text>
              <Text style={styles.objectiveCode} numberOfLines={1}>(OUTCOME_ENGAGEMENT)</Text>
            </View>
            <View style={styles.checkIconContainer}>
              <MaterialCommunityIcons name="check-circle" size={28} color="#10B981" />
            </View>
          </View>
        </View>

        <View style={styles.buttonRow}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText} numberOfLines={1}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleCreate}
            disabled={loading || !campaignName.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText} numberOfLines={1}>Next</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  contentContainer: {
    paddingBottom: 30,
  },
  headerGradient: {
    backgroundColor: "#075E54",
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 20,
    position: "relative",
    overflow: "hidden",
  },
  headerContent: {
    flexDirection: "column",
    alignItems: "center",
    zIndex: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  headerText: {
    width: "100%",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
    letterSpacing: 0.3,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
    textAlign: "center",
  },
  decorativeCircle1: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  decorativeCircle2: {
    position: "absolute",
    bottom: -30,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  form: {
    padding: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  required: {
    color: "#EF4444",
    fontWeight: "800",
  },
  inputWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  input: {
    padding: 16,
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "500",
  },
  objectiveBox: {
    backgroundColor: "#D1FAE5",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
    borderColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  objectiveContent: {
    flex: 1,
    marginRight: 12,
  },
  objectiveText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#065F46",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  objectiveCode: {
    fontSize: 13,
    color: "#047857",
    fontWeight: "600",
  },
  checkIconContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 4,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 32,
  },
  backButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6B7280",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  primaryButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#25D366",
    shadowColor: "#25D366",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

