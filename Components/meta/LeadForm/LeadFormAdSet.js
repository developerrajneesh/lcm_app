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

export default function LeadFormAdSet({ campaignData, onNext, onBack }) {
  const [formData, setFormData] = useState({
    name: "",
    daily_budget: "",
    page_id: campaignData?.page_id || "",
    targeting: {
      geo_locations: { countries: [] },
      device_platforms: [],
      publisher_platforms: [],
    },
  });
  const [pages, setPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [loading, setLoading] = useState(false);

  const countries = [
    { code: "US", name: "United States", flag: "🇺🇸" },
    { code: "CA", name: "Canada", flag: "🇨🇦" },
    { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
    { code: "AU", name: "Australia", flag: "🇦🇺" },
    { code: "IN", name: "India", flag: "🇮🇳" },
    { code: "DE", name: "Germany", flag: "🇩🇪" },
  ];

  const devicePlatforms = [
    { value: "mobile", label: "Mobile" },
    { value: "desktop", label: "Desktop" },
  ];

  const publisherPlatforms = [
    { value: "facebook", label: "Facebook" },
    { value: "instagram", label: "Instagram" },
  ];

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

  const handleCountryToggle = (countryCode) => {
    const currentCountries = formData.targeting.geo_locations.countries;
    const index = currentCountries.indexOf(countryCode);
    let newCountries;
    if (index > -1) {
      newCountries = currentCountries.filter((c) => c !== countryCode);
    } else {
      newCountries = [...currentCountries, countryCode];
    }
    setFormData({
      ...formData,
      targeting: {
        ...formData.targeting,
        geo_locations: { countries: newCountries },
      },
    });
  };

  const handleDeviceToggle = (device) => {
    const devices = formData.targeting.device_platforms;
    const index = devices.indexOf(device);
    if (index > -1) {
      setFormData({
        ...formData,
        targeting: {
          ...formData.targeting,
          device_platforms: devices.filter((d) => d !== device),
        },
      });
    } else {
      setFormData({
        ...formData,
        targeting: {
          ...formData.targeting,
          device_platforms: [...devices, device],
        },
      });
    }
  };

  const handlePublisherToggle = (publisher) => {
    const publishers = formData.targeting.publisher_platforms;
    const index = publishers.indexOf(publisher);
    if (index > -1) {
      setFormData({
        ...formData,
        targeting: {
          ...formData.targeting,
          publisher_platforms: publishers.filter((p) => p !== publisher),
        },
      });
    } else {
      setFormData({
        ...formData,
        targeting: {
          ...formData.targeting,
          publisher_platforms: [...publishers, publisher],
        },
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Please enter ad set name");
      return;
    }
    if (!formData.daily_budget) {
      Alert.alert("Error", "Please enter daily budget");
      return;
    }
    if (!formData.page_id.trim()) {
      Alert.alert("Error", "Please select Page ID");
      return;
    }
    if (formData.targeting.geo_locations.countries.length === 0) {
      Alert.alert("Error", "Please select at least one country");
      return;
    }
    if (formData.targeting.device_platforms.length === 0) {
      Alert.alert("Error", "Please select at least one device platform");
      return;
    }
    if (formData.targeting.publisher_platforms.length === 0) {
      Alert.alert("Error", "Please select at least one publisher platform");
      return;
    }
    if (!campaignData?.campaign_id) {
      Alert.alert("Error", "Campaign ID is missing. Please create campaign first.");
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
      const adsetPayload = {
        act_ad_account_id: actAdAccountId,
        fb_token: fbToken,
        name: formData.name,
        campaign_id: campaignData.campaign_id,
        daily_budget: formData.daily_budget.toString(),
        page_id: formData.page_id,
        billing_event: "IMPRESSIONS",
        status: "PAUSED",
        targeting: formData.targeting,
      };

      const response = await axios.post(
        `${API_BASE_URL}/click-to-lead-form/adsets`,
        adsetPayload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.success && response.data.data && response.data.data.id) {
        onNext({
          ...campaignData,
          adset_id: response.data.data.id,
          page_id: formData.page_id,
        });
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      Alert.alert("Error", error.response?.data?.error || error.message || "Failed to create ad set");
      console.error("Ad Set creation error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: "#E0F2FE" }]}>
          <MaterialCommunityIcons name="file-document" size={32} color="#1877F2" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Create Ad Set - Lead Form</Text>
          <Text style={styles.subtitle}>Configure your ad set settings</Text>
        </View>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Ad Set Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter ad set name"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Daily Budget <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter daily budget"
            value={formData.daily_budget}
            onChangeText={(text) => setFormData({ ...formData, daily_budget: text })}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Facebook Page <Text style={styles.required}>*</Text>
          </Text>
          {loadingPages ? (
            <View style={styles.loadingBox}>
              <Text style={styles.loadingText}>Loading pages...</Text>
            </View>
          ) : pages.length > 0 ? (
            <CustomSelect
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
              placeholder="Enter Facebook Page ID"
              value={formData.page_id}
              onChangeText={(text) => setFormData({ ...formData, page_id: text })}
            />
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Countries <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.countryGrid}>
            {countries.map((country) => (
              <TouchableOpacity
                key={country.code}
                onPress={() => handleCountryToggle(country.code)}
                style={[
                  styles.countryCard,
                  formData.targeting.geo_locations.countries.includes(country.code) &&
                    styles.countryCardSelected,
                ]}
              >
                <Text style={styles.countryFlag}>{country.flag}</Text>
                <Text style={styles.countryName}>{country.name}</Text>
                {formData.targeting.geo_locations.countries.includes(country.code) && (
                  <MaterialCommunityIcons name="check" size={16} color="#10B981" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Device Platforms <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.platformGrid}>
            {devicePlatforms.map((device) => (
              <TouchableOpacity
                key={device.value}
                onPress={() => handleDeviceToggle(device.value)}
                style={[
                  styles.platformCard,
                  formData.targeting.device_platforms.includes(device.value) &&
                    styles.platformCardSelected,
                ]}
              >
                <Text style={styles.platformText}>{device.label}</Text>
                {formData.targeting.device_platforms.includes(device.value) && (
                  <MaterialCommunityIcons name="check" size={16} color="#10B981" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Publisher Platforms <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.platformGrid}>
            {publisherPlatforms.map((publisher) => (
              <TouchableOpacity
                key={publisher.value}
                onPress={() => handlePublisherToggle(publisher.value)}
                style={[
                  styles.platformCard,
                  formData.targeting.publisher_platforms.includes(publisher.value) &&
                    styles.platformCardSelected,
                ]}
              >
                <Text style={styles.platformText}>{publisher.label}</Text>
                {formData.targeting.publisher_platforms.includes(publisher.value) && (
                  <MaterialCommunityIcons name="check" size={16} color="#10B981" />
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
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Create Ad Set</Text>
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
  loadingBox: {
    borderWidth: 1,
    borderColor: "#CCD0D5",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#F2F3F5",
  },
  loadingText: {
    color: "#65676B",
  },
  countryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  countryCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CCD0D5",
    borderRadius: 8,
    padding: 12,
    minWidth: "45%",
    gap: 8,
  },
  countryCardSelected: {
    borderColor: "#1877F2",
    backgroundColor: "#E0F2FE",
  },
  countryFlag: {
    fontSize: 20,
  },
  countryName: {
    flex: 1,
    fontSize: 14,
    color: "#1C1E21",
  },
  platformGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  platformCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CCD0D5",
    borderRadius: 8,
    padding: 12,
    minWidth: "45%",
    gap: 8,
  },
  platformCardSelected: {
    borderColor: "#1877F2",
    backgroundColor: "#E0F2FE",
  },
  platformText: {
    flex: 1,
    fontSize: 14,
    color: "#1C1E21",
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
});

