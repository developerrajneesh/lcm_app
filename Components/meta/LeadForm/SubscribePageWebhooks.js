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

export default function SubscribePageWebhooks({ campaignData, onComplete, onBack }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubscribe = async () => {
    const pageId = campaignData?.page_id;

    if (!pageId) {
      Alert.alert("Error", "Page ID is missing. Please complete previous steps.");
      return;
    }

    setLoading(true);

    try {
      const fbToken = await AsyncStorage.getItem("fb_access_token") || await AsyncStorage.getItem("fb_token");

      if (!fbToken) {
        Alert.alert("Error", "Please connect your Facebook account first");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/click-to-lead-form/subscribe-page`,
        {
          page_id: pageId,
          fb_token: fbToken,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.success) {
        setSuccess(true);
        console.log("Page subscribed successfully:", response.data);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      Alert.alert("Error", error.response?.data?.error || error.message || "Failed to subscribe page to webhooks");
      console.error("Subscription error:", error);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <MaterialCommunityIcons name="check-circle" size={64} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Page Subscribed Successfully!</Text>
          <Text style={styles.successSubtitle}>
            Your page has been subscribed to webhooks. You will now receive real-time notifications when leads are submitted.
          </Text>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Subscription Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Page ID:</Text>
              <Text style={styles.detailValue}>{campaignData?.page_id || "N/A"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Webhook Endpoint:</Text>
              <Text style={[styles.detailValue, styles.webhookUrl]}>
                {API_BASE_URL.replace("/api/v1", "")}/api/v1/webhooks/lead-ads
              </Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information" size={20} color="#1877F2" />
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>Next Steps:</Text> Configure this webhook URL in your Meta App settings to start receiving lead notifications in real-time.
            </Text>
          </View>

          {onComplete && (
            <TouchableOpacity style={styles.primaryButton} onPress={onComplete}>
              <MaterialCommunityIcons name="home" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>Back to Meta Management</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: "#E0F2FE" }]}>
          <MaterialCommunityIcons name="bell" size={32} color="#1877F2" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Subscribe Page to Webhooks</Text>
          <Text style={styles.subtitle}>Subscribe your Facebook Page to receive real-time lead notifications</Text>
        </View>
      </View>

      <View style={styles.form}>
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information" size={20} color="#1877F2" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>What are Webhooks?</Text>
            <Text style={styles.infoText}>
              Webhooks allow you to receive real-time notifications when users submit leads through your Lead Form ads.
              This enables instant processing, CRM integration, and automated follow-ups.
            </Text>
            <Text style={styles.infoSubtitle}>Benefits:</Text>
            <View style={styles.benefitsList}>
              <Text style={styles.benefitItem}>• Real-time lead notifications</Text>
              <Text style={styles.benefitItem}>• Automatic lead data retrieval</Text>
              <Text style={styles.benefitItem}>• CRM integration capabilities</Text>
              <Text style={styles.benefitItem}>• Instant email/SMS notifications</Text>
            </View>
          </View>
        </View>

        {campaignData?.page_id && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Subscription Details</Text>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Page ID</Text>
              <Text style={styles.detailValue}>{campaignData.page_id}</Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Webhook Endpoint</Text>
              <Text style={[styles.detailValue, styles.webhookUrl]}>
                {API_BASE_URL.replace("/api/v1", "")}/api/v1/webhooks/lead-ads
              </Text>
            </View>
          </View>
        )}

        <View style={styles.buttonRow}>
          {onBack && (
            <TouchableOpacity style={[styles.button, styles.backButton]} onPress={onBack}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, (loading || !campaignData?.page_id) && styles.buttonDisabled]}
            onPress={handleSubscribe}
            disabled={loading || !campaignData?.page_id}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="bell" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>Subscribe Page to Webhooks</Text>
              </>
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
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#E0F2FE",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1E21",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#1877F2",
    lineHeight: 20,
    marginBottom: 12,
  },
  infoBold: {
    fontWeight: "600",
  },
  infoSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1E21",
    marginBottom: 8,
  },
  benefitsList: {
    marginTop: 4,
  },
  benefitItem: {
    fontSize: 14,
    color: "#1877F2",
    lineHeight: 22,
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
  detailCard: {
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E4E6EB",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E4E6EB",
  },
  detailLabel: {
    fontSize: 12,
    color: "#65676B",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1E21",
  },
  webhookUrl: {
    fontSize: 12,
    flexWrap: "wrap",
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
    flexDirection: "row",
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
    lineHeight: 24,
  },
});

