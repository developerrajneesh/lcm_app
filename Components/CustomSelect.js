import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const CustomSelect = ({
  data = [],
  onSelect,
  defaultButtonText = "Select an option",
  buttonTextAfterSelection,
  rowTextForSelection,
  defaultValue,
  disabled = false,
  label,
  hint,
  error,
  buttonStyle,
  buttonTextStyle,
  placeholder,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedValue, setSelectedValue] = useState(defaultValue);

  const handleSelect = (item) => {
    setSelectedValue(item);
    setModalVisible(false);
    if (onSelect) {
      onSelect(item);
    }
  };

  const getDisplayText = () => {
    if (selectedValue) {
      if (buttonTextAfterSelection) {
        return buttonTextAfterSelection(selectedValue);
      }
      if (typeof selectedValue === "object" && selectedValue.label) {
        return selectedValue.label;
      }
      if (typeof selectedValue === "string") {
        return selectedValue;
      }
    }
    return placeholder || defaultButtonText;
  };

  const getRowText = (item) => {
    if (rowTextForSelection) {
      return rowTextForSelection(item);
    }
    if (typeof item === "object" && item.label) {
      return item.label;
    }
    if (typeof item === "string") {
      return item;
    }
    return String(item);
  };

  const isSelected = (item) => {
    if (typeof item === "object" && typeof selectedValue === "object") {
      return item.value === selectedValue.value || item.id === selectedValue.id;
    }
    return item === selectedValue;
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[
          styles.button,
          buttonStyle,
          disabled && styles.buttonDisabled,
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.buttonText,
            buttonTextStyle,
            !selectedValue && styles.placeholderText,
          ]}
          numberOfLines={1}
        >
          {getDisplayText()}
        </Text>
        <MaterialCommunityIcons
          name="chevron-down"
          size={20}
          color={disabled ? "#C7C7CC" : "#606770"}
        />
      </TouchableOpacity>

      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {label || "Select an option"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={24}
                      color="#606770"
                    />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={data}
                  keyExtractor={(item, index) => {
                    if (typeof item === "object" && item.value) {
                      return String(item.value);
                    }
                    if (typeof item === "object" && item.id) {
                      return String(item.id);
                    }
                    return String(index);
                  }}
                  renderItem={({ item }) => {
                    const selected = isSelected(item);
                    return (
                      <TouchableOpacity
                        style={[
                          styles.row,
                          selected && styles.selectedRow,
                        ]}
                        onPress={() => handleSelect(item)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.rowText,
                            selected && styles.selectedRowText,
                          ]}
                        >
                          {getRowText(item)}
                        </Text>
                        {selected && (
                          <MaterialCommunityIcons
                            name="check"
                            size={20}
                            color="#1877F2"
                          />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No options available</Text>
                    </View>
                  }
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  button: {
    width: "100%",
    height: 48,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D8DEE6",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  buttonDisabled: {
    opacity: 0.5,
    backgroundColor: "#F5F5F5",
  },
  buttonText: {
    flex: 1,
    fontSize: 16,
    color: "#1C1E21",
    textAlign: "left",
  },
  placeholderText: {
    color: "#8B9DC3",
  },
  hint: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 6,
  },
  error: {
    fontSize: 12,
    color: "#FF3B30",
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    width: "90%",
    maxHeight: "70%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E4E6EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  closeButton: {
    padding: 4,
  },
  row: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
  },
  selectedRow: {
    backgroundColor: "#E3F2FD",
  },
  rowText: {
    fontSize: 16,
    color: "#1A1A1A",
    flex: 1,
  },
  selectedRowText: {
    color: "#1877F2",
    fontWeight: "600",
  },
  separator: {
    height: 1,
    backgroundColor: "#F0F2F5",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#8E8E93",
  },
});

export default CustomSelect;

