import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-chart-kit";

const AnalyticsScreen = () => {
  // Dummy data
  const campaignStats = {
    impressions: "124,856",
    reach: "89,432",
    clicks: "12,745",
    ctr: "10.2%",
    costPerResult: "$0.42",
    amountSpent: "$5,352",
  };

  const performanceData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        data: [20, 45, 28, 80, 99, 43],
        color: (opacity = 1) => `rgba(24, 119, 242, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const barChartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: [20, 45, 28, 80, 99, 43, 65],
      },
    ],
  };

  const pieChartData = [
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
  ];

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

  const campaigns = [
    {
      id: 1,
      name: "Summer Sale",
      status: "Active",
      impressions: "45,231",
      clicks: "5,231",
      ctr: "11.6%",
      spend: "$2,145",
    },
    {
      id: 2,
      name: "New Collection",
      status: "Paused",
      impressions: "32,156",
      clicks: "3,542",
      ctr: "11.0%",
      spend: "$1,856",
    },
    {
      id: 3,
      name: "Holiday Special",
      status: "Completed",
      impressions: "89,432",
      clicks: "9,874",
      ctr: "11.1%",
      spend: "$4,256",
    },
  ];

  const audienceData = [
    { label: "Women", value: "62%" },
    { label: "Men", value: "38%" },
    { label: "18-24", value: "23%" },
    { label: "25-34", value: "42%" },
    { label: "35-44", value: "21%" },
    { label: "45+", value: "14%" },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Date Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterButtonText}>Last 30 days</Text>
          <MaterialIcons name="keyboard-arrow-down" size={20} color="#1877F2" />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        {Object.entries(campaignStats).map(([key, value]) => (
          <View key={key} style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{value}</Text>
            <Text style={styles.summaryLabel}>
              {key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase())}
            </Text>
          </View>
        ))}
      </View>

      {/* Performance Chart */}
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

      {/* Campaign Breakdown */}
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
        {campaigns.map((campaign) => (
          <View key={campaign.id} style={styles.campaignCard}>
            <View style={styles.campaignHeader}>
              <Text style={styles.campaignName}>{campaign.name}</Text>
              <View
                style={[
                  styles.statusBadge,
                  campaign.status === "Active" && styles.statusActive,
                  campaign.status === "Paused" && styles.statusPaused,
                  campaign.status === "Completed" && styles.statusCompleted,
                ]}
              >
                <Text style={styles.statusText}>{campaign.status}</Text>
              </View>
            </View>
            <View style={styles.campaignStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{campaign.impressions}</Text>
                <Text style={styles.statLabel}>Impressions</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{campaign.clicks}</Text>
                <Text style={styles.statLabel}>Clicks</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{campaign.ctr}</Text>
                <Text style={styles.statLabel}>CTR</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{campaign.spend}</Text>
                <Text style={styles.statLabel}>Spend</Text>
              </View>
            </View>
          </View>
        ))}
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
});

export default AnalyticsScreen;
