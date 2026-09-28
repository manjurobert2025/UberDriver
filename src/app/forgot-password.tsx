import { router } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { auth } from "../../services/firebase";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    const emailAddress = email.trim();

    console.log("================================");
    console.log("FORGOT PASSWORD CLICKED");
    console.log("EMAIL:", emailAddress);
    console.log("================================");

    if (!emailAddress) {
      Alert.alert(
        "Forgot Password",
        "Please enter your email address first."
      );
      return;
    }

    try {
      setLoading(true);

      console.log(
        "Sending Firebase reset email to:",
        emailAddress
      );

      await sendPasswordResetEmail(
        auth,
        emailAddress
      );

      console.log(
        "PASSWORD RESET EMAIL SENT SUCCESSFULLY"
      );

      Alert.alert(
        "Password Reset",
        "A password reset link has been sent to your email address. Please check your inbox and spam folder.",
        [
          {
            text: "OK",
            onPress: () => {
              router.replace("../auth/login");
            },
          },
        ]
      );
    } catch (error: any) {
      console.log(
        "FIREBASE FORGOT PASSWORD ERROR:",
        error
      );

      console.log(
        "ERROR CODE:",
        error?.code
      );

      console.log(
        "ERROR MESSAGE:",
        error?.message
      );

      let message =
        "Unable to send password reset email.";

      switch (error?.code) {
        case "auth/invalid-email":
          message =
            "Please enter a valid email address.";
          break;

        case "auth/user-disabled":
          message =
            "This account has been disabled.";
          break;

        case "auth/too-many-requests":
          message =
            "Too many requests. Please wait and try again later.";
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
          if (error?.message) {
            message = error.message;
          }
          break;
      }

      Alert.alert(
        "Forgot Password",
        message
      );
    } finally {
      setLoading(false);

      console.log(
        "FORGOT PASSWORD PROCESS FINISHED"
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>

        <Text style={styles.icon}>
          🔐
        </Text>

        <Text style={styles.title}>
          Forgot Password?
        </Text>

        <Text style={styles.subtitle}>
          Enter your registered email address
          and we'll send you a password reset
          link.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        <Pressable
          style={[
            styles.button,
            loading && styles.disabledButton,
          ]}
          onPress={handleForgotPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <Text style={styles.buttonText}>
              SEND RESET EMAIL
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() =>
            router.replace("../auth/login")
          }
          disabled={loading}
        >
          <Text style={styles.backText}>
            Back to Login
          </Text>
        </Pressable>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F6F8",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 25,
    elevation: 5,
  },

  icon: {
    fontSize: 50,
    textAlign: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 25,
  },

  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    marginBottom: 20,
  },

  button: {
    backgroundColor: "#0A84FF",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  backText: {
    marginTop: 20,
    textAlign: "center",
    color: "#0A84FF",
    fontWeight: "600",
  },
});