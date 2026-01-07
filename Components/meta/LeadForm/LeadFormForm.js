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

export default function LeadFormForm({ campaignData, onNext, onBack }) {
  const [formData, setFormData] = useState({
    name: "",
    privacy_policy_url: "",
    follow_up_action_url: "",
    locale: "en_US",
  });
  const [pages, setPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [questions, setQuestions] = useState([
    { type: "FULL_NAME", label: "", isStandard: true },
    { type: "EMAIL", label: "", isStandard: true },
    { type: "PHONE", label: "", isStandard: true },
  ]);
  const [loading, setLoading] = useState(false);

  const standardQuestionTypes = [
    { value: "FULL_NAME", label: "Full Name" },
    { value: "FIRST_NAME", label: "First Name" },
    { value: "LAST_NAME", label: "Last Name" },
    { value: "EMAIL", label: "Email" },
    { value: "PHONE", label: "Phone" },
    { value: "CITY", label: "City" },
    { value: "STATE", label: "State" },
    { value: "ZIP", label: "ZIP Code" },
    { value: "COUNTRY", label: "Country" },
  ];

  const customQuestionTypes = [
    { value: "CUSTOM", label: "Short Answer", fieldType: "TEXT" },
    { value: "CUSTOM", label: "Long Answer", fieldType: "TEXTAREA" },
    { value: "CUSTOM", label: "Yes/No", fieldType: "YESNO" },
    { value: "CUSTOM", label: "Multiple Choice", fieldType: "MULTIPLE_CHOICE" },
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
        if (pagesData.length > 0 && !selectedPageId) {
          setSelectedPageId(pagesData[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching pages:", error);
      Alert.alert("Error", "Failed to fetch Facebook pages. Please try again.");
    } finally {
      setLoadingPages(false);
    }
  };

  const handleAddQuestion = (questionType, fieldType = null) => {
    if (questionType === "CUSTOM") {
      setQuestions([
        ...questions,
        {
          type: "CUSTOM",
          label: "",
          isStandard: false,
          fieldType: fieldType,
          options: fieldType === "MULTIPLE_CHOICE" ? [] : undefined,
        },
      ]);
    } else {
      setQuestions([
        ...questions,
        {
          type: questionType,
          label: "",
          isStandard: true,
        },
      ]);
    }
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Please enter lead form name");
      return;
    }
    if (!formData.privacy_policy_url.trim()) {
      Alert.alert("Error", "Please enter Privacy Policy URL");
      return;
    }
    if (!selectedPageId) {
      Alert.alert("Error", "Please select a Facebook Page");
      return;
    }
    if (questions.length === 0) {
      Alert.alert("Error", "Please add at least one question");
      return;
    }

    const fbToken = await AsyncStorage.getItem("fb_access_token") || await AsyncStorage.getItem("fb_token");

    if (!fbToken) {
      Alert.alert("Error", "Please connect your Facebook account first");
      return;
    }

    setLoading(true);
    try {
      const formattedQuestions = questions.map((q) => {
        const questionObj = { type: q.type };
        if (q.type === "CUSTOM") {
          if (q.label) questionObj.label = q.label;
          if (q.fieldType) questionObj.field_type = q.fieldType;
          if (q.fieldType === "MULTIPLE_CHOICE" && q.options && q.options.length > 0) {
            questionObj.options = q.options.filter((opt) => opt && opt.trim() !== "");
          }
        }
        return questionObj;
      });

      const leadFormPayload = {
        page_id: selectedPageId,
        fb_token: fbToken,
        name: formData.name,
        privacy_policy_url: formData.privacy_policy_url,
        follow_up_action_url: formData.follow_up_action_url || "",
        locale: formData.locale,
        questions: formattedQuestions,
      };

      const response = await axios.post(
        `${API_BASE_URL}/click-to-lead-form/leadforms`,
        leadFormPayload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.success && response.data.data && response.data.data.id) {
        Alert.alert("Success", `Lead Form created! ID: ${response.data.data.id}`);
        onNext({
          ...campaignData,
          leadgen_form_id: response.data.data.id,
          page_id: selectedPageId,
        });
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      Alert.alert("Error", error.response?.data?.error || error.message || "Failed to create lead form");
      console.error("Lead Form creation error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: "#E0F2FE" }]}>
          <MaterialCommunityIcons name="file-document-edit" size={32} color="#1877F2" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Create Lead Form</Text>
          <Text style={styles.subtitle}>Create a lead form to collect customer information</Text>
        </View>
      </View>

      <View style={styles.form}>
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
                setSelectedPageId(selectedItem.id);
              }}
              placeholder="Select a Facebook Page"
              buttonTextAfterSelection={(selectedItem) => {
                return `${selectedItem.name} (${selectedItem.id})`;
              }}
              rowTextForSelection={(item) => {
                return `${item.name} (${item.id})`;
              }}
              defaultValue={pages.find((p) => p.id === selectedPageId) || null}
              buttonStyle={{ height: 48, backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, borderColor: "#D8DEE6", paddingHorizontal: 14 }}
              buttonTextStyle={{ fontSize: 16, color: !selectedPageId ? "#8B9DC3" : "#1C1E21", textAlign: "left" }}
            />
          ) : (
            <TextInput
              style={styles.input}
              placeholder="Enter Facebook Page ID"
              value={selectedPageId}
              onChangeText={setSelectedPageId}
            />
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Lead Form Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter lead form name"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Privacy Policy URL <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="https://yourbusiness.com/privacy-policy"
            value={formData.privacy_policy_url}
            onChangeText={(text) => setFormData({ ...formData, privacy_policy_url: text })}
            keyboardType="url"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Follow-up Action URL</Text>
          <TextInput
            style={styles.input}
            placeholder="https://yourbusiness.com/thank-you"
            value={formData.follow_up_action_url}
            onChangeText={(text) => setFormData({ ...formData, follow_up_action_url: text })}
            keyboardType="url"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Questions</Text>
          {questions.map((question, index) => (
            <View key={index} style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <Text style={styles.questionNumber}>Question {index + 1}</Text>
                {questions.length > 1 && (
                  <TouchableOpacity onPress={() => handleRemoveQuestion(index)}>
                    <MaterialCommunityIcons name="delete" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
              {question.isStandard ? (
                <Text style={styles.questionType}>
                  {standardQuestionTypes.find((q) => q.value === question.type)?.label || question.type}
                </Text>
              ) : (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter question label"
                    value={question.label || ""}
                    onChangeText={(text) => handleQuestionChange(index, "label", text)}
                  />
                  {question.fieldType === "MULTIPLE_CHOICE" && (
                    <Text style={styles.hint}>Multiple Choice - Add options in advanced settings</Text>
                  )}
                </>
              )}
            </View>
          ))}

          <View style={styles.addQuestionSection}>
            <Text style={styles.sectionTitle}>Add Standard Question:</Text>
            <View style={styles.questionButtons}>
              {standardQuestionTypes.slice(0, 6).map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={styles.addQuestionButton}
                  onPress={() => handleAddQuestion(type.value)}
                >
                  <Text style={styles.addQuestionText}>+ {type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
              <Text style={styles.primaryButtonText}>Create Lead Form</Text>
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
  questionCard: {
    borderWidth: 1,
    borderColor: "#E4E6EB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#F8F9FA",
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: "#65676B",
  },
  questionType: {
    fontSize: 14,
    color: "#1C1E21",
    fontWeight: "500",
  },
  hint: {
    fontSize: 12,
    color: "#65676B",
    marginTop: 4,
  },
  addQuestionSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1E21",
    marginBottom: 12,
  },
  questionButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  addQuestionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#CCD0D5",
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  addQuestionText: {
    fontSize: 12,
    color: "#1877F2",
    fontWeight: "500",
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

