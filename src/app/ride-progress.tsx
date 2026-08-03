import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
const RideProgressScreen = () => {
  const { rideId, pickupLocation, destination } =
    useLocalSearchParams<{
      rideId: string;
      pickupLocation: string;
      destination: string;
    }>();

const [rideStatus, setRideStatus] = useState("");
useEffect(() => {
  const loadRideStatus = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/Ride/${rideId}`
      );

      console.log("Current ride:", response.data);
      console.log("STATUS VALUE:", response.data.status);
      console.log("STATUS TYPE:", typeof response.data.status);

      const status = response.data.status;

switch (status) {
  case 2:
    setRideStatus("Accepted");
    break;

  case 3:
    setRideStatus("DriverArrived");
    break;

  case 4:
    setRideStatus("InProgress");
    break;

  case 5:
    setRideStatus("Completed");
    break;

  case 6:
    setRideStatus("Cancelled");
    break;

  case 7:
    setRideStatus("Rejected");
    break;

  case 8:
    setRideStatus("Requested");
    break;

  default:
    setRideStatus("Pending");
    break;
}

    } catch (error) {
      console.log("Error loading ride status:", error);
    }
  };

  if (rideId) {
    loadRideStatus();
  }

}, [rideId]);

const API_URL = "https://localhost:7197/api";

const handleStartRide = async () => {
  try {
    console.log("START button clicked");
    console.log("RideId:", rideId);

    const response = await axios.post(
      `${API_URL}/Ride/${rideId}/start`
    );

    console.log("Start Ride API response:", response.data);

    // Only change UI AFTER backend succeeds
    setRideStatus("InProgress");

    alert("Ride started successfully");

  } catch (error: any) {
    console.log("Start Ride API error:", error);

    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Data:", error.response.data);
    }

    alert("Unable to start ride");
  }
};

const handleCompleteRide = async () => {
  try {
    console.log("COMPLETE RIDE clicked");
    console.log("RideId:", rideId);

    const response = await axios.post(
      `${API_URL}/Ride/${rideId}/complete`
    );

    console.log("Complete ride response:", response.data);

    // Change UI ONLY after backend succeeds
    setRideStatus("Completed");

    alert("Ride completed successfully");

  } catch (error: any) {
    console.log("Complete ride error:", error);

    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Data:", error.response.data);
    }

    alert("Unable to complete ride");
  }
};
  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Current Ride</Text>
      </View>
{/* ADD NAVIGATION HERE */}
    <View style={styles.bottomNav}>

      <Pressable
        style={styles.navButton}
        onPress={() => router.push("/")}
      >
        <Text style={styles.navIcon}>🏠</Text>
        <Text style={styles.navText}>Home</Text>
      </Pressable>    

      <Pressable
        style={styles.navButton}
        onPress={() => router.push("/profile")}
      >
        <Text style={styles.navIcon}>👤</Text>
        <Text style={styles.navText}>Profile</Text>
      </Pressable>

    </View>

      {/* Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {rideStatus === "Accepted"
            ? "RIDE ACCEPTED"
            : rideStatus === "InProgress"
            ? "RIDE IN PROGRESS"
            : "TRIP COMPLETED"}
        </Text>
      </View>

      {/* Location Card */}
      <View style={styles.card}>

        <Text style={styles.label}>PICKUP</Text>

        <View style={styles.locationRow}>
          <View style={styles.dot} />

          <Text style={styles.locationText}>
            {pickupLocation || "Pickup location"}
          </Text>
        </View>

        <View style={styles.line} />

        <Text style={styles.label}>DESTINATION</Text>

        <View style={styles.locationRow}>
          <View style={styles.destinationDot} />

          <Text style={styles.locationText}>
            {destination || "Destination"}
          </Text>
        </View>

      </View>

    {/* Progress */}
<View style={styles.progressCard}>

  <Text style={styles.sectionTitle}>Trip Status</Text>

  {/* Request received */}
  <Text style={styles.completedStep}>
    ✓ Request received
  </Text>

  {/* Ride accepted */}
  <Text style={styles.completedStep}>
    ✓ Ride accepted
  </Text>

  {/* Ride started */}
  <Text
    style={
      rideStatus === "InProgress" || rideStatus === "Completed"
        ? styles.completedStep
        : styles.pendingStep
    }
  >
    {rideStatus === "InProgress" || rideStatus === "Completed"
      ? "✓"
      : "○"}{" "}
    Ride started
  </Text>

  {/* Trip completed */}
  <Text
    style={
      rideStatus === "Completed"
        ? styles.completedStep
        : styles.pendingStep
    }
  >
    {rideStatus === "Completed" ? "✓" : "○"} Trip completed
  </Text>

</View>
{/* Complete Ride Button */}
{rideStatus === "InProgress" && (
  <TouchableOpacity
    style={styles.primaryButton}
    onPress={handleCompleteRide}
  >
    <Text style={styles.buttonText}>
      COMPLETE RIDE
    </Text>
  </TouchableOpacity>
)}
    </SafeAreaView>
  );
};

export default RideProgressScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6F8",
    padding: 20,
  },

  header: {
    alignItems: "center",
    marginBottom: 20,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
  },

  statusContainer: {
    alignSelf: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 25,
  },

  statusText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2E7D32",
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 3,
  },

  label: {
    fontSize: 12,
    color: "#777",
    fontWeight: "600",
    marginBottom: 8,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2E7D32",
    marginRight: 12,
  },

  destinationDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: "#D32F2F",
    marginRight: 12,
  },

  locationText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
    flex: 1,
  },

  line: {
    width: 2,
    height: 28,
    backgroundColor: "#DDD",
    marginLeft: 5,
    marginVertical: 5,
  },
bottomNav: {
  flexDirection: "row",
  justifyContent: "space-around",
  alignItems: "center",
  borderTopWidth: 1,
  borderTopColor: "#ddd",
  backgroundColor: "#fff",
  paddingVertical: 12,
},

navButton: {
  flex: 1,
  alignItems: "center",
},

navIcon: {
  fontSize: 24,
  marginBottom: 4,
},

navText: {
  fontSize: 14,
  fontWeight: "500",
},
  progressCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 18,
  },

  completedStep: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2E7D32",
    marginBottom: 15,
  },

  pendingStep: {
    fontSize: 15,
    color: "#888",
    marginBottom: 15,
  },

  bottomContainer: {
  marginTop: 20,
  paddingBottom: 15,
},

  primaryButton: {
    backgroundColor: "#111",
    paddingVertical: 17,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});