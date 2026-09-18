import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { registerUser } from "../../services/authService";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validation
    if (!fullName.trim()) {
      Alert.alert("Validation", "Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Validation", "Please enter your email.");
      return;
    }

    if (!mobile.trim()) {
      Alert.alert("Validation", "Please enter your mobile number.");
      return;
    }

    if (!password) {
      Alert.alert("Validation", "Please enter a password.");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Validation",
        "Password must contain at least 6 characters."
      );
      return;
    }

    try {
      setLoading(true);

      // Firebase registration
      const user = await registerUser(
        email.trim(),
        password
      );

      console.log("FIREBASE USER:", user);
      console.log("FIREBASE UID:", user.uid);

      Alert.alert(
        "Registration Successful",
        "Your Firebase account has been created."
      );

      // Go to Driver Details
      router.push({
        pathname: "/driver-details",
        params: {
          firebaseUid: user.uid,
          fullName: fullName.trim(),
          email: email.trim(),
          mobile: mobile.trim(),
        },
      });
    } catch (error: any) {
      console.log("FIREBASE REGISTRATION ERROR:", error);

      let message = "Registration failed.";

      if (error?.code === "auth/email-already-in-use") {
        message = "This email is already registered.";
      } else if (error?.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (error?.code === "auth/weak-password") {
        message = "The password is too weak.";
      } else if (error?.message) {
        message = error.message;
      }

      Alert.alert("Registration Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.logo}>🚖</Text>

        <Text style={styles.title}>Driver Registration</Text>

        <Text style={styles.subtitle}>
          Create your driver account
        </Text>

        <TextInput
          placeholder="Full Name"
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
        />

        <TextInput
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          placeholder="Mobile Number"
          keyboardType="phone-pad"
          style={styles.input}
          value={mobile}
          onChangeText={setMobile}
        />

        <TextInput
          placeholder="Password"
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[
            styles.button,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Registering..." : "Register"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.loginText}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F6F8",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 400,
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
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },

  subtitle: {
    textAlign: "center",
    color: "gray",
    marginTop: 5,
    marginBottom: 25,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    marginBottom: 15,
    fontSize: 16,
  },

  button: {
    backgroundColor: "#0A84FF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },

  loginText: {
    textAlign: "center",
    color: "#0A84FF",
    marginTop: 25,
    fontWeight: "600",
  },
});