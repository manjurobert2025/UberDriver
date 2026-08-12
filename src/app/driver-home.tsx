import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  startSignalR,
  stopSignalR,
} from "../../services/signalRService";

export default function DriverHome() {
  const [driverId, setDriverId] =
    useState<string | null>(null);

  const [signalRConnected, setSignalRConnected] =
    useState(false);

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
          console.log("❌ DriverId not found");

          Alert.alert(
            "Error",
            "Driver ID not found. Please login again."
          );

          return;
        }

        if (mounted) {
          setDriverId(storedDriverId);
        }

        const connection =
          await startSignalR(storedDriverId);

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

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Driver Home
      </Text>

      <Text style={styles.driverText}>
        Driver ID:
      </Text>

      <Text style={styles.driverId}>
        {driverId ?? "Loading..."}
      </Text>

      <Text
        style={[
          styles.status,
          {
            color: signalRConnected
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
  },

  driverText: {
    fontSize: 16,
    marginBottom: 5,
  },

  driverId: {
    fontSize: 14,
    marginBottom: 20,
  },

  status: {
    fontSize: 18,
    fontWeight: "bold",
  },
});