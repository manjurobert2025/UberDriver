import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import DriverMap from "../components/DriverMap.web";

import { updateDriverStatus } from "../../services/driverService";

import { acceptRide } from "../../services/rideService";

import {
  startSignalR,
  stopSignalR,
} from "../../services/signalRService";

export default function DriverHome() {
  const [driverId, setDriverId] =
    useState<string | null>(null);

  const [signalRConnected, setSignalRConnected] =
    useState(false);

  const [isOnline, setIsOnline] =
    useState(false);

  const [assignedRide, setAssignedRide] =
    useState<any>(null);

  // -----------------------------------
  // CONNECT DRIVER TO SIGNALR
  // -----------------------------------

  useEffect(() => {
    let mounted = true;

    const connectDriver = async () => {
      try {
        const storedDriverId =
          await AsyncStorage.getItem("driverId");

        console.log(
          "DriverId:",
          storedDriverId
        );

        if (!storedDriverId) {
          console.log(
            "❌ DriverId not found"
          );

          Alert.alert(
            "Error",
            "Driver ID not found. Please login again."
          );

          return;
        }

        if (mounted) {
          setDriverId(storedDriverId);
        }

        // -----------------------------------
        // START SIGNALR
        // -----------------------------------

        const connection =
          await startSignalR(
            storedDriverId,
            (ride) => {
              console.log(
                "🚕 RIDE RECEIVED IN DRIVER HOME:",
                ride
              );

              if (mounted) {
                setAssignedRide(ride);
              }
            }
          );

        if (
          mounted &&
          connection?.state === "Connected"
        ) {
          setSignalRConnected(true);

          console.log(
            "✅ Driver SignalR connection established"
          );
        }

      } catch (error) {
        console.error(
          "❌ Driver SignalR setup failed:",
          error
        );

        if (mounted) {
          setSignalRConnected(false);
        }
      }
    };

    connectDriver();

    return () => {
      mounted = false;

      stopSignalR();

      console.log(
        "SignalR connection stopped from DriverHome"
      );
    };
  }, []);

  // -----------------------------------
  // ONLINE / OFFLINE
  // -----------------------------------

  const handleAvailabilityChange =
    async (value: boolean) => {

      console.log(
        "SWITCH VALUE:",
        value
      );

      if (!driverId) {
        Alert.alert(
          "Error",
          "Driver ID not found."
        );

        return;
      }

      try {
        console.log(
          "Calling updateDriverStatus:",
          value
        );

        await updateDriverStatus(
          driverId,
          value
        );

        console.log(
          "updateDriverStatus completed"
        );

        setIsOnline(value);

      } catch (error: any) {
        console.error(
          "Update status failed:",
          error
        );

        console.error(
          "Response:",
          error.response?.data
        );

        console.error(
          "Status:",
          error.response?.status
        );

        Alert.alert(
          "Error",
          "Could not update driver availability."
        );
      }
    };

  // -----------------------------------
  // ACCEPT RIDE
  // -----------------------------------

  const handleAcceptRide = async () => {

    if (!assignedRide) {
      Alert.alert(
        "Error",
        "No ride selected."
      );

      return;
    }

    if (!driverId) {
      Alert.alert(
        "Error",
        "Driver ID not found."
      );

      return;
    }

    try {

      console.log(
        "🚕 Accepting ride..."
      );

      console.log(
        "Ride ID:",
        assignedRide.id
      );

      console.log(
        "Driver ID:",
        driverId
      );

      const response =
        await acceptRide(
          assignedRide.id,
          driverId
        );

      console.log(
        "✅ Accept Ride Response:",
        response.data
      );

      Alert.alert(
        "Success",
        "Ride accepted successfully."
      );

      // Remove ride request from screen
      setAssignedRide(null);

    } catch (error: any) {

      console.error(
        "❌ Accept ride failed:",
        error
      );

      console.error(
        "Response:",
        error.response?.data
      );

      console.error(
        "Status:",
        error.response?.status
      );

      Alert.alert(
        "Error",
        error.response?.data ||
          "Ride could not be accepted."
      );
    }
  };

  // -----------------------------------
  // REJECT RIDE
  // -----------------------------------

  const handleRejectRide = () => {

    console.log(
      "Reject ride:",
      assignedRide
    );

    setAssignedRide(null);
  };

  // -----------------------------------
  // UI
  // -----------------------------------

  return (
    <View style={styles.container}>

      {/* TITLE */}

      <Text style={styles.title}>
        Driver Home
      </Text>


      {/* DRIVER ID */}

      <Text style={styles.driverText}>
        Driver ID:
      </Text>

      <Text style={styles.driverId}>
        {driverId ?? "Loading..."}
      </Text>


      {/* MAP */}

      <DriverMap
        latitude={8.5241}
        longitude={76.9366}
      />


      {/* ONLINE / OFFLINE */}

      <View style={styles.onlineRow}>

        <Text
          style={[
            styles.onlineText,
            {
              color: isOnline
                ? "green"
                : "red",
            },
          ]}
        >
          {isOnline
            ? "Online"
            : "Offline"}
        </Text>

        <Switch
          value={isOnline}
          onValueChange={
            handleAvailabilityChange
          }
        />

      </View>


      {/* -----------------------------------
          RIDE REQUEST
      ----------------------------------- */}

      {assignedRide && (

        <View style={styles.rideCard}>

          <Text style={styles.rideTitle}>
            🚕 New Ride Request
          </Text>


          {/* PICKUP */}

          <Text style={styles.label}>
            Pickup
          </Text>

          <Text style={styles.rideText}>
            {assignedRide.pickupLocation}
          </Text>


          {/* DROPOFF */}

          <Text style={styles.label}>
            Dropoff
          </Text>

          <Text style={styles.rideText}>
            {assignedRide.dropoffLocation}
          </Text>


          {/* RIDE ID */}

          <Text style={styles.label}>
            Ride ID
          </Text>

          <Text style={styles.rideId}>
            {assignedRide.id}
          </Text>


          {/* BUTTONS */}

          <View style={styles.buttonRow}>

            <Pressable
              style={styles.acceptButton}
              onPress={
                handleAcceptRide
              }
            >

              <Text
                style={
                  styles.acceptButtonText
                }
              >
                Accept Ride
              </Text>

            </Pressable>


            <Pressable
              style={styles.rejectButton}
              onPress={
                handleRejectRide
              }
            >

              <Text
                style={
                  styles.rejectButtonText
                }
              >
                Reject
              </Text>

            </Pressable>

          </View>

        </View>

      )}


      {/* WAITING MESSAGE */}

      {!assignedRide && isOnline && (

        <Text style={styles.waitingText}>
          Waiting for ride requests...
        </Text>

      )}


      {/* SIGNALR STATUS */}

      <Text
        style={[
          styles.status,
          {
            color:
              signalRConnected
                ? "green"
                : "red",
          },
        ]}
      >

        {signalRConnected
          ? "🟢 SignalR Connected"
          : "🔴 SignalR Not Connected"}

      </Text>

    </View>
  );
}


