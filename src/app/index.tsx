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

    // -------------------------------
    // VALIDATION
    // -------------------------------

    if (!emailAddress) {
      Alert.alert(
        "Validation",
        "Please enter your email address."
      );
      return;
    }

    if (!password) {
      Alert.alert(
        "Validation",
        "Please enter your password."
      );
      return;
    }

    try {
      setLoading(true);

      console.log(
        "DRIVER LOGIN:",
        emailAddress
      );

      // -------------------------------
      // FIREBASE LOGIN
      // -------------------------------

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          emailAddress,
          password
        );

      const user =
        userCredential.user;

      console.log(
        "DRIVER LOGIN SUCCESS:",
        user.uid
      );

      console.log(
        "DRIVER EMAIL:",
        user.email
      );

      // -------------------------------
      // GO TO DRIVER HOME
      // -------------------------------

      router.push("/driver-home");

    } catch (error: any) {
      console.log(
        "DRIVER LOGIN ERROR:",
        error
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
    const emailAddress = email.trim();

    // -------------------------------
    // VALIDATE EMAIL
    // -------------------------------

    if (!emailAddress) {
      Alert.alert(
        "Forgot Password",
        "Please enter your email address first."
      );

      return;
    }

    try {
      setResetLoading(true);

      console.log(
        "Sending Firebase reset email to:",
        emailAddress
      );

      // -------------------------------
      // FIREBASE PASSWORD RESET
      // -------------------------------

      await sendPasswordResetEmail(
        auth,
        emailAddress
      );

      console.log(
        "PASSWORD RESET EMAIL SENT"
      );

      Alert.alert(
        "Password Reset",
        "A password reset link has been sent to your email address. Please check your inbox."
      );

    } catch (error: any) {
      console.log(
        "FIREBASE FORGOT PASSWORD ERROR:",
        error
      );

      let message =
        "Unable to send password reset email.";

      switch (error?.code) {
        case "auth/user-not-found":
          message =
            "No driver account was found with this email.";
          break;

        case "auth/invalid-email":
          message =
            "Please enter a valid email address.";
          break;

        case "auth/too-many-requests":
          message =
            "Too many requests. Please try again later.";
          break;

        case "auth/network-request-failed":
          message =
            "Network error. Please check your internet connection.";
          break;

        default:
          message =
            error?.message ||
            "Unable to send password reset email.";
      }

      Alert.alert(
        "Forgot Password",
        message
      );

    } finally {
      setResetLoading(false);
    }
  };

  // =====================================================
  // REGISTER
  // =====================================================

  const handleRegister = () => {
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

          {/* LOGO */}

          <Text style={styles.logo}>
            🚖
          </Text>

          {/* TITLE */}

          <Text style={styles.title}>
            Driver Login
          </Text>

          <Text style={styles.subtitle}>
            Sign in to your driver account
          </Text>

          {/* EMAIL */}

          <Text style={styles.label}>
            Email
          </Text>

          <TextInput
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={
              !loading &&
              !resetLoading
            }
          />

          {/* PASSWORD */}

          <Text style={styles.label}>
            Password
          </Text>

          <TextInput
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          {/* FORGOT PASSWORD */}

          <TouchableOpacity
            style={styles.forgotButton}
            onPress={
              handleForgotPassword
            }
            disabled={
              loading ||
              resetLoading
            }
          >
            {resetLoading ? (
              <View
                style={
                  styles.loadingRow
                }
              >
                <ActivityIndicator
                  size="small"
                />

                <Text
                  style={
                    styles.forgotText
                  }
                >
                  Sending...
                </Text>
              </View>
            ) : (
              <Text
                style={
                  styles.forgotText
                }
              >
                Forgot Password?
              </Text>
            )}
          </TouchableOpacity>

          {/* LOGIN BUTTON */}

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
          >
            {loading ? (
              <View
                style={
                  styles.loadingRow
                }
              >
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

          {/* REGISTER */}

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
    backgroundColor: "#fff",
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
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#fff",
  },

  forgotButton: {
    alignSelf: "flex-end",
    marginTop: -5,
    marginBottom: 20,
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
    color: "#fff",
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
    color: "#666",
    fontSize: 14,
    marginBottom: 8,
  },

  registerText: {
    color: "#0A84FF",
    fontSize: 16,
    fontWeight: "bold",
  },
});