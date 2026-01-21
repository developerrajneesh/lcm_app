import { MaterialIcons } from "@expo/vector-icons";
import React, { useState, useEffect, useCallback } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-chart-kit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { useFocusEffect } from "@react-navigation/native";

const AnalyticsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState("last_30d");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [campaignStats, setCampaignStats] = useState({
    impressions: 0,
    reach: 0,
    clicks: 0,
    ctr: 0,
    costPerResult: 0,
    amountSpent: 0,
  });
  const [campaigns, setCampaigns] = useState([]);
  const [performanceData, setPerformanceData] = useState({
    labels: [],
    datasets: [{ data: [], color: (opacity = 1) => `rgba(24, 119, 242, ${opacity})`, strokeWidth: 2 }],
  });
  const [barChartData, setBarChartData] = useState({
    labels: [],
    datasets: [{ data: [] }],
  });
  const [pieChartData, setPieChartData] = useState([]);

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#1877F2",
    },
  };

  // Format number with commas
  const formatNumber = (num) => {
    if (!num || num === 0) return "0";
    return num.toLocaleString();
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return "₹0.00";
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  // Format percentage
  const formatPercent = (value) => {
    if (!value || value === 0) return "0%";
    return `${parseFloat(value).toFixed(2)}%`;
  };

  // Fetch analytics data
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get Facebook access token and ad account ID
      const fbAccessToken = await AsyncStorage.getItem("fb_access_token");
      const adAccountId = await AsyncStorage.getItem("fb_ad_account_id");
      
      if (!fbAccessToken || !adAccountId) {
        console.log("No Facebook connection - showing empty analytics");
        setLoading(false);
        return;
      }

      // Fetch all campaigns
      const campaignsResponse = await axios.get(
        `${API_BASE_URL}/campaigns/all`,
        {
          headers: {
            "x-fb-access-token": fbAccessToken,
          },
          params: {
            adAccountId: adAccountId,
          },
        }
      );

      if (!campaignsResponse.data.success || !campaignsResponse.data.campaigns?.data) {
        setLoading(false);
        return;
      }

      const allCampaigns = campaignsResponse.data.campaigns.data;
      
      // Fetch insights for all campaigns
      const insightsPromises = allCampaigns.map(async (campaign) => {
        try {
          const insightsResponse = await axios.get(
            `https://graph.facebook.com/v23.0/${campaign.id}/insights`,
            {
              params: {
                fields: "impressions,clicks,ctr,spend,reach,cpc,cpp,cpm,actions",
                date_preset: dateRange,
                access_token: fbAccessToken,
              },
            }
          );

          if (insightsResponse.data?.data && insightsResponse.data.data.length > 0) {
            return {
              campaign,
              insights: insightsResponse.data.data[0],
            };
          }
          return { campaign, insights: null };
        } catch (error) {
          console.log(`Error fetching insights for campaign ${campaign.id}:`, error.message);
          return { campaign, insights: null };
        }
      });

      const insightsResults = await Promise.all(insightsPromises);

      // Aggregate stats
      let totalImpressions = 0;
      let totalReach = 0;
      let totalClicks = 0;
      let totalSpend = 0;
      let totalActions = 0;

      insightsResults.forEach(({ insights }) => {
        if (insights) {
          totalImpressions += parseInt(insights.impressions || 0);
          totalReach += parseInt(insights.reach || 0);
          totalClicks += parseInt(insights.clicks || 0);
          totalSpend += parseFloat(insights.spend || 0);
          
          // Count actions (conversions, etc.)
          if (insights.actions) {
            insights.actions.forEach((action) => {
              totalActions += parseInt(action.value || 0);
            });
          }
        }
      });

      // Calculate CTR
      const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      
      // Calculate cost per result
      const costPerResult = totalActions > 0 ? totalSpend / totalActions : 0;

      setCampaignStats({
        impressions: totalImpressions,
        reach: totalReach,
        clicks: totalClicks,
        ctr: ctr,
        costPerResult: costPerResult,
        amountSpent: totalSpend,
      });

      // Process campaigns with insights
      const campaignsWithInsights = insightsResults
        .filter(({ insights }) => insights !== null)
        .map(({ campaign, insights }) => ({
          id: campaign.id,
          name: campaign.name || "Unnamed Campaign",
          status: campaign.status || campaign.effective_status || "UNKNOWN",
          impressions: parseInt(insights.impressions || 0),
          clicks: parseInt(insights.clicks || 0),
          ctr: insights.ctr ? parseFloat(insights.ctr) : 0,
          spend: parseFloat(insights.spend || 0),
        }))
        .sort((a, b) => b.spend - a.spend) // Sort by spend descending
        .slice(0, 10); // Top 10 campaigns

      setCampaigns(campaignsWithInsights);

      // Generate performance chart data (last 6 months)
      const monthlyData = generateMonthlyData(insightsResults, dateRange);
      setPerformanceData({
        labels: monthlyData.labels,
        datasets: [{
          data: monthlyData.data,
          color: (opacity = 1) => `rgba(24, 119, 242, ${opacity})`,
          strokeWidth: 2,
        }],
      });

      // Generate weekly bar chart data (last 7 days)
      const weeklyData = generateWeeklyData(insightsResults);
      setBarChartData({
        labels: weeklyData.labels,
        datasets: [{ data: weeklyData.data }],
      });

      // Generate device distribution (mock for now - would need breakdown from insights)
      setPieChartData([
        {
          name: "Mobile",
          population: 68,
          color: "#1877F2",
          legendFontColor: "#7F7F7F",
          legendFontSize: 12,
        },
        {
          name: "Desktop",
          population: 32,
          color: "#42B72A",
          legendFontColor: "#7F7F7F",
          legendFontSize: 12,
        },
      ]);

    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange]);

  // Generate monthly performance data
  const generateMonthlyData = (insightsResults, range) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const data = [0, 0, 0, 0, 0, 0];
    
    // For now, distribute total clicks across months
    // In a real implementation, you'd fetch insights with time_range for each month
    let totalClicks = 0;
    insightsResults.forEach(({ insights }) => {
      if (insights) {
        totalClicks += parseInt(insights.clicks || 0);
      }
    });

    if (totalClicks > 0) {
      // Distribute clicks across months (mock distribution)
      const distribution = [0.1, 0.15, 0.12, 0.2, 0.25, 0.18];
      data.forEach((_, index) => {
        data[index] = Math.round(totalClicks * distribution[index]);
      });
    }

    return { labels: months, data };
  };

  // Generate weekly bar chart data
  const generateWeeklyData = (insightsResults) => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const data = [0, 0, 0, 0, 0, 0, 0];
    
    // For now, distribute total clicks across days
    let totalClicks = 0;
    insightsResults.forEach(({ insights }) => {
      if (insights) {
        totalClicks += parseInt(insights.clicks || 0);
      }
    });

    if (totalClicks > 0) {
      // Distribute clicks across days (mock distribution)
      const distribution = [0.12, 0.14, 0.15, 0.16, 0.18, 0.13, 0.12];
      data.forEach((_, index) => {
        data[index] = Math.round(totalClicks * distribution[index]);
      });
    }

    return { labels: days, data };
  };

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      fetchAnalyticsData();
    }, [fetchAnalyticsData])
  );

  // Track if this is the initial mount
  const isInitialMount = React.useRef(true);

  // Refresh data when date range changes
  useEffect(() => {
    // Skip the initial mount - useFocusEffect handles that
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Fetch data when date range changes
    setLoading(true);
    fetchAnalyticsData();
  }, [dateRange, fetchAnalyticsData]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Date range options
  const dateRangeOptions = [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "last_7d", label: "Last 7 days" },
    { value: "last_14d", label: "Last 14 days" },
    { value: "last_30d", label: "Last 30 days" },
    { value: "last_90d", label: "Last 90 days" },
    { value: "this_month", label: "This month" },
    { value: "last_month", label: "Last month" },
    { value: "this_quarter", label: "This quarter" },
    { value: "lifetime", label: "Lifetime" },
  ];

  // Get display label for current date range
  const getDateRangeLabel = () => {
    const option = dateRangeOptions.find((opt) => opt.value === dateRange);
    return option ? option.label : "Last 30 days";
  };

  // Handle date range selection
  const handleDateRangeSelect = (value) => {
    if (value !== dateRange) {
      setShowDatePicker(false);
      setDateRange(value);
      // Loading state will be set by fetchAnalyticsData
    } else {
      setShowDatePicker(false);
    }
  };

  const audienceData = [
    { label: "Women", value: "62%" },
    { label: "Men", value: "38%" },
    { label: "18-24", value: "23%" },
    { label: "25-34", value: "42%" },
    { label: "35-44", value: "21%" },
    { label: "45+", value: "14%" },
  ];

  if (loading && campaigns.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#1877F2" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Date Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.filterButtonText}>
            {getDateRangeLabel()}
          </Text>
          <MaterialIcons 
            name={showDatePicker ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
            size={20} 
            color="#1877F2" 
          />
        </TouchableOpacity>
      </View>

      {/* Date Range Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDatePicker(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date Range</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <MaterialIcons name="close" size={24} color="#606770" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalOptions} showsVerticalScrollIndicator={false}>
              {dateRangeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionItem,
                    dateRange === option.value && styles.optionItemSelected,
                  ]}
                  onPress={() => handleDateRangeSelect(option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      dateRange === option.value && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {dateRange === option.value && (
                    <MaterialIcons name="check" size={20} color="#1877F2" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{formatNumber(campaignStats.impressions)}</Text>
          <Text style={styles.summaryLabel}>Impressions</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{formatNumber(campaignStats.reach)}</Text>
          <Text style={styles.summaryLabel}>Reach</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{formatNumber(campaignStats.clicks)}</Text>
          <Text style={styles.summaryLabel}>Clicks</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{formatPercent(campaignStats.ctr)}</Text>
          <Text style={styles.summaryLabel}>CTR</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{formatCurrency(campaignStats.costPerResult)}</Text>
          <Text style={styles.summaryLabel}>Cost Per Result</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{formatCurrency(campaignStats.amountSpent)}</Text>
          <Text style={styles.summaryLabel}>Amount Spent</Text>
        </View>
      </View>

      {/* Performance Chart */}
      {performanceData.labels.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Performance Overview</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View details</Text>
            </TouchableOpacity>
          </View>
          <LineChart
            data={performanceData}
            width={Dimensions.get("window").width - 80}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withVerticalLines={false}
            withHorizontalLines={false}
          />
        </View>
      )}

      {/* Campaign Breakdown */}
      {barChartData.labels.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Campaign Breakdown</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>
          {/* @ts-ignore */}
          <BarChart
            data={barChartData}
            width={Dimensions.get("window").width - 100}
            height={200}
            yAxisLabel=""
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(24, 119, 242, ${opacity})`,
            }}
            style={styles.chart}
            showBarTops={false}
            fromZero
          />
        </View>
      )}

      {/* Device Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Distribution</Text>
        <View style={styles.pieChartContainer}>
          <PieChart
            data={pieChartData}
            width={Dimensions.get("window").width - 32}
            height={150}
            chartConfig={chartConfig}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            absolute
          />
        </View>
      </View>

      {/* Audience Demographics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Audience Demographics</Text>
        <View style={styles.audienceContainer}>
          {audienceData.map((item, index) => (
            <View key={index} style={styles.audienceItem}>
              <Text style={styles.audienceLabel}>{item.label}</Text>
              <Text style={styles.audienceValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Campaign List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Campaigns</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#1877F2" />
          </View>
        ) : campaigns.length > 0 ? (
          campaigns.map((campaign) => (
            <View key={campaign.id} style={styles.campaignCard}>
              <View style={styles.campaignHeader}>
                <Text style={styles.campaignName}>{campaign.name}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    (campaign.status === "ACTIVE" || campaign.status === "Active") && styles.statusActive,
                    (campaign.status === "PAUSED" || campaign.status === "Paused") && styles.statusPaused,
                    (campaign.status === "ARCHIVED" || campaign.status === "DELETED" || campaign.status === "Completed") && styles.statusCompleted,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {campaign.status === "ACTIVE" ? "Active" :
                     campaign.status === "PAUSED" ? "Paused" :
                     campaign.status === "ARCHIVED" ? "Archived" :
                     campaign.status === "DELETED" ? "Deleted" : campaign.status}
                  </Text>
                </View>
              </View>
              <View style={styles.campaignStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{formatNumber(campaign.impressions)}</Text>
                  <Text style={styles.statLabel}>Impressions</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{formatNumber(campaign.clicks)}</Text>
                  <Text style={styles.statLabel}>Clicks</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{formatPercent(campaign.ctr)}</Text>
                  <Text style={styles.statLabel}>CTR</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{formatCurrency(campaign.spend)}</Text>
                  <Text style={styles.statLabel}>Spend</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No campaign data available</Text>
            <Text style={styles.emptySubtext}>Connect your Meta account to see analytics</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    padding: 16,
  },
  filterContainer: {
    marginBottom: 16,
    alignItems: "flex-end",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E7F3FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonText: {
    color: "#1877F2",
    fontWeight: "500",
    marginRight: 4,
  },
  summaryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1C1E21",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#606770",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1E21",
  },
  viewAllText: {
    color: "#1877F2",
    fontSize: 14,
    fontWeight: "500",
  },
  chart: {
    borderRadius: 8,
    marginTop: 8,
  },
  pieChartContainer: {
    alignItems: "center",
  },
  audienceContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  audienceItem: {
    width: "48%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E9EBEE",
  },
  audienceLabel: {
    color: "#606770",
    fontSize: 14,
  },
  audienceValue: {
    color: "#1C1E21",
    fontSize: 14,
    fontWeight: "600",
  },
  campaignCard: {
    backgroundColor: "#F5F7FA",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  campaignHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  campaignName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1E21",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: "#E7F3FF",
  },
  statusPaused: {
    backgroundColor: "#FFF4E5",
  },
  statusCompleted: {
    backgroundColor: "#E5F7EE",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  campaignStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1E21",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#606770",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#606770",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1E21",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#606770",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: Dimensions.get("window").width - 64,
    maxHeight: Dimensions.get("window").height * 0.6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E9EBEE",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1E21",
  },
  modalOptions: {
    maxHeight: Dimensions.get("window").height * 0.5,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F7FA",
  },
  optionItemSelected: {
    backgroundColor: "#E7F3FF",
  },
  optionText: {
    fontSize: 16,
    color: "#1C1E21",
  },
  optionTextSelected: {
    color: "#1877F2",
    fontWeight: "600",
  },
});

export default AnalyticsScreen;
