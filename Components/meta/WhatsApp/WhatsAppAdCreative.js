import React, { useState, useEffect } from "react";
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
import CustomSelect from "../../CustomSelect";

export default function WhatsAppAdCreative({ campaignData, onNext, onBack }) {
  const [formData, setFormData] = useState({
    name: "",
    page_id: campaignData?.page_id || "",
    picture_url: "",
    business_page_url: "",
  });
  const [pages, setPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoadingPages(true);
      const accessToken = await AsyncStorage.getItem("fb_access_token");
      if (!accessToken) {
        Alert.alert("Error", "Please connect your Facebook account first");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/ads/pages`, {
        headers: {
          "x-fb-access-token": accessToken,
        },
      });

      if (response.data.success) {
        let pagesData = [];
        if (response.data.pages?.data) {
          pagesData = response.data.pages.data;
        } else if (Array.isArray(response.data.pages)) {
          pagesData = response.data.pages;
        }

        setPages(pagesData);
        if (pagesData.length > 0 && !formData.page_id) {
          setFormData((prev) => ({
            ...prev,
            page_id: pagesData[0].id,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching pages:", error);
      Alert.alert("Error", "Failed to fetch Facebook pages. Please try again.");
    } finally {
      setLoadingPages(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Please enter ad creative name");
      return;
    }
    if (!formData.page_id.trim()) {
      Alert.alert("Error", "Please select Page ID");
      return;
    }
    if (!formData.picture_url.trim()) {
      Alert.alert("Error", "Please enter Picture URL");
      return;
    }
    if (!formData.business_page_url.trim()) {
      Alert.alert("Error", "Please enter Business Page URL");
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
      const creativePayload = {
        name: formData.name,
        page_id: formData.page_id,
        picture_url: formData.picture_url,
        business_page_url: formData.business_page_url,
      };

      const response = await axios.post(
        `${API_BASE_URL}/click-to-whatsapp/adcreatives`,
        creativePayload,
        {
          headers: {
            "Content-Type": "application/json",
            "act_ad_account_id": actAdAccountId,
            "fb_token": fbToken,
          },
        }
      );

      // Backend returns { success: true, data: result }
      // The creative ID is at response.data.data.id
      if (response.data && response.data.success && response.data.data && response.data.data.id) {
        onNext({
          ...campaignData,
          creative_id: response.data.data.id,
          page_id: formData.page_id,
        });
      } else {
        console.error("Invalid response structure:", response.data);
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      Alert.alert("Error", error.response?.data?.error || error.message || "Failed to create ad creative");
      console.error("Ad Creative creation error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: "#F3E8FF" }]}>
          <MaterialCommunityIcons name="image" size={32} color="#9333EA" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Create Ad Creative - WhatsApp Campaign</Text>
          <Text style={styles.subtitle}>Create your ad creative for WhatsApp</Text>
        </View>
      </View>

      {campaignData?.campaign_id && (
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Previous Steps Summary</Text>
          <Text style={styles.summaryText}>Campaign ID: {campaignData.campaign_id}</Text>
          {campaignData.adset_id && (
            <Text style={styles.summaryText}>Ad Set ID: {campaignData.adset_id}</Text>
          )}
        </View>
      )}

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Ad Creative Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter ad creative name"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Page ID <Text style={styles.required}>*</Text>
          </Text>
          {loadingPages ? (
            <View style={[styles.input, { backgroundColor: "#F5F5F5" }]}>
              <Text style={{ color: "#999" }}>Loading pages...</Text>
            </View>
          ) : pages.length > 0 ? (
            <CustomSelect
              label=""
              data={pages}
              onSelect={(selectedItem) => {
                setFormData({ ...formData, page_id: selectedItem.id });
              }}
              placeholder="Select a Facebook Page"
              buttonTextAfterSelection={(selectedItem) => {
                return `${selectedItem.name} (${selectedItem.id})`;
              }}
              rowTextForSelection={(item) => {
                return `${item.name} (${item.id})`;
              }}
              defaultValue={pages.find((p) => p.id === formData.page_id) || null}
              buttonStyle={{ height: 48, backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, borderColor: "#D8DEE6", paddingHorizontal: 14 }}
              buttonTextStyle={{ fontSize: 16, color: !formData.page_id ? "#8B9DC3" : "#1C1E21", textAlign: "left" }}
            />
          ) : (
            <TextInput
              style={styles.input}
              placeholder="Enter your Facebook Page ID"
              value={formData.page_id}
              onChangeText={(text) => setFormData({ ...formData, page_id: text })}
            />
          )}
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.labelRow}>
            <MaterialCommunityIcons name="image" size={20} color="#9333EA" />
            <Text style={styles.label}>
              Picture URL <Text style={styles.required}>*</Text>
            </Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="https://example.com/image.jpg"
            value={formData.picture_url}
            onChangeText={(text) => setFormData({ ...formData, picture_url: text })}
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.labelRow}>
            <MaterialCommunityIcons name="link" size={20} color="#9333EA" />
            <Text style={styles.label}>
              Business Page URL <Text style={styles.required}>*</Text>
            </Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="https://yourbusiness.com"
            value={formData.business_page_url}
            onChangeText={(text) => setFormData({ ...formData, business_page_url: text })}
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.buttonRow}>
          {onBack && (
            <TouchableOpacity style={[styles.button, styles.backButton]} onPress={onBack}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Create Ad Creative</Text>
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
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1E21",
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
    backgroundColor: "#9333EA",
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

