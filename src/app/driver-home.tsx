import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DriverHome() {
  const [isOnline, setIsOnline] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.icon}>☰</Text>

          <Text style={styles.headerTitle}>
            Ride Driver
          </Text>

          <Text style={styles.icon}>🔔</Text>
        </View>

        {/* Online Status */}
        <View style={styles.statusCard}>
          <Text style={styles.onlineText}>
            🟢 Online
          </Text>

          <Switch
            value={isOnline}
            onValueChange={setIsOnline}
          />
        </View>

        {/* Location Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            📍 Current Location
          </Text>

          <Text style={styles.location}>
            Technopark, Trivandrum
          </Text>

          <Text style={styles.subtitle}>
            Ready to receive ride requests
          </Text>
        </View>

        {/* Earnings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Today's Earnings
          </Text>

          <Text style={styles.bigValue}>
            ₹0.00
          </Text>
        </View>

        {/* Trips */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Today's Trips
          </Text>

          <Text style={styles.bigValue}>
            0
          </Text>
        </View>

        {/* Ride Request */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            🚖 No Ride Requests
          </Text>

          <Text style={styles.subtitle}>
            Waiting for nearby passengers...
          </Text>
        </View>

      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>

        <View style={styles.navButton}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navText}>Home</Text>
        </View>

        <View style={styles.navButton}>
          <Text style={styles.navIcon}>📜</Text>
          <Text style={styles.navText}>History</Text>
        </View>

        <View style={styles.navButton}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navText}>Profile</Text>
        </View>

      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F4F6F8",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0A84FF",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },

  icon: {
    fontSize: 24,
    color: "#fff",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },

  statusCard: {
    margin: 15,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
  },

  onlineText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#34C759",
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 15,
    padding: 20,
    elevation: 4,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#222",
  },

  location: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 6,
  },

  subtitle: {
    color: "gray",
    fontSize: 15,
  },

  bigValue: {
    fontSize: 34,
    fontWeight: "bold",
    textAlign: "center",
    color: "#0A84FF",
    marginTop: 10,
  },

  bottomNav: {
    height: 70,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },

  navButton: {
    alignItems: "center",
  },

  navIcon: {
    fontSize: 24,
  },

  navText: {
    fontSize: 14,
    marginTop: 5,
    color: "#444",
    fontWeight: "600",
  },

});