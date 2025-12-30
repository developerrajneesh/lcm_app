import * as AuthSession from 'expo-auth-session';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { FontAwesome6 } from '@expo/vector-icons';
import { API_BASE_URL as DEFAULT_API_BASE_URL } from '../config/api';

// Replace with your Facebook App ID
const FB_APP_ID = '925493953121496';
// const FB_APP_ID = '598850839920311';

// Create redirect URI
const redirectUri = 'https://leadscraftmarketing.com/facebook-callback';

// Facebook OAuth endpoints
const discovery = {
  authorizationEndpoint: 'https://www.facebook.com/v19.0/dialog/oauth',
  tokenEndpoint: 'https://graph.facebook.com/v19.0/oauth/access_token',
};

export default function FacebookConnectButton({ 
  onSuccess, 
  onError,
  buttonText = 'Continue with Facebook',
  style,
  disabled = false,
  API_BASE_URL = DEFAULT_API_BASE_URL
}) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [adAccounts, setAdAccounts] = useState([]);
  const [showAccountSelector, setShowAccountSelector] = useState(false);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: FB_APP_ID,
      redirectUri,
      responseType: 'token', // we want access token
      scopes: ['public_profile', 'email', 'ads_management', 'ads_read', 'business_management', 'whatsapp_business_manage_events', 'whatsapp_business_management', 'whatsapp_business_messaging'],
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { access_token } = response.params;
      console.log('✅ Access Token received:', access_token ? 'PRESENT' : 'MISSING');
      
      if (access_token) {
        handleTokenConnection(access_token);
      } else {
        Alert.alert('Error', 'Access token not found in response');
        setIsConnecting(false);
        if (onError) onError('Access token not found');
      }
    } else if (response?.type === 'error') {
      console.error('OAuth Error:', response.error);
      Alert.alert('Login Error', response.error?.message || 'Failed to connect with Facebook');
      setIsConnecting(false);
      if (onError) onError(response.error);
    } else if (response?.type === 'cancel') {
      console.log('User cancelled OAuth');
      setIsConnecting(false);
    }
  }, [response]);

  const handleTokenConnection = async (token) => {
    if (!token?.trim()) {
      Alert.alert('Error', 'Invalid access token');
      setIsConnecting(false);
      return;
    }

    setIsConnecting(true);

    try {
      // Fetch ad accounts using the dedicated endpoint
      const response = await axios.get(`${API_BASE_URL}/campaigns`, {
        headers: {
          'x-fb-access-token': token,
        },
      });

      if (response.data.success) {
        await AsyncStorage.setItem('fb_access_token', token);
        
        // Get ad accounts from response
        const accounts = response.data.adAccounts?.data || [];
        const validAccounts = accounts.filter(
          (account) => account && account.id && typeof account.id === 'string' && account.id.trim() !== ''
        );

        if (validAccounts.length === 0) {
          Alert.alert(
            'No Ad Accounts',
            'No valid ad accounts found. Please make sure you have ad accounts in your Meta Business Manager.'
          );
          setIsConnecting(false);
          if (onError) onError('No ad accounts found');
          return;
        }

        if (validAccounts.length === 1) {
          // Only one account - auto-select it
          const accountId = validAccounts[0].id;
          await AsyncStorage.setItem('fb_ad_account_id', accountId);
          Alert.alert(
            'Success',
            'Your Meta account has been connected successfully!'
          );
          setIsConnecting(false);
          if (onSuccess) onSuccess(token, accountId);
        } else {
          // Multiple accounts - show selection
          setAdAccounts(validAccounts);
          setShowAccountSelector(true);
        }
      } else {
        throw new Error('Invalid access token');
      }
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.fb?.message ||
          error.response?.data?.message ||
          error.message ||
          'Failed to connect to Meta. Please check your access token.'
      );
      setIsConnecting(false);
      if (onError) onError(error);
    }
  };

  const handleAccountSelect = async (accountId) => {
    try {
      await AsyncStorage.setItem('fb_ad_account_id', accountId);
      setShowAccountSelector(false);
      setIsConnecting(false);
      Alert.alert(
        'Success',
        'Your Meta account has been connected successfully!'
      );
      const token = await AsyncStorage.getItem('fb_access_token');
      if (onSuccess) onSuccess(token, accountId);
    } catch (error) {
      console.error('Error saving ad account:', error);
      Alert.alert('Error', 'Failed to save ad account selection');
      setIsConnecting(false);
      if (onError) onError(error);
    }
  };

  const handlePress = async () => {
    if (!request || disabled || isConnecting) return;
    
    setIsConnecting(true);
    try {
      await promptAsync({ useProxy: true });
    } catch (error) {
      console.error('Error prompting OAuth:', error);
      Alert.alert('Error', 'Failed to open Facebook login');
      setIsConnecting(false);
      if (onError) onError(error);
    }
  };

  return (
    <>
      <TouchableOpacity
        disabled={!request || disabled || isConnecting}
        onPress={handlePress}
        style={[
          styles.socialButton,
          style,
          { opacity: (request && !disabled && !isConnecting) ? 1 : 0.5 }
        ]}
      >
        {isConnecting ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <FontAwesome6 name="facebook" size={20} color="#fff" style={styles.socialIcon} />
            <Text style={styles.socialText}>{buttonText}</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Account Selector Modal */}
      {showAccountSelector && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Ad Account</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAccountSelector(false);
                  setIsConnecting(false);
                }}
                style={styles.modalCloseButton}
              >
                <FontAwesome6 name="xmark" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.accountsList}>
              {adAccounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={styles.accountItem}
                  onPress={() => handleAccountSelect(account.id)}
                >
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>
                      {account.name || account.id}
                    </Text>
                    <Text style={styles.accountId}>ID: {account.id}</Text>
                    {account.currency && (
                      <Text style={styles.accountCurrency}>
                        Currency: {account.currency}
                      </Text>
                    )}
                  </View>
                  <FontAwesome6 name="chevron-right" size={16} color="#666" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginTop: 10,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3D5A98',
    borderColor: '#3D5A98',
    width: '100%',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  socialIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  socialText: {
    fontSize: 16,
    fontFamily: 'WorkSans-Regular',
    color: '#fff',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  modalCloseButton: {
    padding: 4,
  },
  accountsList: {
    maxHeight: 400,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  accountId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  accountCurrency: {
    fontSize: 12,
    color: '#666',
  },
});

