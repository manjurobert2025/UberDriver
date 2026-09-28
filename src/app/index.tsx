import { router } from "expo-router";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { auth } from "../../services/firebase";

export default function DriverLoginScreen() {
  // =====================================================
  // STATE
  // =====================================================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // =====================================================
  // DRIVER LOGIN
  // =====================================================

  const handleLogin = async () => {
    const emailAddress = email.trim();

    console.log("================================");
    console.log("DRIVER LOGIN BUTTON PRESSED");
    console.log("EMAIL:", emailAddress);
    console.log("================================");

    if (!emailAddress) {
      Alert.alert(
        "Login",
        "Please enter your email address."
      );
      return;
    }

    if (!password) {
      Alert.alert(
        "Login",
        "Please enter your password."
      );
      return;
    }

    try {
      setLoading(true);

      console.log(
        "Signing in with Firebase..."
      );

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          emailAddress,
          password
        );

      const user = userCredential.user;

      console.log(
        "DRIVER LOGIN SUCCESS"
      );

      console.log(
        "Driver UID:",
        user.uid
      );

      console.log(
        "Driver Email:",
        user.email
      );

      // Go to driver home
      router.replace("/driver-home");

    } catch (error: any) {
      console.log(
        "================================"
      );

      console.log(
        "DRIVER LOGIN ERROR"
      );

      console.log(
        "ERROR CODE:",
        error?.code
      );

      console.log(
        "ERROR MESSAGE:",
        error?.message
      );

      console.log(
        "================================"
      );

      let message =
        "Unable to login.";

      switch (error?.code) {
        case "auth/user-not-found":
          message =
            "No driver account was found with this email.";
          break;

        case "auth/wrong-password":
          message =
            "Incorrect password.";
          break;

        case "auth/invalid-credential":
          message =
            "Invalid email or password.";
          break;

        case "auth/invalid-email":
          message =
            "Please enter a valid email address.";
          break;

        case "auth/user-disabled":
          message =
            "This driver account has been disabled.";
          break;

        case "auth/too-many-requests":
          message =
            "Too many login attempts. Please try again later.";
          break;

        case "auth/network-request-failed":
          message =
            "Network error. Please check your internet connection.";
          break;

        default:
          message =
            error?.message ||
            "Unable to login.";
          break;
      }

      Alert.alert(
        "Login Failed",
        message
      );

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FORGOT PASSWORD
  // =====================================================

  const handleForgotPassword = async () => {
    console.log(
      "================================"
    );

    console.log(
      "FORGOT PASSWORD BUTTON PRESSED"
    );

    console.log(
      "EMAIL FIELD VALUE:",
      email
    );

    console.log(
      "================================"
    );

    const emailAddress = email.trim();

    // -----------------------------------------------------
    // CHECK EMAIL
    // -----------------------------------------------------

    if (!emailAddress) {
      console.log(
        "NO EMAIL ENTERED"
      );

      Alert.alert(
        "Forgot Password",
        "Please enter your email address first."
      );

      return;
    }

    // -----------------------------------------------------
    // SEND FIREBASE RESET EMAIL
    // -----------------------------------------------------

    try {
      setResetLoading(true);

      console.log(
        "Sending Firebase reset email to:"
      );

      console.log(
        emailAddress
      );

      await sendPasswordResetEmail(
        auth,
        emailAddress
      );

      console.log(
        "================================"
      );

      console.log(
        "PASSWORD RESET EMAIL SENT SUCCESSFULLY"
      );

      console.log(
        "EMAIL:",
        emailAddress
      );

      console.log(
        "================================"
      );

      Alert.alert(
        "Password Reset",
        "A password reset link has been sent to your email address. Please check your inbox and spam folder."
      );

    } catch (error: any) {
      console.log(
        "================================"
      );

      console.log(
        "FIREBASE PASSWORD RESET ERROR"
      );

      console.log(
        "ERROR CODE:",
        error?.code
      );

      console.log(
        "ERROR MESSAGE:",
        error?.message
      );

      console.log(
        "FULL ERROR:",
        error
      );

      console.log(
        "================================"
      );

      let message =
        "Unable to send password reset email.";

      switch (error?.code) {
        case "auth/invalid-email":
          message =
            "Please enter a valid email address.";
          break;

        case "auth/user-not-found":
          message =
            "No account was found with this email address.";
          break;

        case "auth/too-many-requests":
          message =
            "Too many requests. Please try again later.";
          break;

        case "auth/network-request-failed":
          message =
            "Network error. Please check your internet connection.";
          break;

        case "auth/operation-not-allowed":
          message =
            "Email/password authentication is not enabled in Firebase.";
          break;

        default:
          message =
            error?.message ||
            "Unable to send password reset email.";
          break;
      }

      Alert.alert(
        "Password Reset",
        message
      );

    } finally {
      setResetLoading(false);

      console.log(
        "FORGOT PASSWORD PROCESS FINISHED"
      );
    }
  };

  // =====================================================
  // REGISTER
  // =====================================================

  const handleRegister = () => {
    console.log(
      "REGISTER BUTTON PRESSED"
    );

    router.push("/register");
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.container
        }
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>

          {/* =================================================
              LOGO
          ================================================= */}

          <Text style={styles.logo}>
            🚖
          </Text>

          {/* =================================================
              TITLE
          ================================================= */}

          <Text style={styles.title}>
            Driver Login
          </Text>

          <Text style={styles.subtitle}>
            Sign in to your driver account
          </Text>

          {/* =================================================
              EMAIL
          ================================================= */}

          <Text style={styles.label}>
            Email
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={(text) => {
              console.log(
                "EMAIL CHANGED:",
                text
              );

              setEmail(text);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={
              !loading &&
              !resetLoading
            }
          />

          {/* =================================================
              PASSWORD
          ================================================= */}

          <Text style={styles.label}>
            Password
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          {/* =================================================
              FORGOT PASSWORD
          ================================================= */}

          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => {
              console.log(
                "FORGOT PASSWORD TOUCH DETECTED"
              );

              handleForgotPassword();
            }}
            disabled={
              loading ||
              resetLoading
            }
            activeOpacity={0.6}
          >
            {resetLoading ? (
              <View style={styles.loadingRow}>

                <ActivityIndicator
                  size="small"
                />

                <Text
                  style={styles.forgotText}
                >
                  Sending...
                </Text>

              </View>
            ) : (
              <Text
                style={styles.forgotText}
              >
                Forgot Password?
              </Text>
            )}
          </TouchableOpacity>

          {/* =================================================
              LOGIN BUTTON
          ================================================= */}

          <TouchableOpacity
            style={[
              styles.loginButton,
              loading &&
                styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={
              loading ||
              resetLoading
            }
            activeOpacity={0.7}
          >
            {loading ? (
              <View style={styles.loadingRow}>

                <ActivityIndicator
                  color="#fff"
                  size="small"
                />

                <Text
                  style={
                    styles.loginButtonText
                  }
                >
                  Logging in...
                </Text>

              </View>
            ) : (
              <Text
                style={
                  styles.loginButtonText
                }
              >
                Login
              </Text>
            )}
          </TouchableOpacity>

          {/* =================================================
              REGISTER
          ================================================= */}

          <View
            style={
              styles.registerContainer
            }
          >
            <Text
              style={
                styles.registerLabel
              }
            >
              Don't have a driver account?
            </Text>

            <TouchableOpacity
              onPress={handleRegister}
              disabled={
                loading ||
                resetLoading
              }
              activeOpacity={0.7}
            >
              <Text
                style={
                  styles.registerText
                }
              >
                Register
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F6F8",
  },

  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 25,

    elevation: 5,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },

  logo: {
    fontSize: 60,
    textAlign: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#222",
  },

  subtitle: {
    textAlign: "center",
    color: "#777",
    marginTop: 5,
    marginBottom: 25,
    fontSize: 15,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 7,
  },

  input: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },

  forgotButton: {
    alignSelf: "flex-end",
    marginTop: -5,
    marginBottom: 20,

    // Makes the clickable area slightly larger
    paddingVertical: 8,
    paddingHorizontal: 8,
  },

  forgotText: {
    color: "#0A84FF",
    fontSize: 15,
    fontWeight: "600",
  },

  loginButton: {
    backgroundColor: "#0A84FF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 18,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  registerContainer: {
    alignItems: "center",
    marginTop: 25,
  },

  registerLabel: {
    color: "#666666",
    fontSize: 14,
    marginBottom: 8,
  },

  registerText: {
    color: "#0A84FF",
    fontSize: 16,
    fontWeight: "bold",
  },
});