import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

const PaymentHistory = () => {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [payments, setPayments] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalSpent: 0, thisMonthSpent: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filters = [
    { id: "all", label: "All" },
    { id: "subscription", label: "Subscription" },
    { id: "campaign", label: "Campaign" },
    { id: "topup", label: "Top-up" },
  ];

  useEffect(() => {
    fetchPaymentHistory();
  }, [selectedFilter]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const authToken = await AsyncStorage.getItem("authToken");
      const userData = await AsyncStorage.getItem("user");
      
      if (!userData) {
        Alert.alert("Error", "Please login to view payment history");
        router.back();
        return;
      }

      const user = JSON.parse(userData);
      const userId = user.id || user._id;

      const config: any = {
        params: {
          userId: userId,
          filter: selectedFilter,
        },
      };

      if (authToken) {
        config.headers = {
          Authorization: `Bearer ${authToken}`,
        };
      }

      const response = await axios.get(
        `${API_BASE_URL}/subscription/payment-history`,
        config
      );

      if (response.data.success) {
        setPayments(response.data.data.payments || []);
        setSummary(response.data.data.summary || { totalSpent: 0, thisMonthSpent: 0 });
      } else {
        throw new Error(response.data.message || "Failed to fetch payment history");
      }
    } catch (err: any) {
      console.error("Error fetching payment history:", err);
      setError(err.response?.data?.message || err.message || "Failed to load payment history");
      Alert.alert("Error", err.response?.data?.message || err.message || "Failed to load payment history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPaymentHistory();
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment History</Text>
          <View style={styles.placeholder} />
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
                onPress={() => {
                  setSelectedFilter(filter.id);
                }}
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
            <Text style={styles.summaryValue}>{formatAmount(summary.totalSpent)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>This Month</Text>
            <Text style={styles.summaryValue}>{formatAmount(summary.thisMonthSpent)}</Text>
          </View>
        </View>

        {/* Payments List */}
        <View style={styles.paymentsSection}>
          <Text style={styles.sectionTitle}>Recent Payments</Text>
          
          {loading && payments.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>Loading payment history...</Text>
            </View>
          ) : error && payments.length === 0 ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchPaymentHistory}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : payments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#94a3b8" />
              <Text style={styles.emptyText}>No payments found</Text>
              <Text style={styles.emptySubtext}>
                {selectedFilter === "all"
                  ? "You haven't made any payments yet"
                  : `No ${selectedFilter} payments found`}
              </Text>
            </View>
          ) : (
            payments.map((payment) => (
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
                  {formatAmount(payment.amount)}
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
            ))
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
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748b",
  },
  errorContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
});

export default PaymentHistory;

