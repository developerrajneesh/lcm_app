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

export default function LinkCampaign({ onNext, onBack }) {
  const [campaignName, setCampaignName] = useState("");
  const [objective, setObjective] = useState("OUTCOME_TRAFFIC");
  const [loading, setLoading] = useState(false);

  const objectives = [
    { value: "OUTCOME_AWARENESS", label: "Awareness", color: "#9333EA" },
    { value: "OUTCOME_ENGAGEMENT", label: "Engagement", color: "#1877F2" },
    { value: "OUTCOME_LEADS", label: "Leads", color: "#10B981" },
    { value: "OUTCOME_SALES", label: "Sales", color: "#EF4444" },
    { value: "OUTCOME_TRAFFIC", label: "Traffic", color: "#EC4899" },
  ];

  const handleCreate = async () => {
    if (!campaignName.trim()) {
      Alert.alert("Error", "Please enter campaign name");
      return;
    }

    const fbToken = await AsyncStorage.getItem("fb_access_token") || await AsyncStorage.getItem("fb_token");
    const actAdAccountId = await AsyncStorage.getItem("fb_ad_account_id") || await AsyncStorage.getItem("act_ad_account_id");

    if (!actAdAccountId || !fbToken) {
      Alert.alert("Error", "Please connect your Facebook account first");
      return;
    }

    setLoading(true);
    try {
      const campaignPayload = {
        name: campaignName,
        objective: objective,
        special_ad_categories: ["NONE"],
        status: "PAUSED",
      };

      const response = await axios.post(
        `${API_BASE_URL}/click-to-link/campaigns`,
        campaignPayload,
        {
          headers: {
            "Content-Type": "application/json",
            "act_ad_account_id": actAdAccountId,
            "fb_token": fbToken,
          },
        }
      );

      // Backend returns { success: true, data: result }
      // The campaign ID is at response.data.data.id
      if (response.data && response.data.success && response.data.data && response.data.data.id) {
        onNext({
          campaign_id: response.data.data.id,
          name: campaignName,
          objective: objective,
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: "#FCE7F3" }]}>
          <MaterialCommunityIcons name="link" size={32} color="#EC4899" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Create Link Campaign</Text>
          <Text style={styles.subtitle}>Drive traffic to your website with link ads</Text>
        </View>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Campaign Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter campaign name"
            value={campaignName}
            onChangeText={setCampaignName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Objective <Text style={styles.required}>*</Text>
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {objectives.map((obj) => (
              <TouchableOpacity
                key={obj.value}
                onPress={() => setObjective(obj.value)}
                style={[
                  styles.objectiveCard,
                  objective === obj.value && { borderColor: obj.value === "OUTCOME_TRAFFIC" ? "#EC4899" : obj.color, backgroundColor: obj.value === "OUTCOME_TRAFFIC" ? "#FCE7F3" : `${obj.color}20` },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.objectiveText}>{obj.label}</Text>
                  <Text style={styles.objectiveCode}>({obj.value})</Text>
                </View>
                {objective === obj.value && (
                  <MaterialCommunityIcons name="check" size={20} color="#10B981" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.buttonRow}>
          {onBack && (
            <TouchableOpacity style={[styles.button, styles.backButton]} onPress={onBack}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleCreate}
            disabled={loading || !campaignName.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Next</Text>
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
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E4E6EB",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1C1E21",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#606770",
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1E21",
    marginBottom: 8,
  },
  required: {
    color: "#FF0000",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D8DEE6",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  objectiveCard: {
    flex: 1,
    minWidth: "45%",
    padding: 16,
    borderWidth: 2,
    borderRadius: 8,
    borderColor: "#D8DEE6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  objectiveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1E21",
    marginBottom: 4,
  },
  objectiveCode: {
    fontSize: 12,
    color: "#606770",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    backgroundColor: "#8B9DC3",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#EC4899",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

