import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { API_BASE_URL } from "../../config/api";

const SignUpScreen = () => {
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
    profileImage: null,
    referralCode: "",
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState("");

  const handleImagePick = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant camera roll permissions to upload an image."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setPreviewImage(asset.uri);
        // Convert to base64
        try {
          const base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: "base64",
          } as any);
          const mimeType = asset.type || "image/jpeg";
          const base64Data = `data:${mimeType};base64,${base64}`;
          setSignupData({
            ...signupData,
            profileImage: base64Data,
          });
        } catch (error) {
          console.error("Error converting image:", error);
          Alert.alert("Error", "Failed to process image");
        }
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!signupData.name.trim()) {
      setSignupError("Name is required");
      return;
    }
    if (!signupData.email.trim()) {
      setSignupError("Email is required");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupData.email)) {
      setSignupError("Please enter a valid email address");
      return;
    }
    if (!signupData.password) {
      setSignupError("Password is required");
      return;
    }
    if (signupData.password.length < 8) {
      setSignupError("Password must be at least 8 characters long");
      return;
    }
    
    // Phone number is required
    if (!signupData.phoneNumber || !signupData.phoneNumber.trim()) {
      setSignupError("Phone number is required");
      return;
    }
    
    // Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(signupData.phoneNumber.replace(/\s/g, ""))) {
      setSignupError("Please enter a valid phone number");
      return;
    }
    
    // Profile image is required
    if (!signupData.profileImage) {
      setSignupError("Profile image is required");
      return;
    }

    setSignupLoading(true);
    setSignupError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/user/register`, {
        name: signupData.name.trim(),
        email: signupData.email.trim().toLowerCase(),
        password: signupData.password,
        phoneNumber: signupData.phoneNumber.trim(),
        profileImage: signupData.profileImage,
      });

      if (response.data.success) {
        const userData = {
          id: response.data.user._id || response.data.user.id,
          name: response.data.user.name,
          email: response.data.user.email,
          phoneNumber: response.data.user.phoneNumber,
          profileImage: response.data.user.profileImage,
          role: response.data.user.role || "user",
          referralCode: response.data.user.referralCode,
        };

        // Store user data and token
        await AsyncStorage.setItem("user", JSON.stringify(userData));
        if (response.data.token) {
          await AsyncStorage.setItem("authToken", response.data.token);
        }

        // Clear any errors
        setSignupError("");

        // Navigate to Home screen
        router.push("/Home");
      } else {
        setSignupError(response.data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setSignupError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Registration failed. Please try again."
      );
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sign Up</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="person-add" size={48} color="#6366f1" />
              </View>
              <Text style={styles.welcomeText}>Create Account</Text>
              <Text style={styles.subtitleText}>
                Sign up to get started with LCM
              </Text>
            </View>

            {signupError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{signupError}</Text>
              </View>
            ) : null}

            <View style={styles.form}>
              {/* Profile Image Upload */}
              <View style={styles.profileImageContainer}>
                <Text style={styles.inputLabel}>Profile Image <Text style={styles.required}>*</Text></Text>
                <View style={styles.profileImageRow}>
                  {previewImage ? (
                    <View style={styles.profileImagePreviewContainer}>
                      <Image
                        source={{ uri: previewImage }}
                        style={styles.profileImagePreview}
                      />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => {
                          setPreviewImage(null);
                          setSignupData({ ...signupData, profileImage: null });
                        }}
                      >
                        <Ionicons name="close-circle" size={24} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.profileImageUploadButton}
                      onPress={handleImagePick}
                    >
                      <Ionicons name="camera-outline" size={32} color="#6366f1" />
                      <Text style={styles.profileImageUploadText}>
                        Upload Image
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#94a3b8"
                  value={signupData.name}
                  onChangeText={(text) => {
                    setSignupData({ ...signupData, name: text });
                    setSignupError("");
                  }}
                  autoCapitalize="words"
                />
              </View>

              {/* Email */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#94a3b8"
                  value={signupData.email}
                  onChangeText={(text) => {
                    setSignupData({ ...signupData, email: text });
                    setSignupError("");
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Phone Number */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Phone Number <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#94a3b8"
                  value={signupData.phoneNumber}
                  onChangeText={(text) => {
                    setSignupData({ ...signupData, phoneNumber: text });
                    setSignupError("");
                  }}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password (min 8 characters)"
                  placeholderTextColor="#94a3b8"
                  value={signupData.password}
                  onChangeText={(text) => {
                    setSignupData({ ...signupData, password: text });
                    setSignupError("");
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              {/* Referral Code */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  Referral Code <Text style={styles.optional}>(Optional)</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="gift-outline"
                    size={20}
                    color="#6366f1"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter referral code if you have one"
                    placeholderTextColor="#94a3b8"
                    value={signupData.referralCode}
                    onChangeText={(text) => {
                      setSignupData({ ...signupData, referralCode: text.toUpperCase() });
                      setSignupError("");
                    }}
                    autoCapitalize="characters"
                  />
                </View>
                <Text style={styles.hintText}>
                  Enter a referral code to help someone earn ₹50
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  signupLoading && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={signupLoading}
              >
                {signupLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginLink}
                onPress={() => router.push("/Login")}
              >
                <Text style={styles.loginLinkText}>
                  Already have an account?{" "}
                  <Text style={styles.loginLinkTextBold}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e0e7ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
  },
  errorContainer: {
    backgroundColor: "#fee2e2",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
    marginBottom: 20,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
  },
  form: {
    gap: 20,
  },
  profileImageContainer: {
    marginBottom: 4,
  },
  profileImageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  profileImageUploadButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  profileImageUploadText: {
    fontSize: 12,
    color: "#6366f1",
    fontWeight: "500",
  },
  profileImagePreviewContainer: {
    position: "relative",
  },
  profileImagePreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#ffffff",
    borderRadius: 12,
  },
  inputContainer: {
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: "#1e293b",
  },
  hintText: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  optional: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "400",
  },
  required: {
    fontSize: 14,
    color: "#dc2626",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  loginLink: {
    alignItems: "center",
    marginTop: 24,
  },
  loginLinkText: {
    color: "#64748b",
    fontSize: 14,
  },
  loginLinkTextBold: {
    color: "#6366f1",
    fontWeight: "600",
  },
  signupLink: {
    alignItems: "center",
    marginTop: 24,
  },
  signupLinkText: {
    color: "#64748b",
    fontSize: 14,
  },
  signupLinkTextBold: {
    color: "#6366f1",
    fontWeight: "600",
  },
});

export default SignUpScreen;

