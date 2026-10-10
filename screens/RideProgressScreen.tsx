
import { router, useLocalSearchParams } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../services/firebase";

type RideStatus =
  | "requested"
  | "accepted"
  | "driverArrived"
  | "inProgress"
  | "completed"
  | "cancelled"
  | string;

const RideProgressScreen = () => {
  const {
    rideId: rideIdParam,
    pickupLocation: pickupParam,
    destination: destinationParam,
  } = useLocalSearchParams<{
    rideId: string;
    pickupLocation: string;
    destination: string;
  }>();

  const rideId = Array.isArray(rideIdParam)
    ? rideIdParam[0]
    : rideIdParam;

  const pickupLocation = Array.isArray(pickupParam)
    ? pickupParam[0]
    : pickupParam;

  const destination = Array.isArray(destinationParam)
    ? destinationParam[0]
    : destinationParam;

  const [rideStatus, setRideStatus] =
    useState<RideStatus>("requested");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Listen to the ride document for live updates from the Driver app.
  useEffect(() => {
    if (!rideId) {
      setError("Ride ID is missing.");
      setLoading(false);
      return;
    }

    const rideRef = doc(db, "rides", rideId);

    const unsubscribe = onSnapshot(
      rideRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setError("Ride not found.");
          setLoading(false);
          return;
        }

        const data = snapshot.data();

        setRideStatus(data.status || "requested");
        setError("");
        setLoading(false);
      },
      (listenerError) => {
        console.error(
          "Ride progress listener error:",
          listenerError
        );

        setError("Unable to load ride status.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [rideId]);

  const statusDetails: Record<
    string,
    { title: string; message: string }
  > = {
    requested: {
      title: "RIDE REQUESTED",
      message: "Waiting for a driver to accept your ride.",
    },
    accepted: {
      title: "RIDE ACCEPTED",
      message: "Your driver has accepted the ride.",
    },
    driverArrived: {
      title: "DRIVER ARRIVED",
      message: "Your driver has arrived at the pickup point.",
    },
    inProgress: {
      title: "RIDE IN PROGRESS",
      message: "You are on your way to your destination.",
    },
    completed: {
      title: "TRIP COMPLETED",
      message: "Your ride has been completed successfully.",
    },
    cancelled: {
      title: "RIDE CANCELLED",
      message: "This ride has been cancelled.",
    },
  };

  const currentStatus = statusDetails[rideStatus] || {
    title: rideStatus.toUpperCase(),
    message: "Your ride status has been updated.",
  };

  const steps = [
    {
      label: "Request received",
      done: [
        "requested",
        "accepted",
        "driverArrived",
        "inProgress",
        "completed",
      ].includes(rideStatus),
    },
    {
      label: "Ride accepted",
      done: [
        "accepted",
        "driverArrived",
        "inProgress",
        "completed",
      ].includes(rideStatus),
    },
    {
      label: "Driver arrived",
      done: [
        "driverArrived",
        "inProgress",
        "completed",
      ].includes(rideStatus),
    },
    {
      label: "Ride started",
      done: ["inProgress", "completed"].includes(rideStatus),
    },
    {
      label: "Trip completed",
      done: rideStatus === "completed",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Current Ride</Text>
          <Text style={styles.headerSubtitle}>
            Track your journey in real time
          </Text>
        </View>

        {/* Loading */}
        {loading && (
          <View style={styles.messageCard}>
            <ActivityIndicator size="large" color="#111827" />
            <Text style={styles.messageText}>
              Loading ride details...
            </Text>
          </View>
        )}

        {/* Error */}
        {!loading && error !== "" && (
          <View style={styles.messageCard}>
            <Text style={styles.errorText}>{error}</Text>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.back()}
            >
              <Text style={styles.secondaryButtonText}>
                Go Back
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Ride details */}
        {!loading && error === "" && (
          <>
            {/* Status */}
            <View
              style={[
                styles.statusContainer,
                rideStatus === "completed" &&
                  styles.completedStatus,
                rideStatus === "cancelled" &&
                  styles.cancelledStatus,
              ]}
            >
              <Text style={styles.statusText}>
                {currentStatus.title}
              </Text>

              <Text style={styles.statusMessage}>
                {currentStatus.message}
              </Text>
            </View>

            {/* Locations */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                Journey Details
              </Text>

              <Text style={styles.label}>PICKUP</Text>

              <View style={styles.locationRow}>
                <View style={styles.dot} />
                <Text style={styles.locationText}>
                  {pickupLocation || "Pickup location unavailable"}
                </Text>
              </View>

              <View style={styles.line} />

              <Text style={styles.label}>DESTINATION</Text>

              <View style={styles.locationRow}>
                <View style={styles.destinationDot} />
                <Text style={styles.locationText}>
                  {destination || "Destination unavailable"}
                </Text>
              </View>

              <View style={styles.rideIdContainer}>
                <Text style={styles.label}>RIDE ID</Text>
                <Text style={styles.rideId}>{rideId}</Text>
              </View>
            </View>

            {/* Progress */}
            <View style={styles.progressCard}>
              <Text style={styles.sectionTitle}>
                Trip Progress
              </Text>

              {steps.map((step, index) => (
                <View style={styles.stepRow} key={step.label}>
                  <View style={styles.stepIndicatorColumn}>
                    <View
                      style={[
                        styles.stepIndicator,
                        step.done && styles.stepIndicatorDone,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stepIndicatorText,
                          step.done && styles.stepIndicatorTextDone,
                        ]}
                      >
                        {step.done ? "✓" : String(index + 1)}
                      </Text>
                    </View>

                    {index < steps.length - 1 && (
                      <View
                        style={[
                          styles.stepLine,
                          step.done && styles.stepLineDone,
                        ]}
                      />
                    )}
                  </View>

                  <Text
                    style={[
                      styles.stepLabel,
                      step.done && styles.stepLabelDone,
                    ]}
                  >
                    {step.label}
                  </Text>
                </View>
              ))}

              {rideStatus === "cancelled" && (
                <Text style={styles.errorText}>
                  The trip was cancelled.
                </Text>
              )}
            </View>

            {/* Rider information */}
            <View style={styles.bottomContainer}>
              {rideStatus !== "completed" &&
                rideStatus !== "cancelled" && (
                  <Text style={styles.waitingText}>
                    This screen updates automatically when your
                    driver changes the ride status.
                  </Text>
                )}

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.back()}
              >
                <Text style={styles.buttonText}>
                  BACK
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default RideProgressScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6F8",
  },

  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },

  header: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 10,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },

  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 6,
  },

  statusContainer: {
    backgroundColor: "#E8F5E9",
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
  },

  completedStatus: {
    backgroundColor: "#D1FAE5",
  },

  cancelledStatus: {
    backgroundColor: "#FEE2E2",
  },

  statusText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#166534",
    textAlign: "center",
  },

  statusMessage: {
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 20,
  },

  label: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "700",
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
    backgroundColor: "#16A34A",
    marginRight: 12,
  },

  destinationDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: "#DC2626",
    marginRight: 12,
  },

  locationText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
    lineHeight: 22,
  },

  line: {
    width: 2,
    height: 28,
    backgroundColor: "#D1D5DB",
    marginLeft: 5,
    marginVertical: 5,
  },

  rideIdContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  rideId: {
    fontSize: 12,
    color: "#4B5563",
  },

  progressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
  },

  stepRow: {
    flexDirection: "row",
    minHeight: 48,
  },

  stepIndicatorColumn: {
    alignItems: "center",
    width: 30,
    marginRight: 12,
  },

  stepIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  stepIndicatorDone: {
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
  },

  stepIndicatorText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
  },

  stepIndicatorTextDone: {
    color: "#FFFFFF",
  },

  stepLine: {
    flex: 1,
    width: 2,
    minHeight: 20,
    backgroundColor: "#D1D5DB",
  },

  stepLineDone: {
    backgroundColor: "#16A34A",
  },

  stepLabel: {
    flex: 1,
    paddingTop: 4,
    fontSize: 14,
    color: "#9CA3AF",
  },

  stepLabelDone: {
    color: "#166534",
    fontWeight: "600",
  },

  bottomContainer: {
    marginTop: "auto",
    paddingTop: 8,
    paddingBottom: 16,
  },

  waitingText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 14,
  },

  primaryButton: {
    backgroundColor: "#111827",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  secondaryButton: {
    backgroundColor: "#111827",
    padding: 14,
    borderRadius: 10,
    marginTop: 16,
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  messageCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginTop: 20,
  },

  messageText: {
    marginTop: 14,
    fontSize: 14,
    color: "#4B5563",
  },

  errorText: {
    color: "#B91C1C",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
  },
});
