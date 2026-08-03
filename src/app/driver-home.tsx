import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function DriverHome({ route, navigation }: any) { 
  const [isOnline, setIsOnline] = useState(true);
  const API_URL = "https://localhost:7197/api";
  const [driverId, setDriverId] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingRide, setPendingRide] = useState<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Pass these from login or AsyncStorage  
  useEffect(() => {
  const loadData = async () => {
  const storedToken = await AsyncStorage.getItem("token");
  const storedDriverId = await AsyncStorage.getItem("driverId");   
    if (storedToken) setToken(storedToken);
    if (storedDriverId) setDriverId(storedDriverId);
    await getCurrentLocation();
    return () => {
    stopLocationUpdates();
  };
  };
 
    loadData();
}, []);

useEffect(() => {
  if (!isOnline || !driverId) return;
  const interval = setInterval(async () => {
  const ride = await getPendingRide(driverId); 
    if (ride) {
      setPendingRide(ride);
    }
  }, 5000);

  return () => clearInterval(interval);
}, [isOnline, driverId]);

const updateDriverLocation = async () => {
    const coords = await getCurrentLocation();

    if (!coords) return;

    await axios.put(
      `${API_URL}/driver/${driverId}/location`,
        {
            latitude: coords.latitude,
            longitude: coords.longitude,
        },
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    console.log("Location updated");
};

const stopLocationUpdates = () => {

    if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
    }
};
const startLocationUpdates = () => {
  if (intervalRef.current) return;

  updateDriverLocation();

  intervalRef.current = setInterval(() => {
    updateDriverLocation();
  }, 10000);
};
const getCurrentLocation = async () => {
  // Request permission
  let { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    alert("Location permission denied");
    return;
  }

  // Get current location
  let location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  console.log("Latitude:", location.coords.latitude);
  console.log("Longitude:", location.coords.longitude);

  return location.coords;
};
const getPendingRide = async (driverId: string) => {
  try {
    const response = await fetch(
      `${API_URL}/Ride/driver/${driverId}/pending`
    );
    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch pending ride");
    }

    const ride = await response.json();
    return ride;
  } catch (error) {
    console.error(error);
    return null;
  }
};
const acceptRide = async (rideId: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/Ride/${rideId}/accept`,
      null,
      {
        params: {
          driverId: driverId,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    Alert.alert("Success", "Ride accepted successfully");

    router.push({
      pathname: "../../ride-progress",
      params: {
        rideId: rideId,
        pickupLocation: pendingRide.pickupLocation,
        destination: pendingRide.dropoffLocation,
      },
    });

    setPendingRide(null);

  } catch (error) {
    console.log(error);
    Alert.alert("Error", "Unable to accept ride");
  }
};
const rejectRide = async (rideId: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/Ride/${rideId}/reject`,
      null,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200) {
      Alert.alert("Success", "Ride rejected successfully");

      // Remove the rejected ride from the screen
      setPendingRide(null);

      // Later we can automatically wait for the next ride
    }
  } catch (error) {
    console.log(error);
    Alert.alert("Error", "Unable to reject ride");
  }
};
  const toggleStatus = async (value: boolean) => {
  try {
    console.log("driverId:", driverId);
    console.log("token:", token);
    console.log("Setting online status:", value);

    await axios.put(
      `${API_URL}/driver/${driverId}/status`,
      {
        isOnline: value,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Update state only after API succeeds
    setIsOnline(value);

    if (value) {
      startLocationUpdates();
    } else {
      stopLocationUpdates();
      setPendingRide(null);
    }

  } catch (error) {
    console.log("Status update error:", error);
    Alert.alert("Error", "Unable to update driver status");
  }
};
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
       {pendingRide ? (
      <View style={styles.rideCard}>
        <Text>Passenger: {pendingRide.passengerName}</Text>

        <Text>Pickup: {pendingRide.pickupLocation}</Text>

        <Text>Destination: {pendingRide.dropoffLocation}</Text>

        <Button
          title="Accept"
          onPress={() => acceptRide(pendingRide.id)}
        />

        <Button
          title="Reject"
          onPress={() => rejectRide(pendingRide.rideId)}
        />
      </View>
    ) : (
      <Text style={styles.waitingText}>
        Waiting for ride requests...
      </Text>
    )}

          <Switch
            value={isOnline}
            onValueChange={toggleStatus}
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
rideCard: {
  backgroundColor: "#FFFFFF",
  marginTop: 15,
  padding: 16,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#E0E0E0",
  elevation: 3,
},

rideTitle: {
  fontSize: 18,
  fontWeight: "bold",
  color: "#222",
  marginBottom: 12,
},

rideLabel: {
  fontSize: 14,
  color: "#666",
  marginTop: 8,
},

rideValue: {
  fontSize: 16,
  fontWeight: "600",
  color: "#000",
  marginBottom: 4,
},

buttonContainer: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginTop: 20,
},

acceptButton: {
  flex: 1,
  backgroundColor: "#34C759",
  padding: 12,
  borderRadius: 8,
  alignItems: "center",
  marginLeft: 8,
},

rejectButton: {
  flex: 1,
  backgroundColor: "#FF3B30",
  padding: 12,
  borderRadius: 8,
  alignItems: "center",
  marginRight: 8,
},

buttonText: {
  color: "#FFFFFF",
  fontWeight: "bold",
  fontSize: 16,
},

waitingText: {
  textAlign: "center",
  fontSize: 16,
  color: "#666",
  marginTop: 10,
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