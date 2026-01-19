import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  FlatList,
  Modal,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../../../config/api";
import PlacesAutocomplete from "../../PlacesAutocomplete";
import { searchWorkPosition, searchInterest, searchEmployer } from "../../../utils/metaTargetingSearch";

export default function CallAdSet({ campaignData, onNext, onBack }) {
  const [formData, setFormData] = useState({
    name: "",
    daily_budget: "",
    min_age: "18",
    max_age: "45",
    genders: [],
    targeting: {
      geo_locations: { countries: [] },
      device_platforms: [],
      publisher_platforms: [],
      facebook_positions: [],
      instagram_positions: [],
    },
  });
  const [customLocations, setCustomLocations] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [expandedLocations, setExpandedLocations] = useState(new Set()); // Track which location cards are expanded
  const [loading, setLoading] = useState(false);

  // Detailed Targeting States
  const [workPositionQuery, setWorkPositionQuery] = useState("");
  const [interestQuery, setInterestQuery] = useState("");
  const [employerQuery, setEmployerQuery] = useState("");
  const [workPositionResults, setWorkPositionResults] = useState([]);
  const [interestResults, setInterestResults] = useState([]);
  const [employerResults, setEmployerResults] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedWorkPositions, setSelectedWorkPositions] = useState([]);
  const [selectedEmployers, setSelectedEmployers] = useState([]);
  const [loadingWorkPosition, setLoadingWorkPosition] = useState(false);
  const [loadingInterest, setLoadingInterest] = useState(false);
  const [loadingEmployer, setLoadingEmployer] = useState(false);
  const [showWorkPositionModal, setShowWorkPositionModal] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [showEmployerModal, setShowEmployerModal] = useState(false);

  const countries = [
    { code: "US", name: "United States", flag: "🇺🇸" },
    { code: "CA", name: "Canada", flag: "🇨🇦" },
    { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
    { code: "AU", name: "Australia", flag: "🇦🇺" },
    { code: "IN", name: "India", flag: "🇮🇳" },
    { code: "DE", name: "Germany", flag: "🇩🇪" },
  ];

  const handlePlaceSelect = (placeInfo) => {
    if (placeInfo && placeInfo.location) {
      setSelectedPlace(placeInfo);
      const newCustomLocation = {
        latitude: placeInfo.location.lat,
        longitude: placeInfo.location.lng,
        radius: 5,
        distance_unit: "kilometer",
        name: placeInfo.name || "",
        address: placeInfo.address || "",
      };
      
      if (newCustomLocation.radius < 2) newCustomLocation.radius = 2;
      else if (newCustomLocation.radius > 17) newCustomLocation.radius = 17;
      
      const exists = customLocations.some(loc => 
        Math.abs(loc.latitude - newCustomLocation.latitude) < 0.0001 &&
        Math.abs(loc.longitude - newCustomLocation.longitude) < 0.0001
      );
      
      if (!exists) {
        setCustomLocations([...customLocations, newCustomLocation]);
        setTimeout(() => setSelectedPlace(null), 2000);
      }
    }
  };

  const handleCountryToggle = (countryCode) => {
    const currentCountries = formData.targeting.geo_locations.countries;
    const index = currentCountries.indexOf(countryCode);
    let newCountries;
    if (index > -1) {
      newCountries = currentCountries.filter(c => c !== countryCode);
    } else {
      newCountries = [...currentCountries, countryCode];
    }
    setFormData({
      ...formData,
      targeting: {
        ...formData.targeting,
        geo_locations: { countries: newCountries },
      },
    });
  };

  const handleGenderToggle = (genderValue) => {
    const genders = formData.genders;
    const index = genders.indexOf(genderValue);
    if (index > -1) {
      setFormData({
        ...formData,
        genders: genders.filter(g => g !== genderValue),
      });
    } else {
      setFormData({
        ...formData,
        genders: [...genders, genderValue],
      });
    }
  };

  const handlePublisherToggle = (publisher) => {
    const publishers = formData.targeting.publisher_platforms;
    const index = publishers.indexOf(publisher);
    if (index > -1) {
      setFormData({
        ...formData,
        targeting: {
          ...formData.targeting,
          publisher_platforms: publishers.filter(p => p !== publisher),
        },
      });
    } else {
      setFormData({
        ...formData,
        targeting: {
          ...formData.targeting,
          publisher_platforms: [...publishers, publisher],
        },
      });
    }
  };

  const handleFacebookPositionToggle = (position) => {
    const positions = formData.targeting.facebook_positions;
    const index = positions.indexOf(position);
    if (index > -1) {
      setFormData({
        ...formData,
        targeting: {
          ...formData.targeting,
          facebook_positions: positions.filter(p => p !== position),
        },
      });
    } else {
      setFormData({
        ...formData,
        targeting: {
          ...formData.targeting,
          facebook_positions: [...positions, position],
        },
      });
    }
  };

  const handleInstagramPositionToggle = (position) => {
    let positions = [...formData.targeting.instagram_positions];
    const index = positions.indexOf(position);
    if (index > -1) {
      positions.splice(index, 1);
      if (position === 'stream' && positions.includes('explore')) {
        const exploreIndex = positions.indexOf('explore');
        if (exploreIndex > -1) {
          positions.splice(exploreIndex, 1);
        }
      }
    } else {
      positions.push(position);
      if (position === 'explore' && !positions.includes('stream')) {
        positions.push('stream');
      }
    }
    setFormData({
      ...formData,
      targeting: {
        ...formData.targeting,
        instagram_positions: positions,
      },
    });
  };

  const handleDeviceToggle = (device) => {
    const devices = formData.targeting.device_platforms;
    const index = devices.indexOf(device);
    if (index > -1) {
      setFormData({
        ...formData,
        targeting: {
          ...formData.targeting,
          device_platforms: devices.filter(d => d !== device),
        },
      });
    } else {
      setFormData({
        ...formData,
        targeting: {
          ...formData.targeting,
          device_platforms: [...devices, device],
        },
      });
    }
  };

  // Detailed Targeting Functions
  const searchWorkPositions = async (query) => {
    if (!query || query.trim().length < 2) {
      setWorkPositionResults([]);
      return;
    }
    try {
      setLoadingWorkPosition(true);
      const fbToken = await AsyncStorage.getItem("fb_access_token") || await AsyncStorage.getItem("fb_token");
      if (!fbToken) {
        Alert.alert("Error", "Please connect your Meta account first");
        return;
      }
      const response = await searchWorkPosition(fbToken, query.trim());
      if (response.success) {
        setWorkPositionResults(response.data || []);
      } else {
        setWorkPositionResults([]);
        if (response.error) {
          console.error("Work position search error:", response.error);
        }
      }
    } catch (error) {
      console.error("Error searching work positions:", error);
      setWorkPositionResults([]);
    } finally {
      setLoadingWorkPosition(false);
    }
  };

  const searchInterests = async (query) => {
    if (!query || query.trim().length < 2) {
      setInterestResults([]);
      return;
    }
    try {
      setLoadingInterest(true);
      const fbToken = await AsyncStorage.getItem("fb_access_token") || await AsyncStorage.getItem("fb_token");
      if (!fbToken) {
        Alert.alert("Error", "Please connect your Meta account first");
        return;
      }
      const response = await searchInterest(fbToken, query.trim());
      if (response.success) {
        setInterestResults(response.data || []);
      } else {
        setInterestResults([]);
        if (response.error) {
          console.error("Interest search error:", response.error);
        }
      }
    } catch (error) {
      console.error("Error searching interests:", error);
      setInterestResults([]);
    } finally {
      setLoadingInterest(false);
    }
  };

  const searchEmployers = async (query) => {
    if (!query || query.trim().length < 2) {
      setEmployerResults([]);
      return;
    }
    try {
      setLoadingEmployer(true);
      const fbToken = await AsyncStorage.getItem("fb_access_token") || await AsyncStorage.getItem("fb_token");
      if (!fbToken) {
        Alert.alert("Error", "Please connect your Meta account first");
        return;
      }
      const response = await searchEmployer(fbToken, query.trim());
      if (response.success) {
        setEmployerResults(response.data || []);
      } else {
        setEmployerResults([]);
        if (response.error) {
          console.error("Employer search error:", response.error);
        }
      }
    } catch (error) {
      console.error("Error searching employers:", error);
      setEmployerResults([]);
    } finally {
      setLoadingEmployer(false);
    }
  };

  // Debounced search effects
  useEffect(() => {
    const timer = setTimeout(() => {
      if (workPositionQuery && workPositionQuery.trim().length >= 2) {
        searchWorkPositions(workPositionQuery);
      } else {
        setWorkPositionResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [workPositionQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (interestQuery && interestQuery.trim().length >= 2) {
        searchInterests(interestQuery);
      } else {
        setInterestResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [interestQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (employerQuery && employerQuery.trim().length >= 2) {
        searchEmployers(employerQuery);
      } else {
        setEmployerResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [employerQuery]);

  const handleSelectWorkPosition = (item) => {
    if (!selectedWorkPositions.find(pos => pos.id === item.id)) {
      setSelectedWorkPositions([...selectedWorkPositions, item]);
    }
    setWorkPositionQuery("");
    setWorkPositionResults([]);
    setShowWorkPositionModal(false);
  };

  const handleSelectInterest = (item) => {
    if (!selectedInterests.find(int => int.id === item.id)) {
      setSelectedInterests([...selectedInterests, item]);
    }
    setInterestQuery("");
    setInterestResults([]);
    setShowInterestModal(false);
  };

  const handleSelectEmployer = (item) => {
    if (!selectedEmployers.find(emp => emp.id === item.id)) {
      setSelectedEmployers([...selectedEmployers, item]);
    }
    setEmployerQuery("");
    setEmployerResults([]);
    setShowEmployerModal(false);
  };

  const removeWorkPosition = (id) => {
    setSelectedWorkPositions(selectedWorkPositions.filter(pos => pos.id !== id));
  };

  const removeInterest = (id) => {
    setSelectedInterests(selectedInterests.filter(int => int.id !== id));
  };

  const removeEmployer = (id) => {
    setSelectedEmployers(selectedEmployers.filter(emp => emp.id !== id));
  };

  const formatCoverage = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Please enter ad set name");
      return;
    }
    if (!formData.daily_budget) {
      Alert.alert("Error", "Please enter daily budget");
      return;
    }
    const budgetAmount = parseFloat(formData.daily_budget);
    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      Alert.alert("Error", "Please enter a valid daily budget amount");
      return;
    }
    if (parseInt(formData.min_age) < 13 || parseInt(formData.min_age) > 65) {
      Alert.alert("Error", "Min Age must be between 13 and 65");
      return;
    }
    if (parseInt(formData.max_age) < 13 || parseInt(formData.max_age) > 65) {
      Alert.alert("Error", "Max Age must be between 13 and 65");
      return;
    }
    if (parseInt(formData.min_age) > parseInt(formData.max_age)) {
      Alert.alert("Error", "Min Age cannot be greater than Max Age");
      return;
    }
    if (
      formData.targeting.geo_locations.countries.length === 0 &&
      customLocations.length === 0
    ) {
      Alert.alert("Error", "Please select at least one country or add a custom location");
      return;
    }
    if (customLocations.length > 0) {
      const invalidLocations = customLocations.filter(loc => 
        !loc.radius || loc.radius < 2 || loc.radius > 17
      );
      if (invalidLocations.length > 0) {
        Alert.alert("Error", "All custom locations must have a radius between 2 km and 17 km");
        return;
      }
    }
    if (formData.targeting.publisher_platforms.length === 0) {
      Alert.alert("Error", "Please select at least one publisher platform");
      return;
    }
    if (!campaignData?.campaign_id) {
      Alert.alert("Error", "Campaign ID is missing. Please create campaign first.");
      return;
    }

    const fbToken = await AsyncStorage.getItem("fb_access_token") || await AsyncStorage.getItem("fb_token");
    const actAdAccountId = await AsyncStorage.getItem("fb_ad_account_id") || await AsyncStorage.getItem("act_ad_account_id");

    if (!actAdAccountId || !fbToken) {
      Alert.alert("Error", "Please connect your Facebook account first");
      return;
    }

    setLoading(true);
    try {
      const geoLocations = {};
      if (customLocations.length > 0) {
        geoLocations.custom_locations = customLocations.map(loc => ({
          latitude: loc.latitude,
          longitude: loc.longitude,
          radius: loc.radius,
          distance_unit: loc.distance_unit || "kilometer"
        }));
        if (formData.targeting.geo_locations.countries.length > 0) {
          geoLocations.countries = formData.targeting.geo_locations.countries;
        }
      } else {
        geoLocations.countries = formData.targeting.geo_locations.countries;
      }

      const targeting = {
        geo_locations: geoLocations,
        device_platforms: formData.targeting.device_platforms,
        publisher_platforms: formData.targeting.publisher_platforms,
        age_min: parseInt(formData.min_age),
        age_max: parseInt(formData.max_age),
      };

      if (formData.genders.length > 0) {
        targeting.genders = formData.genders;
      }
      if (formData.targeting.facebook_positions.length > 0) {
        targeting.facebook_positions = formData.targeting.facebook_positions;
      }
      if (formData.targeting.instagram_positions.length > 0) {
        targeting.instagram_positions = formData.targeting.instagram_positions;
      }

      // Add detailed targeting if selected
      if (selectedInterests.length > 0) {
        targeting.interests = selectedInterests.map(int => int.id);
      }
      if (selectedWorkPositions.length > 0) {
        targeting.work_positions = selectedWorkPositions.map(pos => pos.id);
      }
      if (selectedEmployers.length > 0) {
        targeting.work_employers = selectedEmployers.map(emp => emp.id);
      }

      const adsetPayload = {
        act_ad_account_id: actAdAccountId,
        fb_token: fbToken,
        name: formData.name,
        campaign_id: campaignData.campaign_id,
        daily_budget: (parseFloat(formData.daily_budget) * 100).toString(), // Convert rupees to paise (×100)
        destination_type: "PHONE_CALL",
        optimization_goal: "QUALITY_CALL",
        billing_event: "IMPRESSIONS",
        status: "ACTIVE",
        targeting,
      };

      const response = await axios.post(
        `${API_BASE_URL}/click-to-call/adsets`,
        adsetPayload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Backend returns { success: true, data: result }
      // The adset ID is at response.data.data.id
      if (response.data && response.data.success && response.data.data && response.data.data.id) {
        onNext({
          ...campaignData,
          adset_id: response.data.data.id,
        });
      } else {
        console.error("Invalid response structure:", response.data);
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      Alert.alert("Error", error.response?.data?.error || error.message || "Failed to create ad set");
      console.error("Ad Set creation error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: "#FFF3E0" }]}>
          <MaterialCommunityIcons name="phone" size={32} color="#FF9800" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Create Ad Set - Call Campaign</Text>
          <Text style={styles.subtitle}>Configure your ad set settings for the call campaign</Text>
        </View>
      </View>

      {campaignData?.campaign_id && (
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Campaign Summary</Text>
          <Text style={styles.summaryText}>Name: {campaignData.name || "N/A"}</Text>
          <Text style={styles.summaryText}>Objective: {campaignData.objective || "N/A"}</Text>
        </View>
      )}

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Ad Set Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter ad set name"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Daily Budget (₹) <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter amount in rupees (e.g., 500)"
            keyboardType="numeric"
            value={formData.daily_budget}
            onChangeText={(text) => setFormData({ ...formData, daily_budget: text })}
          />
          <Text style={[styles.hint, { fontSize: 11, marginTop: 4 }]}>
            Amount will be converted to paise (×100) when submitting
          </Text>
        </View>

        <View style={{ marginTop: 20, borderTopWidth: 1, borderTopColor: "#E4E6EB", paddingTop: 20 }}>
          <Text style={[styles.label, { fontSize: 18, marginBottom: 15 }]}>Targeting</Text>

          <View style={[styles.inputContainer, { backgroundColor: "#E3F2FD", padding: 15, borderRadius: 8, marginBottom: 15 }]}>
            <Text style={styles.label}>Search Location *</Text>
            <Text style={[styles.hint, { marginBottom: 10 }]}>
              Search for a location using Google Places. You can add multiple locations - each will be automatically added to custom_locations for targeting.
            </Text>
            <PlacesAutocomplete
              value=""
              onChange={() => {}}
              onPlaceSelect={handlePlaceSelect}
              placeholder="Search for a location (e.g., city, address, landmark)"
            />
          </View>

          {selectedPlace && (
            <View style={[styles.inputContainer, { backgroundColor: "#E8F5E9", padding: 12, borderRadius: 8, marginBottom: 15 }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <Text style={[styles.label, { fontSize: 14 }]}>Preview:</Text>
                <TouchableOpacity onPress={() => setSelectedPlace(null)}>
                  <MaterialCommunityIcons name="close" size={20} color="#606770" />
                </TouchableOpacity>
              </View>
              {selectedPlace.name && (
                <Text style={styles.hint}><Text style={{ fontWeight: "600" }}>Name:</Text> {selectedPlace.name}</Text>
              )}
              {selectedPlace.address && (
                <Text style={styles.hint}><Text style={{ fontWeight: "600" }}>Address:</Text> {selectedPlace.address}</Text>
              )}
              {selectedPlace.location && (
                <Text style={[styles.hint, { fontSize: 11 }]}>
                  <Text style={{ fontWeight: "600" }}>Coordinates:</Text> {selectedPlace.location.lat.toFixed(6)}, {selectedPlace.location.lng.toFixed(6)}
                </Text>
              )}
            </View>
          )}

          {customLocations.length > 0 && (
            <View style={[styles.inputContainer, { backgroundColor: "#E3F2FD", padding: 15, borderRadius: 8, marginBottom: 15 }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text style={[styles.label, { fontSize: 14 }]}>Custom Locations ({customLocations.length})</Text>
                <TouchableOpacity onPress={() => { 
                  setCustomLocations([]); 
                  setSelectedPlace(null);
                  setExpandedLocations(new Set());
                }}>
                  <Text style={{ color: "#E53935", fontSize: 12, fontWeight: "600" }}>Clear All</Text>
                </TouchableOpacity>
              </View>
              {customLocations.map((loc, idx) => {
                const isExpanded = expandedLocations.has(idx);
                return (
                  <View key={idx} style={{ backgroundColor: "#fff", borderRadius: 8, marginBottom: 10, overflow: "hidden", borderWidth: 1, borderColor: "#BBDEFB" }}>
                    {/* Accordion Header */}
                    <TouchableOpacity
                      onPress={() => {
                        const newExpanded = new Set(expandedLocations);
                        if (isExpanded) {
                          newExpanded.delete(idx);
                        } else {
                          newExpanded.add(idx);
                        }
                        setExpandedLocations(newExpanded);
                      }}
                      style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12 }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        {loc.name && <Text style={[styles.label, { fontSize: 13, marginBottom: 4 }]}>{loc.name}</Text>}
                        {loc.address && <Text style={[styles.hint, { fontSize: 11 }]} numberOfLines={1}>{loc.address}</Text>}
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            setCustomLocations(customLocations.filter((_, i) => i !== idx));
                            const newExpanded = new Set(expandedLocations);
                            newExpanded.delete(idx);
                            // Adjust indices for remaining items
                            const adjustedExpanded = new Set();
                            newExpanded.forEach((expandedIdx) => {
                              if (expandedIdx > idx) {
                                adjustedExpanded.add(expandedIdx - 1);
                              } else if (expandedIdx < idx) {
                                adjustedExpanded.add(expandedIdx);
                              }
                            });
                            setExpandedLocations(adjustedExpanded);
                          }}
                        >
                          <MaterialCommunityIcons name="close" size={18} color="#606770" />
                        </TouchableOpacity>
                        <MaterialCommunityIcons 
                          name={isExpanded ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color="#606770" 
                        />
                      </View>
                    </TouchableOpacity>
                    {/* Accordion Content */}
                    {isExpanded && (
                      <View style={{ paddingHorizontal: 12, paddingBottom: 12, borderTopWidth: 1, borderTopColor: "#E0E0E0" }}>
                        <View style={{ marginTop: 8, marginBottom: 8 }}>
                          <Text style={[styles.hint, { fontSize: 10, fontFamily: "monospace" }]}>
                            Lat: {loc.latitude.toFixed(6)}, Lng: {loc.longitude.toFixed(6)}
                          </Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <Text style={[styles.hint, { fontSize: 12 }]}>Radius:</Text>
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
                          <Text style={[styles.hint, { fontSize: 12 }]}>km</Text>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          <View style={{ flexDirection: "row", gap: 15 }}>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={styles.label}>Min Age <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={formData.min_age}
                onChangeText={(text) => setFormData({ ...formData, min_age: text })}
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={styles.label}>Max Age <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={formData.max_age}
                onChangeText={(text) => setFormData({ ...formData, max_age: text })}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Genders (Optional)</Text>
            <View style={{ flexDirection: "row", gap: 15, marginTop: 8 }}>
              {[
                { value: 1, label: "Male" },
                { value: 2, label: "Female" },
              ].map((gender) => (
                <TouchableOpacity
                  key={gender.value}
                  style={[
                    styles.checkboxContainer,
                    formData.genders.includes(gender.value) && styles.checkboxContainerSelected,
                  ]}
                  onPress={() => handleGenderToggle(gender.value)}
                >
                  <View style={[
                    styles.checkbox,
                    formData.genders.includes(gender.value) && styles.checkboxSelected,
                  ]}>
                    {formData.genders.includes(gender.value) && (
                      <MaterialCommunityIcons name="check" size={16} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>{gender.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.hint}>Leave empty to target all genders</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Countries <Text style={styles.required}>*</Text></Text>
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
                    formData.targeting.geo_locations.countries.includes(country.code)
                      ? { borderColor: "#FF9800", backgroundColor: "#FFF3E0" }
                      : { borderColor: "#D8DEE6", backgroundColor: "#fff" },
                  ]}
                >
                  <Text style={{ fontSize: 20, marginBottom: 4 }}>{country.flag}</Text>
                  <Text style={{ fontSize: 12, fontWeight: "500" }}>{country.name}</Text>
                  {formData.targeting.geo_locations.countries.includes(country.code) && (
                    <MaterialCommunityIcons name="check" size={16} color="#FF9800" style={{ marginTop: 4 }} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Publisher Platforms <Text style={styles.required}>*</Text></Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
              {[
                { value: "facebook", label: "Facebook", icon: "facebook" },
                { value: "instagram", label: "Instagram", icon: "instagram" },
                { value: "messenger", label: "Messenger", icon: "facebook-messenger" },
                { value: "audience_network", label: "Audience Network", icon: "web" },
              ].map((publisher) => (
                <TouchableOpacity
                  key={publisher.value}
                  onPress={() => handlePublisherToggle(publisher.value)}
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
                    formData.targeting.publisher_platforms.includes(publisher.value)
                      ? { borderColor: "#FF9800", backgroundColor: "#FFF3E0" }
                      : { borderColor: "#D8DEE6", backgroundColor: "#fff" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={publisher.icon}
                    size={20}
                    color={formData.targeting.publisher_platforms.includes(publisher.value) ? "#FF9800" : "#606770"}
                  />
                  <Text style={{ fontSize: 12, fontWeight: "500" }}>{publisher.label}</Text>
                  {formData.targeting.publisher_platforms.includes(publisher.value) && (
                    <MaterialCommunityIcons name="check" size={16} color="#FF9800" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Facebook Positions (Optional)</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
              {[
                { value: "feed", label: "Feed" },
                { value: "instant_article", label: "Instant Article" },
              ].map((position) => (
                <TouchableOpacity
                  key={position.value}
                  onPress={() => handleFacebookPositionToggle(position.value)}
                  style={[
                    {
                      padding: 12,
                      borderRadius: 8,
                      borderWidth: 2,
                      minWidth: 100,
                      alignItems: "center",
                    },
                    formData.targeting.facebook_positions.includes(position.value)
                      ? { borderColor: "#FF9800", backgroundColor: "#FFF3E0" }
                      : { borderColor: "#D8DEE6", backgroundColor: "#fff" },
                  ]}
                >
                  <Text style={{ fontSize: 12, fontWeight: "500" }}>{position.label}</Text>
                  {formData.targeting.facebook_positions.includes(position.value) && (
                    <MaterialCommunityIcons name="check" size={16} color="#FF9800" style={{ marginTop: 4 }} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.hint}>Leave empty to use all positions</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Instagram Positions (Optional)</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
              {[
                { value: "stream", label: "Feed" },
                { value: "reels", label: "Reels" },
                { value: "story", label: "Story" },
                { value: "explore", label: "Explore" },
              ].map((position) => (
                <TouchableOpacity
                  key={position.value}
                  onPress={() => handleInstagramPositionToggle(position.value)}
                  style={[
                    {
                      padding: 12,
                      borderRadius: 8,
                      borderWidth: 2,
                      minWidth: 100,
                      alignItems: "center",
                    },
                    formData.targeting.instagram_positions.includes(position.value)
                      ? { borderColor: "#FF9800", backgroundColor: "#FFF3E0" }
                      : { borderColor: "#D8DEE6", backgroundColor: "#fff" },
                  ]}
                >
                  <Text style={{ fontSize: 12, fontWeight: "500" }}>{position.label}</Text>
                  {formData.targeting.instagram_positions.includes(position.value) && (
                    <MaterialCommunityIcons name="check" size={16} color="#FF9800" style={{ marginTop: 4 }} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.hint}>Leave empty to use all positions</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Device Platforms (Optional)</Text>
            <View style={{ flexDirection: "row", gap: 15, marginTop: 8 }}>
              {[
                { value: "mobile", label: "Mobile" },
                { value: "desktop", label: "Desktop" },
              ].map((device) => (
                <TouchableOpacity
                  key={device.value}
                  style={[
                    styles.checkboxContainer,
                    formData.targeting.device_platforms.includes(device.value) && styles.checkboxContainerSelected,
                  ]}
                  onPress={() => handleDeviceToggle(device.value)}
                >
                  <View style={[
                    styles.checkbox,
                    formData.targeting.device_platforms.includes(device.value) && styles.checkboxSelected,
                  ]}>
                    {formData.targeting.device_platforms.includes(device.value) && (
                      <MaterialCommunityIcons name="check" size={16} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>{device.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.hint}>Leave empty to target all devices</Text>
          </View>

          {/* Detailed Targeting Section */}
          <View style={[styles.inputContainer, { marginTop: 20, borderTopWidth: 1, borderTopColor: "#E4E6EB", paddingTop: 20 }]}>
            <Text style={[styles.label, { fontSize: 18, marginBottom: 15 }]}>
              <MaterialCommunityIcons name="magnify" size={20} color="#FF9800" /> Detailed Targeting (Optional)
            </Text>
            <Text style={[styles.hint, { marginBottom: 15 }]}>
              Add interests, work positions, or employers to refine your audience targeting.
            </Text>

            {/* Interests */}
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.label}>
                <MaterialCommunityIcons name="heart" size={16} color="#EC4899" /> Interests
              </Text>
              <TouchableOpacity
                onPress={() => setShowInterestModal(true)}
                style={[styles.input, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
              >
                <Text style={{ color: interestQuery ? "#000" : "#999" }}>
                  {interestQuery || "Search interests (e.g., gaming, sports)"}
                </Text>
                <MaterialCommunityIcons name="magnify" size={20} color="#FF9800" />
              </TouchableOpacity>
              {selectedInterests.length > 0 && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                  {selectedInterests.map((item) => (
                    <View
                      key={item.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#FCE7F3",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        gap: 6,
                      }}
                    >
                      <Text style={{ color: "#BE185D", fontSize: 12 }}>{item.name}</Text>
                      <TouchableOpacity onPress={() => removeInterest(item.id)}>
                        <MaterialCommunityIcons name="close-circle" size={16} color="#BE185D" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Work Positions */}
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.label}>
                <MaterialCommunityIcons name="briefcase" size={16} color="#3B82F6" /> Work Positions
              </Text>
              <TouchableOpacity
                onPress={() => setShowWorkPositionModal(true)}
                style={[styles.input, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
              >
                <Text style={{ color: workPositionQuery ? "#000" : "#999" }}>
                  {workPositionQuery || "Search work positions (e.g., doctor, engineer)"}
                </Text>
                <MaterialCommunityIcons name="magnify" size={20} color="#FF9800" />
              </TouchableOpacity>
              {selectedWorkPositions.length > 0 && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                  {selectedWorkPositions.map((item) => (
                    <View
                      key={item.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#DBEAFE",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        gap: 6,
                      }}
                    >
                      <Text style={{ color: "#1E40AF", fontSize: 12 }}>{item.name}</Text>
                      <TouchableOpacity onPress={() => removeWorkPosition(item.id)}>
                        <MaterialCommunityIcons name="close-circle" size={16} color="#1E40AF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Employers */}
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.label}>
                <MaterialCommunityIcons name="office-building" size={16} color="#F97316" /> Employers (Companies)
              </Text>
              <TouchableOpacity
                onPress={() => setShowEmployerModal(true)}
                style={[styles.input, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
              >
                <Text style={{ color: employerQuery ? "#000" : "#999" }}>
                  {employerQuery || "Search employers/companies (e.g., hospital, tech company)"}
                </Text>
                <MaterialCommunityIcons name="magnify" size={20} color="#FF9800" />
              </TouchableOpacity>
              {selectedEmployers.length > 0 && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                  {selectedEmployers.map((item) => (
                    <View
                      key={item.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#FFEDD5",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        gap: 6,
                      }}
                    >
                      <Text style={{ color: "#9A3412", fontSize: 12 }}>{item.name}</Text>
                      <TouchableOpacity onPress={() => removeEmployer(item.id)}>
                        <MaterialCommunityIcons name="close-circle" size={16} color="#9A3412" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Search Modals */}
        {/* Interest Search Modal */}
        <Modal
          visible={showInterestModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => {
            setShowInterestModal(false);
            setInterestQuery("");
            setInterestResults([]);
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Search Interests</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowInterestModal(false);
                  setInterestQuery("");
                  setInterestResults([]);
                }}
              >
                <MaterialCommunityIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Search interests (e.g., gaming, sports)"
              value={interestQuery}
              onChangeText={setInterestQuery}
              autoFocus
            />
            {loadingInterest && (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#FF9800" />
              </View>
            )}
            <FlatList
              data={interestResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSelectInterest(item)}
                >
                  <Text style={styles.modalItemName}>{item.name}</Text>
                  {item.audience_size && (
                    <Text style={styles.modalItemMeta}>
                      Audience: {formatCoverage(item.audience_size)}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                interestQuery.length >= 2 && !loadingInterest ? (
                  <Text style={styles.modalEmptyText}>No results found</Text>
                ) : null
              }
            />
          </View>
        </Modal>

        {/* Work Position Search Modal */}
        <Modal
          visible={showWorkPositionModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => {
            setShowWorkPositionModal(false);
            setWorkPositionQuery("");
            setWorkPositionResults([]);
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Search Work Positions</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowWorkPositionModal(false);
                  setWorkPositionQuery("");
                  setWorkPositionResults([]);
                }}
              >
                <MaterialCommunityIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Search work positions (e.g., doctor, engineer)"
              value={workPositionQuery}
              onChangeText={setWorkPositionQuery}
              autoFocus
            />
            {loadingWorkPosition && (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#FF9800" />
              </View>
            )}
            <FlatList
              data={workPositionResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSelectWorkPosition(item)}
                >
                  <Text style={styles.modalItemName}>{item.name}</Text>
                  {item.coverage_lower_bound && item.coverage_upper_bound && (
                    <Text style={styles.modalItemMeta}>
                      Coverage: {formatCoverage(item.coverage_lower_bound)} - {formatCoverage(item.coverage_upper_bound)}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                workPositionQuery.length >= 2 && !loadingWorkPosition ? (
                  <Text style={styles.modalEmptyText}>No results found</Text>
                ) : null
              }
            />
          </View>
        </Modal>

        {/* Employer Search Modal */}
        <Modal
          visible={showEmployerModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => {
            setShowEmployerModal(false);
            setEmployerQuery("");
            setEmployerResults([]);
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Search Employers</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowEmployerModal(false);
                  setEmployerQuery("");
                  setEmployerResults([]);
                }}
              >
                <MaterialCommunityIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Search employers/companies (e.g., hospital, tech company)"
              value={employerQuery}
              onChangeText={setEmployerQuery}
              autoFocus
            />
            {loadingEmployer && (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#FF9800" />
              </View>
            )}
            <FlatList
              data={employerResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSelectEmployer(item)}
                >
                  <Text style={styles.modalItemName}>{item.name}</Text>
                  {item.coverage_lower_bound && item.coverage_upper_bound && (
                    <Text style={styles.modalItemMeta}>
                      Coverage: {formatCoverage(item.coverage_lower_bound)} - {formatCoverage(item.coverage_upper_bound)}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                employerQuery.length >= 2 && !loadingEmployer ? (
                  <Text style={styles.modalEmptyText}>No results found</Text>
                ) : null
              }
            />
          </View>
        </Modal>

        <View style={styles.buttonRow}>
          {onBack && (
            <TouchableOpacity style={[styles.button, styles.backButton]} onPress={onBack}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Create Ad Set</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E4E6EB",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1C1E21",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#606770",
  },
  summaryBox: {
    backgroundColor: "#F5F5F5",
    padding: 16,
    margin: 20,
    borderRadius: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1E21",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: "#606770",
    marginBottom: 4,
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1E21",
    marginBottom: 8,
  },
  required: {
    color: "#FF0000",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D8DEE6",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  hint: {
    fontSize: 12,
    color: "#606770",
    marginTop: 4,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D8DEE6",
  },
  checkboxContainerSelected: {
    borderColor: "#FF9800",
    backgroundColor: "#FFF3E0",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#D8DEE6",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: "#FF9800",
    borderColor: "#FF9800",
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#1C1E21",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    backgroundColor: "#8B9DC3",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#FF9800",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 50,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E4E6EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1C1E21",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#D8DEE6",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    margin: 20,
    marginBottom: 10,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E4E6EB",
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1C1E21",
    marginBottom: 4,
  },
  modalItemMeta: {
    fontSize: 12,
    color: "#606770",
  },
  modalEmptyText: {
    textAlign: "center",
    padding: 20,
    color: "#606770",
    fontSize: 14,
  },
});

