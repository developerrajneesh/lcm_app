import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function AdAccountSelector({
  visible,
  adAccounts,
  onSelect,
  onClose,
  loading = false,
}) {
  const [selectedAccount, setSelectedAccount] = useState(null);

  const handleSelect = (account) => {
    setSelectedAccount(account.id);
    onSelect(account.id);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Ad Account</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1877F2" />
              <Text style={styles.loadingText}>Loading ad accounts...</Text>
            </View>
          ) : (
            <View style={styles.contentContainer}>
              {adAccounts && adAccounts.length > 0 ? (
                <FlatList
                  data={adAccounts.filter((account) => account && account.id)}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.accountCard,
                        selectedAccount === item.id && styles.accountCardSelected,
                      ]}
                      onPress={() => handleSelect(item)}
                    >
                      <View style={styles.accountInfo}>
                        <Text style={styles.accountName}>
                          {item.name || item.id || "Unnamed Account"}
                        </Text>
                        <Text style={styles.accountId}>ID: {item.id}</Text>
                        {item.currency && (
                          <Text style={styles.accountCurrency}>
                            Currency: {item.currency}
                          </Text>
                        )}
                      </View>
                      {selectedAccount === item.id && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color="#1877F2"
                        />
                      )}
                    </TouchableOpacity>
                  )}
                  contentContainerStyle={styles.listContent}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="alert-circle-outline" size={48} color="#999" />
                  <Text style={styles.emptyText}>No ad accounts found</Text>
                  <Text style={styles.emptySubtext}>
                    Please make sure you have ad accounts in your Meta Business
                    Manager
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "90%",
    maxWidth: 500,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  contentContainer: {
    maxHeight: 400,
  },
  listContent: {
    padding: 16,
  },
  accountCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  accountCardSelected: {
    backgroundColor: "#e3f2fd",
    borderColor: "#1877F2",
    borderWidth: 2,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  accountId: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  accountCurrency: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
});

