import React, { useState } from "react";
import {
  View,
  Text,
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

export default function LinkLaunch({ campaignData, onComplete, onBack }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [adId, setAdId] = useState(null);

  const handleLaunch = async () => {
    if (!campaignData?.adset_id || !campaignData?.creative_id) {
      Alert.alert("Error", "Ad Set ID or Creative ID is missing. Please complete previous steps.");
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
        adset_id: campaignData.adset_id,
        creative_id: campaignData.creative_id,
        status: "PAUSED",
      };

      const response = await axios.post(
        `${API_BASE_URL}/click-to-link/ads`,
        adPayload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Backend returns { success: true, data: result }
      // The ad ID is at response.data.data.id
      if (response.data && response.data.success && response.data.data && response.data.data.id) {
        setAdId(response.data.data.id);
        setSuccess(true);
      } else {
        console.error("Invalid response structure:", response.data);
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
            Your link ad has been created and is ready to go live.
          </Text>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>Campaign ID: {campaignData?.campaign_id || "N/A"}</Text>
            <Text style={styles.summaryText}>Ad Set ID: {campaignData?.adset_id || "N/A"}</Text>
            <Text style={styles.summaryText}>Creative ID: {campaignData?.creative_id || "N/A"}</Text>
            <Text style={[styles.summaryText, { color: "#EC4899", fontWeight: "600" }]}>
              Ad ID: {adId || "N/A"}
            </Text>
          </View>

          {onComplete && (
            <TouchableOpacity style={styles.primaryButton} onPress={onComplete}>
              <Text style={styles.primaryButtonText}>Go to Meta Management</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: "#FCE7F3" }]}>
          <MaterialCommunityIcons name="send" size={32} color="#EC4899" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Launch Your Link Ad</Text>
          <Text style={styles.subtitle}>
            Ready to launch? Click the button below to create and activate your ad.
          </Text>
        </View>
      </View>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>Campaign Summary</Text>
        <Text style={styles.summaryText}>Campaign ID: {campaignData?.campaign_id || "N/A"}</Text>
        <Text style={styles.summaryText}>Ad Set ID: {campaignData?.adset_id || "N/A"}</Text>
        <Text style={styles.summaryText}>Creative ID: {campaignData?.creative_id || "N/A"}</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Your ad is ready to be created. Once launched, it will be in <Text style={styles.bold}>PAUSED</Text> status.
          You can activate it later from your Meta Ads Manager.
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
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="send" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>Launch Ad</Text>
            </>
          )}
        </TouchableOpacity>
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
  summaryBox: {
    backgroundColor: "#F5F5F5",
    padding: 16,
    margin: 20,
    borderRadius: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1E21",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: "#606770",
    marginBottom: 4,
  },
  infoBox: {
    backgroundColor: "#E3F2FD",
    borderWidth: 1,
    borderColor: "#90CAF9",
    padding: 16,
    margin: 20,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#1565C0",
  },
  bold: {
    fontWeight: "600",
  },
  successContainer: {
    padding: 40,
    alignItems: "center",
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1C1E21",
    marginBottom: 8,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 16,
    color: "#606770",
    marginBottom: 32,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
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

