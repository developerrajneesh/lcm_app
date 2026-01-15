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
  Image,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { API_BASE_URL } from "../../../config/api";
import CustomSelect from "../../CustomSelect";

export default function LinkAdCreative({ campaignData, onNext, onBack }) {
  const [formData, setFormData] = useState({
    name: "",
    page_id: campaignData?.page_id || "",
    picture_url: "",
    link_url: "",
    message: "",
    headline: "",
    description: "",
  });
  const [pages, setPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchPages();
  }, []);

  const handleImageSelect = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "We need camera roll permissions to upload images");
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage(asset);
        setImagePreview(asset.uri);
        setUploadingImage(true);

        try {
          // Convert image to base64
          const base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const base64String = `data:image/jpeg;base64,${base64}`;

          // Upload to S3 automatically
          const response = await axios.post(
            `${API_BASE_URL}/ads/upload-image-s3`,
            {
              imageBase64: base64String,
            }
          );

          if (response.data.success && response.data.url) {
            setFormData((prev) => ({
              ...prev,
              picture_url: response.data.url,
            }));
          } else {
            throw new Error("Upload failed");
          }
        } catch (error) {
          console.error("Error uploading image:", error);
          Alert.alert("Error", `Failed to upload image: ${error.response?.data?.error || error.message}`);
          // Reset on error
          setSelectedImage(null);
          setImagePreview(null);
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (error) {
      console.error("Error selecting image:", error);
      Alert.alert("Error", "Failed to select image");
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setFormData((prev) => ({
      ...prev,
      picture_url: "",
    }));
  };

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
    if (!formData.link_url.trim()) {
      Alert.alert("Error", "Please enter Link URL");
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
        act_ad_account_id: actAdAccountId,
        fb_token: fbToken,
        name: formData.name,
        page_id: formData.page_id,
        picture_url: formData.picture_url,
        link_url: formData.link_url,
        message: formData.message || "",
        headline: formData.headline || "",
        description: formData.description || "",
      };

      const response = await axios.post(
        `${API_BASE_URL}/click-to-link/adcreatives`,
        creativePayload,
        {
          headers: {
            "Content-Type": "application/json",
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
        <View style={[styles.iconContainer, { backgroundColor: "#FCE7F3" }]}>
          <MaterialCommunityIcons name="image" size={32} color="#EC4899" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Create Ad Creative - Link Campaign</Text>
          <Text style={styles.subtitle}>Create your ad creative with link</Text>
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
            <MaterialCommunityIcons name="image" size={20} color="#EC4899" />
            <Text style={styles.label}>
              Picture <Text style={styles.required}>*</Text>
            </Text>
          </View>
          
          {/* Image Upload Section */}
          {!imagePreview && !formData.picture_url && (
            <TouchableOpacity
              style={styles.imageUploadButton}
              onPress={handleImageSelect}
              disabled={uploadingImage}
            >
              <MaterialCommunityIcons name="upload" size={24} color="#EC4899" />
              <Text style={styles.imageUploadText}>Tap to upload image</Text>
              <Text style={styles.imageUploadSubtext}>PNG, JPG, GIF up to 10MB</Text>
            </TouchableOpacity>
          )}

          {imagePreview && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imagePreview }} style={styles.imagePreview} />
              {uploadingImage && (
                <View style={styles.uploadOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.uploadText}>Uploading to AWS...</Text>
                </View>
              )}
              {!uploadingImage && (
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={handleRemoveImage}
                >
                  <MaterialCommunityIcons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {formData.picture_url && !uploadingImage && (
            <View style={styles.successContainer}>
              <View style={styles.successBox}>
                <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
                <Text style={styles.successText}>Image uploaded successfully</Text>
                <TouchableOpacity onPress={handleRemoveImage}>
                  <MaterialCommunityIcons name="close" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.input, styles.readOnlyInput]}
                value={formData.picture_url}
                editable={false}
                placeholder="Image URL will appear here"
              />
            </View>
          )}

          {/* Manual URL input as fallback */}
          {!imagePreview && !formData.picture_url && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.fallbackLabel}>Or enter image URL manually:</Text>
              <TextInput
                style={styles.input}
                placeholder="https://example.com/image.jpg"
                value={formData.picture_url}
                onChangeText={(text) => setFormData({ ...formData, picture_url: text })}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.labelRow}>
            <MaterialCommunityIcons name="link" size={20} color="#EC4899" />
            <Text style={styles.label}>
              Link URL <Text style={styles.required}>*</Text>
            </Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="https://yourwebsite.com"
            value={formData.link_url}
            onChangeText={(text) => setFormData({ ...formData, link_url: text })}
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Message (Optional)</Text>
          <TextInput
            style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
            placeholder="Enter message"
            value={formData.message}
            onChangeText={(text) => setFormData({ ...formData, message: text })}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 15 }}>
          <View style={[styles.inputContainer, { flex: 1 }]}>
            <Text style={styles.label}>Headline (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter headline"
              value={formData.headline}
              onChangeText={(text) => setFormData({ ...formData, headline: text })}
            />
          </View>
          <View style={[styles.inputContainer, { flex: 1 }]}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter description"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
            />
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
  imageUploadButton: {
    borderWidth: 2,
    borderColor: "#D8DEE6",
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  imageUploadText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EC4899",
    marginTop: 8,
  },
  imageUploadSubtext: {
    fontSize: 12,
    color: "#606770",
    marginTop: 4,
  },
  imagePreviewContainer: {
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D8DEE6",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  uploadOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadText: {
    color: "#fff",
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#EF4444",
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  successContainer: {
    marginTop: 8,
  },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#10B981",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  successText: {
    flex: 1,
    fontSize: 13,
    color: "#065F46",
    fontWeight: "600",
  },
  readOnlyInput: {
    backgroundColor: "#F5F5F5",
    color: "#606770",
  },
  fallbackLabel: {
    fontSize: 12,
    color: "#606770",
    marginBottom: 8,
  },
});

