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
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../../../config/api";
import CustomSelect from "../../CustomSelect";
import PlacesAutocomplete from "../../PlacesAutocomplete";

export default function WhatsAppAdSet({ campaignData, onNext, onBack }) {
  const [formData, setFormData] = useState({
    name: "",
    daily_budget: "",
    page_id: "",
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
  const [pages, setPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [customLocations, setCustomLocations] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loading, setLoading] = useState(false);

  const countries = [
    { code: "US", name: "United States", flag: "🇺🇸" },
    { code: "CA", name: "Canada", flag: "🇨🇦" },
    { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
    { code: "AU", name: "Australia", flag: "🇦🇺" },
    { code: "IN", name: "India", flag: "🇮🇳" },
    { code: "DE", name: "Germany", flag: "🇩🇪" },
  ];

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoadingPages(true);
      const accessToken = await AsyncStorage.getItem("fb_access_token");
      if (!accessToken) {
        Alert.alert("Error", "Please connect your Facebook account first");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/ads/pages`, {
        headers: {
          "x-fb-access-token": accessToken,
        },
      });

      if (response.data.success) {
        let pagesData = [];
        if (response.data.pages?.data) {
          pagesData = response.data.pages.data;
        } else if (Array.isArray(response.data.pages)) {
          pagesData = response.data.pages;
        }

        setPages(pagesData);
        if (pagesData.length > 0 && !formData.page_id) {
          setFormData((prev) => ({
            ...prev,
            page_id: pagesData[0].id,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching pages:", error);
      Alert.alert("Error", "Failed to fetch Facebook pages. Please try again.");
    } finally {
      setLoadingPages(false);
    }
  };

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

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Please enter ad set name");
      return;
    }
    if (!formData.daily_budget) {
      Alert.alert("Error", "Please enter daily budget");
      return;
    }
    if (!formData.page_id.trim()) {
      Alert.alert("Error", "Please select Page ID");
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

      const adsetPayload = {
        act_ad_account_id: actAdAccountId,
        fb_token: fbToken,
        name: formData.name,
        campaign_id: campaignData.campaign_id,
        daily_budget: formData.daily_budget.toString(),
        page_id: formData.page_id,
        destination_type: "WHATSAPP",
        optimization_goal: "CONVERSATIONS",
        billing_event: "IMPRESSIONS",
        status: "PAUSED",
        targeting,
      };

      const response = await axios.post(
        `${API_BASE_URL}/click-to-whatsapp/adsets`,
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
          page_id: formData.page_id,
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
        <View style={[styles.iconContainer, { backgroundColor: "#F3E8FF" }]}>
          <MaterialCommunityIcons name="whatsapp" size={32} color="#9333EA" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Create Ad Set - WhatsApp Campaign</Text>
          <Text style={styles.subtitle}>Configure your ad set settings for the WhatsApp campaign</Text>
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

        <View style={{ flexDirection: "row", gap: 15 }}>
          <View style={[styles.inputContainer, { flex: 1 }]}>
            <Text style={styles.label}>
              Page ID <Text style={styles.required}>*</Text>
            </Text>
            {loadingPages ? (
              <View style={[styles.input, { backgroundColor: "#F5F5F5" }]}>
                <Text style={{ color: "#999" }}>Loading pages...</Text>
              </View>
            ) : pages.length > 0 ? (
              <CustomSelect
                label=""
                data={pages}
                onSelect={(selectedItem) => {
                  setFormData({ ...formData, page_id: selectedItem.id });
                }}
                placeholder="Select a Facebook Page"
                buttonTextAfterSelection={(selectedItem) => {
                  return `${selectedItem.name} (${selectedItem.id})`;
                }}
                rowTextForSelection={(item) => {
                  return `${item.name} (${item.id})`;
                }}
                defaultValue={pages.find((p) => p.id === formData.page_id) || null}
                buttonStyle={{ height: 48, backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, borderColor: "#D8DEE6", paddingHorizontal: 14 }}
                buttonTextStyle={{ fontSize: 16, color: !formData.page_id ? "#8B9DC3" : "#1C1E21", textAlign: "left" }}
              />
            ) : (
              <TextInput
                style={styles.input}
                placeholder="Enter Facebook Page ID"
                value={formData.page_id}
                onChangeText={(text) => setFormData({ ...formData, page_id: text })}
              />
            )}
          </View>
          <View style={[styles.inputContainer, { flex: 1 }]}>
            <Text style={styles.label}>
              Daily Budget <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter daily budget"
              keyboardType="numeric"
              value={formData.daily_budget}
              onChangeText={(text) => setFormData({ ...formData, daily_budget: text })}
            />
          </View>
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
                <TouchableOpacity onPress={() => { setCustomLocations([]); setSelectedPlace(null); }}>
                  <Text style={{ color: "#E53935", fontSize: 12, fontWeight: "600" }}>Clear All</Text>
                </TouchableOpacity>
              </View>
              {customLocations.map((loc, idx) => (
                <View key={idx} style={{ backgroundColor: "#fff", padding: 12, borderRadius: 8, marginBottom: 10 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <View style={{ flex: 1 }}>
                      {loc.name && <Text style={[styles.label, { fontSize: 13, marginBottom: 4 }]}>{loc.name}</Text>}
                      {loc.address && <Text style={[styles.hint, { fontSize: 11, marginBottom: 4 }]}>{loc.address}</Text>}
                      <Text style={[styles.hint, { fontSize: 10, fontFamily: "monospace" }]}>
                        Lat: {loc.latitude.toFixed(6)}, Lng: {loc.longitude.toFixed(6)}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setCustomLocations(customLocations.filter((_, i) => i !== idx))}>
                      <MaterialCommunityIcons name="close" size={18} color="#606770" />
                    </TouchableOpacity>
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
              ))}
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
                      ? { borderColor: "#9333EA", backgroundColor: "#F3E8FF" }
                      : { borderColor: "#D8DEE6", backgroundColor: "#fff" },
                  ]}
                >
                  <Text style={{ fontSize: 20, marginBottom: 4 }}>{country.flag}</Text>
                  <Text style={{ fontSize: 12, fontWeight: "500" }}>{country.name}</Text>
                  {formData.targeting.geo_locations.countries.includes(country.code) && (
                    <MaterialCommunityIcons name="check" size={16} color="#9333EA" style={{ marginTop: 4 }} />
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
                      ? { borderColor: "#9333EA", backgroundColor: "#F3E8FF" }
                      : { borderColor: "#D8DEE6", backgroundColor: "#fff" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={publisher.icon}
                    size={20}
                    color={formData.targeting.publisher_platforms.includes(publisher.value) ? "#9333EA" : "#606770"}
                  />
                  <Text style={{ fontSize: 12, fontWeight: "500" }}>{publisher.label}</Text>
                  {formData.targeting.publisher_platforms.includes(publisher.value) && (
                    <MaterialCommunityIcons name="check" size={16} color="#9333EA" />
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
                      ? { borderColor: "#9333EA", backgroundColor: "#F3E8FF" }
                      : { borderColor: "#D8DEE6", backgroundColor: "#fff" },
                  ]}
                >
                  <Text style={{ fontSize: 12, fontWeight: "500" }}>{position.label}</Text>
                  {formData.targeting.facebook_positions.includes(position.value) && (
                    <MaterialCommunityIcons name="check" size={16} color="#9333EA" style={{ marginTop: 4 }} />
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
                      ? { borderColor: "#9333EA", backgroundColor: "#F3E8FF" }
                      : { borderColor: "#D8DEE6", backgroundColor: "#fff" },
                  ]}
                >
                  <Text style={{ fontSize: 12, fontWeight: "500" }}>{position.label}</Text>
                  {formData.targeting.instagram_positions.includes(position.value) && (
                    <MaterialCommunityIcons name="check" size={16} color="#9333EA" style={{ marginTop: 4 }} />
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
        </View>

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
    borderColor: "#9333EA",
    backgroundColor: "#F3E8FF",
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
    backgroundColor: "#9333EA",
    borderColor: "#9333EA",
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
    backgroundColor: "#9333EA",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

