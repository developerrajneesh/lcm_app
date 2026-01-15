import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";
import CustomSelect from "../CustomSelect";

export default function AccountOverview() {
  const [accountDetails, setAccountDetails] = useState(null);
  const [campaignsCount, setCampaignsCount] = useState(0);
  const [adsetsCount, setAdsetsCount] = useState(0);
  const [adsCount, setAdsCount] = useState(0);
  const [availableFunds, setAvailableFunds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fundsLoading, setFundsLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Parse available funds from display_string
  const parseAvailableFunds = (displayString) => {
    if (!displayString) return null;
    
    // Extract amount and currency from display_string
    // Pattern: "Available balance (₹760.37 INR)" or "Available balance ($100.50 USD)"
    const match = displayString.match(/[₹$]?\s*([\d,]+\.?\d*)\s*([A-Z]{3})?/i);
    if (match && match[1]) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      const currency = match[2] || 'INR';
      if (!isNaN(amount)) {
        return { amount, currency };
      }
    }
    return null;
  };

  // Extract account ID without "act_" prefix
  const getAccountIdWithoutPrefix = (accountId) => {
    if (!accountId) return "";
    // Remove "act_" prefix if present
    return accountId.startsWith("act_") ? accountId.substring(4) : accountId;
  };

  // Handle Add Funds button click
  const handleAddFunds = async () => {
    if (!selectedAccountId) {
      Alert.alert("Error", "Please select an ad account first");
      return;
    }
    
    const accountIdWithoutPrefix = getAccountIdWithoutPrefix(selectedAccountId);
    const billingUrl = `https://business.facebook.com/billing_hub/payment_activity?asset_id=${accountIdWithoutPrefix}&placement=ads_manager&payment_account_id=${accountIdWithoutPrefix}`;
    
    try {
      const canOpen = await Linking.canOpenURL(billingUrl);
      if (canOpen) {
        await Linking.openURL(billingUrl);
      } else {
        Alert.alert("Error", "Unable to open billing page. Please try again later.");
      }
    } catch (error) {
      console.error("Error opening billing URL:", error);
      Alert.alert("Error", "Failed to open billing page. Please try again later.");
    }
  };

  // Fetch available ad accounts
  const fetchAdAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const accessToken = await AsyncStorage.getItem("fb_access_token");
      if (!accessToken) return;

      const response = await axios.get(`${API_BASE_URL}/campaigns`, {
        headers: {
          "x-fb-access-token": accessToken,
        },
      });

      if (response.data.success && response.data.adAccounts?.data) {
        const accounts = response.data.adAccounts.data.filter(
          account => account && account.id && typeof account.id === 'string' && account.id.trim() !== ''
        );
        setAvailableAccounts(accounts);
        
        // Get current selected account from storage
        const currentAccountId = await AsyncStorage.getItem("fb_ad_account_id") || await AsyncStorage.getItem("act_ad_account_id");
        
        // If we have a current account ID and it exists in the accounts list, use it
        if (currentAccountId && accounts.find(acc => acc.id === currentAccountId)) {
          setSelectedAccountId(currentAccountId);
        } else if (accounts.length > 0) {
          // Auto-select first account if none selected or current account not found
          const firstAccountId = accounts[0].id;
          setSelectedAccountId(firstAccountId);
          await AsyncStorage.setItem("fb_ad_account_id", firstAccountId);
        }
      }
    } catch (error) {
      console.error("Error fetching ad accounts:", error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Handle account selection change
  const handleAccountChange = async (selectedAccount) => {
    if (!selectedAccount || !selectedAccount.id) return;
    
    const accountId = selectedAccount.id;
    setSelectedAccountId(accountId);
    await AsyncStorage.setItem("fb_ad_account_id", accountId);
    
    // Reset account details and refetch for new account
    setAccountDetails(null);
    setCampaignsCount(0);
    setAdsetsCount(0);
    setAdsCount(0);
    setAvailableFunds(null);
    
    // Refetch data for new account
    await fetchAccountData();
  };

  // Fetch available funds
  const fetchAvailableFunds = async (accountId = null) => {
    try {
      const accessToken = await AsyncStorage.getItem("fb_access_token");
      const adAccountId = accountId || await AsyncStorage.getItem("fb_ad_account_id") || await AsyncStorage.getItem("act_ad_account_id");
      
      if (!adAccountId || !accessToken) return;
      
      setFundsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/campaigns/account/${adAccountId}/funds`, {
        headers: {
          "x-fb-access-token": accessToken,
        },
      });
      
      if (response.data.success && response.data.fundingSourceDetails) {
        const parsedFunds = parseAvailableFunds(response.data.fundingSourceDetails.display_string);
        if (parsedFunds !== null) {
          setAvailableFunds({
            amount: parsedFunds.amount,
            currency: parsedFunds.currency,
            displayString: response.data.fundingSourceDetails.display_string,
            type: response.data.fundingSourceDetails.type,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching available funds:", error);
    } finally {
      setFundsLoading(false);
    }
  };

  // Fetch account data
  const fetchAccountData = useCallback(async (accountId = null) => {
    try {
      setLoading(true);
      
      const accessToken = await AsyncStorage.getItem("fb_access_token");
      const adAccountId = accountId || await AsyncStorage.getItem("fb_ad_account_id") || await AsyncStorage.getItem("act_ad_account_id");
      
      if (!adAccountId || !accessToken) {
        setLoading(false);
        return;
      }

      // Fetch account details
      try {
        const accountResponse = await axios.get(`${API_BASE_URL}/campaigns/account/${adAccountId}`, {
          headers: {
            "x-fb-access-token": accessToken,
          },
        });
        
        if (accountResponse.data.success && accountResponse.data.account) {
          setAccountDetails(accountResponse.data.account);
        } else {
          // Fallback to fetching from accounts list
          const accountsResponse = await axios.get(`${API_BASE_URL}/campaigns`, {
            headers: {
              "x-fb-access-token": accessToken,
            },
          });
          
          if (accountsResponse.data.success && accountsResponse.data.adAccounts?.data) {
            const account = accountsResponse.data.adAccounts.data.find(
              acc => acc.id === adAccountId
            );
            if (account) {
              setAccountDetails(account);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching account details:", err);
        // Fallback to fetching from accounts list
        try {
          const accountsResponse = await axios.get(`${API_BASE_URL}/campaigns`, {
            headers: {
              "x-fb-access-token": accessToken,
            },
          });
          
          if (accountsResponse.data.success && accountsResponse.data.adAccounts?.data) {
            const account = accountsResponse.data.adAccounts.data.find(
              acc => acc.id === adAccountId
            );
            if (account) {
              setAccountDetails(account);
            }
          }
        } catch (fallbackErr) {
          console.error("Error in fallback account fetch:", fallbackErr);
        }
      }

      // Fetch campaigns count
      try {
        let allCampaigns = [];
        let campaignsAfter = null;
        let hasMoreCampaigns = true;
        
        while (hasMoreCampaigns && allCampaigns.length < 1000) { // Limit to prevent excessive API calls
          const campaignsResponse = await axios.get(`${API_BASE_URL}/campaigns/all`, {
            headers: {
              "x-fb-access-token": accessToken,
            },
            params: {
              adAccountId: adAccountId,
              limit: 100,
              after: campaignsAfter,
            },
          });
          
          if (campaignsResponse.data.success && campaignsResponse.data.campaigns) {
            const campaignsData = campaignsResponse.data.campaigns;
            const campaigns = Array.isArray(campaignsData.data) ? campaignsData.data : (Array.isArray(campaignsData) ? campaignsData : []);
            allCampaigns = [...allCampaigns, ...campaigns];
            
            // Check for next page
            const paging = campaignsData.paging;
            if (paging && paging.cursors?.after) {
              campaignsAfter = paging.cursors.after;
              hasMoreCampaigns = true;
            } else {
              hasMoreCampaigns = false;
            }
          } else {
            hasMoreCampaigns = false;
          }
        }
        
        setCampaignsCount(allCampaigns.length);
        // Note: Ad Sets and Ads counts are not fetched to avoid excessive API calls
        // Users can see actual counts in the Manage tab
        setAdsetsCount(0);
        setAdsCount(0);
      } catch (err) {
        console.error("Error fetching campaigns:", err);
        if (err.response?.data?.error?.code === 17) {
          console.warn("Rate limit reached, showing account details only");
        }
      }

      // Fetch available funds
      await fetchAvailableFunds(adAccountId);
    } catch (error) {
      console.error("Error fetching account data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Fetch ad accounts first - this will also set the selected account
    fetchAdAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      fetchAccountData(selectedAccountId);
    }
    
    // Set up interval to fetch funds every 30 seconds
    const fundsInterval = setInterval(() => {
      if (selectedAccountId) {
        fetchAvailableFunds(selectedAccountId);
      }
    }, 30000); // 30 seconds
    
    return () => {
      clearInterval(fundsInterval);
    };
  }, [selectedAccountId, fetchAccountData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAdAccounts().then(() => {
      if (selectedAccountId) {
        fetchAccountData(selectedAccountId);
      }
    });
  }, [selectedAccountId, fetchAccountData]);

  if (loading && !accountDetails) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading account information...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Ad Account Selection Section */}
      <View style={styles.accountSelectorSection}>
        <View style={styles.accountSelectorContainer}>
          <Text style={styles.accountSelectorLabel}>Ad Account:</Text>
          {loadingAccounts ? (
            <View style={[styles.accountSelector, styles.accountSelectorLoading]}>
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text style={styles.accountSelectorText}>Loading...</Text>
            </View>
          ) : availableAccounts.length > 0 ? (
            <CustomSelect
              data={availableAccounts}
              onSelect={handleAccountChange}
              defaultValue={availableAccounts.find(acc => acc.id === selectedAccountId) || availableAccounts[0]}
              buttonTextAfterSelection={(selectedItem) => {
                const accountName = selectedItem.name || selectedItem.id;
                const currency = selectedItem.currency ? `(${selectedItem.currency})` : '';
                return `${accountName} ${currency} - ${selectedItem.id}`;
              }}
              rowTextForSelection={(item) => {
                const accountName = item.name || item.id;
                const currency = item.currency ? `(${item.currency})` : '';
                return `${accountName} ${currency} - ${item.id}`;
              }}
              buttonStyle={styles.accountSelector}
              buttonTextStyle={styles.accountSelectorText}
              placeholder="Select Account"
            />
          ) : (
            <View style={styles.accountSelector}>
              <Text style={styles.accountSelectorText}>No accounts available</Text>
            </View>
          )}
        </View>

        {/* Available Funds and Add Funds Row */}
        {selectedAccountId && (
          <View style={styles.fundsAndButtonRow}>
            {/* Available Funds Box */}
            <View style={styles.fundsBox}>
              <Text style={styles.fundsLabel}>Available Funds:</Text>
              <View style={styles.fundsContent}>
                {fundsLoading ? (
                  <ActivityIndicator size="small" color="#10B981" />
                ) : availableFunds ? (
                  <Text style={styles.fundsAmount}>
                    {availableFunds.currency} {availableFunds.amount.toFixed(2)}
                  </Text>
                ) : accountDetails?.balance !== undefined && accountDetails.balance !== null ? (
                  <Text style={styles.fundsAmount}>
                    {accountDetails.currency || 'INR'} {parseFloat(accountDetails.balance / 100).toFixed(2)}
                  </Text>
                ) : (
                  <Text style={styles.fundsAmount}>Loading...</Text>
                )}
                <TouchableOpacity
                  onPress={() => fetchAvailableFunds(selectedAccountId)}
                  style={styles.fundsRefreshButton}
                  disabled={fundsLoading}
                >
                  <MaterialCommunityIcons
                    name="refresh"
                    size={16}
                    color="#10B981"
                    style={fundsLoading && { transform: [{ rotate: '360deg' }] }}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Add Funds Button */}
            <TouchableOpacity
              onPress={handleAddFunds}
              style={styles.addFundsButton}
            >
              <Text style={styles.addFundsSymbol}>₹</Text>
              <Text style={styles.addFundsText}>Add Funds</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Account Overview</Text>
            <TouchableOpacity
              onPress={fetchAccountData}
              style={styles.refreshButton}
              disabled={loading}
            >
              <MaterialCommunityIcons
                name="refresh"
                size={20}
                color="#3B82F6"
                style={loading && { transform: [{ rotate: '360deg' }] }}
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => setExpanded(!expanded)}
            style={styles.expandButton}
          >
            <MaterialCommunityIcons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={24}
              color="#6B7280"
            />
          </TouchableOpacity>
        </View>

        {accountDetails && (
          <View style={styles.accountInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{accountDetails.name || "N/A"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <View style={[
                styles.statusBadge,
                accountDetails.account_status === 1 ? styles.statusActive : styles.statusInactive
              ]}>
                <Text style={styles.statusText}>
                  {accountDetails.account_status === 1 ? "Active" : "Inactive"}
                </Text>
              </View>
            </View>
            {accountDetails.currency && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Currency:</Text>
                <Text style={styles.infoValue}>{accountDetails.currency}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Available Funds:</Text>
              <View style={styles.fundsContainer}>
                {fundsLoading ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : availableFunds ? (
                  <Text style={styles.fundsValue}>
                    {availableFunds.currency} {availableFunds.amount.toFixed(2)}
                  </Text>
                ) : accountDetails?.balance !== undefined && accountDetails.balance !== null ? (
                  <Text style={styles.fundsValue}>
                    {accountDetails.currency || 'INR'} {parseFloat(accountDetails.balance / 100).toFixed(2)}
                  </Text>
                ) : (
                  <Text style={styles.fundsValue}>N/A</Text>
                )}
                <TouchableOpacity
                  onPress={fetchAvailableFunds}
                  style={styles.fundsRefreshButton}
                  disabled={fundsLoading}
                >
                  <MaterialCommunityIcons
                    name="refresh"
                    size={16}
                    color="#3B82F6"
                    style={fundsLoading && { transform: [{ rotate: '360deg' }] }}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {expanded && (
          <View style={styles.expandedContent}>
            {/* Statistics Grid */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, styles.statCardBlue]}>
                <View style={styles.statHeader}>
                  <MaterialCommunityIcons name="target" size={20} color="#3B82F6" />
                  <Text style={styles.statLabel}>Campaigns</Text>
                </View>
                <Text style={styles.statValue}>{campaignsCount}</Text>
              </View>
              <View style={[styles.statCard, styles.statCardPurple]}>
                <View style={styles.statHeader}>
                  <MaterialCommunityIcons name="layers" size={20} color="#9333EA" />
                  <Text style={styles.statLabel}>Ad Sets</Text>
                </View>
                <Text style={styles.statValue}>{adsetsCount}</Text>
              </View>
              <View style={[styles.statCard, styles.statCardGreen]}>
                <View style={styles.statHeader}>
                  <MaterialCommunityIcons name="trending-up" size={20} color="#10B981" />
                  <Text style={styles.statLabel}>Ads</Text>
                </View>
                <Text style={styles.statValue}>{adsCount}</Text>
              </View>
              <View style={[styles.statCard, styles.statCardOrange]}>
                <View style={styles.statHeader}>
                  <MaterialCommunityIcons name="currency-usd" size={20} color="#F59E0B" />
                  <Text style={styles.statLabel}>Amount Spent</Text>
                </View>
                <Text style={styles.statValueSmall}>
                  {accountDetails?.amount_spent 
                    ? `${accountDetails.currency || ''} ${parseFloat(accountDetails.amount_spent / 100).toFixed(2)}`
                    : 'N/A'}
                </Text>
              </View>
            </View>

            {/* Account Details */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Account Information</Text>
              <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Account ID:</Text>
                  <Text style={styles.detailValue}>
                    {accountDetails?.id || (async () => {
                      const id = await AsyncStorage.getItem("fb_ad_account_id") || await AsyncStorage.getItem("act_ad_account_id");
                      return id || "N/A";
                    })()}
                  </Text>
                </View>
                {accountDetails?.account_id && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Account Number:</Text>
                    <Text style={styles.detailValue}>{accountDetails.account_id}</Text>
                  </View>
                )}
                {accountDetails?.business_name && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Business:</Text>
                    <Text style={styles.detailValue}>{accountDetails.business_name}</Text>
                  </View>
                )}
                {accountDetails?.timezone_name && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailRowWithIcon}>
                      <MaterialCommunityIcons name="clock-outline" size={16} color="#6B7280" />
                      <Text style={styles.detailLabel}>Timezone:</Text>
                    </View>
                    <Text style={styles.detailValue}>{accountDetails.timezone_name}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Financial Information */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Financial Information</Text>
              <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Available Funds:</Text>
                  <View style={styles.fundsContainer}>
                    {fundsLoading ? (
                      <ActivityIndicator size="small" color="#3B82F6" />
                    ) : availableFunds ? (
                      <Text style={styles.detailValue}>
                        {availableFunds.currency} {availableFunds.amount.toFixed(2)}
                      </Text>
                    ) : accountDetails?.balance !== undefined && accountDetails.balance !== null ? (
                      <Text style={styles.detailValue}>
                        {accountDetails.currency || 'INR'} {parseFloat(accountDetails.balance / 100).toFixed(2)}
                      </Text>
                    ) : (
                      <Text style={styles.detailValue}>N/A</Text>
                    )}
                    <TouchableOpacity
                      onPress={fetchAvailableFunds}
                      style={styles.fundsRefreshButton}
                      disabled={fundsLoading}
                    >
                      <MaterialCommunityIcons
                        name="refresh"
                        size={16}
                        color="#3B82F6"
                        style={fundsLoading && { transform: [{ rotate: '360deg' }] }}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                {accountDetails?.spend_cap && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Spend Cap:</Text>
                    <Text style={styles.detailValue}>
                      {accountDetails.currency || ''} {parseFloat(accountDetails.spend_cap / 100).toFixed(2)}
                    </Text>
                  </View>
                )}
                {accountDetails?.funding_source && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Funding Source:</Text>
                    <Text style={styles.detailValue}>{accountDetails.funding_source}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Currency:</Text>
                  <Text style={styles.detailValue}>{accountDetails?.currency || 'N/A'}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  refreshButton: {
    padding: 4,
  },
  expandButton: {
    padding: 4,
  },
  accountInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: "#D1FAE5",
  },
  statusInactive: {
    backgroundColor: "#FEF3C7",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  fundsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fundsValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  fundsRefreshButton: {
    padding: 4,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "47%",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  statCardBlue: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  statCardPurple: {
    backgroundColor: "#F5F3FF",
    borderColor: "#DDD6FE",
  },
  statCardGreen: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  statCardOrange: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  statValueSmall: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  detailsSection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  detailsCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailRowWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  detailValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
    flexShrink: 1,
    textAlign: "right",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  accountSelectorSection: {
    gap: 12,
    marginBottom: 16,
  },
  fundsAndButtonRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },
  accountSelectorContainer: {
    flex: 1,
    minWidth: 200,
  },
  accountSelectorLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3B82F6",
    marginBottom: 4,
    marginLeft: 4,
  },
  accountSelector: {
    height: 48,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#3B82F6",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  accountSelectorLoading: {
    justifyContent: "center",
    gap: 8,
  },
  accountSelectorText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
    flex: 1,
  },
  fundsBox: {
    flex: 1,
    minWidth: 150,
    backgroundColor: "#ECFDF5",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#10B981",
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    justifyContent: "center",
    minHeight: 72,
  },
  fundsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#065F46",
    marginBottom: 4,
  },
  fundsContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fundsAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#10B981",
    flex: 1,
  },
  fundsRefreshButton: {
    padding: 4,
  },
  addFundsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#10B981",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "#EF4444",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    minWidth: 120,
    height: 72,
  },
  addFundsSymbol: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  addFundsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});

