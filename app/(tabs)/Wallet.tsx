import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Wallet = () => {
  const balance = 1250.50;
  const transactions = [
    {
      id: 1,
      type: "credit",
      amount: 500,
      description: "Top-up via Credit Card",
      date: "Dec 10, 2024",
      time: "10:30 AM",
    },
    {
      id: 2,
      type: "debit",
      amount: 250,
      description: "Ad Campaign Payment",
      date: "Dec 8, 2024",
      time: "2:15 PM",
    },
    {
      id: 3,
      type: "credit",
      amount: 1000,
      description: "Referral Bonus",
      date: "Dec 5, 2024",
      time: "9:00 AM",
    },
    {
      id: 4,
      type: "debit",
      amount: 150,
      description: "Subscription Payment",
      date: "Dec 1, 2024",
      time: "11:45 AM",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wallet</Text>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-vertical" size={24} color="#1e293b" />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
          <View style={styles.balanceActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="add-circle-outline" size={24} color="#22c55e" />
              <Text style={styles.actionButtonText}>Add Money</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="arrow-forward-circle-outline" size={24} color="#6366f1" />
              <Text style={styles.actionButtonText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionItem}>
              <View style={[styles.quickActionIcon, { backgroundColor: "#e0f2fe" }]}>
                <Ionicons name="card-outline" size={24} color="#0ea5e9" />
              </View>
              <Text style={styles.quickActionText}>Add Card</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionItem}>
              <View style={[styles.quickActionIcon, { backgroundColor: "#dcfce7" }]}>
                <Ionicons name="swap-horizontal-outline" size={24} color="#22c55e" />
              </View>
              <Text style={styles.quickActionText}>Transfer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionItem}>
              <View style={[styles.quickActionIcon, { backgroundColor: "#fef3c7" }]}>
                <Ionicons name="gift-outline" size={24} color="#f59e0b" />
              </View>
              <Text style={styles.quickActionText}>Rewards</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionItem}>
              <View style={[styles.quickActionIcon, { backgroundColor: "#f3e8ff" }]}>
                <Ionicons name="stats-chart-outline" size={24} color="#8b5cf6" />
              </View>
              <Text style={styles.quickActionText}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {transactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View
                style={[
                  styles.transactionIconContainer,
                  {
                    backgroundColor:
                      transaction.type === "credit" ? "#dcfce7" : "#fee2e2",
                  },
                ]}
              >
                <Ionicons
                  name={transaction.type === "credit" ? "arrow-down" : "arrow-up"}
                  size={20}
                  color={transaction.type === "credit" ? "#22c55e" : "#ef4444"}
                />
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionDescription}>{transaction.description}</Text>
                <Text style={styles.transactionDate}>
                  {transaction.date} • {transaction.time}
                </Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  {
                    color: transaction.type === "credit" ? "#22c55e" : "#ef4444",
                  },
                ]}
              >
                {transaction.type === "credit" ? "+" : "-"}₹{transaction.amount.toFixed(2)}
              </Text>
            </View>
          ))}
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
  moreButton: {
    padding: 8,
  },
  balanceCard: {
    backgroundColor: "#6366f1",
    margin: 20,
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  balanceLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 24,
  },
  balanceActions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  quickActions: {
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
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickActionItem: {
    width: "48%",
    alignItems: "center",
    marginBottom: 16,
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
  },
  transactionsSection: {
    padding: 20,
    backgroundColor: "#ffffff",
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  transactionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: "#94a3b8",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
});

export default Wallet;

