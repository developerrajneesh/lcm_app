import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useEffect } from "react";
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
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";
import { useFocusEffect } from "@react-navigation/native";

const UgcProVideo = () => {
  const [showForm, setShowForm] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    whatsappNumber: "",
    email: "",
    numberOfVideos: "",
    languagePreference: "English",
    companyBrandName: "",
    additionalRequirements: "",
  });
  const [formErrors, setFormErrors] = useState<any>({});
  const [successMessage, setSuccessMessage] = useState("");

  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        try {
          const userData = await AsyncStorage.getItem("user");
          if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            // Fetch requests after user is loaded
            await fetchRequestsForUser(parsedUser);
          } else {
            Alert.alert("Error", "Please login to view UGC Pro Video");
            router.back();
          }
        } catch (error) {
          console.error("Error loading user data:", error);
        }
      };
      loadData();
    }, []) // Empty dependency array - only run on focus
  );

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } else {
        Alert.alert("Error", "Please login to view UGC Pro Video");
        router.back();
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const fetchRequestsForUser = async (userData: any) => {
    if (!userData) return;

    try {
      setLoading(true);
      const authToken = await AsyncStorage.getItem("authToken");
      const userId = userData.id || userData._id;

      const response = await axios.get(`${API_BASE_URL}/ugc-requests/user`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "user-id": userId,
        },
      });

      if (response.data.success) {
        setRequests(response.data.data || []);
      } else {
        console.error("Failed to fetch requests:", response.data);
      }
    } catch (error: any) {
      console.error("Error fetching UGC requests:", error);
      if (error.response) {
        console.error("Error response:", error.response.data);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const authToken = await AsyncStorage.getItem("authToken");
      const userId = user.id || user._id;

      const response = await axios.get(`${API_BASE_URL}/ugc-requests/user`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "user-id": userId,
        },
      });

      if (response.data.success) {
        setRequests(response.data.data || []);
      } else {
        console.error("Failed to fetch requests:", response.data);
      }
    } catch (error: any) {
      console.error("Error fetching UGC requests:", error);
      if (error.response) {
        console.error("Error response:", error.response.data);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    if (user) {
      fetchRequestsForUser(user);
    } else {
      const loadAndRefresh = async () => {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          await fetchRequestsForUser(parsedUser);
        }
      };
      loadAndRefresh();
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors: any = {};

    if (!formData.fullName.trim()) {
      errors.fullName = "Full Name is required";
    }

    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = "Phone Number is required";
    }

    if (!formData.whatsappNumber.trim()) {
      errors.whatsappNumber = "WhatsApp Number is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.numberOfVideos || parseInt(formData.numberOfVideos) <= 0) {
      errors.numberOfVideos = "Number of Videos is required and must be greater than 0";
    }

    if (!formData.languagePreference) {
      errors.languagePreference = "Language Preference is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      const authToken = await AsyncStorage.getItem("authToken");
      const userId = user?.id || user?._id;

      const response = await axios.post(
        `${API_BASE_URL}/ugc-requests`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
            "user-id": userId,
          },
        }
      );

      if (response.data.success) {
        setSuccessMessage("Thank you! Your details are received. Our UGC expert will contact you shortly.");
        setFormData({
          fullName: "",
          phoneNumber: "",
          whatsappNumber: "",
          email: "",
          numberOfVideos: "",
          languagePreference: "English",
          companyBrandName: "",
          additionalRequirements: "",
        });
        setShowForm(false);
        if (user) {
          await fetchRequestsForUser(user);
        }
        setTimeout(() => {
          setSuccessMessage("");
        }, 5000);
      } else {
        Alert.alert("Error", response.data.message || "Failed to submit request. Please try again.");
      }
    } catch (error: any) {
      console.error("Error submitting UGC request:", error);
      if (error.response) {
        console.error("Error response:", error.response.data);
        Alert.alert("Error", error.response.data.message || "Failed to submit request. Please try again.");
      } else {
        Alert.alert("Error", "Failed to submit request. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      pending: { color: "#fef3c7", textColor: "#f59e0b", icon: "time-outline", text: "Pending" },
      in_progress: { color: "#dbeafe", textColor: "#3b82f6", icon: "hourglass-outline", text: "In Progress" },
      completed: { color: "#dcfce7", textColor: "#22c55e", icon: "checkmark-circle", text: "Completed" },
      cancelled: { color: "#fee2e2", textColor: "#ef4444", icon: "close-circle", text: "Cancelled" },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <View style={[styles.statusBadge, { backgroundColor: config.color }]}>
        <Ionicons name={config.icon as any} size={14} color={config.textColor} />
        <Text style={[styles.statusText, { color: config.textColor }]}>{config.text}</Text>
      </View>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (showForm) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setShowForm(false)} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#1e293b" />
              </TouchableOpacity>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>UGC Pro Video Editing</Text>
                <Text style={styles.headerSubtitle}>Requirements Form</Text>
              </View>
            </View>

            {successMessage ? (
              <View style={styles.successMessage}>
                <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            <Text style={styles.formSubtitle}>
              Share your UGC video requirements. Our team will contact you shortly.
            </Text>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Full Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, formErrors.fullName && styles.inputError]}
                  placeholder="Enter your name"
                  value={formData.fullName}
                  onChangeText={(text) => handleInputChange("fullName", text)}
                />
                {formErrors.fullName && (
                  <Text style={styles.errorText}>{formErrors.fullName}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Phone Number <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, formErrors.phoneNumber && styles.inputError]}
                  placeholder="Primary contact number"
                  value={formData.phoneNumber}
                  onChangeText={(text) => handleInputChange("phoneNumber", text)}
                  keyboardType="phone-pad"
                />
                {formErrors.phoneNumber && (
                  <Text style={styles.errorText}>{formErrors.phoneNumber}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  WhatsApp Number <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, formErrors.whatsappNumber && styles.inputError]}
                  placeholder="If same as phone number, type 'Same'"
                  value={formData.whatsappNumber}
                  onChangeText={(text) => handleInputChange("whatsappNumber", text)}
                  keyboardType="phone-pad"
                />
                {formErrors.whatsappNumber && (
                  <Text style={styles.errorText}>{formErrors.whatsappNumber}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Email <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, formErrors.email && styles.inputError]}
                  placeholder="Enter your active email address"
                  value={formData.email}
                  onChangeText={(text) => handleInputChange("email", text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {formErrors.email && (
                  <Text style={styles.errorText}>{formErrors.email}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Number of Videos Needed <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, formErrors.numberOfVideos && styles.inputError]}
                  placeholder="Example: 1, 3, 5, 10..."
                  value={formData.numberOfVideos}
                  onChangeText={(text) => handleInputChange("numberOfVideos", text)}
                  keyboardType="number-pad"
                />
                {formErrors.numberOfVideos && (
                  <Text style={styles.errorText}>{formErrors.numberOfVideos}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Language Preference <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.selectContainer}>
                  <TouchableOpacity
                    style={[
                      styles.selectOption,
                      formData.languagePreference === "English" && styles.selectOptionActive,
                    ]}
                    onPress={() => handleInputChange("languagePreference", "English")}
                  >
                    <Text
                      style={[
                        styles.selectOptionText,
                        formData.languagePreference === "English" && styles.selectOptionTextActive,
                      ]}
                    >
                      English
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.selectOption,
                      formData.languagePreference === "Hindi" && styles.selectOptionActive,
                    ]}
                    onPress={() => handleInputChange("languagePreference", "Hindi")}
                  >
                    <Text
                      style={[
                        styles.selectOptionText,
                        formData.languagePreference === "Hindi" && styles.selectOptionTextActive,
                      ]}
                    >
                      Hindi
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Company / Brand Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your company/brand name (optional)"
                  value={formData.companyBrandName}
                  onChangeText={(text) => handleInputChange("companyBrandName", text)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Additional Requirements</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Share any specific instructions or expectations"
                  value={formData.additionalRequirements}
                  onChangeText={(text) => handleInputChange("additionalRequirements", text)}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Requirements</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.pageTitle}>UGC Pro Video</Text>
            <Text style={styles.pageSubtitle}>Professional UGC video editing services</Text>
          </View>
          <TouchableOpacity
            style={styles.requestButton}
            onPress={() => setShowForm(true)}
          >
            <Ionicons name="add" size={20} color="#ffffff" />
            <Text style={styles.requestButtonText}>Request</Text>
          </TouchableOpacity>
        </View>

        {/* Previous Requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Previous Requests</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
            </View>
          ) : requests.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="videocam-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyStateText}>No requests yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Click "Request" to submit your first request
              </Text>
            </View>
          ) : (
            <View style={styles.requestsList}>
              {requests.map((request) => (
                <View key={request._id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <View style={styles.requestHeaderLeft}>
                      <Ionicons name="videocam" size={20} color="#6366f1" />
                      <Text style={styles.requestVideos}>{request.numberOfVideos} Video(s)</Text>
                    </View>
                    {getStatusBadge(request.status)}
                  </View>
                  <View style={styles.requestDetails}>
                    <View style={styles.requestDetailItem}>
                      <Text style={styles.requestDetailLabel}>Language:</Text>
                      <Text style={styles.requestDetailValue}>{request.languagePreference}</Text>
                    </View>
                    <View style={styles.requestDetailItem}>
                      <Text style={styles.requestDetailLabel}>Submitted:</Text>
                      <Text style={styles.requestDetailValue}>{formatDate(request.createdAt)}</Text>
                    </View>
                    {request.companyBrandName ? (
                      <View style={styles.requestDetailItem}>
                        <Text style={styles.requestDetailLabel}>Brand:</Text>
                        <Text style={styles.requestDetailValue}>{request.companyBrandName}</Text>
                      </View>
                    ) : null}
                  </View>
                  {request.adminNotes ? (
                    <View style={styles.adminNotes}>
                      <Text style={styles.adminNotesLabel}>Admin Note:</Text>
                      <Text style={styles.adminNotesText}>{request.adminNotes}</Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  formSubtitle: {
    fontSize: 14,
    color: "#64748b",
    padding: 16,
    paddingTop: 8,
  },
  successMessage: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    padding: 12,
    margin: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#86efac",
  },
  successText: {
    color: "#166534",
    marginLeft: 8,
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  required: {
    color: "#ef4444",
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1e293b",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
  },
  selectContainer: {
    flexDirection: "row",
    gap: 12,
  },
  selectOption: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  selectOptionActive: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  selectOptionText: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
  },
  selectOptionTextActive: {
    color: "#ffffff",
  },
  submitButton: {
    backgroundColor: "#6366f1",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  requestButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366f1",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  requestButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
  },
  requestsList: {
    gap: 12,
  },
  requestCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  requestHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  requestVideos: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  requestDetails: {
    gap: 8,
  },
  requestDetailItem: {
    flexDirection: "row",
  },
  requestDetailLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    width: 80,
  },
  requestDetailValue: {
    fontSize: 14,
    color: "#1e293b",
    flex: 1,
  },
  adminNotes: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#dbeafe",
    borderRadius: 8,
  },
  adminNotesLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e40af",
    marginBottom: 4,
  },
  adminNotesText: {
    fontSize: 12,
    color: "#1e40af",
  },
});

export default UgcProVideo;

