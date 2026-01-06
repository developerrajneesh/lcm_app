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
import { useEffect, useState, useCallback, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
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
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import MetaConnectScreen from "../../Components/meta/ConnectMetaAccount";
import MetaCompaigns from "../../Components/meta/MetaCompaigns";
import AccountOverview from "../../Components/meta/AccountOverview";
import PlacesAutocomplete from "../../Components/PlacesAutocomplete";
import CustomSelect from "../../Components/CustomSelect";
import { API_BASE_URL } from "../../config/api";
import { useSubscription } from "../../hooks/useSubscription";
import { hasFeatureAccess, hasActiveSubscription } from "../../utils/subscription";
import UpgradeModal from "../../Components/UpgradeModal";
import NotificationBadge from "../../Components/NotificationBadge";
// WhatsApp Components
import WhatsAppCampaign from "../../Components/meta/WhatsApp/WhatsAppCampaign";
import WhatsAppAdSet from "../../Components/meta/WhatsApp/WhatsAppAdSet";
import WhatsAppAdCreative from "../../Components/meta/WhatsApp/WhatsAppAdCreative";
import WhatsAppLaunch from "../../Components/meta/WhatsApp/WhatsAppLaunch";
// Call Components
import CallCampaign from "../../Components/meta/Call/CallCampaign";
import CallAdSet from "../../Components/meta/Call/CallAdSet";
import CallAdCreative from "../../Components/meta/Call/CallAdCreative";
import CallLaunch from "../../Components/meta/Call/CallLaunch";
// Link Components
import LinkCampaign from "../../Components/meta/Link/LinkCampaign";
import LinkAdSet from "../../Components/meta/Link/LinkAdSet";
import LinkAdCreative from "../../Components/meta/Link/LinkAdCreative";
import LinkLaunch from "../../Components/meta/Link/LinkLaunch";

// Header Component
const Header = ({ userId }) => (
  <View style={styles.header}>
    <View style={styles.headerLeft}>
      <FontAwesome name="facebook-square" size={28} color="#1877F2" />
      <Text style={styles.headerTitle}>Meta Ads</Text>
    </View>
    {userId ? (
      <NotificationBadge userId={userId} iconSize={24} iconColor="#1C1E21" />
    ) : (
      <TouchableOpacity style={styles.notificationButton}>
        <Ionicons name="notifications-outline" size={24} color="#1C1E21" />
      </TouchableOpacity>
    )}
  </View>
);

// Tab Navigation Component
const TabNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "overview", label: "Overview" },
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
const SectionHeader = ({ title, step, totalSteps = 4 }) => (
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
  destinationType,
  setDestinationType,
  whatsappNumber,
  setWhatsappNumber,
  campaignType,
}) => {
  const campaignObjectivesV23 = [
    { id: "OUTCOME_AWARENESS", name: "Awareness", icon: "eye", category: "Awareness" },
    { id: "OUTCOME_TRAFFIC", name: "Traffic", icon: "globe", category: "Traffic" },
    { id: "OUTCOME_ENGAGEMENT", name: "Engagement", icon: "thumb-up", category: "Engagement" },
    { id: "OUTCOME_LEADS", name: "Leads", icon: "clipboard-text", category: "Leads" },
    { id: "OUTCOME_SALES", name: "Sales", icon: "cash", category: "Sales" },
    { id: "OUTCOME_APP_PROMOTION", name: "App Promotion", icon: "download", category: "App" },
  ];
  
  // Set default objective based on campaign type
  useEffect(() => {
    if (campaignType === "whatsapp") {
      setObjective("OUTCOME_ENGAGEMENT");
    } else if (campaignType === "call") {
      setObjective("OUTCOME_TRAFFIC");
    } else if (campaignType === "link") {
      setObjective("OUTCOME_TRAFFIC");
    } else if (campaignType === "lead-form") {
      setObjective("OUTCOME_LEADS");
    }
  }, [campaignType, setObjective]);
  
  const objectives = campaignObjectivesV23;

  const destinationTypes = [
    { value: "", label: "Select destination type" },
    { value: "WEBSITE", label: "Website" },
    { value: "WHATSAPP", label: "WhatsApp" },
    { value: "MESSAGING_APPS", label: "Messaging Apps" },
    { value: "PHONE_CALL", label: "Phone Call" },
    { value: "INSTAGRAM_PROFILE", label: "Instagram Profile" },
    { value: "FACEBOOK_PAGE", label: "Facebook Page" },
    { value: "ON_AD", label: "On Ad" },
    { value: "INSTANT_FORM", label: "Instant Form" },
    { value: "CALLS", label: "Calls" },
    { value: "APP_STORE", label: "App Store" },
    { value: "APP_DEEP_LINK", label: "App Deep Link" },
    { value: "APP", label: "App" },
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
        <Text style={styles.inputLabel}>Objective</Text>
        {campaignType === "whatsapp" ? (
          // WhatsApp: Fixed objective (OUTCOME_ENGAGEMENT)
          <View style={[styles.objectiveButton, styles.selectedObjective, { backgroundColor: "#9333EA" }]}>
            <MaterialCommunityIcons name="thumb-up" size={20} color="#fff" />
            <Text style={[styles.objectiveText, styles.selectedObjectiveText]}>
              Engagement (OUTCOME_ENGAGEMENT)
            </Text>
          </View>
        ) : (
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
        )}
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

// AdSet Details Component
const AdSetDetails = ({
  adSetName,
  setAdSetName,
  budget,
  setBudget,
  pageId,
  setPageId,
  pages,
  loadingPages,
  optimizationGoal,
  setOptimizationGoal,
  allowedOptimizationGoals,
  optimizationGoalNames,
  campaignObjectiveNames,
  campaignObjective,
  objective,
  destinationType,
  setDestinationType,
  whatsappNumber,
  setWhatsappNumber,
  bidStrategy,
  setBidStrategy,
  bidAmount,
  setBidAmount,
  bidConstraints,
  setBidConstraints,
  appId,
  setAppId,
  objectStoreUrl,
  setObjectStoreUrl,
  pixelId,
  setPixelId,
  conversionEvent,
  setConversionEvent,
  targeting,
  setTargeting,
  customLocations,
  setCustomLocations,
  selectedPlace,
  setSelectedPlace,
  handlePlaceSelect,
  publisherPlatforms,
  setPublisherPlatforms,
  facebookPositions,
  setFacebookPositions,
  instagramPositions,
  setInstagramPositions,
  devicePlatforms,
  setDevicePlatforms,
  genders,
  setGenders,
  campaignType, // Add campaignType prop
}) => {
  // Get destination types based on campaign objective
  const getDestinationTypes = () => {
    const activeObjective = campaignObjective || objective;
    
    // For OUTCOME_ENGAGEMENT, only show WEBSITE, PHONE_CALL, and WHATSAPP
    if (activeObjective === "OUTCOME_ENGAGEMENT") {
      return [
        { value: "", label: "Select destination type" },
        { value: "WEBSITE", label: "Website" },
        { value: "PHONE_CALL", label: "Phone Call" },
        { value: "WHATSAPP", label: "WhatsApp" },
      ];
    }
    
    // For other objectives, show all destination types
    return [
      { value: "", label: "Select destination type" },
      { value: "WEBSITE", label: "Website" },
      { value: "WHATSAPP", label: "WhatsApp" },
      { value: "MESSAGING_APPS", label: "Messaging Apps" },
      { value: "PHONE_CALL", label: "Phone Call" },
      { value: "INSTAGRAM_PROFILE", label: "Instagram Profile" },
      { value: "FACEBOOK_PAGE", label: "Facebook Page" },
      { value: "ON_AD", label: "On Ad" },
      { value: "INSTANT_FORM", label: "Instant Form" },
      { value: "CALLS", label: "Calls" },
      { value: "APP_STORE", label: "App Store" },
      { value: "APP_DEEP_LINK", label: "App Deep Link" },
      { value: "APP", label: "App" },
    ];
  };

  const destinationTypes = getDestinationTypes();

  const bidStrategies = [
    { value: "LOWEST_COST_WITHOUT_CAP", label: "Lowest Cost" },
    { value: "LOWEST_COST_WITH_BID_CAP", label: "Lowest Cost with Bid Cap" },
    { value: "COST_CAP", label: "Cost Cap" },
    { value: "LOWEST_COST_WITH_MIN_ROAS", label: "ROAS Goal" },
  ];

  const conversionEvents = [
    { value: "PURCHASE", label: "Purchase" },
    { value: "ADD_TO_CART", label: "Add to Cart" },
    { value: "INITIATE_CHECKOUT", label: "Initiate Checkout" },
    { value: "LEAD", label: "Lead" },
    { value: "COMPLETE_REGISTRATION", label: "Complete Registration" },
    { value: "CONTACT", label: "Contact" },
    { value: "FIND_LOCATION", label: "Find Location" },
    { value: "SCHEDULE", label: "Schedule" },
    { value: "SEARCH", label: "Search" },
    { value: "SIGN_UP", label: "Sign Up" },
    { value: "SUBMIT_APPLICATION", label: "Submit Application" },
    { value: "SUBSCRIBE", label: "Subscribe" },
    { value: "VIEW_CONTENT", label: "View Content" },
  ];

  // WhatsApp campaigns: Simplified form matching web version
  if (campaignType === "whatsapp") {
    const countries = [
      { code: "US", name: "United States", flag: "🇺🇸" },
      { code: "CA", name: "Canada", flag: "🇨🇦" },
      { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
      { code: "AU", name: "Australia", flag: "🇦🇺" },
      { code: "IN", name: "India", flag: "🇮🇳" },
      { code: "DE", name: "Germany", flag: "🇩🇪" },
    ];

    const handleCountryToggle = (countryCode) => {
      const currentCountries = targeting.geo_locations?.countries || [];
      const index = currentCountries.indexOf(countryCode);
      let newCountries;
      if (index > -1) {
        newCountries = currentCountries.filter(c => c !== countryCode);
      } else {
        newCountries = [...currentCountries, countryCode];
      }
      setTargeting({
        ...targeting,
        geo_locations: {
          ...targeting.geo_locations,
          countries: newCountries,
        },
      });
    };

    return (
      <View style={styles.section}>
        <SectionHeader title="Step 2: Create AdSet - WhatsApp Campaign" step={2} totalSteps={4} />

        {/* AdSet Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Ad Set Name <Text style={{ color: "#FF0000" }}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Enter ad set name"
            value={adSetName}
            onChangeText={setAdSetName}
          />
        </View>

        {/* Page ID and Daily Budget in a row */}
        <View style={{ flexDirection: "row", gap: 15 }}>
          <View style={[styles.inputContainer, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Page ID <Text style={{ color: "#FF0000" }}>*</Text></Text>
            {loadingPages ? (
              <View style={[styles.input, { backgroundColor: "#F5F5F5" }]}>
                <Text style={{ color: "#999" }}>Loading pages...</Text>
              </View>
            ) : pages.length > 0 ? (
              <CustomSelect
                label=""
                data={pages && Array.isArray(pages) && pages.length > 0 ? pages : []}
                onSelect={(selectedItem) => {
                  setPageId(selectedItem.id);
                }}
                placeholder="Select a Facebook Page"
                buttonTextAfterSelection={(selectedItem) => {
                  return `${selectedItem.name} (${selectedItem.id})`;
                }}
                rowTextForSelection={(item) => {
                  return `${item.name} (${item.id})`;
                }}
                defaultValue={pages && Array.isArray(pages) ? pages.find((p) => p.id === pageId) : null}
                disabled={!pages || !Array.isArray(pages) || pages.length === 0}
                buttonStyle={{ height: 48, backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, borderColor: "#D8DEE6", paddingHorizontal: 14 }}
                buttonTextStyle={{ fontSize: 16, color: !pageId ? "#8B9DC3" : "#1C1E21", textAlign: "left" }}
                hint={
                  (!pages || !Array.isArray(pages) || pages.length === 0)
                    ? "No pages found. Make sure your Facebook account has pages."
                    : undefined
                }
              />
            ) : (
              <TextInput
                style={styles.input}
                placeholder="Enter Facebook Page ID"
                value={pageId}
                onChangeText={setPageId}
              />
            )}
          </View>
          <View style={[styles.inputContainer, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Daily Budget <Text style={{ color: "#FF0000" }}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Enter daily budget"
              keyboardType="numeric"
              value={budget}
              onChangeText={setBudget}
            />
          </View>
        </View>

        {/* Targeting Section */}
        <View style={{ marginTop: 20, borderTopWidth: 1, borderTopColor: "#E4E6EB", paddingTop: 20 }}>
          <Text style={[styles.inputLabel, { fontSize: 18, marginBottom: 15 }]}>Targeting</Text>

          {/* Google Places Autocomplete */}
          <View style={[styles.inputContainer, { backgroundColor: "#E3F2FD", padding: 15, borderRadius: 8, marginBottom: 15 }]}>
            <Text style={styles.inputLabel}>Search Location *</Text>
            <Text style={[styles.inputHint, { marginBottom: 10 }]}>
              Search for a location using Google Places. You can add multiple locations - each will be automatically added to custom_locations for targeting.
            </Text>
            <PlacesAutocomplete
              value=""
              onChange={() => {}}
              onPlaceSelect={handlePlaceSelect}
              placeholder="Search for a location (e.g., city, address, landmark)"
            />
          </View>

          {/* Display Selected Place Preview */}
          {selectedPlace && (
            <View style={[styles.inputContainer, { backgroundColor: "#E8F5E9", padding: 12, borderRadius: 8, marginBottom: 15 }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <Text style={[styles.inputLabel, { fontSize: 14 }]}>Preview:</Text>
                <TouchableOpacity onPress={() => setSelectedPlace(null)}>
                  <MaterialCommunityIcons name="close" size={20} color="#606770" />
                </TouchableOpacity>
              </View>
              {selectedPlace.name && (
                <Text style={styles.inputHint}><Text style={{ fontWeight: "600" }}>Name:</Text> {selectedPlace.name}</Text>
              )}
              {selectedPlace.address && (
                <Text style={styles.inputHint}><Text style={{ fontWeight: "600" }}>Address:</Text> {selectedPlace.address}</Text>
              )}
              {selectedPlace.location && (
                <Text style={[styles.inputHint, { fontSize: 11 }]}>
                  <Text style={{ fontWeight: "600" }}>Coordinates:</Text> {selectedPlace.location.lat.toFixed(6)}, {selectedPlace.location.lng.toFixed(6)}
                </Text>
              )}
            </View>
          )}

          {/* Display All Custom Locations */}
          {customLocations.length > 0 && (
            <View style={[styles.inputContainer, { backgroundColor: "#E3F2FD", padding: 15, borderRadius: 8, marginBottom: 15 }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text style={[styles.inputLabel, { fontSize: 14 }]}>Custom Locations ({customLocations.length})</Text>
                <TouchableOpacity onPress={() => { setCustomLocations([]); setSelectedPlace(null); }}>
                  <Text style={{ color: "#E53935", fontSize: 12, fontWeight: "600" }}>Clear All</Text>
                </TouchableOpacity>
              </View>
              {customLocations.map((loc, idx) => (
                <View key={idx} style={{ backgroundColor: "#fff", padding: 12, borderRadius: 8, marginBottom: 10 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <View style={{ flex: 1 }}>
                      {loc.name && <Text style={[styles.inputLabel, { fontSize: 13, marginBottom: 4 }]}>{loc.name}</Text>}
                      {loc.address && <Text style={[styles.inputHint, { fontSize: 11, marginBottom: 4 }]}>{loc.address}</Text>}
                      <Text style={[styles.inputHint, { fontSize: 10, fontFamily: "monospace" }]}>
                        Lat: {loc.latitude.toFixed(6)}, Lng: {loc.longitude.toFixed(6)}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setCustomLocations(customLocations.filter((_, i) => i !== idx))}>
                      <MaterialCommunityIcons name="close" size={18} color="#606770" />
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={[styles.inputHint, { fontSize: 12 }]}>Radius:</Text>
                    <TextInput
                      style={[styles.input, { width: 60, paddingVertical: 6, paddingHorizontal: 8, fontSize: 12 }]}
                      value={loc.radius.toString()}
                      onChangeText={(text) => {
                        const newLocations = [...customLocations];
                        const newRadius = parseInt(text);
                        if (!isNaN(newRadius)) {
                          if (newRadius < 2) newLocations[idx].radius = 2;
                          else if (newRadius > 17) newLocations[idx].radius = 17;
                          else newLocations[idx].radius = newRadius;
                        } else {
                          newLocations[idx].radius = 5;
                        }
                        setCustomLocations(newLocations);
                      }}
                      keyboardType="numeric"
                    />
                    <Text style={[styles.inputHint, { fontSize: 12 }]}>km</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Age Range */}
          <View style={{ flexDirection: "row", gap: 15 }}>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Min Age <Text style={{ color: "#FF0000" }}>*</Text></Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={targeting.ageMin?.toString() || "18"}
                onChangeText={(text) => setTargeting({ ...targeting, ageMin: parseInt(text) || 18 })}
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Max Age <Text style={{ color: "#FF0000" }}>*</Text></Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={targeting.ageMax?.toString() || "45"}
                onChangeText={(text) => setTargeting({ ...targeting, ageMax: parseInt(text) || 45 })}
              />
            </View>
          </View>

          {/* Genders (Optional) */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Genders (Optional)</Text>
            <View style={{ flexDirection: "row", gap: 15, marginTop: 8 }}>
              {[
                { value: 1, label: "Male" },
                { value: 2, label: "Female" },
              ].map((gender) => (
                <TouchableOpacity
                  key={gender.value}
                  style={[
                    styles.checkboxContainer,
                    genders.includes(gender.value) && styles.checkboxContainerSelected,
                  ]}
                  onPress={() => {
                    if (genders.includes(gender.value)) {
                      setGenders(genders.filter(g => g !== gender.value));
                    } else {
                      setGenders([...genders, gender.value]);
                    }
                  }}
                >
                  <View style={[
                    styles.checkbox,
                    genders.includes(gender.value) && styles.checkboxSelected,
                  ]}>
                    {genders.includes(gender.value) && (
                      <MaterialCommunityIcons name="check" size={16} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>{gender.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.inputHint}>Leave empty to target all genders</Text>
          </View>

          {/* Countries */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Countries <Text style={{ color: "#FF0000" }}>*</Text></Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
              {countries.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  onPress={() => handleCountryToggle(country.code)}
                  style={[
                    {
                      padding: 12,
                      borderRadius: 8,
                      borderWidth: 2,
                      minWidth: 100,
                      alignItems: "center",
                    },
                    (targeting.geo_locations?.countries || []).includes(country.code)
                      ? { borderColor: "#9333EA", backgroundColor: "#F3E8FF" }
                      : { borderColor: "#D8DEE6", backgroundColor: "#fff" },
                  ]}
                >
                  <Text style={{ fontSize: 20, marginBottom: 4 }}>{country.flag}</Text>
                  <Text style={{ fontSize: 12, fontWeight: "500" }}>{country.name}</Text>
                  {(targeting.geo_locations?.countries || []).includes(country.code) && (
                    <MaterialCommunityIcons name="check" size={16} color="#9333EA" style={{ marginTop: 4 }} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Publisher Platforms */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Publisher Platforms <Text style={{ color: "#FF0000" }}>*</Text></Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
              {[
                { value: "facebook", label: "Facebook", icon: "facebook" },
                { value: "instagram", label: "Instagram", icon: "instagram" },
                { value: "messenger", label: "Messenger", icon: "facebook-messenger" },
                { value: "audience_network", label: "Audience Network", icon: "web" },
              ].map((publisher) => (
                <TouchableOpacity
                  key={publisher.value}
                  onPress={() => {
                    if (publisherPlatforms.includes(publisher.value)) {
                      setPublisherPlatforms(publisherPlatforms.filter(p => p !== publisher.value));
                    } else {
                      setPublisherPlatforms([...publisherPlatforms, publisher.value]);
                    }
                  }}
                  style={[
                    {
                      padding: 12,
                      borderRadius: 8,
                      borderWidth: 2,
                      minWidth: 100,
                      alignItems: "center",
                      flexDirection: "row",
                      gap: 8,
                    },
                    publisherPlatforms.includes(publisher.value)
                      ? { borderColor: "#9333EA", backgroundColor: "#F3E8FF" }
                      : { borderColor: "#D8DEE6", backgroundColor: "#fff" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={publisher.icon}
                    size={20}
                    color={publisherPlatforms.includes(publisher.value) ? "#9333EA" : "#606770"}
                  />
                  <Text style={{ fontSize: 12, fontWeight: "500" }}>{publisher.label}</Text>
                  {publisherPlatforms.includes(publisher.value) && (
                    <MaterialCommunityIcons name="check" size={16} color="#9333EA" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Facebook Positions (Optional) */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Facebook Positions (Optional)</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
              {[
                { value: "feed", label: "Feed" },
                { value: "instant_article", label: "Instant Article" },
              ].map((position) => (
                <TouchableOpacity
                  key={position.value}
                  onPress={() => {
                    if (facebookPositions.includes(position.value)) {
                      setFacebookPositions(facebookPositions.filter(p => p !== position.value));
                    } else {
                      setFacebookPositions([...facebookPositions, position.value]);
                    }
                  }}
                  style={[
                    {
                      padding: 12,
                      borderRadius: 8,
                      borderWidth: 2,
                      minWidth: 100,
                      alignItems: "center",
                    },
                    facebookPositions.includes(position.value)
                      ? { borderColor: "#9333EA", backgroundColor: "#F3E8FF" }
                      : { borderColor: "#D8DEE6", backgroundColor: "#fff" },
                  ]}
                >
                  <Text style={{ fontSize: 12, fontWeight: "500" }}>{position.label}</Text>
                  {facebookPositions.includes(position.value) && (
                    <MaterialCommunityIcons name="check" size={16} color="#9333EA" style={{ marginTop: 4 }} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.inputHint}>Leave empty to use all positions</Text>
          </View>

          {/* Instagram Positions (Optional) */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Instagram Positions (Optional)</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
              {[
                { value: "stream", label: "Feed" },
                { value: "reels", label: "Reels" },
                { value: "story", label: "Story" },
                { value: "explore", label: "Explore" },
              ].map((position) => (
                <TouchableOpacity
                  key={position.value}
                  onPress={() => {
                    let newPositions = [...instagramPositions];
                    const index = newPositions.indexOf(position.value);
                    if (index > -1) {
                      newPositions.splice(index, 1);
                      // If removing stream and explore is still selected, remove explore too
                      if (position.value === 'stream' && newPositions.includes('explore')) {
                        const exploreIndex = newPositions.indexOf('explore');
                        if (exploreIndex > -1) {
                          newPositions.splice(exploreIndex, 1);
                        }
                      }
                    } else {
                      newPositions.push(position.value);
                      // If selecting explore, automatically add stream (feed) as it's required
                      if (position.value === 'explore' && !newPositions.includes('stream')) {
                        newPositions.push('stream');
                      }
                    }
                    setInstagramPositions(newPositions);
                  }}
                  style={[
                    {
                      padding: 12,
                      borderRadius: 8,
                      borderWidth: 2,
                      minWidth: 100,
                      alignItems: "center",
                    },
                    instagramPositions.includes(position.value)
                      ? { borderColor: "#9333EA", backgroundColor: "#F3E8FF" }
                      : { borderColor: "#D8DEE6", backgroundColor: "#fff" },
                  ]}
                >
                  <Text style={{ fontSize: 12, fontWeight: "500" }}>{position.label}</Text>
                  {instagramPositions.includes(position.value) && (
                    <MaterialCommunityIcons name="check" size={16} color="#9333EA" style={{ marginTop: 4 }} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.inputHint}>Leave empty to use all positions</Text>
          </View>

          {/* Device Platforms (Optional) */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Device Platforms (Optional)</Text>
            <View style={{ flexDirection: "row", gap: 15, marginTop: 8 }}>
              {[
                { value: "mobile", label: "Mobile" },
                { value: "desktop", label: "Desktop" },
              ].map((device) => (
                <TouchableOpacity
                  key={device.value}
                  style={[
                    styles.checkboxContainer,
                    devicePlatforms.includes(device.value) && styles.checkboxContainerSelected,
                  ]}
                  onPress={() => {
                    if (devicePlatforms.includes(device.value)) {
                      setDevicePlatforms(devicePlatforms.filter(d => d !== device.value));
                    } else {
                      setDevicePlatforms([...devicePlatforms, device.value]);
                    }
                  }}
                >
                  <View style={[
                    styles.checkbox,
                    devicePlatforms.includes(device.value) && styles.checkboxSelected,
                  ]}>
                    {devicePlatforms.includes(device.value) && (
                      <MaterialCommunityIcons name="check" size={16} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>{device.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.inputHint}>Leave empty to target all devices</Text>
          </View>
        </View>
      </View>
    );
  }

  // Default AdSet form for other campaign types (Call, Link, etc.)
  return (
    <View style={styles.section}>
      <SectionHeader title="Step 2: Create AdSet" step={2} />

      {/* AdSet Name */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>AdSet Name *</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="e.g., My_AdSet_Gonda_UP"
            value={adSetName}
            onChangeText={setAdSetName}
          />
        </View>
      </View>

      {/* Facebook Page Selection - Hide for OUTCOME_ENGAGEMENT campaigns */}
      {(campaignObjective || objective) !== "OUTCOME_ENGAGEMENT" && (
        <>
          {loadingPages ? (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Facebook Page *</Text>
              <View style={styles.inputWrapper}>
                <ActivityIndicator size="small" color="#1877F2" />
                <Text style={[styles.input, { marginLeft: 10 }]}>Loading pages...</Text>
              </View>
            </View>
          ) : (
            <CustomSelect
              label="Facebook Page *"
              data={pages && Array.isArray(pages) && pages.length > 0 ? pages : []}
              onSelect={(selectedItem) => {
                setPageId(selectedItem.id);
              }}
              placeholder="Select Facebook Page"
              buttonTextAfterSelection={(selectedItem) => {
                return `${selectedItem.name} (${selectedItem.id})`;
              }}
              rowTextForSelection={(item) => {
                return `${item.name} (${item.id})`;
              }}
              defaultValue={pages && Array.isArray(pages) ? pages.find((p) => p.id === pageId) : null}
              disabled={!pages || !Array.isArray(pages) || pages.length === 0}
              buttonStyle={{ height: 48, backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, borderColor: "#D8DEE6", paddingHorizontal: 14 }}
              buttonTextStyle={{ fontSize: 16, color: !pageId ? "#8B9DC3" : "#1C1E21", textAlign: "left" }}
              hint={
                (!pages || !Array.isArray(pages) || pages.length === 0)
                  ? "No pages found. Make sure your Facebook account has pages."
                  : undefined
              }
            />
          )}
        </>
      )}

      {/* Optimization Goal */}
      <CustomSelect
        label={
          "Optimization Goal *" +
          (allowedOptimizationGoals.length > 0 && (campaignObjective || objective)
            ? ` (Based on: ${campaignObjectiveNames[campaignObjective || objective] || campaignObjective || objective})`
            : "")
        }
        data={
          allowedOptimizationGoals.length > 0
            ? allowedOptimizationGoals
            : Object.keys(optimizationGoalNames)
        }
        onSelect={(selectedItem) => {
          setOptimizationGoal(selectedItem);
        }}
        placeholder="Select Optimization Goal"
        buttonTextAfterSelection={(selectedItem) => {
          return optimizationGoalNames[selectedItem] || selectedItem;
        }}
        rowTextForSelection={(item) => {
          return optimizationGoalNames[item] || item;
        }}
        defaultValue={optimizationGoal}
      />

      {/* Destination Type - Hide for OUTCOME_LEADS and OUTCOME_AWARENESS campaigns */}
      {(campaignObjective || objective) !== "OUTCOME_LEADS" && (campaignObjective || objective) !== "OUTCOME_AWARENESS" && (
        <CustomSelect
          label="Destination Type *"
          data={destinationTypes.filter((type) => type.value !== "")}
          onSelect={(selectedItem) => {
            setDestinationType(selectedItem.value);
          }}
          placeholder="Select destination type"
          buttonTextAfterSelection={(selectedItem) => {
            return selectedItem.label;
          }}
          rowTextForSelection={(item) => {
            return item.label;
          }}
          defaultValue={destinationTypes.find((t) => t.value === destinationType)}
          buttonStyle={{ height: 48, backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, borderColor: "#D8DEE6", paddingHorizontal: 14 }}
          buttonTextStyle={{ fontSize: 16, color: !destinationType ? "#8B9DC3" : "#1C1E21", textAlign: "left" }}
          hint="Select where you want to send people when they click your ad"
        />
      )}

      {/* Show read-only destination type for OUTCOME_LEADS campaigns */}
      {(campaignObjective || objective) === "OUTCOME_LEADS" && (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Destination Type *</Text>
          <View style={[styles.inputWrapper, { backgroundColor: "#F5F5F5" }]}>
            <Text style={[styles.input, { color: "#666" }]}>Lead Form (Automatically set for Leads campaigns)</Text>
          </View>
        </View>
      )}

      {/* WhatsApp Number - Show when destination type is WHATSAPP */}
      {destinationType === "WHATSAPP" && (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>
            WhatsApp Number * <Text style={styles.requiredText}>(Required)</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="e.g., +1234567890"
              keyboardType="phone-pad"
              value={whatsappNumber}
              onChangeText={setWhatsappNumber}
            />
          </View>
          <Text style={styles.inputHint}>
            Enter your WhatsApp Business number in international format (e.g., +1234567890)
          </Text>
        </View>
      )}

      {/* Promoted Object - Show for APP_INSTALLS and APP_ENGAGEMENT */}
      {(optimizationGoal === "APP_INSTALLS" || optimizationGoal === "APP_ENGAGEMENT") && (
        <View style={[styles.section, { marginTop: 20, padding: 15, backgroundColor: "#E3F2FD", borderRadius: 8 }]}>
          <Text style={[styles.inputLabel, { marginBottom: 10 }]}>
            App Information (Required for App Optimization Goals)
          </Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              App ID (Facebook Application ID) * <Text style={styles.requiredText}>(Required)</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="e.g., 123456789"
                value={appId}
                onChangeText={setAppId}
              />
            </View>
            <Text style={styles.inputHint}>
              Your app's Facebook App ID (application_id). This must match the app in the App Store URL.
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              App Store URL * <Text style={styles.requiredText}>(Required)</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="e.g., https://apps.apple.com/app/id123456789"
                value={objectStoreUrl}
                onChangeText={setObjectStoreUrl}
                keyboardType="url"
              />
            </View>
            <Text style={styles.inputHint}>
              Apple App Store or Google Play Store URL. Must match the App ID provided above.
            </Text>
          </View>
        </View>
      )}

      {/* Conversion Tracking - Show for OFFSITE_CONVERSIONS */}
      {optimizationGoal === "OFFSITE_CONVERSIONS" && (
        <View style={[styles.section, { marginTop: 20, padding: 15, backgroundColor: "#E3F2FD", borderRadius: 8 }]}>
          <Text style={[styles.inputLabel, { marginBottom: 10 }]}>
            Conversion Tracking (Required for Offsite Conversions)
          </Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Facebook Pixel ID * <Text style={styles.requiredText}>(Required)</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="e.g., 123456789012345"
                value={pixelId}
                onChangeText={setPixelId}
              />
            </View>
            <Text style={styles.inputHint}>
              Your Facebook Pixel ID (found in Events Manager)
            </Text>
          </View>

          <CustomSelect
            label="Conversion Event * (Required)"
            data={conversionEvents}
            onSelect={(selectedItem) => {
              setConversionEvent(selectedItem.value);
            }}
            placeholder="Select Conversion Event"
            buttonTextAfterSelection={(selectedItem) => {
              return selectedItem.label;
            }}
            rowTextForSelection={(item) => {
              return item.label;
            }}
            defaultValue={conversionEvents.find((e) => e.value === conversionEvent)}
            buttonStyle={{ height: 48, backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, borderColor: "#D8DEE6", paddingHorizontal: 14 }}
            buttonTextStyle={{ fontSize: 16, color: "#1C1E21", textAlign: "left" }}
            hint="The conversion event you want to optimize for"
          />
        </View>
      )}

      {/* Bid Strategy */}
      <CustomSelect
        label="Bid Strategy *"
        data={bidStrategies}
        onSelect={(selectedItem) => {
          setBidStrategy(selectedItem.value);
          // Reset related fields when strategy changes
          if (selectedItem.value === "LOWEST_COST_WITHOUT_CAP") {
            setBidAmount("");
            setBidConstraints({ roas_average_floor: "" });
          }
          // Warn if COST_CAP is selected with incompatible optimization goal
          const engagementGoals = ["CONVERSATIONS", "POST_ENGAGEMENT", "PAGE_LIKES", "EVENT_RESPONSES", "THRUPLAY"];
          if (selectedItem.value === "COST_CAP" && engagementGoals.includes(optimizationGoal)) {
            Alert.alert(
              "Incompatible Selection",
              `COST_CAP bid strategy is not compatible with ${optimizationGoal} optimization goal. Please select a different optimization goal (e.g., LINK_CLICKS, LANDING_PAGE_VIEWS, OFFSITE_CONVERSIONS) or use a different bid strategy.`,
              [{ text: "OK" }]
            );
          }
        }}
        placeholder="Select Bid Strategy"
        buttonTextAfterSelection={(selectedItem) => {
          return selectedItem.label;
        }}
        rowTextForSelection={(item) => {
          return item.label;
        }}
        defaultValue={bidStrategies.find((s) => s.value === bidStrategy)}
      />
      {/* Warning for incompatible COST_CAP */}
      {bidStrategy === "COST_CAP" && ["CONVERSATIONS", "POST_ENGAGEMENT", "PAGE_LIKES", "EVENT_RESPONSES", "THRUPLAY"].includes(optimizationGoal) && (
        <View style={[styles.inputContainer, { backgroundColor: "#FFF3CD", padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#FFC107" }]}>
          <Text style={[styles.inputLabel, { color: "#856404" }]}>
            ⚠️ Warning: COST_CAP is not compatible with {optimizationGoal} optimization goal. Please select a different optimization goal or bid strategy.
          </Text>
        </View>
      )}

      {/* Bid Amount - Show for LOWEST_COST_WITH_BID_CAP and COST_CAP */}
      {(bidStrategy === "LOWEST_COST_WITH_BID_CAP" || bidStrategy === "COST_CAP") && (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>
            Bid Amount * <Text style={styles.requiredText}>(Required)</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="e.g., 100"
              keyboardType="numeric"
              value={bidAmount}
              onChangeText={setBidAmount}
            />
          </View>
        </View>
      )}

      {/* Bid Constraints - Show for LOWEST_COST_WITH_MIN_ROAS */}
      {bidStrategy === "LOWEST_COST_WITH_MIN_ROAS" && (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>
            ROAS Average Floor * <Text style={styles.requiredText}>(Required)</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="e.g., 2.5"
              keyboardType="numeric"
              value={bidConstraints.roas_average_floor}
              onChangeText={(text) => setBidConstraints({ roas_average_floor: text })}
            />
          </View>
        </View>
      )}

      {/* Daily Budget */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Daily Budget (₹) *</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="e.g., 500 (minimum ₹225.00)"
            keyboardType="numeric"
            value={budget}
            onChangeText={setBudget}
          />
        </View>
        <Text style={styles.inputHint}>Minimum: ₹225.00 per day</Text>
      </View>

      {/* Targeting Section */}
      <View style={[styles.section, { marginTop: 20, borderTopWidth: 1, borderTopColor: "#E4E6EB", paddingTop: 20 }]}>
        <Text style={[styles.inputLabel, { fontSize: 18, marginBottom: 15 }]}>Targeting</Text>
        
        {/* Google Places Autocomplete - Location Search */}
        <View style={[styles.inputContainer, { backgroundColor: "#E3F2FD", padding: 15, borderRadius: 8, marginBottom: 15 }]}>
          <Text style={styles.inputLabel}>Search Location *</Text>
          <Text style={[styles.inputHint, { marginBottom: 10 }]}>
            Search for a location using Google Places. You can add multiple locations - each will be automatically added to custom_locations for targeting.
          </Text>
          <PlacesAutocomplete
            value=""
            onChange={() => {}}
            onPlaceSelect={handlePlaceSelect}
            placeholder="Search for a location (e.g., city, address, landmark)"
          />
        </View>
        
        {/* Display Selected Place Details (temporary preview) */}
        {selectedPlace && (
          <View style={[styles.inputContainer, { backgroundColor: "#E8F5E9", padding: 12, borderRadius: 8, marginBottom: 15 }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <Text style={[styles.inputLabel, { fontSize: 14 }]}>Preview:</Text>
              <TouchableOpacity onPress={() => setSelectedPlace(null)}>
                <MaterialCommunityIcons name="close" size={20} color="#606770" />
              </TouchableOpacity>
            </View>
            {selectedPlace.name && (
              <Text style={styles.inputHint}><Text style={{ fontWeight: "600" }}>Name:</Text> {selectedPlace.name}</Text>
            )}
            {selectedPlace.address && (
              <Text style={styles.inputHint}><Text style={{ fontWeight: "600" }}>Address:</Text> {selectedPlace.address}</Text>
            )}
            {selectedPlace.location && (
              <Text style={[styles.inputHint, { fontSize: 11 }]}>
                <Text style={{ fontWeight: "600" }}>Coordinates:</Text> {selectedPlace.location.lat.toFixed(6)}, {selectedPlace.location.lng.toFixed(6)}
              </Text>
            )}
          </View>
        )}

        {/* Display All Custom Locations */}
        {customLocations.length > 0 && (
          <View style={[styles.inputContainer, { backgroundColor: "#E3F2FD", padding: 15, borderRadius: 8, marginBottom: 15 }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={[styles.inputLabel, { fontSize: 14 }]}>
                Custom Locations ({customLocations.length})
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setCustomLocations([]);
                  setSelectedPlace(null);
                }}
              >
                <Text style={{ color: "#E53935", fontSize: 12, fontWeight: "600" }}>Clear All</Text>
              </TouchableOpacity>
            </View>
            {customLocations.map((loc, idx) => (
              <View key={idx} style={{ backgroundColor: "#fff", padding: 12, borderRadius: 8, marginBottom: 10 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    {loc.name && (
                      <Text style={[styles.inputLabel, { fontSize: 13, marginBottom: 4 }]}>{loc.name}</Text>
                    )}
                    {loc.address && (
                      <Text style={[styles.inputHint, { fontSize: 11, marginBottom: 4 }]}>{loc.address}</Text>
                    )}
                    <Text style={[styles.inputHint, { fontSize: 10, fontFamily: "monospace" }]}>
                      Lat: {loc.latitude.toFixed(6)}, Lng: {loc.longitude.toFixed(6)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setCustomLocations(customLocations.filter((_, i) => i !== idx));
                    }}
                  >
                    <MaterialCommunityIcons name="close" size={18} color="#606770" />
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={[styles.inputHint, { fontSize: 12 }]}>Radius:</Text>
                  <TextInput
                    style={[styles.input, { width: 60, paddingVertical: 6, paddingHorizontal: 8, fontSize: 12 }]}
                    value={loc.radius.toString()}
                    onChangeText={(text) => {
                      const newLocations = [...customLocations];
                      const newRadius = parseInt(text);
                      if (!isNaN(newRadius)) {
                        if (newRadius < 2) {
                          newLocations[idx].radius = 2;
                        } else if (newRadius > 17) {
                          newLocations[idx].radius = 17;
                        } else {
                          newLocations[idx].radius = newRadius;
                        }
                      } else {
                        newLocations[idx].radius = 5;
                      }
                      setCustomLocations(newLocations);
                    }}
                    keyboardType="numeric"
                  />
                  <Text style={[styles.inputHint, { fontSize: 12 }]}>km</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Age Range */}
        <View style={{ flexDirection: "row", gap: 15 }}>
          <View style={[styles.inputContainer, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Min Age *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={targeting.ageMin?.toString() || "18"}
                onChangeText={(text) => setTargeting({ ...targeting, ageMin: parseInt(text) || 18 })}
              />
            </View>
          </View>
          <View style={[styles.inputContainer, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Max Age *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={targeting.ageMax?.toString() || "45"}
                onChangeText={(text) => setTargeting({ ...targeting, ageMax: parseInt(text) || 45 })}
              />
            </View>
          </View>
        </View>

        {/* Genders (Optional) */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Genders (Optional)</Text>
          <View style={{ flexDirection: "row", gap: 15, marginTop: 8 }}>
            {[
              { value: 1, label: "Male" },
              { value: 2, label: "Female" },
            ].map((gender) => (
              <TouchableOpacity
                key={gender.value}
                style={[
                  styles.checkboxContainer,
                  genders.includes(gender.value) && styles.checkboxContainerSelected,
                ]}
                onPress={() => {
                  if (genders.includes(gender.value)) {
                    setGenders(genders.filter((g) => g !== gender.value));
                  } else {
                    setGenders([...genders, gender.value]);
                  }
                }}
              >
                <View style={[
                  styles.checkbox,
                  genders.includes(gender.value) && styles.checkboxSelected,
                ]}>
                  {genders.includes(gender.value) && (
                    <MaterialCommunityIcons name="check" size={16} color="#fff" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>{gender.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.inputHint}>Leave empty to target all genders</Text>
        </View>

        {/* Publisher Platforms */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Publisher Platforms *</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
            {[
              { value: "facebook", label: "Facebook" },
              { value: "instagram", label: "Instagram" },
              { value: "messenger", label: "Messenger" },
              { value: "audience_network", label: "Audience Network" },
            ].map((platform) => (
              <TouchableOpacity
                key={platform.value}
                style={[
                  styles.chip,
                  publisherPlatforms.includes(platform.value) && styles.chipSelected,
                ]}
                onPress={() => {
                  if (publisherPlatforms.includes(platform.value)) {
                    if (publisherPlatforms.length > 1) {
                      setPublisherPlatforms(publisherPlatforms.filter((p) => p !== platform.value));
                    }
                  } else {
                    setPublisherPlatforms([...publisherPlatforms, platform.value]);
                  }
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    publisherPlatforms.includes(platform.value) && styles.chipTextSelected,
                  ]}
                >
                  {platform.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Facebook Positions (Optional) */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Facebook Positions (Optional)</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
            {[
              { value: "feed", label: "Feed" },
              { value: "video_feeds", label: "Video Feeds" },
              { value: "right_column", label: "Right Column" },
              { value: "instant_article", label: "Instant Article" },
              { value: "instream_video", label: "Instream Video" },
              { value: "rewarded_video", label: "Rewarded Video" },
            ].map((position) => (
              <TouchableOpacity
                key={position.value}
                style={[
                  styles.checkboxContainer,
                  facebookPositions.includes(position.value) && styles.checkboxContainerSelected,
                ]}
                onPress={() => {
                  if (facebookPositions.includes(position.value)) {
                    setFacebookPositions(facebookPositions.filter((p) => p !== position.value));
                  } else {
                    setFacebookPositions([...facebookPositions, position.value]);
                  }
                }}
              >
                <View style={[
                  styles.checkbox,
                  facebookPositions.includes(position.value) && styles.checkboxSelected,
                ]}>
                  {facebookPositions.includes(position.value) && (
                    <MaterialCommunityIcons name="check" size={16} color="#fff" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>{position.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.inputHint}>Leave empty to use all positions</Text>
        </View>

        {/* Instagram Positions (Optional) */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Instagram Positions (Optional)</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
            {[
              { value: "stream", label: "Stream" },
              { value: "reels", label: "Reels" },
              { value: "story", label: "Story" },
              { value: "explore", label: "Explore" },
            ].map((position) => (
              <TouchableOpacity
                key={position.value}
                style={[
                  styles.checkboxContainer,
                  instagramPositions.includes(position.value) && styles.checkboxContainerSelected,
                ]}
                onPress={() => {
                  if (instagramPositions.includes(position.value)) {
                    setInstagramPositions(instagramPositions.filter((p) => p !== position.value));
                  } else {
                    setInstagramPositions([...instagramPositions, position.value]);
                  }
                }}
              >
                <View style={[
                  styles.checkbox,
                  instagramPositions.includes(position.value) && styles.checkboxSelected,
                ]}>
                  {instagramPositions.includes(position.value) && (
                    <MaterialCommunityIcons name="check" size={16} color="#fff" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>{position.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.inputHint}>Leave empty to use all positions</Text>
        </View>

        {/* Device Platforms (Optional) */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Device Platforms (Optional)</Text>
          <View style={{ flexDirection: "row", gap: 15, marginTop: 8 }}>
            {[
              { value: "mobile", label: "Mobile" },
              { value: "desktop", label: "Desktop" },
            ].map((device) => (
              <TouchableOpacity
                key={device.value}
                style={[
                  styles.checkboxContainer,
                  devicePlatforms.includes(device.value) && styles.checkboxContainerSelected,
                ]}
                onPress={() => {
                  if (devicePlatforms.includes(device.value)) {
                    setDevicePlatforms(devicePlatforms.filter((d) => d !== device.value));
                  } else {
                    setDevicePlatforms([...devicePlatforms, device.value]);
                  }
                }}
              >
                <View style={[
                  styles.checkbox,
                  devicePlatforms.includes(device.value) && styles.checkboxSelected,
                ]}>
                  {devicePlatforms.includes(device.value) && (
                    <MaterialCommunityIcons name="check" size={16} color="#fff" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>{device.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.inputHint}>Leave empty to target all devices</Text>
        </View>
      </View>
    </View>
  );
};

// Ad Creation Component (Step 3)
const AdCreationSection = ({
  adName,
  setAdName,
  callToActionType,
  setCallToActionType,
  allowedCTAs,
  ctaTypeNames,
  destinationUrl,
  setDestinationUrl,
  phoneNumber,
  setPhoneNumber,
  address,
  setAddress,
  pageId,
  setPageId,
  pages,
  loadingPages,
  adCreative,
  setAdCreative,
  imageHash,
  setImageHash,
  videoId,
  setVideoId,
  uploadingImage,
  uploadingVideo,
  handleImageUpload,
  handleVideoUpload,
  requiresVideo,
  adSetOptimizationGoal,
  optimizationGoal,
  optimizationGoalNames,
  adSetDestinationType,
  isCTAAutoSelected,
}) => {
  const isMessagingCTA = callToActionType === "WHATSAPP_MESSAGE" || 
                        callToActionType === "SEND_MESSAGE" || 
                        callToActionType === "MESSAGE_PAGE" || 
                        callToActionType === "MESSAGE_US";

  return (
    <View style={styles.section}>
      <SectionHeader title="Step 3: Create Ad" step={3} />
      
      {(adSetOptimizationGoal || optimizationGoal) && (
        <View style={{ marginBottom: 15, padding: 10, backgroundColor: "#E3F2FD", borderRadius: 8 }}>
          <Text style={[styles.inputLabel, { fontSize: 12 }]}>AdSet Optimization Goal:</Text>
          <Text style={[styles.inputHint, { fontWeight: "600", marginTop: 4 }]}>
            {optimizationGoalNames[adSetOptimizationGoal || optimizationGoal] || (adSetOptimizationGoal || optimizationGoal)}
          </Text>
        </View>
      )}

      {/* Ad Name */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Ad Name *</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="e.g., WhatsApp Creative"
            value={adName}
            onChangeText={setAdName}
          />
        </View>
      </View>

      {/* Call to Action Type */}
      <CustomSelect
        label={
          "Call to Action Type *" +
          (isCTAAutoSelected
            ? ` (Auto-selected based on destination type)`
            : allowedCTAs.length > 0
            ? ` (Based on: ${optimizationGoalNames[adSetOptimizationGoal || optimizationGoal] || (adSetOptimizationGoal || optimizationGoal)})`
            : "")
        }
        data={allowedCTAs.length > 0 ? allowedCTAs : Object.keys(ctaTypeNames)}
        onSelect={(selectedItem) => {
          setCallToActionType(selectedItem);
          // If user changes from auto-selected CTA, mark as no longer auto-selected
          if (isCTAAutoSelected) {
            setIsCTAAutoSelected(false);
          }
        }}
        placeholder="Select Call to Action Type"
        buttonTextAfterSelection={(selectedItem) => {
          return ctaTypeNames[selectedItem] || selectedItem;
        }}
        rowTextForSelection={(item) => {
          return ctaTypeNames[item] || item;
        }}
        defaultValue={callToActionType}
        buttonStyle={{ 
          height: 48, 
          backgroundColor: "#fff", 
          borderRadius: 8, 
          borderWidth: 1, 
          borderColor: "#D8DEE6", 
          paddingHorizontal: 14 
        }}
        buttonTextStyle={{ fontSize: 16, color: "#1C1E21", textAlign: "left" }}
        hint={
          isCTAAutoSelected
            ? `CTA is automatically set based on destination type (${adSetDestinationType}). You can change it if needed.`
            : allowedCTAs.length > 0
            ? `Only CTA types valid for ${optimizationGoalNames[adSetOptimizationGoal || optimizationGoal] || (adSetOptimizationGoal || optimizationGoal)} optimization goal are shown.`
            : undefined
        }
      />

      {/* Phone Number for CALL_NOW CTA */}
      {callToActionType === "CALL_NOW" && (
        <View style={[styles.inputContainer, { backgroundColor: "#E3F2FD", padding: 15, borderRadius: 8 }]}>
          <Text style={styles.inputLabel}>
            Phone Number * <Text style={styles.requiredText}>(Required for Call Now CTA)</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="e.g., +1234567890 or (123) 456-7890"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>
          <Text style={styles.inputHint}>
            Enter a valid phone number with country code (e.g., +1 234 567 8900)
          </Text>
        </View>
      )}

      {/* Address for GET_DIRECTIONS */}
      {callToActionType === "GET_DIRECTIONS" && (
        <View style={[styles.inputContainer, { backgroundColor: "#E3F2FD", padding: 15, borderRadius: 8 }]}>
          <Text style={styles.inputLabel}>
            Address * <Text style={styles.requiredText}>(Required for Get Directions)</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="e.g., 123 Main St, City, State, ZIP"
              value={address}
              onChangeText={setAddress}
            />
          </View>
          <Text style={styles.inputHint}>
            Enter the full address for directions
          </Text>
        </View>
      )}


      {/* Video Upload (for video optimization goals) */}
      {requiresVideo ? (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>
            Video * <Text style={styles.requiredText}>(Required for {optimizationGoalNames[adSetOptimizationGoal] || adSetOptimizationGoal})</Text>
          </Text>
          <Text style={[styles.inputHint, { marginBottom: 10 }]}>
            Video is required for {optimizationGoalNames[adSetOptimizationGoal] || adSetOptimizationGoal} optimization goal.
          </Text>
          <TouchableOpacity
            style={[styles.mediaUpload, { borderStyle: "dashed" }]}
            onPress={handleVideoUpload}
          >
            {uploadingVideo ? (
              <View style={styles.mediaPlaceholder}>
                <ActivityIndicator size="large" color="#1877F2" />
                <Text style={styles.mediaPlaceholderText}>Uploading video...</Text>
              </View>
            ) : videoId ? (
              <View style={styles.mediaPlaceholder}>
                <MaterialCommunityIcons name="check-circle" size={40} color="#4CAF50" />
                <Text style={styles.mediaPlaceholderText}>Video uploaded successfully</Text>
                <Text style={[styles.inputHint, { fontSize: 10 }]}>Video ID: {videoId}</Text>
              </View>
            ) : (
              <View style={styles.mediaPlaceholder}>
                <MaterialCommunityIcons name="video-plus" size={40} color="#D8DEE6" />
                <Text style={styles.mediaPlaceholderText}>Click to upload video</Text>
                <Text style={styles.mediaPlaceholderSubtext}>Supported: MP4, MOV, AVI (Max 4GB)</Text>
              </View>
            )}
          </TouchableOpacity>
          
          {/* Image Thumbnail for Video Ads */}
          <View style={[styles.inputContainer, { marginTop: 15 }]}>
            <Text style={styles.inputLabel}>
              Image Thumbnail * <Text style={styles.requiredText}>(Required for video ads)</Text>
            </Text>
            <Text style={[styles.inputHint, { marginBottom: 10 }]}>
              Meta requires an image thumbnail for video ads.
            </Text>
            <TouchableOpacity
              style={[styles.mediaUpload, { borderStyle: "dashed" }]}
              onPress={handleImageUpload}
            >
              {uploadingImage ? (
                <View style={styles.mediaPlaceholder}>
                  <ActivityIndicator size="large" color="#1877F2" />
                  <Text style={styles.mediaPlaceholderText}>Uploading thumbnail...</Text>
                </View>
              ) : imageHash ? (
                <View style={styles.mediaPlaceholder}>
                  <MaterialCommunityIcons name="check-circle" size={40} color="#4CAF50" />
                  <Text style={styles.mediaPlaceholderText}>Thumbnail uploaded</Text>
                  <Text style={[styles.inputHint, { fontSize: 10 }]}>Hash: {imageHash.substring(0, 20)}...</Text>
                </View>
              ) : (
                <View style={styles.mediaPlaceholder}>
                  <MaterialCommunityIcons name="image-plus" size={40} color="#D8DEE6" />
                  <Text style={styles.mediaPlaceholderText}>Click to upload thumbnail</Text>
                  <Text style={styles.mediaPlaceholderSubtext}>Recommended: 1200×628px</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* Image Upload (for non-video optimization goals) */
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>
            Image {callToActionType === "WHATSAPP_MESSAGE" ? "*" : "(Recommended)"}
          </Text>
          {callToActionType !== "WHATSAPP_MESSAGE" && (
            <Text style={[styles.inputHint, { marginBottom: 10 }]}>
              Image is recommended for better ad performance.
            </Text>
          )}
          <TouchableOpacity
            style={[styles.mediaUpload, { borderStyle: "dashed" }]}
            onPress={handleImageUpload}
          >
            {uploadingImage ? (
              <View style={styles.mediaPlaceholder}>
                <ActivityIndicator size="large" color="#1877F2" />
                <Text style={styles.mediaPlaceholderText}>Uploading image...</Text>
              </View>
            ) : adCreative.media ? (
              <View style={{ position: "relative" }}>
                <Image source={{ uri: adCreative.media }} style={styles.mediaPreview} />
                {imageHash && (
                  <View style={{ marginTop: 8, padding: 8, backgroundColor: "#E8F5E9", borderRadius: 4 }}>
                    <Text style={[styles.inputHint, { color: "#4CAF50", fontSize: 11 }]}>
                      ✓ Image uploaded (Hash: {imageHash.substring(0, 20)}...)
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={{ position: "absolute", top: 5, right: 5, backgroundColor: "#E53935", borderRadius: 15, padding: 5 }}
                  onPress={() => {
                    setAdCreative({ ...adCreative, media: null, mediaUrl: null });
                    setImageHash("");
                  }}
                >
                  <MaterialCommunityIcons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.mediaPlaceholder}>
                <MaterialCommunityIcons name="image-plus" size={40} color="#D8DEE6" />
                <Text style={styles.mediaPlaceholderText}>Click to upload</Text>
                <Text style={styles.mediaPlaceholderSubtext}>
                  Recommended: 1200×628px {callToActionType === "WHATSAPP_MESSAGE" && "(Required for WhatsApp ads)"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Message/Primary Text */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          Message {callToActionType === "WHATSAPP_MESSAGE" ? "*" : "(Optional)"}
        </Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder={
              callToActionType === "WHATSAPP_MESSAGE"
                ? "Chat with us on WhatsApp to get instant details"
                : "The main text of your ad"
            }
            multiline
            numberOfLines={4}
            value={adCreative.primaryText}
            onChangeText={(text) => setAdCreative({ ...adCreative, primaryText: text })}
          />
        </View>
      </View>

      {/* Destination URL */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          Destination URL {isMessagingCTA ? "(Optional)" : "*"}
        </Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder={
              isMessagingCTA
                ? "https://wa.me/1234567890 or https://m.me/yourpage (optional)"
                : "https://www.example.com"
            }
            keyboardType="url"
            value={destinationUrl}
            onChangeText={setDestinationUrl}
          />
        </View>
        {isMessagingCTA && (
          <Text style={styles.inputHint}>
            Link is optional for messaging CTAs. You can leave this empty.
          </Text>
        )}
      </View>

      {/* Headline */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Headline (Optional)</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Short headline"
            value={adCreative.headline}
            onChangeText={(text) => setAdCreative({ ...adCreative, headline: text })}
          />
        </View>
      </View>

      {/* Description */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Description (Optional)</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Details about the offer"
            multiline
            numberOfLines={3}
            value={adCreative.description}
            onChangeText={(text) => setAdCreative({ ...adCreative, description: text })}
          />
        </View>
      </View>
    </View>
  );
};

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
  const params = useLocalSearchParams();
  
  // Campaign type selection (step 0)
  const [campaignType, setCampaignType] = useState(null); // "whatsapp", "call", "link", "lead-form"
  
  // Step management - matching web flow: 0: Campaign Type Selection, 1: Campaign, 2: AdSet, 3: AdCreative, 4: Ad
  const [step, setStep] = useState(params.step ? parseInt(params.step) : 0);
  const [createdCampaignId, setCreatedCampaignId] = useState(params.campaignId || null);
  const [createdAdSetId, setCreatedAdSetId] = useState(params.adsetId || null);
  const [createdCreativeId, setCreatedCreativeId] = useState(null);
  
  // Campaign data to pass between components
  const [campaignData, setCampaignData] = useState({});
  
  // Set step and IDs from params if provided
  useEffect(() => {
    if (params.step) {
      setStep(parseInt(params.step));
    }
    if (params.campaignId) {
      setCreatedCampaignId(params.campaignId);
      // Reset campaignObjective when a new campaign is selected to force refetch
      setCampaignObjective(null);
    }
    if (params.campaignName) {
      setCampaignName(params.campaignName);
    }
    if (params.adsetId) {
      setCreatedAdSetId(params.adsetId);
    }
    if (params.adsetName) {
      setAdSetName(params.adsetName);
    }
    if (params.step || params.campaignId || params.adsetId) {
      setActiveTab("create");
    }
  }, [params.step, params.campaignId, params.campaignName, params.adsetId, params.adsetName]);

  // Fetch pages when step is 2 and accessToken is available
  useEffect(() => {
    if (step === 2 && accessToken) {
      fetchPages();
    }
  }, [step, accessToken]);
  
  // Campaign Details
  const [campaignName, setCampaignName] = useState("");
  const [objective, setObjective] = useState("OUTCOME_TRAFFIC");
  const [campaignObjective, setCampaignObjective] = useState(null);
  
  // AdSet Details
  const [adSetName, setAdSetName] = useState("");
  const [budget, setBudget] = useState("");
  const [optimizationGoal, setOptimizationGoal] = useState("LINK_CLICKS");
  const [allowedOptimizationGoals, setAllowedOptimizationGoals] = useState([]);
  const [bidStrategy, setBidStrategy] = useState("LOWEST_COST_WITHOUT_CAP");
  const [bidAmount, setBidAmount] = useState("");
  const [bidConstraints, setBidConstraints] = useState({ roas_average_floor: "" });
  const [publisherPlatforms, setPublisherPlatforms] = useState(["facebook", "instagram"]);
  
  // Destination Type & WhatsApp
  const [destinationType, setDestinationType] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  
  // Promoted Object (for APP_INSTALLS/APP_ENGAGEMENT)
  const [appId, setAppId] = useState("");
  const [objectStoreUrl, setObjectStoreUrl] = useState("");
  
  // Conversion Tracking (for OFFSITE_CONVERSIONS)
  const [pixelId, setPixelId] = useState("");
  const [conversionEvent, setConversionEvent] = useState("PURCHASE");
  
  // Facebook Page
  const [pageId, setPageId] = useState("");
  const [pages, setPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  
  // Targeting
  const [targeting, setTargeting] = useState({
    ageMin: 18,
    ageMax: 45,
  });
  const [customLocations, setCustomLocations] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [facebookPositions, setFacebookPositions] = useState(["feed", "video_feeds"]);
  const [instagramPositions, setInstagramPositions] = useState(["stream", "reels"]);
  const [devicePlatforms, setDevicePlatforms] = useState(["mobile", "desktop"]);
  const [genders, setGenders] = useState([]); // Array of numbers: 1=male, 2=female
  
  // Ad Creative
  const [adCreative, setAdCreative] = useState({
    primaryText: "",
    headline: "",
    description: "",
    media: null,
    mediaUrl: null,
  });
  
  // AdCreative Details (Step 3) - matching web flow
  const [creativeName, setCreativeName] = useState("");
  const [creativePageId, setCreativePageId] = useState("");
  const [pictureUrl, setPictureUrl] = useState("");
  const [businessPageUrl, setBusinessPageUrl] = useState("");
  const [creativePhoneNumber, setCreativePhoneNumber] = useState("");
  
  // Ad Creation (Step 4) - updated from step 3
  const [adName, setAdName] = useState("");
  const [callToActionType, setCallToActionType] = useState("LEARN_MORE");
  const [allowedCTAs, setAllowedCTAs] = useState([]);
  const [destinationUrl, setDestinationUrl] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(""); // For CALL_NOW
  const [address, setAddress] = useState(""); // For GET_DIRECTIONS
  const [imageHash, setImageHash] = useState("");
  const [videoId, setVideoId] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [adSetOptimizationGoal, setAdSetOptimizationGoal] = useState(null);
  const [adSetDestinationType, setAdSetDestinationType] = useState(null);
  const [isCTAAutoSelected, setIsCTAAutoSelected] = useState(false);
  
  // Connection & UI
  const [isConnected, setIsConnected] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [adAccountId, setAdAccountId] = useState("");
  const [adAccounts, setAdAccounts] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  
  // Edit Modal State
  const [editField, setEditField] = useState(null);
  const [tempValue, setTempValue] = useState("");
  
  // Subscription
  const { subscription, loading: subscriptionLoading, refreshSubscription } = useSubscription();

  // Use a ref to store the latest refreshSubscription function and prevent multiple simultaneous refreshes
  const refreshSubscriptionRef = useRef(refreshSubscription);
  const isRefreshingRef = useRef(false);
  
  // Update ref when refreshSubscription changes
  useEffect(() => {
    refreshSubscriptionRef.current = refreshSubscription;
  }, [refreshSubscription]);

  // Refresh subscription when screen comes into focus (e.g., after payment)
  useFocusEffect(
    useCallback(() => {
      // Prevent multiple simultaneous refreshes
      if (isRefreshingRef.current) {
        return;
      }
      
      isRefreshingRef.current = true;
      console.log("🔄 MetaAdsScreen: Screen focused - refreshing subscription");
      refreshSubscriptionRef.current();
      
      // Reset ref after a short delay
      setTimeout(() => {
        isRefreshingRef.current = false;
      }, 1000);
    }, []) // Empty dependency array - only run on focus
  );
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Auto-hide upgrade modal when subscription becomes active
  useEffect(() => {
    if (!subscriptionLoading && subscription) {
      const hasActive = hasActiveSubscription(subscription);
      const hasAccess = hasFeatureAccess(subscription, "meta-ads");
      
      if (hasActive && hasAccess) {
        console.log("✅ MetaAdsScreen: Subscription is now active - hiding upgrade modal");
        setShowUpgradeModal(false);
      }
    }
  }, [subscription, subscriptionLoading]);
  
  // User ID for notifications
  const [userId, setUserId] = useState(null);
  
  // Get user ID on mount
  useEffect(() => {
    const loadUserId = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          setUserId(user.id || user._id || null);
        }
      } catch (error) {
        console.error("Error loading user ID:", error);
      }
    };
    loadUserId();
  }, []);

  // Constants - Optimization Goal Names
  const optimizationGoalNames = {
    "LINK_CLICKS": "Link Clicks",
    "CONVERSIONS": "Conversions",
    "VALUE": "Value",
    "BRAND_AWARENESS": "Brand Awareness",
    "AD_RECALL_LIFT": "Ad Recall Lift",
    "REACH": "Reach",
    "IMPRESSIONS": "Impressions",
    "THRUPLAY": "ThruPlay",
    "TWO_SECOND_VIDEO_VIEWS": "Two Second Video Views",
    "LANDING_PAGE_VIEWS": "Landing Page Views",
    "POST_ENGAGEMENT": "Post Engagement",
    "CONVERSATIONS": "Conversations",
    "PAGE_LIKES": "Page Likes",
    "EVENT_RESPONSES": "Event Responses",
    "LEAD_GENERATION": "Lead Generation",
    "QUALITY_CALL": "Quality Call",
    "OFFSITE_CONVERSIONS": "Offsite Conversions",
    "PRODUCT_CATALOG_SALES": "Product Catalog Sales",
    "APP_INSTALLS": "App Installs",
    "APP_ENGAGEMENT": "App Engagement",
    "VIDEO_VIEWS": "Video Views",
  };

  // Campaign Objective Display Names
  const campaignObjectiveNames = {
    "OUTCOME_AWARENESS": "Awareness",
    "OUTCOME_TRAFFIC": "Traffic",
    "OUTCOME_ENGAGEMENT": "Engagement",
    "OUTCOME_LEADS": "Leads",
    "OUTCOME_SALES": "Sales",
    "OUTCOME_APP_PROMOTION": "App Promotion",
  };

  // Campaign → AdSet Optimization Goals Mapping
  const campaignAdsetMappingV23 = {
    "OUTCOME_AWARENESS": {
      adsetOptimizationGoals: ["AD_RECALL_LIFT", "REACH", "IMPRESSIONS", "THRUPLAY"],
    },
    "OUTCOME_TRAFFIC": {
      adsetOptimizationGoals: ["LINK_CLICKS", "LANDING_PAGE_VIEWS", "IMPRESSIONS", "REACH"],
    },
    "OUTCOME_ENGAGEMENT": {
      adsetOptimizationGoals: ["CONVERSATIONS", "POST_ENGAGEMENT", "THRUPLAY", "PAGE_LIKES", "EVENT_RESPONSES"],
    },
    "OUTCOME_LEADS": {
      adsetOptimizationGoals: ["LEAD_GENERATION", "LINK_CLICKS"],
    },
    "OUTCOME_APP_PROMOTION": {
      adsetOptimizationGoals: ["APP_INSTALLS", "APP_ENGAGEMENT"],
    },
    "OUTCOME_SALES": {
      adsetOptimizationGoals: ["LANDING_PAGE_VIEWS", "LINK_CLICKS"],
    },
  };

  // Optimization Goal → Valid CTAs Mapping
  const optimizationGoalCTAMapping = {
    "AD_RECALL_LIFT": ["LEARN_MORE", "WATCH_MORE", "LISTEN_NOW", "GET_QUOTE", "SIGN_UP"],
    "REACH": ["LEARN_MORE", "WATCH_MORE", "LISTEN_NOW", "GET_QUOTE", "SIGN_UP"],
    "IMPRESSIONS": ["LEARN_MORE", "WATCH_MORE", "LISTEN_NOW", "GET_QUOTE", "SIGN_UP", "SHOP_NOW", "BOOK_NOW", "CONTACT_US", "CALL_NOW"],
    "THRUPLAY": ["WATCH_MORE", "WATCH_VIDEO", "LEARN_MORE", "SEND_MESSAGE", "WHATSAPP_MESSAGE"],
    "TWO_SECOND_VIDEO_VIEWS": ["WATCH_MORE", "WATCH_VIDEO", "LEARN_MORE"],
    "LINK_CLICKS": ["LEARN_MORE", "BOOK_NOW", "CONTACT_US", "CALL_NOW", "SHOP_NOW", "GET_OFFER", "SIGN_UP", "SUBSCRIBE"],
    "LANDING_PAGE_VIEWS": ["LEARN_MORE", "SHOP_NOW", "BOOK_NOW", "GET_OFFER", "SIGN_UP"],
    "CONVERSATIONS": ["SEND_MESSAGE", "WHATSAPP_MESSAGE", "MESSAGE_PAGE", "MESSAGE_US"],
    "POST_ENGAGEMENT": ["LIKE_PAGE", "FOLLOW", "SHARE", "COMMENT", "LEARN_MORE"],
    "PAGE_LIKES": ["LIKE_PAGE", "FOLLOW", "LEARN_MORE"],
    "EVENT_RESPONSES": ["EVENT_RSVP", "INTERESTED", "LEARN_MORE"],
    "LEAD_GENERATION": ["SIGN_UP", "GET_QUOTE", "APPLY_NOW", "SUBSCRIBE", "LEARN_MORE", "CALL_NOW"],
    "QUALITY_CALL": ["CALL_NOW", "CONTACT_US", "GET_QUOTE"],
    "OFFSITE_CONVERSIONS": ["SHOP_NOW", "BUY_NOW", "ORDER_NOW", "SIGN_UP", "LEARN_MORE", "CALL_NOW"],
    "VALUE": ["SHOP_NOW", "BUY_NOW", "ORDER_NOW", "BOOK_NOW", "GET_OFFER"],
    "APP_INSTALLS": ["INSTALL_MOBILE_APP", "INSTALL_APP", "USE_APP", "PLAY_GAME"],
    "APP_ENGAGEMENT": ["USE_APP", "PLAY_GAME", "INSTALL_MOBILE_APP"],
    "VIDEO_VIEWS": ["WATCH_VIDEO", "WATCH_MORE", "WATCH", "LEARN_MORE"],
  };

  // CTA Type Display Names
  const ctaTypeNames = {
    "LEARN_MORE": "Learn More",
    "SHOP_NOW": "Shop Now",
    "SIGN_UP": "Sign Up",
    "BOOK_NOW": "Book Now",
    "CONTACT_US": "Contact Us",
    "CALL_NOW": "Call Now",
    "GET_QUOTE": "Get Quote",
    "GET_OFFER": "Get Offer",
    "SUBSCRIBE": "Subscribe",
    "BUY_NOW": "Buy Now",
    "ORDER_NOW": "Order Now",
    "LIKE_PAGE": "Like Page",
    "SEND_MESSAGE": "Send Message",
    "WHATSAPP_MESSAGE": "WhatsApp Message",
    "WATCH_MORE": "Watch More",
    "LISTEN_NOW": "Listen Now",
    "EVENT_RSVP": "Event RSVP",
    "APPLY_NOW": "Apply Now",
    "INSTALL_MOBILE_APP": "Install Mobile App",
    "USE_APP": "Use App",
    "PLAY_GAME": "Play Game",
    "GET_DIRECTIONS": "Get Directions",
  };

  // Video optimization goals
  const videoOptimizationGoals = ["THRUPLAY", "TWO_SECOND_VIDEO_VIEWS", "VIDEO_VIEWS"];
  const requiresVideo = adSetOptimizationGoal && videoOptimizationGoals.includes(adSetOptimizationGoal);

  // Fetch campaign objective when campaignId is provided
  useEffect(() => {
    const fetchCampaignObjective = async () => {
      if (createdCampaignId && accessToken) {
        try {
          console.log("📥 Fetching campaign objective for campaign:", createdCampaignId);
          const response = await axios.get(`${API_BASE_URL}/campaigns/${createdCampaignId}`, {
            headers: {
              "x-fb-access-token": accessToken,
            },
          });
          if (response.data?.campaign?.objective) {
            const fetchedObjective = response.data.campaign.objective;
            setCampaignObjective(fetchedObjective);
            console.log("✅ Campaign objective fetched:", fetchedObjective);
            // Also update the objective state if it's different
            if (objective !== fetchedObjective) {
              setObjective(fetchedObjective);
            }
          }
        } catch (error) {
          console.error("❌ Error fetching campaign objective:", error);
        }
      }
    };
    fetchCampaignObjective();
  }, [createdCampaignId, accessToken]);

  // Update allowed optimization goals based on campaign objective
  const updateAllowedOptimizationGoals = useCallback(() => {
    const activeObjective = campaignObjective || objective;
    if (activeObjective && campaignAdsetMappingV23[activeObjective]) {
      const allowedGoals = campaignAdsetMappingV23[activeObjective].adsetOptimizationGoals;
      setAllowedOptimizationGoals(allowedGoals);
      // Set default optimization goal if current one is not allowed
      if (allowedGoals.length > 0 && !allowedGoals.includes(optimizationGoal)) {
        setOptimizationGoal(allowedGoals[0]);
      }
    } else {
      setAllowedOptimizationGoals([]);
    }
  }, [campaignObjective, objective, optimizationGoal]);

  // Update allowed optimization goals when objective or campaignObjective changes
  useEffect(() => {
    updateAllowedOptimizationGoals();
  }, [updateAllowedOptimizationGoals]);

  // Auto-set destination type to LEAD_FORM when campaign is OUTCOME_LEADS
  useEffect(() => {
    const activeObjective = campaignObjective || objective;
    if (activeObjective === "OUTCOME_LEADS") {
      setDestinationType("LEAD_FORM");
    }
  }, [campaignObjective, objective]);

  useEffect(() => {
    checkConnection();
    if (step === 2 && accessToken && adAccountId) {
      fetchPages();
    }
    if (step === 3) {
      // First, try to use destination type from form state (it's the source of truth)
      const activeObjective = campaignObjective || objective;
      const formStateDestinationType = activeObjective === "OUTCOME_LEADS" 
        ? "LEAD_FORM" 
        : (activeObjective === "OUTCOME_AWARENESS" ? null : destinationType);
      
      if (formStateDestinationType && !adSetDestinationType) {
        console.log("📍 Setting destination type from form state in useEffect:", formStateDestinationType);
        setAdSetDestinationType(formStateDestinationType);
      }
      
      // Fetch optimization goal from created AdSet
      if (createdAdSetId && accessToken) {
        fetchAdSetOptimizationGoal();
      } else {
        // If no adset to fetch, update CTAs immediately
        updateAllowedCTAs();
      }
    }
  }, [step, accessToken, adAccountId, createdAdSetId, adSetOptimizationGoal, adSetDestinationType, destinationType, campaignObjective, objective]);

  // Refresh connection status when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      checkConnection();
    }, [])
  );

  // Update allowed CTAs based on optimization goal and destination type
  const updateAllowedCTAs = (overrideOptimizationGoal = null, overrideDestinationType = null) => {
    const activeOptimizationGoal = overrideOptimizationGoal || adSetOptimizationGoal || optimizationGoal;
    const activeDestinationType = overrideDestinationType || adSetDestinationType || destinationType;
    let allowedCTATypes = [];
    let autoSelectedCTA = null;
    let shouldAutoSelect = false;

    // First, filter by destination type if available
    if (activeDestinationType) {
      if (activeDestinationType === "PHONE_CALL") {
        // For PHONE_CALL, only show WHATSAPP_MESSAGE, LEARN_MORE, CALL_NOW
        allowedCTATypes = ["WHATSAPP_MESSAGE", "LEARN_MORE", "CALL_NOW"];
        autoSelectedCTA = "CALL_NOW";
        shouldAutoSelect = true;
      } else if (activeDestinationType === "WHATSAPP") {
        // For WHATSAPP, auto-select WHATSAPP_MESSAGE
        allowedCTATypes = Object.keys(ctaTypeNames); // Show all CTAs but auto-select
        autoSelectedCTA = "WHATSAPP_MESSAGE";
        shouldAutoSelect = true;
      } else if (activeDestinationType === "WEBSITE") {
        // For WEBSITE, auto-select LEARN_MORE
        allowedCTATypes = Object.keys(ctaTypeNames); // Show all CTAs but auto-select
        autoSelectedCTA = "LEARN_MORE";
        shouldAutoSelect = true;
      }
    }

    // If destination type filtering didn't apply, use optimization goal mapping
    if (allowedCTATypes.length === 0 && activeOptimizationGoal && optimizationGoalCTAMapping[activeOptimizationGoal]) {
      allowedCTATypes = optimizationGoalCTAMapping[activeOptimizationGoal];
    }

    // If still no CTAs, show all
    if (allowedCTATypes.length === 0) {
      allowedCTATypes = Object.keys(ctaTypeNames);
    }

    // Apply optimization goal filter to destination-based CTAs if needed
    // BUT for PHONE_CALL, always prioritize CALL_NOW regardless of optimization goal
    if (activeDestinationType === "PHONE_CALL") {
      // For PHONE_CALL destination, CALL_NOW is ALWAYS the required CTA
      // Don't filter by optimization goal - destination type takes precedence
      // Ensure CALL_NOW is first in the list and always selected
      if (!allowedCTATypes.includes("CALL_NOW")) {
        allowedCTATypes.unshift("CALL_NOW");
      } else {
        // Move CALL_NOW to the front
        allowedCTATypes = allowedCTATypes.filter(cta => cta !== "CALL_NOW");
        allowedCTATypes.unshift("CALL_NOW");
      }
      // Always set CALL_NOW as auto-selected for PHONE_CALL, regardless of optimization goal
      autoSelectedCTA = "CALL_NOW";
      shouldAutoSelect = true;
    } else if (activeDestinationType && activeOptimizationGoal && optimizationGoalCTAMapping[activeOptimizationGoal]) {
      // For other destination types, apply normal optimization goal filter
      const goalCTAs = optimizationGoalCTAMapping[activeOptimizationGoal];
      allowedCTATypes = allowedCTATypes.filter(cta => goalCTAs.includes(cta));
    }

    setAllowedCTAs(allowedCTATypes);

    // Auto-select CTA if needed
    if (shouldAutoSelect && autoSelectedCTA) {
      setCallToActionType(autoSelectedCTA);
      setIsCTAAutoSelected(true);
    } else {
      // Reset CTA if current one is not allowed
      if (!allowedCTATypes.includes(callToActionType)) {
        setCallToActionType(allowedCTATypes[0] || "LEARN_MORE");
      }
      setIsCTAAutoSelected(false);
    }
  };

  // Fetch optimization goal from created AdSet
  const fetchAdSetOptimizationGoal = async () => {
    if (!createdAdSetId || !accessToken) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/adsets/${createdAdSetId}`, {
        headers: {
          "x-fb-access-token": accessToken,
        },
      });
      if (response.data?.adset?.optimization_goal) {
        setAdSetOptimizationGoal(response.data.adset.optimization_goal);
        console.log("📋 AdSet optimization goal:", response.data.adset.optimization_goal);
      }
      // Also fetch destination type from adset
      // PRIORITIZE form state destinationType over API inference (API may not correctly infer PHONE_CALL)
      const currentOptimizationGoal = response.data?.adset?.optimization_goal || adSetOptimizationGoal || optimizationGoal;
      
      // Use form state destination type as primary source (it's the source of truth)
      // Only use API value if form state is not available
      const activeObjective = campaignObjective || objective;
      const formStateDestinationType = activeObjective === "OUTCOME_LEADS" 
        ? "LEAD_FORM" 
        : (activeObjective === "OUTCOME_AWARENESS" ? null : destinationType);
      
      const fetchedDestinationType = response.data?.adset?.destination_type || response.data?.adset?.destinationType;
      
      // Prioritize form state over API inference
      const finalDestinationType = formStateDestinationType || fetchedDestinationType;
      
      if (finalDestinationType) {
        console.log("📍 Using destination type:", finalDestinationType, formStateDestinationType ? "(from form state)" : "(from API)");
        setAdSetDestinationType(finalDestinationType);
        // Update CTAs immediately with fetched values
        updateAllowedCTAs(currentOptimizationGoal, finalDestinationType);
      } else {
        console.warn("⚠️ No destination type found in form state or API response");
        updateAllowedCTAs(currentOptimizationGoal, null);
      }
    } catch (error) {
      console.error("Error fetching optimization goal from created adset:", error);
      // Still update CTAs even if fetch fails
      updateAllowedCTAs();
    }
  };

  // Fetch Facebook Pages
  const fetchPages = async () => {
    if (!accessToken) {
      console.warn("⚠️ No access token available for loading pages");
      return;
    }
    setLoadingPages(true);
    try {
      console.log("📥 Loading Facebook pages...");
      const response = await axios.get(`${API_BASE_URL}/ads/pages`, {
        headers: {
          "x-fb-access-token": accessToken,
        },
      });
      console.log("📤 Pages API response:", response.data);
      
      if (response.data.success) {
        // Handle different response structures (same as web version)
        let pagesData = [];
        
        if (response.data.pages?.data) {
          // Standard structure: { success: true, pages: { data: [...] } }
          pagesData = response.data.pages.data;
        } else if (Array.isArray(response.data.pages)) {
          // Direct array: { success: true, pages: [...] }
          pagesData = response.data.pages;
        } else if (response.data.pages && typeof response.data.pages === 'object') {
          // Try to extract data from nested structure
          pagesData = response.data.pages.data || Object.values(response.data.pages).flat() || [];
        }
        
        console.log(`✅ Loaded ${pagesData.length} pages:`, pagesData);
        
        if (pagesData.length > 0) {
          setPages(pagesData);
          // Auto-select first page if available
          if (!pageId) {
            setPageId(pagesData[0].id);
            console.log("✅ Auto-selected first page:", pagesData[0].id, pagesData[0].name);
          }
        } else {
          console.warn("⚠️ No pages found. Make sure you have pages associated with your Facebook account.");
          setPages([]);
        }
      } else {
        console.error("❌ Pages API returned success: false", response.data);
        setPages([]);
      }
    } catch (error) {
      console.error("❌ Error fetching pages:", error);
      const errorMessage = error.response?.data?.error || error.message || "Failed to load pages";
      console.error("Error details:", errorMessage);
      setPages([]);
    } finally {
      setLoadingPages(false);
    }
  };

  // Handle place selection from Google Places
  const handlePlaceSelect = (placeInfo) => {
    if (placeInfo) {
      setSelectedPlace(placeInfo);
      console.log("📍 Place selected:", placeInfo);
      
      // Automatically add to custom_locations if coordinates are available
      if (placeInfo.location && placeInfo.location.lat && placeInfo.location.lng) {
        const newCustomLocation = {
          latitude: placeInfo.location.lat,
          longitude: placeInfo.location.lng,
          radius: 5, // Default radius in kilometers (within 2-17 km range)
          distance_unit: "kilometer",
          name: placeInfo.name || "",
          address: placeInfo.address || "",
          placeId: placeInfo.placeId || "",
        };
        
        // Ensure radius is within valid range (2-17 km)
        if (newCustomLocation.radius < 2) {
          newCustomLocation.radius = 2;
        } else if (newCustomLocation.radius > 17) {
          newCustomLocation.radius = 17;
        }
        
        // Check if this location already exists (avoid duplicates)
        const exists = customLocations.some(loc => 
          Math.abs(loc.latitude - newCustomLocation.latitude) < 0.0001 &&
          Math.abs(loc.longitude - newCustomLocation.longitude) < 0.0001
        );
        
        if (!exists) {
          setCustomLocations([...customLocations, newCustomLocation]);
          console.log("✅ Added to custom_locations:", newCustomLocation);
          // Clear selected place after adding so user can add more
          setTimeout(() => {
            setSelectedPlace(null);
          }, 2000);
        } else {
          console.log("ℹ️ Location already exists in custom_locations");
          setSelectedPlace(null);
        }
      }
    }
  };

  const checkConnection = async () => {
    try {
      const token = await AsyncStorage.getItem("fb_access_token");
      const accountId = await AsyncStorage.getItem("fb_ad_account_id");
      if (token && accountId) {
        setAccessToken(token);
        setAdAccountId(accountId);
        setIsConnected(true);
      } else if (token) {
        // Token exists but no accountId - try to get ad accounts
        setAccessToken(token);
        setIsConnected(true); // Set connected first so user doesn't see connect screen
        await fetchAdAccounts(token);
      } else {
        // No token found
        setIsConnected(false);
      }
    } catch (error) {
      console.error("Error checking connection:", error);
      setIsConnected(false);
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
        const accounts = response.data.adAccounts.data.filter(
          account => account && account.id && typeof account.id === 'string' && account.id.trim() !== ''
        );
        
        if (accounts.length === 0) {
          // No valid ad accounts found - clear connection
          await AsyncStorage.removeItem("fb_access_token");
          await AsyncStorage.removeItem("fb_token");
          await AsyncStorage.removeItem("fb_ad_account_id");
          await AsyncStorage.removeItem("act_ad_account_id");
          setAccessToken("");
          setAdAccountId("");
          setAdAccounts([]);
          setIsConnected(false);
          Alert.alert(
            "No Ad Account Found",
            "You don't have any Meta ad accounts. Please create an ad account in Meta Business Manager first, then reconnect with LCM.\n\n" +
            "Steps:\n" +
            "1. Go to Meta Business Manager (business.facebook.com)\n" +
            "2. Create an ad account\n" +
            "3. Come back here and reconnect your Meta account"
          );
          return;
        }
        
        setAdAccounts(accounts);
        if (accounts.length === 1) {
          const accountId = accounts[0].id;
          setAdAccountId(accountId);
          await AsyncStorage.setItem("fb_ad_account_id", accountId);
          setIsConnected(true);
        } else if (accounts.length > 1) {
          setIsConnected(true);
          setShowAccountModal(true);
        }
      }
    } catch (error) {
      console.error("Error fetching ad accounts:", error);
      
      // Check for token expiration
      const { handleTokenExpiration } = require("../../utils/metaErrorHandler");
      await handleTokenExpiration(error, () => {
        setIsConnected(false);
      });
    }
  };

  // Handle Image Upload
  const handleImageUpload = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant camera roll permissions to upload an image."
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1.91, 1], // Recommended aspect ratio for ads (1200x628)
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);
        const asset = result.assets[0];
        
        try {
          // Convert to base64 (same as web version)
          const base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: "base64",
          });
          
          // Get mime type from asset (expo-image-picker provides this)
          // Fallback to detecting from URI or default to jpeg
          let mimeType = asset.mimeType || asset.type || "image/jpeg";
          
          // If mimeType is not provided, try to detect from URI
          if (!mimeType || mimeType === "image/jpeg") {
            const uriLower = asset.uri.toLowerCase();
            if (uriLower.includes(".png") || uriLower.includes("png")) {
              mimeType = "image/png";
            } else if (uriLower.includes(".gif") || uriLower.includes("gif")) {
              mimeType = "image/gif";
            } else if (uriLower.includes(".webp") || uriLower.includes("webp")) {
              mimeType = "image/webp";
            } else if (uriLower.includes(".jpg") || uriLower.includes(".jpeg")) {
              mimeType = "image/jpeg";
            }
          }
          
          // Create base64 data URL (same format as web FileReader.result)
          const base64Image = `data:${mimeType};base64,${base64}`;
          
          // Validate base64 string
          if (!base64 || base64.length === 0) {
            throw new Error("Failed to convert image to base64");
          }
          
          console.log("✅ Image converted to base64");
          console.log("  - MIME type:", mimeType);
          console.log("  - Base64 length:", base64.length);
          console.log("  - Asset URI:", asset.uri);
          console.log("  - Asset type:", asset.type);
          console.log("  - Asset mimeType:", asset.mimeType);
          
          // Set preview immediately (same as web version)
          setAdCreative({
            ...adCreative,
            media: base64Image, // Use base64 for preview (same as web)
            mediaUrl: base64Image, // Store base64 for upload
          });
          
          // Upload to Meta
          if (!accessToken) {
            Alert.alert("Error", "Please connect your Meta account first.");
            setUploadingImage(false);
            return;
          }

          // Ensure adAccountId is loaded - if not, try to load it
          let currentAdAccountId = adAccountId;
          if (!currentAdAccountId || currentAdAccountId.trim() === "") {
            console.log("⚠️ AdAccountId not loaded, fetching from storage...");
            try {
              const storedAccountId = await AsyncStorage.getItem("fb_ad_account_id");
              if (storedAccountId && storedAccountId.trim() !== "") {
                currentAdAccountId = storedAccountId;
                setAdAccountId(storedAccountId);
                console.log("✅ AdAccountId loaded from storage:", currentAdAccountId);
              } else {
                Alert.alert("Error", "Ad account not found. Please reconnect your Meta account.");
                setUploadingImage(false);
                return;
              }
            } catch (storageError) {
              console.error("Error loading adAccountId:", storageError);
              Alert.alert("Error", "Failed to load ad account. Please reconnect your Meta account.");
              setUploadingImage(false);
              return;
            }
          }

          // Backend handles act_ prefix automatically, so send as-is
          // Just ensure it's trimmed and not empty
          const cleanAdAccountId = currentAdAccountId.trim();
          
          if (!cleanAdAccountId) {
            Alert.alert("Error", "Ad account ID is invalid. Please reconnect your Meta account.");
            setUploadingImage(false);
            return;
          }

          // Validate base64 string exists (format validation removed - same as web)
          if (!base64Image || base64.length === 0) {
            Alert.alert("Error", "Failed to convert image. Please try selecting the image again.");
            setUploadingImage(false);
            return;
          }

          console.log("📤 Uploading image to Meta...");
          console.log("  - AdAccountId:", cleanAdAccountId);
          console.log("  - PageId:", pageId || "Not provided");
          console.log("  - Image size:", base64Image.length, "bytes");
          console.log("  - Image format:", base64Image.substring(5, base64Image.indexOf(";")));
          console.log("  - AccessToken exists:", !!accessToken);

          // Build request payload - only include pageId if it exists and is not empty
          const uploadPayload = {
            adAccountId: cleanAdAccountId,
            imageBase64: base64Image,
          };
          
          // Only add pageId if it exists and is not empty
          if (pageId && pageId.trim() !== "") {
            uploadPayload.pageId = pageId;
          }

          console.log("📤 Upload payload:", {
            adAccountId: uploadPayload.adAccountId,
            hasPageId: !!uploadPayload.pageId,
            imageBase64Length: uploadPayload.imageBase64.length,
          });

          const uploadResponse = await axios.post(
            `${API_BASE_URL}/ads/upload-image`,
            uploadPayload,
            {
              headers: {
                "x-fb-access-token": accessToken,
              },
            }
          );
          
          if (uploadResponse.data.success) {
            if (uploadResponse.data.imageHash) {
              // ✅ Perfect! We have image_hash - this is the preferred method
              setImageHash(uploadResponse.data.imageHash);
              console.log("✅ Image uploaded successfully with image_hash:", uploadResponse.data.imageHash);
              console.log("✅ Using image_hash (preferred method) - image will show in your ad");
              Alert.alert("Success", "Image uploaded successfully!");
            } else {
              // No hash returned - this is OK for Facebook/Instagram ads
              const message = uploadResponse.data.message || uploadResponse.data.warning;
              
              if (message) {
                console.log("ℹ️", message);
              }
              
              // Only show alert for WhatsApp ads (which require hash)
              if (callToActionType === "WHATSAPP_MESSAGE" && uploadResponse.data.requiresCapability !== false) {
                Alert.alert(
                  "⚠️ Meta App Configuration Required",
                  "Your Meta app doesn't have the 'adimages' capability enabled.\n\n" +
                  "For WhatsApp ads, image_hash is required. Please enable the 'adimages' capability in your Meta App Dashboard:\n" +
                  "1. Go to developers.facebook.com\n" +
                  "2. Select your app\n" +
                  "3. Go to Settings > Advanced > Capabilities\n" +
                  "4. Enable 'adimages' capability"
                );
              } else {
                // For Facebook/Instagram ads, silently continue - image URL will be used
                console.log("ℹ️ No image_hash available. Will use redirect page method to show image.");
                console.log("💡 Tip: Enable 'adimages' capability in Meta App Dashboard to use image_hash (preferred method)");
                Alert.alert("Info", "Image uploaded. Note: For best results, enable 'adimages' capability in Meta App Dashboard.");
              }
              
              // Set the image URL if available
              if (uploadResponse.data.imageUrl) {
                console.log("ℹ️ Image URL available:", uploadResponse.data.imageUrl);
                setAdCreative(prev => ({
                  ...prev,
                  mediaUrl: uploadResponse.data.imageUrl
                }));
              }
            }
          } else {
            console.error("❌ Upload failed:", uploadResponse.data.error);
            const errorMsg = uploadResponse.data.error || "Failed to upload image";
            throw new Error(errorMsg);
          }
        } catch (uploadError) {
          console.error("❌ Error uploading image:", uploadError);
          const errorMsg = uploadError.response?.data?.message || 
                          uploadError.response?.data?.error ||
                          uploadError.message || 
                          "Unknown error";
          
          // Handle capability errors (same as web version)
          if (errorMsg.includes("capability") || errorMsg.includes("#3")) {
            // Only show alert for WhatsApp ads
            if (callToActionType === "WHATSAPP_MESSAGE") {
              Alert.alert(
                "⚠️ Meta App Configuration Required",
                "Your Meta app doesn't have the 'adimages' capability enabled.\n\n" +
                "To fix this:\n" +
                "1. Go to Meta App Dashboard (developers.facebook.com)\n" +
                "2. Select your app\n" +
                "3. Go to Settings > Advanced\n" +
                "4. Enable 'adimages' capability\n\n" +
                "For WhatsApp ads, image_hash is required."
              );
            } else {
              console.warn("⚠️ Image upload had issues, but you can still create the ad:", errorMsg);
              Alert.alert(
                "Warning",
                "Image upload had issues, but you can still create the ad. " +
                "Enable 'adimages' capability in Meta App Dashboard for better results."
              );
            }
          } else {
            // Only alert for critical errors, not for capability issues on non-WhatsApp ads
            if (callToActionType === "WHATSAPP_MESSAGE") {
              Alert.alert("Upload Error", "Failed to upload image to Meta: " + errorMsg);
            } else {
              console.warn("⚠️ Image upload had issues, but you can still create the ad:", errorMsg);
              Alert.alert(
                "Warning",
                "Image upload had issues, but you can still create the ad: " + errorMsg
              );
            }
          }
          
          // Don't clear preview on error - let user see what they selected (same as web)
          // They can manually remove it if needed
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (error) {
      console.error("Error selecting image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
      setUploadingImage(false);
    }
  };

  // Handle Video Upload
  const handleVideoUpload = async () => {
    try {
      Alert.alert(
        "Video Upload",
        "Video upload will be implemented with expo-image-picker. For now, video ads are not supported."
      );
      
      // TODO: Implement with expo-image-picker
      // Similar to image upload but for videos
    } catch (error) {
      console.error("Error selecting video:", error);
      setUploadingVideo(false);
    }
  };

  // Step 1: Create Campaign
  const handleCreateCampaign = async () => {
    // Wait for subscription to finish loading
    if (subscriptionLoading) {
      // Show loader - subscription loading state will be handled by the component
      // Wait for subscription to load, then proceed
      const checkSubscription = setInterval(() => {
        if (!subscriptionLoading) {
          clearInterval(checkSubscription);
          // Retry the action after subscription loads
          setTimeout(() => handleCreateCampaign(), 100);
        }
      }, 100);
      return;
    }

    // Check subscription first
    console.log("🔍 MetaAdsScreen: Checking subscription for create campaign");
    console.log("  - Loading:", subscriptionLoading);
    console.log("  - Subscription:", subscription ? JSON.stringify(subscription, null, 2) : "null");
    
    if (!hasActiveSubscription(subscription)) {
      console.log("❌ MetaAdsScreen: No active subscription");
      setShowUpgradeModal(true);
      return;
    }
    
    if (!hasFeatureAccess(subscription, "meta-ads")) {
      console.log("❌ MetaAdsScreen: No meta-ads feature access");
      setShowUpgradeModal(true);
      return;
    }
    
    console.log("✅ MetaAdsScreen: Subscription check passed - allowing campaign creation");
    
    if (!campaignName.trim()) {
      Alert.alert("Error", "Please enter a campaign name");
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
      // Use same API endpoint and payload structure as web version
      const campaignPayload = {
        name: campaignName,
        objective: objective,
        special_ad_categories: ["NONE"],
        status: "PAUSED",
      };

      // Determine API endpoint based on campaign type
      let campaignEndpoint;
      if (campaignType === "whatsapp") {
        campaignEndpoint = `${API_BASE_URL}/click-to-whatsapp/campaigns`;
      } else if (campaignType === "call") {
        campaignEndpoint = `${API_BASE_URL}/click-to-call/campaigns`;
      } else if (campaignType === "link") {
        campaignEndpoint = `${API_BASE_URL}/click-to-link/campaigns`;
      } else {
        Alert.alert("Error", "Please select a campaign type first");
        setIsLoading(false);
        return;
      }

      console.log("📤 Creating campaign:", {
        endpoint: campaignEndpoint,
        payload: campaignPayload,
        campaignType,
      });

      const campaignResponse = await axios.post(
        campaignEndpoint,
        campaignPayload,
        {
          headers: {
            "Content-Type": "application/json",
            "act_ad_account_id": adAccountId,
            "fb_token": accessToken,
          },
        }
      );

      console.log("📥 Campaign response:", campaignResponse.data);

      // Backend returns: { success: true, data: { id: "...", ... } }
      if (!campaignResponse.data.success) {
        throw new Error(campaignResponse.data.error || campaignResponse.data.message || "Failed to create campaign");
      }

      // Extract campaign ID from response.data.data.id
      const campaignId = campaignResponse.data.data?.id;
      if (!campaignId) {
        console.error("Campaign response structure:", campaignResponse.data);
        throw new Error("Campaign ID not found in response");
      }

      setCreatedCampaignId(campaignId);
      setCampaignObjective(objective);
      setAdSetName(`${campaignName} - AdSet`);
      setStep(2); // Move to AdSet creation step
      
      Alert.alert("Success", "Campaign created successfully! Now create an AdSet.");
    } catch (error) {
      console.error("Error creating campaign:", error);
      
      // Check for token expiration
      const { handleTokenExpiration } = require("../../utils/metaErrorHandler");
      const wasTokenExpired = await handleTokenExpiration(error, () => {
        setIsConnected(false);
      });
      
      if (!wasTokenExpired) {
        // Better error message for 404
        let errorMessage = error.message || "Failed to create campaign. Please try again.";
        
        if (error.response?.status === 404) {
          errorMessage = `Endpoint not found (404): ${error.config?.url}\n\nThis usually means:\n1. Backend route not registered\n2. Wrong API base URL\n3. Backend server not running\n\nCurrent API_BASE_URL: ${API_BASE_URL}`;
        } else if (error.response?.data) {
          errorMessage = error.response.data.error || 
                        error.response.data.message || 
                        error.response.data.fb?.message ||
                        errorMessage;
        }
        
        console.error("Full error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        });
        
        Alert.alert("Error", errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Create AdSet
  const handleCreateAdSet = async () => {
    // Wait for subscription to finish loading
    if (subscriptionLoading) {
      // Show loader - subscription loading state will be handled by the component
      // Wait for subscription to load, then proceed
      const checkSubscription = setInterval(() => {
        if (!subscriptionLoading) {
          clearInterval(checkSubscription);
          // Retry the action after subscription loads
          setTimeout(() => handleCreateAdSet(), 100);
        }
      }, 100);
      return;
    }

    // Check subscription
    console.log("🔍 MetaAdsScreen: Checking subscription for create adset");
    if (!hasActiveSubscription(subscription) || !hasFeatureAccess(subscription, "meta-ads")) {
      console.log("❌ MetaAdsScreen: Subscription check failed for adset");
      setShowUpgradeModal(true);
      return;
    }
    
    console.log("✅ MetaAdsScreen: Subscription check passed - allowing adset creation");
    
    if (!adSetName.trim()) {
      Alert.alert("Error", "Please enter an ad set name");
      return;
    }
    if (!budget || parseFloat(budget) <= 0) {
      Alert.alert("Error", "Please enter a valid daily budget (minimum ₹225.00)");
      return;
    }
    if (parseFloat(budget) < 225) {
      Alert.alert("Error", "Daily budget must be at least ₹225.00");
      return;
    }
    if (customLocations.length === 0) {
      Alert.alert("Error", "Please search for a location using Google Places to add custom_locations for targeting");
      return;
    }
    if (publisherPlatforms.length === 0) {
      Alert.alert("Error", "Please select at least one publisher platform");
      return;
    }
    // Determine the active campaign objective
    const activeObjective = campaignObjective || objective;
    // Only require pageId if campaign objective is NOT OUTCOME_ENGAGEMENT
    if (activeObjective !== "OUTCOME_ENGAGEMENT" && (!pageId || !pageId.trim())) {
      Alert.alert("Error", "Please select a Facebook page");
      return;
    }
    // For OUTCOME_LEADS campaigns, destination type is automatically set to LEAD_FORM
    // For OUTCOME_AWARENESS campaigns, destination type is not required
    if (activeObjective !== "OUTCOME_LEADS" && activeObjective !== "OUTCOME_AWARENESS" && !destinationType) {
      Alert.alert("Error", "Please select a destination type");
      return;
    }
    if (destinationType === "WHATSAPP" && !whatsappNumber.trim()) {
      Alert.alert("Error", "WhatsApp Business Number is required for WhatsApp destination type");
      return;
    }
    if ((optimizationGoal === "APP_INSTALLS" || optimizationGoal === "APP_ENGAGEMENT") && (!appId || !objectStoreUrl)) {
      Alert.alert("Error", "App ID and App Store URL are required for APP_INSTALLS or APP_ENGAGEMENT optimization goals");
      return;
    }
    if (optimizationGoal === "OFFSITE_CONVERSIONS" && (!pixelId || !conversionEvent)) {
      Alert.alert("Error", "Facebook Pixel ID and Conversion Event are required for OFFSITE_CONVERSIONS optimization goal");
      return;
    }
    if (bidStrategy === "LOWEST_COST_WITH_BID_CAP" && (!bidAmount || parseFloat(bidAmount) <= 0)) {
      Alert.alert("Error", "Bid Amount is required for the selected bid strategy");
      return;
    }
    if (bidStrategy === "COST_CAP" && (!bidAmount || parseFloat(bidAmount) <= 0)) {
      Alert.alert("Error", "Bid Amount is required for the selected bid strategy");
      return;
    }
    // Validate COST_CAP compatibility with optimization goal
    // COST_CAP is not compatible with engagement-based optimization goals
    const engagementGoals = ["CONVERSATIONS", "POST_ENGAGEMENT", "PAGE_LIKES", "EVENT_RESPONSES", "THRUPLAY"];
    if (bidStrategy === "COST_CAP" && engagementGoals.includes(optimizationGoal)) {
      Alert.alert(
        "Error", 
        `COST_CAP bid strategy is not compatible with ${optimizationGoal} optimization goal. Please select a different optimization goal (e.g., LINK_CLICKS, LANDING_PAGE_VIEWS, OFFSITE_CONVERSIONS) or use a different bid strategy.`
      );
      return;
    }
    if (bidStrategy === "LOWEST_COST_WITH_MIN_ROAS" && (!bidConstraints.roas_average_floor || parseFloat(bidConstraints.roas_average_floor) <= 0)) {
      Alert.alert("Error", "ROAS Average Floor is required for ROAS Goal bid strategy");
      return;
    }

    // Validate all custom locations have valid radius (2-17 km)
    const invalidLocations = customLocations.filter(loc => {
      const radius = parseInt(loc.radius);
      return isNaN(radius) || radius < 2 || radius > 17;
    });
    
    if (invalidLocations.length > 0) {
      Alert.alert("Error", "All custom locations must have a radius between 2 km and 17 km. Please adjust the radius values.");
      return;
    }

    setIsLoading(true);

    try {
      const billingEvent = "IMPRESSIONS"; // Default for new accounts
      
      // Build geo_locations object
      const geoLocations = {};
      
      // Add custom_locations from Google Places
      geoLocations.custom_locations = customLocations.map(loc => {
        const radius = parseInt(loc.radius);
        const validRadius = Math.max(2, Math.min(17, isNaN(radius) ? 5 : radius));
        return {
          latitude: parseFloat(loc.latitude),
          longitude: parseFloat(loc.longitude),
          radius: validRadius,
          distance_unit: "kilometer"
        };
      });
      
      // Build targeting data object
      const targetingData = {
        geo_locations: geoLocations,
        age_min: parseInt(targeting.ageMin) || 18,
        age_max: parseInt(targeting.ageMax) || 45,
        publisher_platforms: publisherPlatforms,
      };
      
      // Add positions
      if (facebookPositions.length > 0) {
        targetingData.facebook_positions = facebookPositions;
      }
      if (instagramPositions.length > 0) {
        targetingData.instagram_positions = instagramPositions;
      }
      
      // Add device platforms
      if (devicePlatforms.length > 0) {
        targetingData.device_platforms = devicePlatforms;
      }
      
      // Add genders if selected
      if (genders.length > 0) {
        targetingData.genders = genders;
      }

      // Use same API endpoint and payload structure as web version
      // Build AdSet payload matching web structure based on campaign type
      let adsetPayload;
      let adsetEndpoint;
      let destinationTypeValue;
      
      if (campaignType === "whatsapp") {
        adsetPayload = {
          name: adSetName,
          campaign_id: createdCampaignId,
          daily_budget: budget.toString(),
          page_id: pageId || "", // Required for WhatsApp
          destination_type: "WHATSAPP",
          optimization_goal: "CONVERSATIONS",
          billing_event: "IMPRESSIONS",
          status: "PAUSED",
          targeting: targetingData,
        };
        adsetEndpoint = `${API_BASE_URL}/click-to-whatsapp/adsets`;
        destinationTypeValue = "WHATSAPP";
      } else if (campaignType === "call") {
        adsetPayload = {
          name: adSetName,
          campaign_id: createdCampaignId,
          daily_budget: budget.toString(),
          destination_type: "PHONE_CALL",
          optimization_goal: "QUALITY_CALL",
          billing_event: "IMPRESSIONS",
          status: "PAUSED",
          targeting: targetingData,
        };
        adsetEndpoint = `${API_BASE_URL}/click-to-call/adsets`;
        destinationTypeValue = "PHONE_CALL";
      } else if (campaignType === "link") {
        adsetPayload = {
          name: adSetName,
          campaign_id: createdCampaignId,
          daily_budget: budget.toString(),
          destination_type: "WEBSITE",
          optimization_goal: "LINK_CLICKS",
          billing_event: "IMPRESSIONS",
          status: "PAUSED",
          targeting: targetingData,
        };
        adsetEndpoint = `${API_BASE_URL}/click-to-link/adsets`;
        destinationTypeValue = "WEBSITE";
      } else {
        Alert.alert("Error", "Invalid campaign type");
        setIsLoading(false);
        return;
      }

      const adSetResponse = await axios.post(
        adsetEndpoint,
        adsetPayload,
        {
          headers: {
            "Content-Type": "application/json",
            "act_ad_account_id": adAccountId,
            "fb_token": accessToken,
          },
        }
      );

      if (!adSetResponse.data.success && !adSetResponse.data.data) {
        throw new Error(adSetResponse.data.error || adSetResponse.data.message || "Failed to create ad set");
      }

      // Handle both response formats: { success: true, data: { id } } or { data: { id } }
      const adSetId = adSetResponse.data.data?.id || adSetResponse.data.id;
      if (!adSetId) {
        throw new Error("Ad Set ID not found in response");
      }

      setCreatedAdSetId(adSetId);
      setAdSetDestinationType(destinationTypeValue);
      
      setStep(3); // Move to AdCreative creation step (new step 3)
      
      Alert.alert("Success", "AdSet created successfully! Now create an Ad Creative.");
    } catch (error) {
      console.error("Error creating ad set:", error);
      
      // Check for token expiration
      const { handleTokenExpiration } = require("../../utils/metaErrorHandler");
      const wasTokenExpired = await handleTokenExpiration(error, () => {
        setIsConnected(false);
      });
      
      if (!wasTokenExpired) {
        Alert.alert(
          "Error",
          error.response?.data?.fb?.message ||
            error.response?.data?.message ||
            error.message ||
            "Failed to create ad set. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Create AdCreative - matching web flow
  const handleCreateAdCreative = async () => {
    // Wait for subscription to finish loading
    if (subscriptionLoading) {
      const checkSubscription = setInterval(() => {
        if (!subscriptionLoading) {
          clearInterval(checkSubscription);
          setTimeout(() => handleCreateAdCreative(), 100);
        }
      }, 100);
      return;
    }

    // Check subscription
    console.log("🔍 MetaAdsScreen: Checking subscription for create ad creative");
    if (!hasActiveSubscription(subscription) || !hasFeatureAccess(subscription, "meta-ads")) {
      console.log("❌ MetaAdsScreen: Subscription check failed for ad creative");
      setShowUpgradeModal(true);
      return;
    }
    
    console.log("✅ MetaAdsScreen: Subscription check passed - allowing ad creative creation");
    
    if (!creativeName.trim()) {
      Alert.alert("Error", "Please enter an ad creative name");
      return;
    }
    if (!creativePageId.trim()) {
      Alert.alert("Error", "Please select a Facebook page");
      return;
    }
    if (!pictureUrl.trim()) {
      Alert.alert("Error", "Please enter a picture URL");
      return;
    }
    if (!businessPageUrl.trim()) {
      Alert.alert("Error", "Please enter a business page URL");
      return;
    }
    if (!creativePhoneNumber.trim()) {
      Alert.alert("Error", "Please enter a phone number");
      return;
    }

    setIsLoading(true);

    try {
      // Use same API endpoint and payload structure as web version
      const creativePayload = {
        name: creativeName,
        page_id: creativePageId,
        picture_url: pictureUrl,
        business_page_url: businessPageUrl,
        phone_number: creativePhoneNumber,
      };

      const creativeResponse = await axios.post(
        `${API_BASE_URL}/click-to-call/adcreatives`,
        creativePayload,
        {
          headers: {
            "Content-Type": "application/json",
            "act_ad_account_id": adAccountId,
            "fb_token": accessToken,
          },
        }
      );

      if (!creativeResponse.data.success && !creativeResponse.data.data) {
        throw new Error(creativeResponse.data.error || creativeResponse.data.message || "Failed to create ad creative");
      }

      // Handle both response formats: { success: true, data: { id } } or { data: { id } }
      const creativeId = creativeResponse.data.data?.id || creativeResponse.data.id;
      if (!creativeId) {
        throw new Error("Creative ID not found in response");
      }

      setCreatedCreativeId(creativeId);
      setAdName(`${creativeName} - Ad`);
      setStep(4); // Move to Ad creation step (step 4)
      
      Alert.alert("Success", "Ad Creative created successfully! Now create an Ad.");
    } catch (error) {
      console.error("Error creating ad creative:", error);
      
      // Check for token expiration
      const { handleTokenExpiration } = require("../../utils/metaErrorHandler");
      const wasTokenExpired = await handleTokenExpiration(error, () => {
        setIsConnected(false);
      });
      
      if (!wasTokenExpired) {
        Alert.alert(
          "Error",
          error.response?.data?.error ||
            error.response?.data?.message ||
            error.message ||
            "Failed to create ad creative. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 4: Create Ad - updated from step 3
  const handleCreateAd = async () => {
    // Wait for subscription to finish loading
    if (subscriptionLoading) {
      // Show loader - subscription loading state will be handled by the component
      // Wait for subscription to load, then proceed
      const checkSubscription = setInterval(() => {
        if (!subscriptionLoading) {
          clearInterval(checkSubscription);
          // Retry the action after subscription loads
          setTimeout(() => handleCreateAd(), 100);
        }
      }, 100);
      return;
    }

    // Check subscription
    console.log("🔍 MetaAdsScreen: Checking subscription for create ad");
    if (!hasActiveSubscription(subscription) || !hasFeatureAccess(subscription, "meta-ads")) {
      console.log("❌ MetaAdsScreen: Subscription check failed for ad");
      setShowUpgradeModal(true);
      return;
    }
    
    console.log("✅ MetaAdsScreen: Subscription check passed - allowing ad creation");
    
    // Simplified validation for Call campaigns - matching web flow
    if (!adName.trim()) {
      Alert.alert("Error", "Please enter an ad name");
      return;
    }

    if (!createdCreativeId) {
      Alert.alert("Error", "Creative ID is missing. Please create an Ad Creative first.");
      return;
    }

    if (!createdAdSetId) {
      Alert.alert("Error", "Ad Set ID is missing. Please create an Ad Set first.");
      return;
    }

    setIsLoading(true);

    try {
      // Use same API endpoint and payload structure as web version

      const adPayload = {
        adset_id: createdAdSetId,
        creative_id: createdCreativeId,
        status: "PAUSED",
      };

      // Determine API endpoint based on campaign type
      let adEndpoint;
      if (campaignType === "whatsapp") {
        adEndpoint = `${API_BASE_URL}/click-to-whatsapp/ads`;
      } else if (campaignType === "call") {
        adEndpoint = `${API_BASE_URL}/click-to-call/ads`;
      } else if (campaignType === "link") {
        adEndpoint = `${API_BASE_URL}/click-to-link/ads`;
      } else {
        Alert.alert("Error", "Invalid campaign type");
        setIsLoading(false);
        return;
      }

      const adResponse = await axios.post(
        adEndpoint,
        adPayload,
        {
          headers: {
            "Content-Type": "application/json",
            "act_ad_account_id": adAccountId,
            "fb_token": accessToken,
          },
        }
      );

      if (!adResponse.data.success && !adResponse.data.data) {
        throw new Error(adResponse.data.error || adResponse.data.message || "Failed to create ad");
      }

      // Handle both response formats: { success: true, data: { id } } or { data: { id } }
      const adId = adResponse.data.data?.id || adResponse.data.id;
      console.log("Ad created successfully:", adId);
      
      Alert.alert("Success", "Campaign, AdSet, and Ad created successfully!", [
        {
          text: "OK",
          onPress: () => {
            // Reset form
            setCampaignName("");
            setAdSetName("");
            setAdName("");
            setBudget("");
            setDestinationType("");
            setWhatsappNumber("");
            setCustomLocations([]);
            setAdCreative({
              primaryText: "",
              headline: "",
              description: "",
              media: null,
              mediaUrl: null,
            });
            setCreatedCampaignId(null);
            setCreatedAdSetId(null);
            setStep(1);
            setActiveTab("manage");
          },
        },
      ]);
    } catch (error) {
      console.error("Error creating ad:", error);
      
      // Check for token expiration
      const { handleTokenExpiration } = require("../../utils/metaErrorHandler");
      const wasTokenExpired = await handleTokenExpiration(error, () => {
        setIsConnected(false);
      });
      
      if (!wasTokenExpired) {
        Alert.alert(
          "Error",
          error.response?.data?.fb?.message ||
            error.response?.data?.message ||
            error.message ||
            "Failed to create ad. Please try again."
        );
      }
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
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === "overview" ? (
        <AccountOverview />
      ) : activeTab === "manage" ? (
        <MetaCompaigns />
      ) : activeTab === "analytics" ? (
        <AnalyticsScreen />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {activeTab === "create" ? (
            <>
              {step === 0 && (
                <>
                  {/* Campaign Type Selection Screen */}
                  <View style={styles.section}>
                    <SectionHeader title="Select Campaign Type" />
                    <Text style={[styles.inputLabel, { marginBottom: 20, textAlign: "center" }]}>
                      Choose the type of campaign you want to create
                    </Text>
                    
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 15, justifyContent: "center" }}>
                      {/* Click to WhatsApp */}
                      <TouchableOpacity
                        style={[
                          styles.campaignTypeCard,
                          { backgroundColor: "#9333EA" }, // Purple
                          campaignType === "whatsapp" && styles.campaignTypeCardSelected,
                        ]}
                        onPress={() => {
                          setCampaignType("whatsapp");
                          setStep(1);
                        }}
                      >
                        <FontAwesome name="whatsapp" size={40} color="#fff" style={{ opacity: 0.3, marginBottom: 10 }} />
                        <Text style={styles.campaignTypeText}>Click to WhatsApp</Text>
                      </TouchableOpacity>

                      {/* Click to Call */}
                      <TouchableOpacity
                        style={[
                          styles.campaignTypeCard,
                          { backgroundColor: "#F97316" }, // Orange
                          campaignType === "call" && styles.campaignTypeCardSelected,
                        ]}
                        onPress={() => {
                          setCampaignType("call");
                          setStep(1);
                        }}
                      >
                        <Feather name="phone" size={40} color="#fff" style={{ opacity: 0.3, marginBottom: 10 }} />
                        <Text style={styles.campaignTypeText}>Click to Call</Text>
                      </TouchableOpacity>

                      {/* Click to Link */}
                      <TouchableOpacity
                        style={[
                          styles.campaignTypeCard,
                          { backgroundColor: "#EC4899" }, // Pink
                          campaignType === "link" && styles.campaignTypeCardSelected,
                        ]}
                        onPress={() => {
                          setCampaignType("link");
                          setStep(1);
                        }}
                      >
                        <Feather name="link" size={40} color="#fff" style={{ opacity: 0.3, marginBottom: 10 }} />
                        <Text style={styles.campaignTypeText}>Click to Link</Text>
                      </TouchableOpacity>

                      {/* Lead Form Ads */}
                      <TouchableOpacity
                        style={[
                          styles.campaignTypeCard,
                          { backgroundColor: "#3B82F6" }, // Blue
                          campaignType === "lead-form" && styles.campaignTypeCardSelected,
                        ]}
                        onPress={() => {
                          setCampaignType("lead-form");
                          setStep(1);
                        }}
                      >
                        <MaterialIcons name="description" size={40} color="#fff" style={{ opacity: 0.3, marginBottom: 10 }} />
                        <Text style={styles.campaignTypeText}>Lead Form Ads</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}

              {step === 1 && campaignType && (
                <>
                  {campaignType === "whatsapp" && (
                    <WhatsAppCampaign
                      onNext={(data) => {
                        setCampaignData(data);
                        setCreatedCampaignId(data.campaign_id);
                        setStep(2);
                      }}
                      onBack={() => setStep(0)}
                    />
                  )}
                  {campaignType === "call" && (
                    <CallCampaign
                      onNext={(data) => {
                        setCampaignData(data);
                        setCreatedCampaignId(data.campaign_id);
                        setStep(2);
                      }}
                      onBack={() => setStep(0)}
                    />
                  )}
                  {campaignType === "link" && (
                    <LinkCampaign
                      onNext={(data) => {
                        setCampaignData(data);
                        setCreatedCampaignId(data.campaign_id);
                        setStep(2);
                      }}
                      onBack={() => setStep(0)}
                    />
                  )}
                  {campaignType === "lead-form" && (
                    <>
                      <CampaignDetails
                        campaignName={campaignName}
                        setCampaignName={setCampaignName}
                        budget={budget}
                        setBudget={setBudget}
                        objective={objective}
                        setObjective={setObjective}
                        destinationType={destinationType}
                        setDestinationType={setDestinationType}
                        whatsappNumber={whatsappNumber}
                        setWhatsappNumber={setWhatsappNumber}
                        campaignType={campaignType}
                      />
                      <View style={{ flexDirection: "row", gap: 15, marginTop: 20 }}>
                        <TouchableOpacity
                          style={[styles.launchButton, { flex: 1, backgroundColor: "#8B9DC3" }]}
                          onPress={() => setStep(0)}
                        >
                          <Text style={styles.launchButtonText}>Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.launchButton, { flex: 1 }, isLoading && styles.launchButtonDisabled]}
                          onPress={handleCreateCampaign}
                          disabled={isLoading || !campaignName.trim()}
                        >
                          {isLoading ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <Text style={styles.launchButtonText}>Create Campaign</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </>
              )}

              {step === 2 && campaignType && (
                <>
                  {campaignType === "whatsapp" && (
                    <WhatsAppAdSet
                      campaignData={campaignData}
                      onNext={(data) => {
                        setCampaignData(data);
                        setCreatedAdSetId(data.adset_id);
                        setStep(3);
                      }}
                      onBack={() => setStep(1)}
                    />
                  )}
                  {campaignType === "call" && (
                    <CallAdSet
                      campaignData={campaignData}
                      onNext={(data) => {
                        setCampaignData(data);
                        setCreatedAdSetId(data.adset_id);
                        setStep(3);
                      }}
                      onBack={() => setStep(1)}
                    />
                  )}
                  {campaignType === "link" && (
                    <LinkAdSet
                      campaignData={campaignData}
                      onNext={(data) => {
                        setCampaignData(data);
                        setCreatedAdSetId(data.adset_id);
                        setStep(3);
                      }}
                      onBack={() => setStep(1)}
                    />
                  )}
                  {campaignType === "lead-form" && (
                    <>
                      <AdSetDetails
                        adSetName={adSetName}
                        setAdSetName={setAdSetName}
                        budget={budget}
                        setBudget={setBudget}
                        pageId={pageId}
                        setPageId={setPageId}
                        pages={pages}
                        loadingPages={loadingPages}
                        optimizationGoal={optimizationGoal}
                        setOptimizationGoal={setOptimizationGoal}
                        allowedOptimizationGoals={allowedOptimizationGoals}
                        optimizationGoalNames={optimizationGoalNames}
                        campaignObjectiveNames={campaignObjectiveNames}
                        campaignObjective={campaignObjective}
                        objective={objective}
                        destinationType={destinationType}
                        setDestinationType={setDestinationType}
                        whatsappNumber={whatsappNumber}
                        setWhatsappNumber={setWhatsappNumber}
                        bidStrategy={bidStrategy}
                        setBidStrategy={setBidStrategy}
                        bidAmount={bidAmount}
                        setBidAmount={setBidAmount}
                        bidConstraints={bidConstraints}
                        setBidConstraints={setBidConstraints}
                        appId={appId}
                        setAppId={setAppId}
                        objectStoreUrl={objectStoreUrl}
                        setObjectStoreUrl={setObjectStoreUrl}
                        pixelId={pixelId}
                        setPixelId={setPixelId}
                        conversionEvent={conversionEvent}
                        setConversionEvent={setConversionEvent}
                        targeting={targeting}
                        setTargeting={setTargeting}
                        customLocations={customLocations}
                        setCustomLocations={setCustomLocations}
                        selectedPlace={selectedPlace}
                        setSelectedPlace={setSelectedPlace}
                        handlePlaceSelect={handlePlaceSelect}
                        publisherPlatforms={publisherPlatforms}
                        setPublisherPlatforms={setPublisherPlatforms}
                        facebookPositions={facebookPositions}
                        setFacebookPositions={setFacebookPositions}
                        instagramPositions={instagramPositions}
                        setInstagramPositions={setInstagramPositions}
                        devicePlatforms={devicePlatforms}
                        setDevicePlatforms={setDevicePlatforms}
                        genders={genders}
                        setGenders={setGenders}
                        campaignType={campaignType}
                      />
                      <View style={{ flexDirection: "row", gap: 15, marginTop: 20 }}>
                        <TouchableOpacity
                          style={[styles.launchButton, { flex: 1, backgroundColor: "#8B9DC3" }]}
                          onPress={() => setStep(1)}
                        >
                          <Text style={styles.launchButtonText}>Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.launchButton,
                            { flex: 1 },
                            isLoading && styles.launchButtonDisabled,
                          ]}
                          onPress={handleCreateAdSet}
                          disabled={
                            isLoading ||
                            !adSetName.trim() ||
                            !budget ||
                            parseFloat(budget) < 225 ||
                            customLocations.length === 0 ||
                            publisherPlatforms.length === 0 ||
                            ((campaignObjective || objective) !== "OUTCOME_ENGAGEMENT" && !pageId) ||
                            ((campaignObjective || objective) !== "OUTCOME_LEADS" && (campaignObjective || objective) !== "OUTCOME_AWARENESS" && !destinationType) ||
                            (destinationType === "WHATSAPP" && !whatsappNumber) ||
                            ((optimizationGoal === "APP_INSTALLS" || optimizationGoal === "APP_ENGAGEMENT") && (!appId || !objectStoreUrl)) ||
                            (optimizationGoal === "OFFSITE_CONVERSIONS" && (!pixelId || !conversionEvent)) ||
                            (bidStrategy === "LOWEST_COST_WITH_BID_CAP" && (!bidAmount || parseFloat(bidAmount) <= 0)) ||
                            (bidStrategy === "COST_CAP" && (!bidAmount || parseFloat(bidAmount) <= 0)) ||
                            (bidStrategy === "LOWEST_COST_WITH_MIN_ROAS" && (!bidConstraints.roas_average_floor || parseFloat(bidConstraints.roas_average_floor) <= 0))
                          }
                        >
                          {isLoading ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <Text style={styles.launchButtonText}>Create AdSet</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </>
              )}

              {step === 3 && campaignType && (
                <>
                  {campaignType === "whatsapp" && (
                    <WhatsAppAdCreative
                      campaignData={campaignData}
                      onNext={(data) => {
                        setCampaignData(data);
                        setCreatedCreativeId(data.creative_id);
                        setStep(4);
                      }}
                      onBack={() => setStep(2)}
                    />
                  )}
                  {campaignType === "call" && (
                    <CallAdCreative
                      campaignData={campaignData}
                      onNext={(data) => {
                        setCampaignData(data);
                        setCreatedCreativeId(data.creative_id);
                        setStep(4);
                      }}
                      onBack={() => setStep(2)}
                    />
                  )}
                  {campaignType === "link" && (
                    <LinkAdCreative
                      campaignData={campaignData}
                      onNext={(data) => {
                        setCampaignData(data);
                        setCreatedCreativeId(data.creative_id);
                        setStep(4);
                      }}
                      onBack={() => setStep(2)}
                    />
                  )}
                  {campaignType === "lead-form" && (
                    <>
                      {/* AdCreative Form - Step 3 - matching web flow */}
                      <View style={styles.section}>
                        <SectionHeader title="Step 3: Create Ad Creative" step={3} totalSteps={4} />
                        
                        <View style={styles.inputContainer}>
                          <Text style={styles.inputLabel}>Ad Creative Name <Text style={{ color: "#FF0000" }}>*</Text></Text>
                          <TextInput
                            style={styles.input}
                            placeholder="Enter ad creative name"
                            value={creativeName}
                            onChangeText={setCreativeName}
                          />
                        </View>

                        <View style={styles.inputContainer}>
                          <Text style={styles.inputLabel}>Page ID <Text style={{ color: "#FF0000" }}>*</Text></Text>
                          {loadingPages ? (
                            <View style={[styles.input, { backgroundColor: "#F5F5F5" }]}>
                              <Text style={{ color: "#999" }}>Loading pages...</Text>
                            </View>
                          ) : pages.length > 0 ? (
                            <CustomSelect
                              options={pages.map(page => ({ label: `${page.name} (${page.id})`, value: page.id }))}
                              value={creativePageId}
                              onValueChange={setCreativePageId}
                              placeholder="Select a Facebook Page"
                            />
                          ) : (
                            <TextInput
                              style={styles.input}
                              placeholder="Enter your Facebook Page ID"
                              value={creativePageId}
                              onChangeText={setCreativePageId}
                            />
                          )}
                          <Text style={styles.inputHint}>Your Facebook Page ID where the ad will appear</Text>
                        </View>

                        <View style={styles.inputContainer}>
                          <Text style={styles.inputLabel}>Picture URL <Text style={{ color: "#FF0000" }}>*</Text></Text>
                          <TextInput
                            style={styles.input}
                            placeholder="https://example.com/image.jpg"
                            value={pictureUrl}
                            onChangeText={setPictureUrl}
                            keyboardType="url"
                            autoCapitalize="none"
                          />
                          <Text style={styles.inputHint}>URL of the image for your ad (must be publicly accessible)</Text>
                        </View>

                        <View style={styles.inputContainer}>
                          <Text style={styles.inputLabel}>Business Page URL <Text style={{ color: "#FF0000" }}>*</Text></Text>
                          <TextInput
                            style={styles.input}
                            placeholder="https://yourbusiness.com"
                            value={businessPageUrl}
                            onChangeText={setBusinessPageUrl}
                            keyboardType="url"
                            autoCapitalize="none"
                          />
                          <Text style={styles.inputHint}>URL of your business page or website</Text>
                        </View>
                      </View>

                      <View style={{ flexDirection: "row", gap: 15, marginTop: 20 }}>
                        <TouchableOpacity
                          style={[styles.launchButton, { flex: 1, backgroundColor: "#8B9DC3" }]}
                          onPress={() => setStep(2)}
                        >
                          <Text style={styles.launchButtonText}>Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.launchButton,
                            { flex: 1 },
                            isLoading && styles.launchButtonDisabled,
                          ]}
                          onPress={handleCreateAdCreative}
                          disabled={
                            isLoading ||
                            !creativeName.trim() ||
                            !creativePageId.trim() ||
                            !pictureUrl.trim() ||
                            !businessPageUrl.trim()
                          }
                        >
                          {isLoading ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <Text style={styles.launchButtonText}>Create Ad Creative</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </>
              )}

              {step === 4 && campaignType && (
                <>
                  {campaignType === "whatsapp" && (
                    <WhatsAppLaunch
                      campaignData={campaignData}
                      onComplete={() => {
                        setStep(0);
                        setCampaignType(null);
                        setCampaignData({});
                        setCreatedCampaignId(null);
                        setCreatedAdSetId(null);
                        setCreatedCreativeId(null);
                        setActiveTab("overview");
                      }}
                      onBack={() => setStep(3)}
                    />
                  )}
                  {campaignType === "call" && (
                    <CallLaunch
                      campaignData={campaignData}
                      onComplete={() => {
                        setStep(0);
                        setCampaignType(null);
                        setCampaignData({});
                        setCreatedCampaignId(null);
                        setCreatedAdSetId(null);
                        setCreatedCreativeId(null);
                        setActiveTab("overview");
                      }}
                      onBack={() => setStep(3)}
                    />
                  )}
                  {campaignType === "link" && (
                    <LinkLaunch
                      campaignData={campaignData}
                      onComplete={() => {
                        setStep(0);
                        setCampaignType(null);
                        setCampaignData({});
                        setCreatedCampaignId(null);
                        setCreatedAdSetId(null);
                        setCreatedCreativeId(null);
                        setActiveTab("overview");
                      }}
                      onBack={() => setStep(3)}
                    />
                  )}
                  {campaignType === "lead-form" && (
                    <>
                      {/* Ad Creation - Step 4 - simplified for Call campaigns */}
                      <View style={styles.section}>
                        <SectionHeader title="Step 4: Create Ad" step={4} totalSteps={4} />
                        
                        <View style={styles.inputContainer}>
                          <Text style={styles.inputLabel}>Ad Name <Text style={{ color: "#FF0000" }}>*</Text></Text>
                          <TextInput
                            style={styles.input}
                            placeholder="Enter ad name"
                            value={adName}
                            onChangeText={setAdName}
                          />
                        </View>

                        {createdCreativeId && (
                          <View style={{ marginTop: 15, padding: 10, backgroundColor: "#E3F2FD", borderRadius: 8 }}>
                            <Text style={[styles.inputLabel, { fontSize: 12 }]}>Creative ID:</Text>
                            <Text style={[styles.inputHint, { fontWeight: "600", marginTop: 4 }]}>
                              {createdCreativeId}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={{ flexDirection: "row", gap: 15, marginTop: 20 }}>
                        <TouchableOpacity
                          style={[styles.launchButton, { flex: 1, backgroundColor: "#8B9DC3" }]}
                          onPress={() => setStep(3)}
                        >
                          <Text style={styles.launchButtonText}>Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.launchButton,
                            { flex: 1, backgroundColor: "#4CAF50" },
                            isLoading && styles.launchButtonDisabled,
                          ]}
                          onPress={handleCreateAd}
                          disabled={isLoading || !adName.trim() || !createdCreativeId}
                        >
                          {isLoading ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <Text style={styles.launchButtonText}>Launch Ad</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </>
              )}
            </>
          ) : (
            <AnalyticsScreen />
          )}
        </ScrollView>
      )}

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

      {/* Loading Overlay */}
      <Modal
        visible={subscriptionLoading}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingModalContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingModalText}>Checking subscription...</Text>
          </View>
        </View>
      </Modal>

      {/* Upgrade Modal */}
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={async () => {
          setShowUpgradeModal(false);
          
          // Refresh subscription when modal closes (in case user just made payment)
          console.log("🔄 MetaAdsScreen: Refreshing subscription after modal close");
          await refreshSubscription();
          
          // Wait a moment for subscription state to update
          await new Promise(resolve => setTimeout(resolve, 500));
          
          console.log("✅ MetaAdsScreen: Subscription refreshed - user can now access Meta Ads");
        }}
        isPremiumFeature={false}
        featureName="Meta Ads"
      />
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
  campaignTypeCard: {
    width: "45%",
    aspectRatio: 1.2,
    borderRadius: 16,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  campaignTypeCardSelected: {
    borderWidth: 3,
    borderColor: "#fff",
    transform: [{ scale: 1.05 }],
  },
  campaignTypeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 10,
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
  inputHint: {
    fontSize: 12,
    color: "#606770",
    marginTop: 6,
  },
  requiredText: {
    color: "#E41E3F",
    fontSize: 12,
  },
  pickerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D8DEE6",
    backgroundColor: "#fff",
  },
  chipSelected: {
    backgroundColor: "#1877F2",
    borderColor: "#1877F2",
  },
  chipText: {
    fontSize: 14,
    color: "#606770",
    fontWeight: "500",
  },
  chipTextSelected: {
    color: "#fff",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkboxContainerSelected: {
    // Optional: Add selected state styling if needed
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#D8DEE6",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: "#1877F2",
    borderColor: "#1877F2",
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#1C1E21",
    fontWeight: "500",
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingModalContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    minWidth: 200,
  },
  loadingModalText: {
    marginTop: 16,
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
  },
});

export default MetaAdsScreen;
