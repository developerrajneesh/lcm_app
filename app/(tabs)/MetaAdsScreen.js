import AnalyticsScreen from "@/Components/AnalyticsScreen";
import {
  Feather,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// Note: expo-image-picker needs to be installed
// For now, we'll use a placeholder
// import * as ImagePicker from "expo-image-picker";
import MetaConnectScreen from "../../Components/meta/ConnectMetaAccount";
import { API_BASE_URL } from "../../config/api";

// Header Component
const Header = () => (
  <View style={styles.header}>
    <View style={styles.headerLeft}>
      <FontAwesome name="facebook-square" size={28} color="#1877F2" />
      <Text style={styles.headerTitle}>Meta Ads</Text>
    </View>
    <TouchableOpacity style={styles.notificationButton}>
      <Ionicons name="notifications-outline" size={24} color="#1C1E21" />
    </TouchableOpacity>
  </View>
);

// Tab Navigation Component
const TabNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "create", label: "Create" },
    { id: "manage", label: "Manage" },
    { id: "analytics", label: "Analytics" },
  ];

  return (
    <View style={styles.tabsContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tab, activeTab === tab.id && styles.activeTab]}
          onPress={() => setActiveTab(tab.id)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText,
            ]}
          >
            {tab.label}
          </Text>
          {activeTab === tab.id && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Section Header Component
const SectionHeader = ({ title, step, totalSteps = 3 }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {step && (
      <View style={styles.sectionStep}>
        <Text style={styles.sectionStepText}>
          Step {step} of {totalSteps}
        </Text>
      </View>
    )}
  </View>
);

// Campaign Details Component
const CampaignDetails = ({
  campaignName,
  setCampaignName,
  budget,
  setBudget,
  objective,
  setObjective,
}) => {
  const objectives = [
    { id: "OUTCOME_TRAFFIC", name: "Website Traffic", icon: "web" },
    { id: "OUTCOME_CONVERSIONS", name: "Conversions", icon: "currency-usd" },
    { id: "OUTCOME_ENGAGEMENT", name: "Engagement", icon: "thumb-up" },
    { id: "BRAND_AWARENESS", name: "Brand Awareness", icon: "bullhorn" },
  ];

  return (
    <View style={styles.section}>
      <SectionHeader title="Campaign Details" step={1} />

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Campaign Name</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="e.g., Summer Running Sale"
            value={campaignName}
            onChangeText={setCampaignName}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Daily Budget ($)</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="e.g., 20"
            keyboardType="numeric"
            value={budget}
            onChangeText={setBudget}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Objective</Text>
        <View style={styles.objectivesContainer}>
          {objectives.map((obj) => (
            <TouchableOpacity
              key={obj.id}
              style={[
                styles.objectiveButton,
                objective === obj.id && styles.selectedObjective,
              ]}
              onPress={() => setObjective(obj.id)}
            >
              <MaterialCommunityIcons
                name={obj.icon}
                size={20}
                color={objective === obj.id ? "#fff" : "#1877F2"}
              />
              <Text
                style={[
                  styles.objectiveText,
                  objective === obj.id && styles.selectedObjectiveText,
                ]}
              >
                {obj.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

// Targeting Item Component
const TargetingItem = ({ icon, label, value, onEdit }) => (
  <View style={styles.targetingItem}>
    <View style={styles.targetingIcon}>{icon}</View>
    <View style={styles.targetingContent}>
      <Text style={styles.targetingLabel}>{label}</Text>
      <Text style={styles.targetingText}>{value}</Text>
    </View>
    <TouchableOpacity style={styles.editButton} onPress={onEdit}>
      <Text style={styles.editButtonText}>Edit</Text>
    </TouchableOpacity>
  </View>
);

// Targeting Section Component
const TargetingSection = ({ targeting, setEditField, setTempValue }) => (
  <View style={styles.section}>
    <SectionHeader title="Targeting" step={2} />

    <TargetingItem
      icon={<Feather name="map-pin" size={18} color="#8B9DC3" />}
      label="Location"
      value={targeting.location}
      onEdit={() => {
        setEditField("location");
        setTempValue(targeting.location);
      }}
    />

    <TargetingItem
      icon={<MaterialIcons name="people-outline" size={18} color="#8B9DC3" />}
      label="Age Range"
      value={`${targeting.ageMin}-${targeting.ageMax} years`}
      onEdit={() => {
        setEditField("ageMin");
        setTempValue(targeting.ageMin.toString());
      }}
    />

    <TargetingItem
      icon={<MaterialIcons name="interests" size={18} color="#8B9DC3" />}
      label="Interests"
      value={targeting.interests.join(", ")}
      onEdit={() => {
        setEditField("interests");
        setTempValue(targeting.interests.join(", "));
      }}
    />
  </View>
);

// Ad Creative Section Component
const AdCreativeSection = ({ adCreative, setAdCreative, selectImage }) => (
  <View style={styles.section}>
    <SectionHeader title="Ad Creative" step={3} />

    <TouchableOpacity style={styles.mediaUpload} onPress={selectImage}>
      {adCreative.media ? (
        <Image source={{ uri: adCreative.media }} style={styles.mediaPreview} />
      ) : (
        <View style={styles.mediaPlaceholder}>
          <MaterialIcons name="add-photo-alternate" size={40} color="#D8DEE6" />
          <Text style={styles.mediaPlaceholderText}>Add Image or Video</Text>
          <Text style={styles.mediaPlaceholderSubtext}>
            Recommended size: 1200×628px
          </Text>
        </View>
      )}
    </TouchableOpacity>

    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>Primary Text</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="The main text of your ad"
          multiline
          value={adCreative.primaryText}
          onChangeText={(text) =>
            setAdCreative({ ...adCreative, primaryText: text })
          }
        />
      </View>
    </View>

    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>Headline</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Short headline"
          value={adCreative.headline}
          onChangeText={(text) =>
            setAdCreative({ ...adCreative, headline: text })
          }
        />
      </View>
    </View>

    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>Description</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Details about the offer"
          multiline
          value={adCreative.description}
          onChangeText={(text) =>
            setAdCreative({ ...adCreative, description: text })
          }
        />
      </View>
    </View>
  </View>
);

// Edit Modal Component
const EditModal = ({
  editField,
  setEditField,
  tempValue,
  setTempValue,
  targeting,
  setTargeting,
}) => (
  <Modal
    transparent
    visible={editField !== null}
    animationType="fade"
    onRequestClose={() => setEditField(null)}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>
          Edit {editField?.replace(/([A-Z])/g, " $1").toLowerCase()}
        </Text>

        <View style={styles.modalInputContainer}>
          <TextInput
            style={styles.modalInput}
            placeholder={`Enter ${editField}`}
            value={tempValue}
            onChangeText={setTempValue}
            keyboardType={
              editField === "ageMin" || editField === "ageMax"
                ? "numeric"
                : "default"
            }
          />
        </View>

        <View style={styles.modalButtons}>
          <TouchableOpacity
            onPress={() => setEditField(null)}
            style={styles.modalButtonSecondary}
          >
            <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              const updated = { ...targeting };
              if (editField === "interests") {
                updated[editField] = tempValue.split(",").map((i) => i.trim());
              } else {
                updated[editField] = isNaN(tempValue)
                  ? tempValue
                  : parseInt(tempValue);
              }
              setTargeting(updated);
              setEditField(null);
            }}
            style={styles.modalButtonPrimary}
          >
            <Text style={styles.modalButtonPrimaryText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// Empty State Component
const EmptyState = ({ icon, title, text, buttonText, onButtonPress }) => (
  <View style={styles.emptyState}>
    {icon}
    <Text style={styles.emptyStateTitle}>{title}</Text>
    <Text style={styles.emptyStateText}>{text}</Text>
    {buttonText && (
      <TouchableOpacity style={styles.emptyStateButton} onPress={onButtonPress}>
        <Text style={styles.emptyStateButtonText}>{buttonText}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// Main Component
const MetaAdsScreen = () => {
  const [campaignName, setCampaignName] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [adAccountId, setAdAccountId] = useState("");
  const [adAccounts, setAdAccounts] = useState([]);
  const [budget, setBudget] = useState("");
  const [objective, setObjective] = useState("OUTCOME_TRAFFIC");
  const [targeting, setTargeting] = useState({
    location: "United States",
    ageMin: 18,
    ageMax: 65,
    interests: ["Fitness", "Running"],
  });
  const [adCreative, setAdCreative] = useState({
    primaryText: "Boost your running performance with our premium gear!",
    headline: "Upgrade Your Running Experience",
    description: "Shop now for limited-time discounts on running equipment",
    media: null,
    mediaUrl: null,
  });
  const [activeTab, setActiveTab] = useState("create");
  const [editField, setEditField] = useState(null);
  const [tempValue, setTempValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const token = await AsyncStorage.getItem("fb_access_token");
      const accountId = await AsyncStorage.getItem("fb_ad_account_id");
      if (token && accountId) {
        setAccessToken(token);
        setAdAccountId(accountId);
        setIsConnected(true);
      } else {
        // Try to get ad accounts
        if (token) {
          setAccessToken(token);
          await fetchAdAccounts(token);
        }
      }
    } catch (error) {
      console.error("Error checking connection:", error);
    }
  };

  const fetchAdAccounts = async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/campaigns`, {
        headers: {
          "x-fb-access-token": token,
        },
      });
      if (response.data.success && response.data.adAccounts?.data) {
        setAdAccounts(response.data.adAccounts.data);
        if (response.data.adAccounts.data.length === 1) {
          const accountId = response.data.adAccounts.data[0].id;
          setAdAccountId(accountId);
          await AsyncStorage.setItem("fb_ad_account_id", accountId);
          setIsConnected(true);
        } else if (response.data.adAccounts.data.length > 1) {
          setShowAccountModal(true);
        }
      }
    } catch (error) {
      console.error("Error fetching ad accounts:", error);
    }
  };

  const selectImage = async () => {
    // Image picker implementation
    // For now, just show an alert
    Alert.alert(
      "Image Picker",
      "Image picker will be implemented. For now, you can create ads without images."
    );
    // TODO: Implement image picker when expo-image-picker is installed
    // try {
    //   const permissionResult =
    //     await ImagePicker.requestMediaLibraryPermissionsAsync();
    //   if (permissionResult.granted === false) {
    //     Alert.alert("Permission required", "Please grant camera roll permissions");
    //     return;
    //   }
    //   const result = await ImagePicker.launchImageLibraryAsync({
    //     mediaTypes: ImagePicker.MediaTypeOptions.Images,
    //     allowsEditing: true,
    //     aspect: [1.91, 1],
    //     quality: 0.8,
    //   });
    //   if (!result.canceled && result.assets[0]) {
    //     setAdCreative({
    //       ...adCreative,
    //       media: result.assets[0].uri,
    //       mediaUrl: result.assets[0].uri,
    //     });
    //   }
    // } catch (error) {
    //   console.error("Error selecting image:", error);
    //   Alert.alert("Error", "Failed to select image");
    // }
  };

  const launchCampaign = async () => {
    if (!campaignName.trim()) {
      Alert.alert("Error", "Please enter a campaign name");
      return;
    }
    if (!budget || parseFloat(budget) <= 0) {
      Alert.alert("Error", "Please enter a valid budget");
      return;
    }
    if (!accessToken) {
      Alert.alert("Error", "Please connect your Meta account first");
      return;
    }
    if (!adAccountId) {
      Alert.alert("Error", "Please select an ad account");
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Create Campaign
      const campaignResponse = await axios.post(
        `${API_BASE_URL}/campaigns`,
        {
          adAccountId,
          name: campaignName,
          objective: objective,
          status: "PAUSED",
          special_ad_categories: [], // Empty array for regular campaigns
        },
        {
          headers: {
            "x-fb-access-token": accessToken,
          },
        }
      );

      if (!campaignResponse.data.success) {
        throw new Error(campaignResponse.data.message || "Failed to create campaign");
      }

      const campaignId = campaignResponse.data.campaign.id;

      // Step 2: Create AdSet
      // Note: Targeting format needs to match Facebook's API requirements
      // For interests, you need actual interest IDs from Facebook, not names
      // This is a simplified version - in production, you'd have an interest selector
      const targetingData = {
        geo_locations: {
          countries: ["US"],
        },
        age_min: targeting.ageMin,
        age_max: targeting.ageMax,
        // Interests should be Facebook interest IDs, not names
        // For now, we'll use empty array - user should select from Facebook's interest list
        interests: [],
      };

      const adSetResponse = await axios.post(
        `${API_BASE_URL}/adsets`,
        {
          campaignId,
          name: `${campaignName} - AdSet`,
          optimizationGoal: "LINK_CLICKS",
          billingEvent: "IMPRESSIONS",
          dailyBudget: Math.round(parseFloat(budget) * 100), // Convert to cents
          targeting: targetingData,
          status: "PAUSED",
        },
        {
          headers: {
            "x-fb-access-token": accessToken,
          },
        }
      );

      if (!adSetResponse.data.success) {
        throw new Error(adSetResponse.data.message || "Failed to create ad set");
      }

      const adSetId = adSetResponse.data.adset.id;

      // Step 3: Create Ad
      // Note: Facebook Ads API requires a page_id for link ads
      // For now, we'll skip ad creation if no page_id is available
      // In production, you'd get the page_id from the user's connected pages
      let adResponse = null;
      try {
        // Try to create ad - this may fail if page_id is required
        adResponse = await axios.post(
          `${API_BASE_URL}/ads`,
          {
            adsetId,
            name: `${campaignName} - Ad`,
            creative: {
              object_story_spec: {
                link_data: {
                  message: adCreative.primaryText || "Check out our offer!",
                  link: "https://www.example.com", // Replace with actual destination URL
                  name: adCreative.headline || campaignName,
                  description: adCreative.description || "",
                  call_to_action: {
                    type: "LEARN_MORE",
                  },
                },
              },
            },
            status: "PAUSED",
          },
          {
            headers: {
              "x-fb-access-token": accessToken,
            },
          }
        );
      } catch (adError) {
        // If ad creation fails (e.g., missing page_id), that's okay
        // The campaign and adset are still created
        console.warn("Ad creation failed (this is okay):", adError.response?.data);
        Alert.alert(
          "Partial Success",
          "Campaign and AdSet created successfully, but Ad creation failed. You can create ads manually in Facebook Ads Manager or provide a page_id."
        );
      }

      if (adResponse && !adResponse.data.success) {
        throw new Error(adResponse.data.message || "Failed to create ad");
      }

      const successMessage = adResponse
        ? "Campaign, AdSet, and Ad created successfully!"
        : "Campaign and AdSet created successfully!";

      Alert.alert("Success", successMessage, [
        {
          text: "OK",
          onPress: () => {
            // Reset form
            setCampaignName("");
            setBudget("");
            setAdCreative({
              primaryText: "",
              headline: "",
              description: "",
              media: null,
              mediaUrl: null,
            });
            setActiveTab("manage");
          },
        },
      ]);
    } catch (error) {
      console.error("Error creating campaign:", error);
      Alert.alert(
        "Error",
        error.response?.data?.fb?.message ||
          error.response?.data?.message ||
          error.message ||
          "Failed to create campaign. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountSelect = async (accountId) => {
    setAdAccountId(accountId);
    await AsyncStorage.setItem("fb_ad_account_id", accountId);
    setShowAccountModal(false);
    setIsConnected(true);
  };

  if (!isConnected) {
    return (
      <MetaConnectScreen
        onSuccess={async (token, accountId) => {
          if (token) {
            setAccessToken(token);
            await AsyncStorage.setItem("fb_access_token", token);
            if (accountId) {
              setAdAccountId(accountId);
              await AsyncStorage.setItem("fb_ad_account_id", accountId);
              setIsConnected(true);
            } else {
              await fetchAdAccounts(token);
            }
          } else {
            setIsConnected(true);
          }
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === "create" ? (
          <>
            <CampaignDetails
              campaignName={campaignName}
              setCampaignName={setCampaignName}
              budget={budget}
              setBudget={setBudget}
              objective={objective}
              setObjective={setObjective}
            />

            <TargetingSection
              targeting={targeting}
              setEditField={setEditField}
              setTempValue={setTempValue}
            />

            <AdCreativeSection
              adCreative={adCreative}
              setAdCreative={setAdCreative}
              selectImage={selectImage}
            />

            <TouchableOpacity
              style={[styles.launchButton, isLoading && styles.launchButtonDisabled]}
              onPress={launchCampaign}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.launchButtonText}>Launch Campaign</Text>
              )}
            </TouchableOpacity>
          </>
        ) : activeTab === "manage" ? (
          <EmptyState
            icon={
              <MaterialCommunityIcons
                name="clipboard-list-outline"
                size={48}
                color="#D8DEE6"
              />
            }
            title="No campaigns yet"
            text="Create your first campaign to get started"
            buttonText="Create Campaign"
            onButtonPress={() => setActiveTab("create")}
          />
        ) : (
          <AnalyticsScreen />
        )}
      </ScrollView>

      <EditModal
        editField={editField}
        setEditField={setEditField}
        tempValue={tempValue}
        setTempValue={setTempValue}
        targeting={targeting}
        setTargeting={setTargeting}
      />

      {/* Account Selection Modal */}
      <Modal
        transparent
        visible={showAccountModal}
        animationType="slide"
        onRequestClose={() => setShowAccountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Ad Account</Text>
            <ScrollView>
              {adAccounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={styles.accountItem}
                  onPress={() => handleAccountSelect(account.id)}
                >
                  <Text style={styles.accountName}>{account.name || account.id}</Text>
                  <Text style={styles.accountId}>{account.id}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalButtonSecondary}
              onPress={() => setShowAccountModal(false)}
            >
              <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Redesigned Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F8FF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E9EBEE",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginLeft: 12,
    color: "#1C1E21",
  },
  notificationButton: {
    padding: 8,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E9EBEE",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    position: "relative",
  },
  tabText: {
    color: "#606770",
    fontWeight: "600",
    fontSize: 14,
  },
  activeTabText: {
    color: "#1877F2",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    height: 3,
    width: "100%",
    backgroundColor: "#1877F2",
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1E21",
  },
  sectionStep: {
    backgroundColor: "#E7F3FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  sectionStepText: {
    fontSize: 12,
    color: "#1877F2",
    fontWeight: "600",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: "#606770",
    marginBottom: 8,
    fontWeight: "600",
  },
  inputWrapper: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D8DEE6",
    overflow: "hidden",
  },
  input: {
    backgroundColor: "#fff",
    padding: 14,
    fontSize: 16,
    color: "#1C1E21",
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  objectivesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  objectiveButton: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D8DEE6",
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  selectedObjective: {
    backgroundColor: "#1877F2",
    borderColor: "#1877F2",
  },
  objectiveText: {
    marginLeft: 10,
    color: "#1C1E21",
    fontSize: 14,
    fontWeight: "500",
  },
  selectedObjectiveText: {
    color: "#fff",
  },
  targetingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },
  targetingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F7FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  targetingContent: {
    flex: 1,
  },
  targetingLabel: {
    fontSize: 12,
    color: "#606770",
    marginBottom: 4,
    fontWeight: "500",
  },
  targetingText: {
    color: "#1C1E21",
    fontSize: 16,
    fontWeight: "500",
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    color: "#1877F2",
    fontWeight: "600",
    fontSize: 14,
  },
  mediaUpload: {
    marginBottom: 20,
    borderRadius: 8,
    overflow: "hidden",
  },
  mediaPlaceholder: {
    height: 200,
    backgroundColor: "#F5F7FA",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9EBEE",
    borderRadius: 8,
    borderStyle: "dashed",
  },
  mediaPlaceholderText: {
    marginTop: 10,
    color: "#606770",
    fontSize: 16,
    fontWeight: "500",
  },
  mediaPlaceholderSubtext: {
    color: "#8B9DC3",
    fontSize: 12,
    marginTop: 6,
  },
  mediaPreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  launchButton: {
    backgroundColor: "#1877F2",
    borderRadius: 8,
    padding: 18,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#1877F2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  launchButtonDisabled: {
    opacity: 0.6,
  },
  launchButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  accountItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E9EBEE",
  },
  accountName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1E21",
    marginBottom: 4,
  },
  accountId: {
    fontSize: 14,
    color: "#606770",
  },
  emptyState: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1E21",
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 15,
    color: "#606770",
    marginTop: 10,
    textAlign: "center",
    maxWidth: "80%",
    lineHeight: 22,
  },
  emptyStateButton: {
    marginTop: 24,
    backgroundColor: "#1877F2",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyStateButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1E21",
    marginBottom: 20,
  },
  modalInputContainer: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D8DEE6",
    overflow: "hidden",
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: "#fff",
    padding: 14,
    fontSize: 16,
    color: "#1C1E21",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalButtonSecondary: {
    padding: 12,
    marginRight: 12,
    borderRadius: 6,
  },
  modalButtonSecondaryText: {
    color: "#606770",
    fontWeight: "600",
    fontSize: 14,
  },
  modalButtonPrimary: {
    backgroundColor: "#1877F2",
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 18,
  },
  modalButtonPrimaryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default MetaAdsScreen;
