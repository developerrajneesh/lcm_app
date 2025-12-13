import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import axios from "axios";

// Configure base API URL
const API_BASE_URL = "https://api.leadscraftmarketing.com/api/v1";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

const AuthModal = ({ visible, onClose }) => {
  // Screen states
  const [currentScreen, setCurrentScreen] = useState("login"); // 'login', 'signup', 'forgot', 'otp'

  // Form states
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [forgotData, setForgotData] = useState({ email: "" });
  const [otpData, setOtpData] = useState({ otp: "" });

  // Validation states
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Validation functions
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const validateLogin = () => {
    const newErrors = {};
    if (!loginData.email) newErrors.email = "Email is required";
    else if (!validateEmail(loginData.email))
      newErrors.email = "Invalid email format";
    if (!loginData.password) newErrors.password = "Password is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignup = () => {
    const newErrors = {};
    if (!signupData.name) newErrors.name = "Name is required";
    if (!signupData.email) newErrors.email = "Email is required";
    else if (!validateEmail(signupData.email))
      newErrors.email = "Invalid email format";
    if (!signupData.password) newErrors.password = "Password is required";
    else if (signupData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (signupData.password !== signupData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForgot = () => {
    const newErrors = {};
    if (!forgotData.email) newErrors.email = "Email is required";
    else if (!validateEmail(forgotData.email))
      newErrors.email = "Invalid email format";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOtp = () => {
    const newErrors = {};
    if (!otpData.otp) newErrors.otp = "OTP is required";
    else if (otpData.otp.length !== 6) newErrors.otp = "OTP must be 6 digits";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // API call functions
  const loginUser = async (credentials) => {
    try {
      // Assuming your login endpoint is at /user/login
      const response = await api.post("/user/login", credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Login failed" };
    }
  };

  const registerUser = async (userData) => {
    try {
      // Based on your Postman collection
      const response = await api.post("/user/register", userData);
      return response.data;
    } catch (error) {
      console.log(error);

      throw error.response?.data || { message: "Registration failed" };
    }
  };

  const forgotPassword = async (email) => {
    try {
      // Assuming your forgot password endpoint is at /user/forgot-password
      const response = await api.post("/user/forgot-password", { email });
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || { message: "Password reset request failed" }
      );
    }
  };

  const verifyOtp = async (otpData, context) => {
    try {
      // Assuming your OTP verification endpoint is at /user/verify-otp
      const payload = { ...otpData, context };
      const response = await api.post("/user/verify-otp", payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "OTP verification failed" };
    }
  };

  const resetPassword = async (resetData) => {
    try {
      // Assuming your password reset endpoint is at /user/reset-password
      const response = await api.post("/user/reset-password", resetData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Password reset failed" };
    }
  };

  // Form handlers
  const handleLogin = async () => {
    if (!validateLogin()) return;

    setIsLoading(true);
    try {
      const response = await loginUser(loginData);
      if (response.success) {
        Alert.alert("Success", "Logged in successfully");
        onClose();
        // Store token if available
        if (response.token) {
          // You might want to store this token in AsyncStorage or context
          console.log("Auth token:", response.token);
        }
      } else {
        Alert.alert("Error", response.message || "Login failed");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!validateSignup()) return;

    setIsLoading(true);
    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...apiData } = signupData;
      const response = await registerUser(apiData);
      if (response.success) {
        setCurrentScreen("otp");
      } else {
        Alert.alert("Error", response.message || "Signup failed");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!validateForgot()) return;

    setIsLoading(true);
    try {
      const response = await forgotPassword(forgotData.email);
      if (response.success) {
        setCurrentScreen("otp");
      } else {
        Alert.alert("Error", response.message || "Password reset failed");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Password reset failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerification = async () => {
    if (!validateOtp()) return;

    setIsLoading(true);
    try {
      // Determine context (signup or password reset)
      const context = currentScreen === "signup" ? "signup" : "password_reset";
      const response = await verifyOtp(otpData, context);

      if (response.success) {
        if (context === "signup") {
          Alert.alert("Success", "Account created successfully");
          onClose();
          // navigation.navigate('Home'); // Replace with your home screen name
        } else {
          // For password reset, you might want to navigate to a password reset screen
          Alert.alert(
            "Success",
            "OTP verified. You can now reset your password."
          );
          // Here you would typically navigate to a password reset screen
          onClose();
        }
      } else {
        Alert.alert("Error", response.message || "OTP verification failed");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "OTP verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Render screens
  const renderLoginScreen = () => (
    <View style={styles.screenContainer}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={[styles.input, errors.email && styles.inputError]}
        placeholder="Email"
        placeholderTextColor="#999"
        value={loginData.email}
        onChangeText={(text) => setLoginData({ ...loginData, email: text })}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

      <TextInput
        style={[styles.input, errors.password && styles.inputError]}
        placeholder="Password"
        placeholderTextColor="#999"
        value={loginData.password}
        onChangeText={(text) => setLoginData({ ...loginData, password: text })}
        secureTextEntry
      />
      {errors.password && (
        <Text style={styles.errorText}>{errors.password}</Text>
      )}

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <View style={styles.linkContainer}>
        <TouchableOpacity onPress={() => setCurrentScreen("forgot")}>
          <Text style={styles.linkText}>Forgot Password?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentScreen("signup")}>
          <Text style={styles.linkText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSignupScreen = () => (
    <View style={styles.screenContainer}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        style={[styles.input, errors.name && styles.inputError]}
        placeholder="Full Name"
        placeholderTextColor="#999"
        value={signupData.name}
        onChangeText={(text) => setSignupData({ ...signupData, name: text })}
      />
      {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

      <TextInput
        style={[styles.input, errors.email && styles.inputError]}
        placeholder="Email"
        placeholderTextColor="#999"
        value={signupData.email}
        onChangeText={(text) => setSignupData({ ...signupData, email: text })}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

      <TextInput
        style={[styles.input, errors.password && styles.inputError]}
        placeholder="Password"
        placeholderTextColor="#999"
        value={signupData.password}
        onChangeText={(text) =>
          setSignupData({ ...signupData, password: text })
        }
        secureTextEntry
      />
      {errors.password && (
        <Text style={styles.errorText}>{errors.password}</Text>
      )}

      <TextInput
        style={[styles.input, errors.confirmPassword && styles.inputError]}
        placeholder="Confirm Password"
        placeholderTextColor="#999"
        value={signupData.confirmPassword}
        onChangeText={(text) =>
          setSignupData({ ...signupData, confirmPassword: text })
        }
        secureTextEntry
      />
      {errors.confirmPassword && (
        <Text style={styles.errorText}>{errors.confirmPassword}</Text>
      )}

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleSignup}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setCurrentScreen("login")}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );

  const renderForgotPasswordScreen = () => (
    <View style={styles.screenContainer}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>
        Enter your email to receive a password reset OTP
      </Text>

      <TextInput
        style={[styles.input, errors.email && styles.inputError]}
        placeholder="Email"
        placeholderTextColor="#999"
        value={forgotData.email}
        onChangeText={(text) => setForgotData({ ...forgotData, email: text })}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleForgotPassword}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send OTP</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setCurrentScreen("login")}>
        <Text style={styles.linkText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOtpScreen = () => (
    <View style={styles.screenContainer}>
      <Text style={styles.title}>OTP Verification</Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit OTP sent to your email
      </Text>

      <TextInput
        style={[styles.input, errors.otp && styles.inputError]}
        placeholder="OTP"
        placeholderTextColor="#999"
        value={otpData.otp}
        onChangeText={(text) => setOtpData({ ...otpData, otp: text })}
        keyboardType="number-pad"
        maxLength={6}
      />
      {errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleOtpVerification}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verify OTP</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          setCurrentScreen(currentScreen === "signup" ? "signup" : "forgot")
        }
      >
        <Text style={styles.linkText}>Resend OTP</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>

        {currentScreen === "login" && renderLoginScreen()}
        {currentScreen === "signup" && renderSignupScreen()}
        {currentScreen === "forgot" && renderForgotPasswordScreen()}
        {currentScreen === "otp" && renderOtpScreen()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5fcff",
    padding: 20,
  },
  screenContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    fontSize: 12,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 20,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  linkText: {
    color: "#007AFF",
    textAlign: "center",
    marginTop: 10,
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#007AFF",
    lineHeight: 24,
  },
});

export default AuthModal;
