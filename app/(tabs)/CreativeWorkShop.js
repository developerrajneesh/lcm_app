import React, { useState, useEffect, useCallback } from "react";
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
import axios from "axios";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const API_BASE_URL = "http://192.168.1.9:5000/api/v1";

export default function WorkshopScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({});

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
        setData(response.data.data);
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

  // Download image with text overlays
  const handleDownload = async () => {
    if (!data || !data.images || data.images.length === 0) {
      Alert.alert("Error", "No images to download");
      return;
    }

    setDownloading(true);

    try {
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Please grant permission to save images");
        setDownloading(false);
        return;
      }

      // Download all images
      for (let i = 0; i < data.images.length; i++) {
        const imageData = data.images[i];
        const imageUrl = imageData.imageUrl || imageData.imageBase64;

        // Create a file name
        const extension = imageData.mimeType?.includes("png") ? "png" : "jpg";
        const fileName = `workshop-${data.id}-${i + 1}-${Date.now()}.${extension}`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;

        // If it's a URL (S3), download it
        if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
          const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);
          if (!downloadResult.uri) {
            throw new Error("Failed to download image from URL");
          }
        } else {
          // Handle base64 (backward compatibility)
          const base64String = imageUrl;
          const base64Data = base64String.includes(",")
            ? base64String.split(",")[1]
            : base64String;

          // Write base64 to file
          await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: "base64",
          });
        }

        // Save to media library
        const asset = await MediaLibrary.createAssetAsync(fileUri);
        await MediaLibrary.createAlbumAsync("Workshop", asset, false);
      }

      Alert.alert(
        "Success",
        `${data.images.length} ${data.images.length === 1 ? "image" : "images"} saved to gallery!`
      );
    } catch (err) {
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

                        // Build style object conditionally - only add border if borderWidth > 0
                        // Parse borderWidth as number and default to 0 if not set
                        const borderWidth = text.borderWidth !== undefined && text.borderWidth !== null 
                          ? (typeof text.borderWidth === 'number' ? text.borderWidth : parseInt(text.borderWidth) || 0)
                          : 0;
                        const hasBorder = borderWidth > 0;
                        
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
                        };

                        // Only add borderWidth and borderColor if borderWidth > 0
                        // React Native will not show border if borderWidth is 0 or not set
                        if (hasBorder) {
                          textStyle.borderWidth = borderWidth;
                          textStyle.borderColor = text.borderColor || "#000000";
                        } else {
                          // Explicitly set borderWidth to 0 to ensure no border is rendered
                          textStyle.borderWidth = 0;
                        }

                        return (
                          <Text
                            key={textIndex}
                            style={[styles.textOverlay, textStyle]}
                          >
                            {text.text}
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
