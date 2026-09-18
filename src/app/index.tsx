import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { loginUser } from "../../services/authService";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(
        "Validation",
        "Please enter email and password."
      );
      return;
    }

    try {
      setLoading(true);

      // Firebase login
      const user = await loginUser(
        email.trim(),
        password
      );

      console.log("FIREBASE LOGIN SUCCESS");
      console.log("Firebase UID:", user.uid);
      console.log("Email:", user.email);

      // Store Firebase UID
      await AsyncStorage.setItem(
        "firebaseUid",
        user.uid
      );

      // Store email
      if (user.email) {
        await AsyncStorage.setItem(
          "email",
          user.email
        );
      }

      console.log(
        "Navigating to Driver Home..."
      );

      // Navigate directly to Driver Home
      router.replace("/driver-home");

    } catch (error: any) {
      console.log(
        "FIREBASE LOGIN ERROR:",
        error
      );

      let message =
        "Invalid email or password.";

      if (
        error?.code ===
        "auth/invalid-credential"
      ) {
        message =
          "Invalid email or password.";
      } else if (
        error?.code ===
        "auth/user-not-found"
      ) {
        message =
          "No account found with this email.";
      } else if (
        error?.code ===
        "auth/wrong-password"
      ) {
        message =
          "Incorrect password.";
      } else if (
        error?.code ===
        "auth/invalid-email"
      ) {
        message =
          "Please enter a valid email address.";
      } else if (error?.message) {
        message = error.message;
      }

      Alert.alert(
        "Login Failed",
        message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>

        <Text style={styles.logo}>
          🚖
        </Text>

        <Text style={styles.title}>
          Ride Driver
        </Text>

        <Text style={styles.subtitle}>
          Sign in to start accepting rides
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          editable={!loading}
        />

        <Pressable
          onPress={() =>
            router.push("/forgot-password")
          }
          disabled={loading}
        >
          <Text style={styles.forgotPassword}>
            Forgot Password?
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.button,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading
              ? "Logging in..."
              : "Login"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            router.push("/register")
          }
          disabled={loading}
        >
          <Text style={styles.register}>
            New Driver? Register
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
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    elevation: 5,
  },

  logo: {
    fontSize: 55,
    textAlign: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
  },

  subtitle: {
    textAlign: "center",
    color: "gray",
    marginBottom: 30,
    marginTop: 5,
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
    marginBottom: 15,
  },

  forgotPassword: {
    textAlign: "right",
    marginTop: 8,
    marginBottom: 15,
    fontSize: 14,
    fontWeight: "600",
    color: "#0A84FF",
  },

  button: {
    backgroundColor: "#0A84FF",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    width: "100%",
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  register: {
    marginTop: 25,
    textAlign: "center",
    color: "#0A84FF",
    fontWeight: "600",
  },
});