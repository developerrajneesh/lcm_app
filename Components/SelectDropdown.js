import React from "react";
import { View, Text, StyleSheet } from "react-native";
import SelectDropdown from "react-native-select-dropdown";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const CustomSelect = ({
  data,
  onSelect,
  defaultButtonText = "Select an option",
  buttonTextAfterSelection,
  rowTextForSelection,
  defaultValue,
  disabled = false,
  search = false,
  searchPlaceHolder = "Search...",
  style,
  buttonStyle,
  buttonTextStyle,
  dropdownStyle,
  rowStyle,
  rowTextStyle,
  selectedRowStyle,
  selectedRowTextStyle,
  searchInputStyle,
  renderDropdownIcon,
  label,
  hint,
  error,
}) => {
  // Ensure data is an array
  const dataArray = Array.isArray(data) ? data : [];

  // Debug: Log data to help troubleshoot
  if (__DEV__ && dataArray.length === 0) {
    console.warn("CustomSelect: No data provided", { data, dataArray });
  }

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      {dataArray.length > 0 ? (
        <View style={{ zIndex: 1000, elevation: 1000, position: "relative" }}>
          <SelectDropdown
            data={dataArray}
            onSelect={onSelect}
            defaultButtonText={defaultButtonText}
            buttonTextAfterSelection={buttonTextAfterSelection}
            rowTextForSelection={rowTextForSelection}
            defaultValue={defaultValue}
            disabled={disabled}
            search={search}
            searchPlaceHolder={searchPlaceHolder}
          buttonStyle={[
            styles.button,
            {
              width: "100%",
              height: 48,
              backgroundColor: "white",
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#E4E6EB",
              paddingHorizontal: 16,
              justifyContent: "space-between",
              flexDirection: "row",
              alignItems: "center",
            },
            buttonStyle,
          ]}
          buttonTextStyle={[
            styles.buttonText,
            {
              textAlign: "left",
              fontSize: 16,
              color: "#1A1A1A",
              flex: 1,
            },
            buttonTextStyle,
          ]}
            dropdownStyle={[styles.dropdown, dropdownStyle]}
            rowStyle={[styles.row, rowStyle]}
            rowTextStyle={[styles.rowText, rowTextStyle]}
            selectedRowStyle={[styles.selectedRow, selectedRowStyle]}
            selectedRowTextStyle={[styles.selectedRowText, selectedRowTextStyle]}
            searchInputStyle={[styles.searchInput, searchInputStyle]}
            renderDropdownIcon={(isOpened) => {
              if (renderDropdownIcon) {
                return renderDropdownIcon(isOpened);
              }
              return (
                <MaterialCommunityIcons
                  name={isOpened ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#606770"
                />
              );
            }}
          />
        </View>
      ) : (
        <View style={[styles.button, buttonStyle, { opacity: 0.5 }]}>
          <Text style={[styles.buttonText, buttonTextStyle]}>
            {defaultButtonText}
          </Text>
        </View>
      )}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 1,
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
    borderColor: "#E4E6EB",
    paddingHorizontal: 16,
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    textAlign: "left",
    fontSize: 16,
    color: "#1A1A1A",
    flex: 1,
  },
  dropdown: {
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E4E6EB",
    marginTop: 4,
    zIndex: 9999,
    elevation: 9999,
  },
  row: {
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },
  rowText: {
    fontSize: 16,
    color: "#1A1A1A",
  },
  selectedRow: {
    backgroundColor: "#E3F2FD",
  },
  selectedRowText: {
    color: "#1877F2",
    fontWeight: "600",
  },
  searchInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E4E6EB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: "#1A1A1A",
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
});

export default CustomSelect;

