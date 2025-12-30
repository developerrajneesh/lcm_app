import React, { useState, useEffect, useRef } from "react";
import { View, TextInput, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";

const GOOGLE_PLACES_API_KEY = "AIzaSyBQNvf19m47XPrvwByhKcUnaBaienlDdF8";
// const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACE_APIKEY || "AIzaSyBQNvf19m47XPrvwByhKcUnaBaienlDdF8";

const PlacesAutocomplete = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Search for a location",
  style,
}) => {
  const [inputValue, setInputValue] = useState(value || "");
  const [predictions, setPredictions] = useState([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value || "");
    }
  }, [value]);

  const searchPlaces = async (query) => {
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // If query is too short, clear predictions
    if (!query || query.length < 2) {
      setPredictions([]);
      setShowPredictions(false);
      setLoading(false);
      return;
    }

    if (!GOOGLE_PLACES_API_KEY) {
      console.warn("Google Places API key not configured");
      return;
    }

    // Debounce the API call - wait 300ms after user stops typing
    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      console.log("🔍 PlacesAutocomplete: Searching for:", query);
      console.log("🔑 Using API Key:", GOOGLE_PLACES_API_KEY ? GOOGLE_PLACES_API_KEY.substring(0, 10) + "..." : "MISSING");
      
      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
          {
            params: {
              input: query,
              key: GOOGLE_PLACES_API_KEY,
              types: "geocode|establishment", // Fixed: removed parentheses
            },
          }
        );

        console.log("✅ PlacesAutocomplete: API Response:", response.data?.status);
        console.log("📋 PlacesAutocomplete: Predictions count:", response.data?.predictions?.length || 0);

        if (response.data) {
          if (response.data.status === "OK" && response.data.predictions) {
            console.log("✅ PlacesAutocomplete: Setting predictions");
            setPredictions(response.data.predictions);
            setShowPredictions(true);
          } else if (response.data.status === "ZERO_RESULTS") {
            console.log("ℹ️ PlacesAutocomplete: No results found");
            setPredictions([]);
            setShowPredictions(false);
          } else {
            console.warn("⚠️ PlacesAutocomplete: API Status:", response.data.status, response.data.error_message);
            setPredictions([]);
            setShowPredictions(false);
            if (response.data.error_message) {
              console.error("❌ PlacesAutocomplete Error:", response.data.error_message);
            }
          }
        } else {
          console.warn("⚠️ PlacesAutocomplete: No data in response");
          setPredictions([]);
          setShowPredictions(false);
        }
      } catch (error) {
        console.error("❌ PlacesAutocomplete: Error fetching places:", error);
        console.error("❌ Error details:", error.response?.data || error.message);
        setPredictions([]);
        setShowPredictions(false);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const getPlaceDetails = async (placeId) => {
    if (!GOOGLE_PLACES_API_KEY) {
      console.warn("Google Places API key not configured");
      return;
    }

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`,
        {
          params: {
            place_id: placeId,
            key: GOOGLE_PLACES_API_KEY,
            fields:
              "formatted_address,name,place_id,geometry,formatted_phone_number,website,rating,user_ratings_total,types,address_components",
          },
        }
      );

      if (response.data && response.data.result) {
        const place = response.data.result;
        const placeInfo = {
          name: place.name || "",
          address: place.formatted_address || "",
          placeId: place.place_id || "",
          phone: place.formatted_phone_number || "",
          website: place.website || "",
          rating: place.rating || null,
          totalRatings: place.user_ratings_total || 0,
          location: place.geometry?.location
            ? {
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng,
              }
            : null,
          types: place.types || [],
          addressComponents: place.address_components || [],
        };

        setInputValue(place.name || place.formatted_address);
        setShowPredictions(false);
        setPredictions([]);

        if (onChange) {
          onChange(place.formatted_address || place.website || "");
        }

        if (onPlaceSelect) {
          onPlaceSelect(placeInfo);
        }
      }
    } catch (error) {
      console.error("Error fetching place details:", error);
      Alert.alert("Error", "Failed to fetch place details");
    }
  };

  const handleInputChange = (text) => {
    console.log("📝 PlacesAutocomplete: Input changed:", text);
    setInputValue(text);
    if (onChange) {
      onChange(text);
    }
    // Trigger search with debouncing
    searchPlaces(text);
  };

  const handleSelectPrediction = (prediction) => {
    // Clear debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    setShowPredictions(false);
    getPlaceDetails(prediction.place_id);
  };

  const handleClear = () => {
    // Clear debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    setInputValue("");
    setPredictions([]);
    setShowPredictions(false);
    setLoading(false);
    if (onChange) {
      onChange("");
    }
    if (onPlaceSelect) {
      onPlaceSelect(null);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <MaterialCommunityIcons
          name="map-marker"
          size={20}
          color="#8B9DC3"
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={handleInputChange}
          placeholder={placeholder}
          placeholderTextColor="#8B9DC3"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {loading ? (
          <ActivityIndicator size="small" color="#1877F2" style={styles.loadingIndicator} />
        ) : inputValue ? (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <MaterialCommunityIcons name="close-circle" size={20} color="#8B9DC3" />
          </TouchableOpacity>
        ) : null}
      </View>

      {(showPredictions || loading) && (predictions.length > 0 || loading) && (
        <View style={styles.predictionsContainer}>
          {loading && predictions.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#1877F2" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : predictions.length > 0 ? (
            <FlatList
              data={predictions}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.predictionItem}
                  onPress={() => handleSelectPrediction(item)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="map-marker-outline"
                    size={20}
                    color="#1877F2"
                    style={styles.predictionIcon}
                  />
                  <View style={styles.predictionText}>
                    <Text style={styles.predictionMainText}>
                      {item.structured_formatting?.main_text || item.description}
                    </Text>
                    {item.structured_formatting?.secondary_text && (
                      <Text style={styles.predictionSecondaryText}>
                        {item.structured_formatting.secondary_text}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              style={styles.predictionsList}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
            />
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 1000,
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D8DEE6",
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1C1E21",
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  predictionsContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D8DEE6",
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginTop: 2,
    maxHeight: 250,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 9999,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#606770",
  },
  predictionsList: {
    maxHeight: 250,
  },
  predictionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
    backgroundColor: "#fff",
  },
  predictionIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  predictionText: {
    flex: 1,
  },
  predictionMainText: {
    fontSize: 15,
    color: "#1C1E21",
    fontWeight: "500",
    lineHeight: 20,
  },
  predictionSecondaryText: {
    fontSize: 13,
    color: "#606770",
    marginTop: 4,
    lineHeight: 18,
  },
});

export default PlacesAutocomplete;

