import { MaterialIcons } from "@expo/vector-icons";
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
} from "react-native";

const AccountDelete = () => {
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const reasons = [
    "No longer need the service",
    "Found a better alternative",
    "Too expensive",
    "Privacy concerns",
    "Technical issues",
    "Other",
  ];

  const handleDeleteAccount = () => {
    if (confirmText.toLowerCase() !== "delete") {
      Alert.alert("Error", "Please type 'DELETE' to confirm");
      return;
    }

    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert("Account Deleted", "Your account has been permanently deleted.", [
              { text: "OK", onPress: () => router.push("/Home") },
            ]);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Delete Account</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Warning Section */}
        <View style={styles.warningSection}>
          <View style={styles.warningIconContainer}>
            <MaterialIcons name="warning" size={48} color="#ef4444" />
          </View>
          <Text style={styles.warningTitle}>Permanent Account Deletion</Text>
          <Text style={styles.warningText}>
            Deleting your account will permanently remove all your data, including:
          </Text>
          <View style={styles.warningList}>
            <View style={styles.warningItem}>
              <MaterialIcons name="check-circle" size={20} color="#ef4444" />
              <Text style={styles.warningItemText}>All your campaigns and ad data</Text>
            </View>
            <View style={styles.warningItem}>
              <MaterialIcons name="check-circle" size={20} color="#ef4444" />
              <Text style={styles.warningItemText}>Payment history and transactions</Text>
            </View>
            <View style={styles.warningItem}>
              <MaterialIcons name="check-circle" size={20} color="#ef4444" />
              <Text style={styles.warningItemText}>Account settings and preferences</Text>
            </View>
            <View style={styles.warningItem}>
              <MaterialIcons name="check-circle" size={20} color="#ef4444" />
              <Text style={styles.warningItemText}>Referral codes and rewards</Text>
            </View>
          </View>
          <Text style={styles.warningNote}>
            This action cannot be undone. Please make sure you want to proceed.
          </Text>
        </View>

        {/* Reason Section */}
        <View style={styles.reasonSection}>
          <Text style={styles.sectionTitle}>Why are you deleting your account?</Text>
          <View style={styles.reasonsList}>
            {reasons.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.reasonItem,
                  reason === item && styles.reasonItemSelected,
                ]}
                onPress={() => setReason(item)}
              >
                <Text
                  style={[
                    styles.reasonText,
                    reason === item && styles.reasonTextSelected,
                  ]}
                >
                  {item}
                </Text>
                {reason === item && (
                  <MaterialIcons name="check-circle" size={20} color="#ef4444" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Confirmation Section */}
        <View style={styles.confirmationSection}>
          <Text style={styles.sectionTitle}>Type 'DELETE' to confirm</Text>
          <TextInput
            style={styles.confirmInput}
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder="Type DELETE here"
            placeholderTextColor="#94a3b8"
            autoCapitalize="characters"
          />
        </View>

        {/* Delete Button */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[
              styles.deleteButton,
              confirmText.toLowerCase() !== "delete" && styles.deleteButtonDisabled,
            ]}
            onPress={handleDeleteAccount}
            disabled={confirmText.toLowerCase() !== "delete"}
          >
            <MaterialIcons name="delete-forever" size={24} color="#ffffff" />
            <Text style={styles.deleteButtonText}>Permanently Delete Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
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
  scrollView: {
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
  warningSection: {
    backgroundColor: "#ffffff",
    margin: 20,
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#fee2e2",
  },
  warningIconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ef4444",
    textAlign: "center",
    marginBottom: 12,
  },
  warningText: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  warningList: {
    marginBottom: 20,
  },
  warningItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  warningItemText: {
    fontSize: 14,
    color: "#334155",
    marginLeft: 12,
    flex: 1,
  },
  warningNote: {
    fontSize: 13,
    color: "#ef4444",
    fontWeight: "600",
    textAlign: "center",
    fontStyle: "italic",
  },
  reasonSection: {
    padding: 20,
    backgroundColor: "#ffffff",
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
  },
  reasonsList: {
    gap: 12,
  },
  reasonItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  reasonItemSelected: {
    backgroundColor: "#fef2f2",
    borderColor: "#ef4444",
  },
  reasonText: {
    fontSize: 15,
    color: "#334155",
    flex: 1,
  },
  reasonTextSelected: {
    color: "#ef4444",
    fontWeight: "600",
  },
  confirmationSection: {
    padding: 20,
    backgroundColor: "#ffffff",
  },
  confirmInput: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1e293b",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    textAlign: "center",
    fontWeight: "600",
    letterSpacing: 2,
  },
  buttonSection: {
    padding: 20,
    backgroundColor: "#ffffff",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  deleteButtonDisabled: {
    backgroundColor: "#e2e8f0",
  },
  deleteButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 14,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
  },
});

export default AccountDelete;

