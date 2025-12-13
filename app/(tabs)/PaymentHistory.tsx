import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PaymentHistory = () => {
  const [selectedFilter, setSelectedFilter] = useState("all");

  const filters = [
    { id: "all", label: "All" },
    { id: "subscription", label: "Subscription" },
    { id: "campaign", label: "Campaign" },
    { id: "topup", label: "Top-up" },
  ];

  const payments = [
    {
      id: 1,
      type: "subscription",
      amount: 599,
      description: "Premium Subscription",
      date: "Dec 10, 2024",
      status: "completed",
      method: "Credit Card",
    },
    {
      id: 2,
      type: "campaign",
      amount: 250,
      description: "Ad Campaign Payment",
      date: "Dec 8, 2024",
      status: "completed",
      method: "Wallet",
    },
    {
      id: 3,
      type: "topup",
      amount: 1000,
      description: "Wallet Top-up",
      date: "Dec 5, 2024",
      status: "completed",
      method: "UPI",
    },
    {
      id: 4,
      type: "subscription",
      amount: 599,
      description: "Premium Subscription",
      date: "Nov 10, 2024",
      status: "completed",
      method: "Credit Card",
    },
    {
      id: 5,
      type: "campaign",
      amount: 150,
      description: "Ad Campaign Payment",
      date: "Nov 28, 2024",
      status: "failed",
      method: "Wallet",
    },
  ];

  const filteredPayments =
    selectedFilter === "all"
      ? payments
      : payments.filter((p) => p.type === selectedFilter);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "subscription":
        return "card-outline";
      case "campaign":
        return "megaphone-outline";
      case "topup":
        return "add-circle-outline";
      default:
        return "receipt-outline";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "subscription":
        return "#f59e0b";
      case "campaign":
        return "#6366f1";
      case "topup":
        return "#22c55e";
      default:
        return "#64748b";
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment History</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter-outline" size={24} color="#1e293b" />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterChip,
                  selectedFilter === filter.id && styles.filterChipActive,
                ]}
                onPress={() => setSelectedFilter(filter.id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedFilter === filter.id && styles.filterChipTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={styles.summaryValue}>₹2,598</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>This Month</Text>
            <Text style={styles.summaryValue}>₹849</Text>
          </View>
        </View>

        {/* Payments List */}
        <View style={styles.paymentsSection}>
          <Text style={styles.sectionTitle}>Recent Payments</Text>
          {filteredPayments.map((payment) => (
            <View key={payment.id} style={styles.paymentItem}>
              <View
                style={[
                  styles.paymentIconContainer,
                  { backgroundColor: `${getTypeColor(payment.type)}20` },
                ]}
              >
                <Ionicons
                  name={getTypeIcon(payment.type) as any}
                  size={24}
                  color={getTypeColor(payment.type)}
                />
              </View>
              <View style={styles.paymentDetails}>
                <Text style={styles.paymentDescription}>{payment.description}</Text>
                <View style={styles.paymentMeta}>
                  <Text style={styles.paymentDate}>{payment.date}</Text>
                  <Text style={styles.paymentMethod}> • {payment.method}</Text>
                </View>
              </View>
              <View style={styles.paymentAmountContainer}>
                <Text
                  style={[
                    styles.paymentAmount,
                    { color: payment.status === "failed" ? "#ef4444" : "#1e293b" },
                  ]}
                >
                  ₹{payment.amount}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        payment.status === "completed" ? "#dcfce7" : "#fee2e2",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: payment.status === "completed" ? "#22c55e" : "#ef4444",
                      },
                    ]}
                  >
                    {payment.status}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Download Receipt */}
        <TouchableOpacity style={styles.downloadButton}>
          <Ionicons name="download-outline" size={20} color="#6366f1" />
          <Text style={styles.downloadButtonText}>Download All Receipts</Text>
        </TouchableOpacity>
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
  filterButton: {
    padding: 8,
  },
  filtersContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterChipActive: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
  filterChipTextActive: {
    color: "#ffffff",
  },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 20,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
  },
  paymentsSection: {
    padding: 20,
    backgroundColor: "#ffffff",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
  },
  paymentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentDescription: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: 4,
  },
  paymentMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentDate: {
    fontSize: 12,
    color: "#94a3b8",
  },
  paymentMethod: {
    fontSize: 12,
    color: "#94a3b8",
  },
  paymentAmountContainer: {
    alignItems: "flex-end",
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#6366f1",
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6366f1",
    marginLeft: 8,
  },
});

export default PaymentHistory;

