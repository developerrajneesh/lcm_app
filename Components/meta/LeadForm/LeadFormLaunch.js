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

export default function LeadFormLaunch({ campaignData, onComplete, onBack }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [adId, setAdId] = useState(null);
  const [adName, setAdName] = useState("");

  const handleLaunch = async () => {
    if (!campaignData?.adset_id || !campaignData?.creative_id) {
      Alert.alert("Error", "Ad Set ID or Creative ID is missing. Please complete previous steps.");
      return;
    }
    if (!adName.trim()) {
      Alert.alert("Error", "Please enter ad name");
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
      const adPayload = {
        act_ad_account_id: actAdAccountId,
        fb_token: fbToken,
        name: adName,
        adset_id: campaignData.adset_id,
        creative_id: campaignData.creative_id,
        leadgen_form_id: campaignData.leadgen_form_id,
        status: "PAUSED",
      };

      const response = await axios.post(
        `${API_BASE_URL}/click-to-lead-form/ads`,
        adPayload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.success && response.data.data && response.data.data.id) {
        setAdId(response.data.data.id);
        setSuccess(true);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      Alert.alert("Error", error.response?.data?.error || error.message || "Failed to launch ad");
      console.error("Ad creation error:", error);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <MaterialCommunityIcons name="check-circle" size={48} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Ad Launched Successfully!</Text>
          <Text style={styles.successSubtitle}>
            Your Lead Form ad has been created and is ready to go live.
          </Text>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>Campaign ID: {campaignData?.campaign_id || "N/A"}</Text>
            <Text style={styles.summaryText}>Ad Set ID: {campaignData?.adset_id || "N/A"}</Text>
            <Text style={styles.summaryText}>Creative ID: {campaignData?.creative_id || "N/A"}</Text>
            {campaignData?.leadgen_form_id && (
              <Text style={styles.summaryText}>Lead Form ID: {campaignData.leadgen_form_id}</Text>
            )}
            <Text style={[styles.summaryText, { color: "#1877F2", fontWeight: "600" }]}>
              Ad ID: {adId || "N/A"}
            </Text>
          </View>

          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="bell" size={20} color="#1877F2" />
            <Text style={styles.infoText}>
              Subscribe your page to webhooks to receive real-time lead notifications.
            </Text>
          </View>

          <View style={styles.buttonRow}>
            {onComplete && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => {
                  // Skip webhook subscription and go back to overview
                  onComplete({ ...campaignData, ad_id: adId, goToSubscribe: false });
                }}
              >
                <Text style={styles.secondaryButtonText}>Skip for Now</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => {
                if (onComplete) {
                  // Pass a flag to indicate we want to go to subscribe webhooks
                  onComplete({ ...campaignData, ad_id: adId, goToSubscribe: true });
                }
              }}
            >
              <MaterialCommunityIcons name="bell" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>Subscribe to Webhooks</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: "#E0F2FE" }]}>
          <MaterialCommunityIcons name="rocket-launch" size={32} color="#1877F2" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Launch Your Lead Form Ad</Text>
          <Text style={styles.subtitle}>Ready to launch? Complete the form below to create your ad.</Text>
        </View>
      </View>

      <View style={styles.form}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Campaign Summary</Text>
          <Text style={styles.summaryText}>Campaign ID: {campaignData?.campaign_id || "N/A"}</Text>
          <Text style={styles.summaryText}>Ad Set ID: {campaignData?.adset_id || "N/A"}</Text>
          <Text style={styles.summaryText}>Creative ID: {campaignData?.creative_id || "N/A"}</Text>
          {campaignData?.leadgen_form_id && (
            <Text style={styles.summaryText}>Lead Form ID: {campaignData.leadgen_form_id}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Ad Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your ad name"
            value={adName}
            onChangeText={setAdName}
          />
        </View>

        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information" size={20} color="#1877F2" />
          <Text style={styles.infoText}>
            Your ad will be created in PAUSED status. You can activate it later from your Meta Ads Manager.
          </Text>
        </View>

        <View style={styles.buttonRow}>
          {onBack && (
            <TouchableOpacity style={[styles.button, styles.backButton]} onPress={onBack}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleLaunch}
            disabled={loading || !adName.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Launch Ad</Text>
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#1C1E21",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#65676B",
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1E21",
    marginBottom: 8,
  },
  required: {
    color: "#EF4444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCD0D5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  summaryBox: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E4E6EB",
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1E21",
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: "#65676B",
    marginBottom: 8,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#E0F2FE",
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#1877F2",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    backgroundColor: "#E4E6EB",
  },
  backButtonText: {
    color: "#1C1E21",
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#1877F2",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1C1E21",
    marginBottom: 12,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 16,
    color: "#65676B",
    textAlign: "center",
    marginBottom: 32,
  },
  secondaryButton: {
    backgroundColor: "#E4E6EB",
  },
  secondaryButtonText: {
    color: "#1C1E21",
    fontSize: 16,
    fontWeight: "600",
  },
});

