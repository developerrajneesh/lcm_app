import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

/**
 * Check if an error response indicates token expiration
 * @param {Object} error - The error object from axios
 * @returns {boolean} - True if the error indicates token expiration
 */
export function isTokenExpiredError(error) {
  if (!error || !error.response) return false;
  
  const errorData = error.response.data;
  
  // Check for token expiration indicators
  return (
    error.response.status === 401 &&
    (errorData?.tokenExpired === true ||
     errorData?.code === "TOKEN_EXPIRED" ||
     (errorData?.fb?.code === 190 && errorData?.fb?.error_subcode === 463) ||
     (errorData?.error?.code === 190 && errorData?.error?.error_subcode === 463))
  );
}

/**
 * Handle token expiration by clearing tokens and showing alert
 * @param {Object} error - The error object from axios
 * @param {Function} onDisconnect - Optional callback to call when disconnecting
 * @returns {boolean} - True if token expiration was handled
 */
export async function handleTokenExpiration(error, onDisconnect = null) {
  if (!isTokenExpiredError(error)) {
    return false;
  }
  
  console.warn("⚠️ Facebook access token has expired. Disconnecting...");
  
  // Clear tokens
  try {
    await AsyncStorage.removeItem("fb_access_token");
    await AsyncStorage.removeItem("fb_ad_account_id");
  } catch (storageError) {
    console.error("Error clearing tokens:", storageError);
  }
  
  // Show alert
  Alert.alert(
    "Session Expired",
    "Your Facebook access token has expired. Please reconnect your account.",
    [
      {
        text: "OK",
        onPress: () => {
          if (onDisconnect) {
            onDisconnect();
          }
        },
      },
    ]
  );
  
  return true;
}

