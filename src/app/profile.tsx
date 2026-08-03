import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function ProfileScreen() {

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("driverId");

      router.replace("/");
    } catch (error) {
      console.log("Logout error:", error);
      alert("Unable to logout.");
    }
  };

  return (
    <View style={styles.container}>

      <Text style={styles.icon}>👤</Text>

      <Text style={styles.title}>
        Driver Profile
      </Text>

      <Text style={styles.subtitle}>
        Manage your driver account
      </Text>

      <Pressable
        style={styles.logoutButton}
        onPress={logout}
      >
        <Text style={styles.logoutText}>
          LOGOUT
        </Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  icon: {
    fontSize: 60,
    textAlign: "center",
    marginBottom: 15,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 40,
  },

  logoutButton: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  logoutText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },
});