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
  Linking,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { API_BASE_URL } from "../../../config/api";
import CustomSelect from "../../CustomSelect";

export default function CallAdCreative({ campaignData, onNext, onBack }) {
  const [formData, setFormData] = useState({
    name: "",
    page_id: campaignData?.page_id || "",
    picture_url: "",
    business_page_url: "",
    phone_number: "",
    primary_text: "",
    headline: "",
    description: "",
  });
  const [pages, setPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [mediaType, setMediaType] = useState("image"); // "image" or "video"
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [videoThumbnail, setVideoThumbnail] = useState(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [thumbnailImageHash, setThumbnailImageHash] = useState(null);

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
        allowsEditing: false,
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

  const handleVideoSelect = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "We need camera roll permissions to upload videos");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedVideo(asset);
        setVideoPreview(asset.uri);
        setVideoId(null);
        setUploadingVideo(true);

        try {
          // Convert video to base64
          const base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const base64String = `data:video/mp4;base64,${base64}`;

          // Get ad account ID and access token
          const adAccountId = await AsyncStorage.getItem("fb_ad_account_id") || await AsyncStorage.getItem("act_ad_account_id");
          const accessToken = await AsyncStorage.getItem("fb_access_token");

          if (!adAccountId || !accessToken) {
            throw new Error("Missing ad account ID or access token");
          }

          // Upload video to Meta API
          const uploadResponse = await axios.post(
            `${API_BASE_URL}/ads/upload-video`,
            {
              adAccountId,
              videoBase64: base64String,
              pageId: formData.page_id || campaignData?.page_id,
            },
            {
              headers: {
                "x-fb-access-token": accessToken,
              },
            }
          );

          if (uploadResponse.data.success && uploadResponse.data.videoId) {
            setVideoId(uploadResponse.data.videoId);
            console.log("✅ Video uploaded successfully. Video ID:", uploadResponse.data.videoId);
          } else {
            throw new Error(uploadResponse.data.error || "Upload failed");
          }
        } catch (error) {
          console.error("Error uploading video:", error);
          Alert.alert("Error", `Failed to upload video: ${error.response?.data?.error || error.message}`);
          setVideoId(null);
          setSelectedVideo(null);
          setVideoPreview(null);
        } finally {
          setUploadingVideo(false);
        }
      }
    } catch (error) {
      console.error("Error selecting video:", error);
      Alert.alert("Error", "Failed to select video");
      setUploadingVideo(false);
    }
  };

  const handleRemoveVideo = () => {
    setSelectedVideo(null);
    setVideoPreview(null);
    setVideoId(null);
    handleRemoveThumbnail();
  };

  const handleThumbnailSelect = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "We need camera roll permissions to upload thumbnail");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setVideoThumbnail(asset);
        setUploadingThumbnail(true);

        try {
          // Convert image to base64
          const base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const base64String = `data:image/jpeg;base64,${base64}`;

          // Get ad account ID and access token
          const adAccountId = await AsyncStorage.getItem("fb_ad_account_id") || await AsyncStorage.getItem("act_ad_account_id");
          const accessToken = await AsyncStorage.getItem("fb_access_token");

          if (!adAccountId || !accessToken) {
            throw new Error("Missing ad account ID or access token");
          }

          // Upload thumbnail image to Meta API to get image_hash
          const uploadResponse = await axios.post(
            `${API_BASE_URL}/ads/upload-image`,
            {
              adAccountId,
              imageBase64: base64String,
              pageId: formData.page_id || campaignData?.page_id,
            },
            {
              headers: {
                "x-fb-access-token": accessToken,
              },
            }
          );

          if (uploadResponse.data.success && uploadResponse.data.imageHash) {
            setThumbnailImageHash(uploadResponse.data.imageHash);
            console.log("✅ Thumbnail uploaded successfully. Image Hash:", uploadResponse.data.imageHash);
          } else {
            throw new Error(uploadResponse.data.error || "Upload failed");
          }
        } catch (error) {
          console.error("Error uploading thumbnail:", error);
          Alert.alert("Error", `Failed to upload thumbnail: ${error.response?.data?.error || error.message}`);
          setVideoThumbnail(null);
          setThumbnailImageHash(null);
        } finally {
          setUploadingThumbnail(false);
        }
      }
    } catch (error) {
      console.error("Error selecting thumbnail:", error);
      Alert.alert("Error", "Failed to select thumbnail");
      setUploadingThumbnail(false);
    }
  };

  const handleRemoveThumbnail = () => {
    setVideoThumbnail(null);
    setThumbnailImageHash(null);
  };

  const handleMediaTypeChange = (type) => {
    setMediaType(type);
    if (type === "image") {
      handleRemoveVideo();
    } else {
      handleRemoveImage();
    }
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
    // Validate media based on type
    if (mediaType === "image" && !formData.picture_url.trim()) {
      Alert.alert("Error", "Please upload an image or enter Picture URL");
      return;
    }
    if (mediaType === "video" && !videoId) {
      Alert.alert("Error", "Please upload a video");
      return;
    }
    if (mediaType === "video" && !thumbnailImageHash) {
      Alert.alert("Error", "Please upload a thumbnail image for the video. Meta requires a thumbnail for video ads.");
      return;
    }
    if (!formData.business_page_url.trim()) {
      Alert.alert("Error", "Please enter Business Page URL");
      return;
    }
    if (!formData.phone_number.trim()) {
      Alert.alert("Error", "Please enter Phone Number");
      return;
    }
    if (!formData.primary_text.trim()) {
      Alert.alert("Error", "Please enter Primary Text");
      return;
    }
    if (!formData.headline.trim()) {
      Alert.alert("Error", "Please enter Headline");
      return;
    }
    if (formData.headline.length > 27) {
      Alert.alert("Error", "Headline must be 27 characters or less");
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
        business_page_url: formData.business_page_url,
        phone_number: formData.phone_number,
        primary_text: formData.primary_text,
        headline: formData.headline,
        description: formData.description || "",
      };

      // Add media based on type
      if (mediaType === "image") {
        creativePayload.picture_url = formData.picture_url;
      } else if (mediaType === "video") {
        creativePayload.video_id = videoId;
        if (thumbnailImageHash) {
          creativePayload.image_hash = thumbnailImageHash;
        }
      }

      const response = await axios.post(
        `${API_BASE_URL}/click-to-call/adcreatives`,
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
        <View style={[styles.iconContainer, { backgroundColor: "#FFF3E0" }]}>
          <MaterialCommunityIcons name="image" size={32} color="#FF9800" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Create Ad Creative - Call Campaign</Text>
          <Text style={styles.subtitle}>Create your ad creative with image and call-to-action</Text>
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
            <View style={styles.noPagesContainer}>
              <Text style={styles.noPagesText}>No Facebook pages found</Text>
              <TouchableOpacity
                style={styles.createPageButton}
                onPress={() => {
                  Linking.openURL("https://www.facebook.com/pages/create");
                }}
              >
                <MaterialCommunityIcons name="plus-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.createPageButtonText}>Create Facebook Page</Text>
              </TouchableOpacity>
              <Text style={styles.orText}>OR</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Facebook Page ID manually"
                value={formData.page_id}
                onChangeText={(text) => setFormData({ ...formData, page_id: text })}
              />
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.labelRow}>
            <MaterialCommunityIcons name="image" size={20} color="#FF9800" />
            <Text style={styles.label}>
              Media (Image or Video) <Text style={styles.required}>*</Text>
            </Text>
          </View>

          {/* Media Type Selection */}
          <View style={styles.mediaTypeContainer}>
            <TouchableOpacity
              style={[
                styles.mediaTypeButton,
                mediaType === "image" && styles.mediaTypeButtonActive,
              ]}
              onPress={() => handleMediaTypeChange("image")}
            >
              <Text
                style={[
                  styles.mediaTypeButtonText,
                  mediaType === "image" && styles.mediaTypeButtonTextActive,
                ]}
              >
                Image
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.mediaTypeButton,
                mediaType === "video" && styles.mediaTypeButtonActive,
              ]}
              onPress={() => handleMediaTypeChange("video")}
            >
              <Text
                style={[
                  styles.mediaTypeButtonText,
                  mediaType === "video" && styles.mediaTypeButtonTextActive,
                ]}
              >
                Video
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Image Upload Section */}
          {mediaType === "image" && (
            <>
          {!imagePreview && !formData.picture_url && (
            <TouchableOpacity
              style={styles.imageUploadButton}
              onPress={handleImageSelect}
              disabled={uploadingImage}
            >
              <MaterialCommunityIcons name="upload" size={24} color="#FF9800" />
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
            </>
          )}

          {/* Video Upload Section */}
          {mediaType === "video" && (
            <View>
              {!videoPreview && !videoId && (
                <TouchableOpacity
                  style={styles.imageUploadButton}
                  onPress={handleVideoSelect}
                  disabled={uploadingVideo}
                >
                  <MaterialCommunityIcons name="video" size={24} color="#FF9800" />
                  <Text style={styles.imageUploadText}>Tap to upload video</Text>
                  <Text style={styles.imageUploadSubtext}>MP4, MOV, AVI up to 500MB</Text>
                </TouchableOpacity>
              )}

              {videoId && !uploadingVideo && (
                <View style={styles.successContainer}>
                  <View style={styles.successBox}>
                    <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
                    <Text style={styles.successText}>Video uploaded successfully (ID: {videoId})</Text>
                    <TouchableOpacity onPress={handleRemoveVideo}>
                      <MaterialCommunityIcons name="close" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {uploadingVideo && (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator size="large" color="#FF9800" />
                  <Text style={styles.uploadingText}>Uploading video to Meta...</Text>
                  <Text style={styles.uploadingSubtext}>This may take a few minutes</Text>
                </View>
              )}

              {/* Video Thumbnail Upload - Required by Meta API */}
              {videoId && !uploadingVideo && (
                <View style={styles.thumbnailContainer}>
                  <Text style={styles.thumbnailTitle}>⚠️ Video Thumbnail Required</Text>
                  <Text style={styles.thumbnailSubtext}>
                    Meta requires a thumbnail image for video ads. Please upload an image.
                  </Text>
                  {!thumbnailImageHash && !videoThumbnail && (
                    <TouchableOpacity
                      style={[styles.imageUploadButton, { marginTop: 12, backgroundColor: "#FEF3C7", borderColor: "#FCD34D" }]}
                      onPress={handleThumbnailSelect}
                      disabled={uploadingThumbnail}
                    >
                      <MaterialCommunityIcons name="image" size={24} color="#D97706" />
                      <Text style={[styles.imageUploadText, { color: "#92400E" }]}>Upload Thumbnail Image</Text>
                      <Text style={[styles.imageUploadSubtext, { color: "#78350F" }]}>PNG, JPG up to 10MB</Text>
                    </TouchableOpacity>
                  )}
                  {thumbnailImageHash && (
                    <View style={styles.successContainer}>
                      <View style={styles.successBox}>
                        <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
                        <Text style={styles.successText}>Thumbnail uploaded</Text>
                        <TouchableOpacity onPress={handleRemoveThumbnail}>
                          <MaterialCommunityIcons name="close" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  {uploadingThumbnail && (
                    <View style={styles.uploadingContainer}>
                      <ActivityIndicator size="small" color="#FF9800" />
                      <Text style={styles.uploadingText}>Uploading thumbnail...</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.labelRow}>
            <MaterialCommunityIcons name="text" size={20} color="#FF9800" />
            <Text style={styles.label}>
              Primary Text <Text style={styles.required}>*</Text>
            </Text>
          </View>
          <TextInput
            style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
            placeholder="Enter primary text for your ad"
            value={formData.primary_text}
            onChangeText={(text) => setFormData({ ...formData, primary_text: text })}
            multiline
            numberOfLines={4}
          />
          <Text style={styles.hint}>The main text that appears in your ad</Text>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.labelRow}>
            <MaterialCommunityIcons name="format-title" size={20} color="#FF9800" />
            <Text style={styles.label}>
              Headline <Text style={styles.required}>*</Text>
            </Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter headline for your ad"
            value={formData.headline}
            onChangeText={(text) => setFormData({ ...formData, headline: text })}
            maxLength={27}
          />
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
            <Text style={styles.hint}>Maximum 27 characters. Appears above the primary text</Text>
            {formData.headline.length > 0 && (
              <Text style={[styles.hint, { color: formData.headline.length > 27 ? "#EF4444" : "#606770" }]}>
                {formData.headline.length}/27
              </Text>
            )}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.labelRow}>
            <MaterialCommunityIcons name="text-subject" size={20} color="#FF9800" />
            <Text style={styles.label}>
              Description
            </Text>
          </View>
          <TextInput
            style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
            placeholder="Enter description for your ad (optional)"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
            numberOfLines={4}
          />
          <Text style={styles.hint}>Additional text that appears below the headline (optional)</Text>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.labelRow}>
            <MaterialCommunityIcons name="link" size={20} color="#FF9800" />
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

        <View style={styles.inputContainer}>
          <View style={styles.labelRow}>
            <MaterialCommunityIcons name="phone" size={20} color="#FF9800" />
            <Text style={styles.label}>
              Phone Number <Text style={styles.required}>*</Text>
            </Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="+1234567890"
            value={formData.phone_number}
            onChangeText={(text) => setFormData({ ...formData, phone_number: text })}
            keyboardType="phone-pad"
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
            disabled={loading || uploadingVideo}
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
    backgroundColor: "#FF9800",
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
    color: "#FF9800",
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
  noPagesContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  noPagesText: {
    fontSize: 14,
    color: "#606770",
    marginBottom: 16,
    textAlign: "center",
  },
  createPageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1877F2",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 16,
    width: "100%",
  },
  createPageButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  orText: {
    fontSize: 12,
    color: "#8B9DC3",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  mediaTypeContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  mediaTypeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  mediaTypeButtonActive: {
    backgroundColor: "#FF9800",
    borderColor: "#FF9800",
  },
  mediaTypeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  mediaTypeButtonTextActive: {
    color: "#fff",
  },
  thumbnailContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FCD34D",
    borderRadius: 8,
  },
  thumbnailTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
    marginBottom: 4,
  },
  thumbnailSubtext: {
    fontSize: 12,
    color: "#78350F",
    marginBottom: 12,
  },
  uploadingContainer: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    marginTop: 8,
  },
  uploadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E40AF",
    marginTop: 8,
  },
  uploadingSubtext: {
    fontSize: 12,
    color: "#3B82F6",
    marginTop: 4,
  },
});

