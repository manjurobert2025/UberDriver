import axios from "axios";
import { router } from "expo-router";
import { useState } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = "https://localhost:7197/api";

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      alert("Please enter your email address");
      return;
    }

    try {
      setLoading(true);

      console.log("Sending reset email to:", email);

      const response = await axios.post(
        `${API_URL}/Auth/forgot-password`,
        {
          email: email.trim(),
        }
      );

      console.log("Forgot password response:", response.data);

      alert(
        "Reset email sent. Please check your email for the reset token."
      );

      // Go to Reset Password screen
      router.push({
        pathname: "/reset-password",
        params: {
          email: email.trim(),
        },
      });

    } catch (error: any) {
      console.log("Forgot password error:", error);

      if (error.response) {
        console.log("Status:", error.response.status);
        console.log("Data:", error.response.data);
      }

      alert("Unable to send reset email. Please try again.");

    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      <View style={styles.card}>

        <Text style={styles.icon}>🔐</Text>

        <Text style={styles.title}>
          Forgot Password?
        </Text>

        <Text style={styles.subtitle}>
          Enter your registered email address and we'll send you a password
          reset token.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Pressable
          style={[
            styles.button,
            loading && styles.disabledButton,
          ]}
          onPress={handleForgotPassword}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Sending..." : "SEND RESET EMAIL"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
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