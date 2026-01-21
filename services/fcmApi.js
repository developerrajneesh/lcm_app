import { API_BASE_URL } from '../config/api';

/**
 * Register FCM device token with backend
 * @param {string} deviceToken - FCM device token (required)
 * @param {string} platform - Platform (android, ios, web)
 * @param {string} userId - User ID (optional)
 */
export const registerFCMToken = async (deviceToken, platform, userId = null) => {
  try {
    const response = await fetch(`${API_BASE_URL}/fcm/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceToken,
        platform,
        userId: userId || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error registering FCM token:', error);
    throw error;
  }
};

/**
 * Check if FCM token exists in database
 * @param {string} deviceToken - FCM device token
 */
export const checkFCMTokenExists = async (deviceToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/fcm/check/${encodeURIComponent(deviceToken)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking FCM token:', error);
    throw error;
  }
};

/**
 * Update userId for an existing FCM token
 * @param {string} deviceToken - FCM device token
 * @param {string} userId - User ID to update
 */
export const updateFCMTokenUserId = async (deviceToken, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/fcm/update-user-id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceToken,
        userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating FCM token userId:', error);
    throw error;
  }
};

/**
 * Unregister FCM device token
 */
export const unregisterFCMToken = async (deviceToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/fcm/unregister`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error unregistering FCM token:', error);
    throw error;
  }
};