// -----------------------------------
// STYLES
// -----------------------------------

const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 15,
  },

  driverText: {
    fontSize: 16,
    marginBottom: 5,
  },

  driverId: {
    fontSize: 14,
    marginBottom: 15,
  },

  onlineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  onlineText: {
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 12,
  },

  // -----------------------------------
  // RIDE CARD
  // -----------------------------------

  rideCard: {
    width: "100%",
    maxWidth: 500,
    marginTop: 20,
    padding: 20,
    borderRadius: 15,
    backgroundColor: "#F5F7FA",
    elevation: 4,

    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  rideTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 18,
  },

  label: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#777777",
    marginTop: 8,
    marginBottom: 3,
  },

  rideText: {
    fontSize: 17,
    marginBottom: 5,
  },

  rideId: {
    fontSize: 12,
    color: "#666666",
  },

  // -----------------------------------
  // BUTTONS
  // -----------------------------------

  buttonRow: {
    flexDirection: "row",
    marginTop: 20,
    gap: 10,
  },

  acceptButton: {
    flex: 1,
    backgroundColor: "#16A34A",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  rejectButton: {
    flex: 1,
    backgroundColor: "#DC2626",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  rejectButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  waitingText: {
    marginTop: 20,
    fontSize: 16,
    color: "#777777",
  },

  status: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
  },

});