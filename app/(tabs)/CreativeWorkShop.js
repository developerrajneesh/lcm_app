import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { StatusBar } from "expo-status-bar";
import { captureRef } from "react-native-view-shot";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function WorkshopScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({});
  const imageRefs = useRef({});
  const [userData, setUserData] = useState({ username: "User", usernumber: "", userLogo: null });

  // Fetch user data for placeholders
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataStr = await AsyncStorage.getItem("user");
        if (userDataStr) {
          const user = JSON.parse(userDataStr);
          const loadedUserData = {
            username: user.name || "User",
            usernumber: user.phoneNumber || "",
            userLogo: user.profileImage || null,
          };
          console.log("Loaded user data for placeholders:", loadedUserData);
          setUserData(loadedUserData);
        } else {
          console.warn("No user data found in AsyncStorage");
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };
    loadUserData();
  }, []);

  // Fetch image-text data
  useEffect(() => {
    if (id) {
      fetchData(id);
    } else {
      setError("No workshop ID provided");
      setLoading(false);
    }
  }, [id]);

  const fetchData = async (workshopId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/image-texts/${workshopId}`);

      if (response.data.success && response.data.data) {
        // Normalize borderWidth values - ensure 0 or undefined becomes 0, and remove borderColor if borderWidth is 0
        const normalizedData = {
          ...response.data.data,
          images: response.data.data.images?.map((img) => ({
            ...img,
            texts: img.texts?.map((txt) => {
              // BORDER FEATURE COMPLETELY REMOVED - Remove all border properties from data
              const normalizedText = { ...txt };
              
              // Completely remove all border-related properties
              delete normalizedText.borderWidth;
              delete normalizedText.borderColor;
              delete normalizedText.borderStyle;
              
              return normalizedText;
            }),
          })),
        };
        setData(normalizedData);
      } else {
        throw new Error("Invalid data format");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || "Failed to fetch data";
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle image load - store that image is ready for rendering text
  const handleImageLoad = useCallback(
    (index) => {
      if (!data?.images) return;

      const imageData = data.images[index];
      if (!imageData) return;

      // Calculate container dimensions (matches image aspect ratio)
      const imageAspectRatio = imageData.originalWidth / imageData.originalHeight;
      const containerWidth = SCREEN_WIDTH - 40;
      const containerHeight = containerWidth / imageAspectRatio;

      // Store the container dimensions (which match the image dimensions since aspect ratio matches)
      setImageDimensions((prev) => ({
        ...prev,
        [index]: {
          width: containerWidth,
          height: containerHeight,
        },
      }));
    },
    [data]
  );

  // Calculate scaled font size based on image scaling
  const getScaledFontSize = (originalFontSize, imageIndex) => {
    const imageData = data?.images[imageIndex];
    if (!imageData || !imageDimensions[imageIndex]) {
      return originalFontSize;
    }

    const { originalWidth } = imageData;
    const { width: renderedWidth } = imageDimensions[imageIndex];

    if (originalWidth === 0 || renderedWidth === 0) return originalFontSize;

    // Scale font size proportionally to image width
    const scaleFactor = renderedWidth / originalWidth;
    return originalFontSize * scaleFactor;
  };

  // Get user data for placeholder replacement
  const getUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        return {
          username: user.name || "User",
          usernumber: user.phoneNumber || "",
          userLogo: user.profileImage || null,
        };
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
    return {
      username: "User",
      usernumber: "",
      userLogo: null,
    };
  };

  // Replace placeholders in text with user data
  const replacePlaceholders = (text, userData) => {
    if (!text) return text;
    let replaced = text;
    replaced = replaced.replace(/\{\{username\}\}/g, userData.username);
    replaced = replaced.replace(/\{\{usernumber\}\}/g, userData.usernumber);
    // Note: {{userLogo}} in text will be replaced with empty string
    // For image elements, we'll handle it separately
    replaced = replaced.replace(/\{\{userLogo\}\}/g, "");
    return replaced;
  };

  // Download image with text overlays
  const handleDownload = async () => {
    if (!data || !data.images || data.images.length === 0) {
      Alert.alert("Error", "No images to download");
      return;
    }

    setDownloading(true);

    try {
      // Get user data for placeholder replacement
      const userData = await getUserData();

      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Please grant permission to save images");
        setDownloading(false);
        return;
      }

      // Download all images with text overlays
      for (let i = 0; i < data.images.length; i++) {
        const imageData = data.images[i];
        const imageRef = imageRefs.current[`image-${i}`];
        
        if (!imageRef) {
          console.warn(`Image ref not found for image ${i}, trying fallback...`);
          // Fallback: download original image without text overlays
          const imageUrl = imageData.imageUrl || imageData.imageBase64;
          const extension = imageData.mimeType?.includes("png") ? "png" : "jpg";
          const fileName = `workshop-${data.id}-${i + 1}-${Date.now()}.${extension}`;
          const fileUri = `${FileSystem.documentDirectory}${fileName}`;
          
          if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
            const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);
            if (downloadResult.uri) {
              const asset = await MediaLibrary.createAssetAsync(fileUri);
              await MediaLibrary.createAlbumAsync("Workshop", asset, false);
            }
          } else {
            const base64String = imageUrl;
            const base64Data = base64String.includes(",")
              ? base64String.split(",")[1]
              : base64String;
            await FileSystem.writeAsStringAsync(fileUri, base64Data, {
              encoding: "base64",
            });
            const asset = await MediaLibrary.createAssetAsync(fileUri);
            await MediaLibrary.createAlbumAsync("Workshop", asset, false);
          }
          continue;
        }

        // Create a file name
        const extension = imageData.mimeType?.includes("png") ? "png" : "jpg";
        const fileName = `workshop-${data.id}-${i + 1}-${Date.now()}.${extension}`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;

        // Wait a bit to ensure the view is fully rendered
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Capture the view with text overlays
        try {
          const uri = await captureRef(imageRef, {
            format: extension === "png" ? "png" : "jpg",
            quality: 1.0,
            result: "tmpfile",
          });

          // Copy the captured file to our desired location
          await FileSystem.copyAsync({
            from: uri,
            to: fileUri,
          });

          // Save to media library
          const asset = await MediaLibrary.createAssetAsync(fileUri);
          await MediaLibrary.createAlbumAsync("Workshop", asset, false);
        } catch (captureError) {
          console.error(`Error capturing image ${i}:`, captureError);
          // Fallback: download original image without text overlays
          const imageUrl = imageData.imageUrl || imageData.imageBase64;
          if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
            const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);
            if (downloadResult.uri) {
              const asset = await MediaLibrary.createAssetAsync(fileUri);
              await MediaLibrary.createAlbumAsync("Workshop", asset, false);
            }
          } else {
            const base64String = imageUrl;
            const base64Data = base64String.includes(",")
              ? base64String.split(",")[1]
              : base64String;
            await FileSystem.writeAsStringAsync(fileUri, base64Data, {
              encoding: "base64",
            });
            const asset = await MediaLibrary.createAssetAsync(fileUri);
            await MediaLibrary.createAlbumAsync("Workshop", asset, false);
          }
        }
      }

      Alert.alert(
        "Success",
        `${data.images.length} ${data.images.length === 1 ? "image" : "images"} saved to gallery!`
      );
    } catch (err) {
      console.error("Download error:", err);
      Alert.alert("Error", err.message || "Failed to download image");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading workshop...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>❌ {error || "Failed to load data"}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonHeader}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workshop</Text>
        <TouchableOpacity
          style={[styles.downloadButton, downloading && styles.downloadButtonDisabled]}
          onPress={handleDownload}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.downloadButtonText}>⬇️ Download</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {data.images && data.images.length > 0 && (
          <View style={styles.imagesContainer}>
            {data.images.map((imageData, imageIndex) => {
              const imageAspectRatio = imageData.originalWidth / imageData.originalHeight;
              const displayWidth = SCREEN_WIDTH - 40;
              const displayHeight = displayWidth / imageAspectRatio;

              // Use stored dimensions if available, otherwise use calculated
              const renderedDimensions = imageDimensions[imageIndex];
              const containerWidth = renderedDimensions?.width || displayWidth;
              const containerHeight = renderedDimensions?.height || displayHeight;

              return (
                <View key={imageIndex} style={styles.imageWrapper}>
                  <View
                    ref={(ref) => {
                      imageRefs.current[`image-${imageIndex}`] = ref;
                    }}
                    style={[
                      styles.imageContainer,
                      {
                        width: displayWidth,
                        height: displayHeight,
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: imageData.imageUrl || imageData.imageBase64 }}
                      style={[
                        styles.image,
                        {
                          width: "100%",
                          height: "100%",
                        },
                      ]}
                      resizeMode="contain"
                      onLoad={() => handleImageLoad(imageIndex)}
                    />

                    {/* Render text overlays - only after container dimensions are measured */}
                    {renderedDimensions &&
                      imageData.texts.map((text, textIndex) => {
                        const scaledFontSize = getScaledFontSize(text.fontSize, imageIndex);

                        // Use actual rendered container dimensions for position calculation
                        // text.x and text.y are percentages (0-1), multiply by actual container dimensions
                        const absoluteX = text.x * containerWidth;
                        const absoluteY = text.y * containerHeight;

                        // BORDER FEATURE COMPLETELY REMOVED - No border properties will be added
                        const textStyle = {
                          left: absoluteX,
                          top: absoluteY,
                          fontSize: scaledFontSize,
                          fontFamily: text.fontFamily || "sans-serif",
                          color: text.color || "#000000",
                          backgroundColor: text.bgColor || "transparent",
                          fontWeight: text.bold ? "bold" : "normal",
                          fontStyle: text.italic ? "italic" : "normal",
                          padding: 4,
                          borderRadius: text.borderRadius || 0,
                          // NO border properties - borders are completely disabled
                        };

                        // Get original text
                        const originalText = text.text || "";
                        
                        // Handle {{userLogo}} - if text is exactly {{userLogo}}, render image instead
                        if (originalText.trim() === "{{userLogo}}") {
                          if (userData.userLogo) {
                            return (
                              <Image
                                key={textIndex}
                                source={{ uri: userData.userLogo }}
                                style={[
                                  styles.textOverlay,
                                  textStyle,
                                  {
                                    width: scaledFontSize * 2,
                                    height: scaledFontSize * 2,
                                    borderRadius: text.borderRadius || scaledFontSize,
                                  },
                                ]}
                                resizeMode="cover"
                              />
                            );
                          } else {
                            // No user logo, don't render anything
                            return null;
                          }
                        }
                        
                        // Replace placeholders in text - ensure we have user data
                        let displayText = originalText;
                        const username = userData.username || "User";
                        const usernumber = userData.usernumber || "";
                        
                        // Replace placeholders
                        displayText = displayText.replace(/\{\{username\}\}/g, username);
                        displayText = displayText.replace(/\{\{usernumber\}\}/g, usernumber);
                        // Remove {{userLogo}} from text if it's mixed with other text
                        displayText = displayText.replace(/\{\{userLogo\}\}/g, "");
                        
                        // Debug log to verify replacement
                        if (originalText.includes("{{username}}") || originalText.includes("{{usernumber}}") || originalText.includes("{{userLogo}}")) {
                          console.log("Placeholder replacement:", {
                            original: originalText,
                            replaced: displayText,
                            userData: { username, usernumber, hasLogo: !!userData.userLogo }
                          });
                        }

                        return (
                          <Text
                            key={textIndex}
                            style={[styles.textOverlay, textStyle]}
                          >
                            {displayText}
                          </Text>
                        );
                      })}
                  </View>

                  <Text style={styles.imageInfo}>
                    Image {imageIndex + 1} • {imageData.texts.length} text overlay(s)
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  errorText: {
    fontSize: 16,
    color: "#dc2626",
    marginBottom: 20,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingTop: Platform.OS === "ios" ? 50 : 15,
  },
  backButtonHeader: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: "#667eea",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  downloadButton: {
    backgroundColor: "#667eea",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  downloadButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  downloadButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  imagesContainer: {
    marginTop: 10,
  },
  imageWrapper: {
    marginBottom: 30,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: "relative",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 10,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  textOverlay: {
    position: "absolute",
    padding: 4,
    minWidth: 50,
  },
  imageInfo: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  backButton: {
    backgroundColor: "#667eea",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
});
