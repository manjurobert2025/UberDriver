import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { resetPassword } from "../../services/authService";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams();

  const [email, setEmail] = useState(
    typeof params.email === "string" ? params.email : ""
  );

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
  console.log("RESET PASSWORD BUTTON PRESSED");

  if (!email.trim()) {
    alert("Please enter your email.");
    return;
  }

  if (!token.trim()) {
    alert("Please enter the reset token.");
    return;
  }

  if (!newPassword.trim()) {
    alert("Please enter a new password.");
    return;
  }

  if (newPassword.length < 6) {
    alert("Password must contain at least 6 characters.");
    return;
  }

  if (newPassword !== confirmPassword) {
    alert("New password and confirm password do not match.");
    return;
  }

  console.log("VALIDATION PASSED");

  try {
    setLoading(true);

    console.log("CALLING RESET PASSWORD API");

    const response = await resetPassword(
      email.trim(),
      token.trim(),
      newPassword
    );

    console.log("RESET PASSWORD RESPONSE:", response);

    alert("Password reset successfully!");

    router.replace("/");

  } catch (error: any) {
    console.log("RESET PASSWORD ERROR:", error);

    if (error.response) {
      console.log("STATUS:", error.response.status);
      console.log("ERROR DATA:", error.response.data);
    }

    alert(
      error.response?.data?.message ||
      error.response?.data ||
      error.message ||
      "Unable to reset password."
    );

  } finally {
    setLoading(false);
  }
};
  return (
    <View style={styles.container}>
      <View style={styles.card}>

        <Text style={styles.icon}>🔑</Text>

        <Text style={styles.title}>
          Reset Password
        </Text>

        <Text style={styles.subtitle}>
          Enter the reset token sent to your email and choose
          a new password.
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

        <TextInput
          style={styles.input}
          placeholder="Reset Token"
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <Pressable
          style={[
            styles.button,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>
              RESET PASSWORD
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.replace("/")}
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
    backgroundColor: "#f4f5f7",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingHorizontal: 25,
    paddingVertical: 30,
    alignItems: "center",
  },

  icon: {
    fontSize: 46,
    marginBottom: 10,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },

  input: {
    width: "100%",
    height: 50,
    borderWidth: 2,
    borderColor: "#222",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 15,
  },

  button: {
    width: "100%",
    height: 52,
    backgroundColor: "#1687f8",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 15,
  },

  backText: {
    color: "#0066ff",
    marginTop: 22,
    fontSize: 14,
    fontWeight: "500",
  },
});