import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "../services/firebase";

type RidePayment = {
  id: string;
  status?: string;
  fare?: number;
  totalFare?: number;
  amount?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  completedAt?: { toDate?: () => Date } | Date | string | number | null;
  createdAt?: { toDate?: () => Date } | Date | string | number | null;
  pickupLocation?: string;
  dropLocation?: string;
  destination?: string;
};

type RideWithFare = RidePayment & {
  fareAmount: number;
  normalizedPaymentStatus: "paid" | "pending" | "unknown";
};

function toDate(value: RidePayment["completedAt"]): Date | null {
  if (!value) return null;

  if (value instanceof Date) return value;

  if (
    typeof value === "object" &&
    value !== null &&
    typeof value.toDate === "function"
  ) {
    return value.toDate();
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function formatDate(value: RidePayment["completedAt"]): string {
  const date = toDate(value);
  return date
    ? date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Date unavailable";
}

function formatINR(value: number): string {
  return value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

function getFare(data: RidePayment): number {
  // Adjust this mapping if your Firestore uses a different fare field.
  const value = data.fare ?? data.totalFare ?? data.amount ?? 0;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

function getPaymentStatus(
  value?: string
): "paid" | "pending" | "unknown" {
  const status = (value || "").trim().toLowerCase();

  if (["paid", "completed", "success", "successful"].includes(status)) {
    return "paid";
  }

  if (
    ["pending", "unpaid", "due", "initiated", "processing"].includes(status)
  ) {
    return "pending";
  }

  // Missing/unrecognized values are not incorrectly counted as paid.
  return "unknown";
}

export default function DriverPaymentsScreen() {
  const [rides, setRides] = useState<RideWithFare[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadPayments = useCallback(async () => {
    try {
      setError("");

      const user = auth.currentUser;
      if (!user) {
        setRides([]);
        setError("Please log in to view your earnings.");
        return;
      }

      // Your Driver app resolves drivers/{documentId} using userId == auth UID.
      const driverQuery = query(
        collection(db, "drivers"),
        where("userId", "==", user.uid)
      );
      const driverSnapshot = await getDocs(driverQuery);

      if (driverSnapshot.empty) {
        setRides([]);
        setError("Your driver profile could not be found.");
        return;
      }

      const driverId = driverSnapshot.docs[0].id;

      // Query only this driver's completed rides.
      const completedRidesQuery = query(
        collection(db, "rides"),
        where("driverId", "==", driverId),
        where("status", "==", "completed")
      );

      const rideSnapshot = await getDocs(completedRidesQuery);

      const results: RideWithFare[] = rideSnapshot.docs.map((rideDoc) => {
        const data = rideDoc.data() as RidePayment;

        return {
          ...data,
          id: rideDoc.id,
          fareAmount: getFare(data),
          normalizedPaymentStatus: getPaymentStatus(data.paymentStatus),
        };
      });

      results.sort((a, b) => {
        const dateA = toDate(a.completedAt)?.getTime() ?? 0;
        const dateB = toDate(b.completedAt)?.getTime() ?? 0;
        return dateB - dateA;
      });

      setRides(results);
    } catch (err) {
      console.error("Failed to load driver earnings:", err);
      setError(
        "Could not load earnings. Check your connection and Firestore rules."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  const onRefresh = () => {
    setRefreshing(true);
    void loadPayments();
  };

  const totalEarnings = rides.reduce(
    (total, ride) => total + ride.fareAmount,
    0
  );

  const paidEarnings = rides.reduce(
    (total, ride) =>
      total +
      (ride.normalizedPaymentStatus === "paid" ? ride.fareAmount : 0),
    0
  );

  const pendingEarnings = rides.reduce(
    (total, ride) =>
      total +
      (ride.normalizedPaymentStatus === "pending" ? ride.fareAmount : 0),
    0
  );

  const unknownStatusCount = rides.filter(
    (ride) => ride.normalizedPaymentStatus === "unknown"
  ).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Payments & Earnings</Text>
          <Text style={styles.subtitle}>
            Your earnings from completed rides
          </Text>
        </View>

        {loading ? (
          <View style={styles.centerMessage}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.mutedText}>Loading earnings...</Text>
          </View>
        ) : (
          <>
            {error !== "" && (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    setLoading(true);
                    void loadPayments();
                  }}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {error === "" && (
              <>
                <View style={styles.totalCard}>
                  <Text style={styles.totalLabel}>TOTAL RIDE FARES</Text>
                  <Text style={styles.totalAmount}>
                    {formatINR(totalEarnings)}
                  </Text>
                  <Text style={styles.totalCaption}>
                    {rides.length} completed{" "}
                    {rides.length === 1 ? "ride" : "rides"}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Paid</Text>
                    <Text style={styles.paidAmount}>
                      {formatINR(paidEarnings)}
                    </Text>
                  </View>

                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Pending</Text>
                    <Text style={styles.pendingAmount}>
                      {formatINR(pendingEarnings)}
                    </Text>
                  </View>
                </View>

                {unknownStatusCount > 0 && (
                  <View style={styles.noticeCard}>
                    <Text style={styles.noticeText}>
                      Payment status is missing or unrecognized for{" "}
                      {unknownStatusCount}{" "}
                      {unknownStatusCount === 1 ? "ride" : "rides"}. These
                      fares are included in total ride fares but not counted
                      as paid or pending.
                    </Text>
                  </View>
                )}

                <View style={styles.historyHeader}>
                  <Text style={styles.sectionTitle}>Completed Rides</Text>
                  <Text style={styles.historyCount}>{rides.length}</Text>
                </View>

                {rides.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>No completed rides yet</Text>
                    <Text style={styles.mutedText}>
                      Completed rides with recorded fares will appear here.
                    </Text>
                  </View>
                ) : (
                  rides.map((ride) => (
                    <View style={styles.rideCard} key={ride.id}>
                      <View style={styles.rideTopRow}>
                        <View style={styles.rideIcon}>
                          <Text style={styles.rideIconText}>₹</Text>
                        </View>

                        <View style={styles.rideMain}>
                          <Text style={styles.rideTitle}>
                            Ride #{ride.id.slice(0, 8)}
                          </Text>
                          <Text style={styles.rideDate}>
                            {formatDate(ride.completedAt ?? ride.createdAt)}
                          </Text>
                        </View>

                        <View style={styles.rideAmountBlock}>
                          <Text style={styles.rideAmount}>
                            {formatINR(ride.fareAmount)}
                          </Text>
                          <View
                            style={[
                              styles.statusBadge,
                              ride.normalizedPaymentStatus === "paid"
                                ? styles.paidBadge
                                : ride.normalizedPaymentStatus === "pending"
                                ? styles.pendingBadge
                                : styles.unknownBadge,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusBadgeText,
                                ride.normalizedPaymentStatus === "paid"
                                  ? styles.paidBadgeText
                                  : ride.normalizedPaymentStatus === "pending"
                                  ? styles.pendingBadgeText
                                  : styles.unknownBadgeText,
                              ]}
                            >
                              {ride.normalizedPaymentStatus === "paid"
                                ? "Paid"
                                : ride.normalizedPaymentStatus === "pending"
                                ? "Pending"
                                : "Unknown"}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {(ride.pickupLocation || ride.dropLocation || ride.destination) && (
                        <View style={styles.routeBlock}>
                          {ride.pickupLocation ? (
                            <Text style={styles.routeText} numberOfLines={2}>
                              From: {ride.pickupLocation}
                            </Text>
                          ) : null}
                          {ride.dropLocation || ride.destination ? (
                            <Text style={styles.routeText} numberOfLines={2}>
                              To: {ride.dropLocation || ride.destination}
                            </Text>
                          ) : null}
                        </View>
                      )}

                      {ride.paymentMethod ? (
                        <Text style={styles.paymentMethod}>
                          Method: {ride.paymentMethod}
                        </Text>
                      ) : null}
                    </View>
                  ))
                )}

                <Text style={styles.disclaimer}>
                  These totals are calculated from ride documents in Firestore.
                  They are not verified bank payouts. Confirm your fare and
                  payment field names before relying on these figures.
                </Text>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 10,
    marginBottom: 22,
  },
  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 6,
  },
  totalCard: {
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 22,
    marginBottom: 14,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#D1D5DB",
  },
  totalAmount: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    marginTop: 10,
  },
  totalCaption: {
    color: "#D1D5DB",
    fontSize: 13,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  summaryLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  paidAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#15803D",
    marginTop: 8,
  },
  pendingAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#B45309",
    marginTop: 8,
  },
  noticeCard: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
    borderWidth: 1,
    borderRadius: 12,
    padding: 13,
    marginBottom: 18,
  },
  noticeText: {
    color: "#92400E",
    fontSize: 13,
    lineHeight: 19,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111827",
  },
  historyCount: {
    backgroundColor: "#E5E7EB",
    color: "#374151",
    overflow: "hidden",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontWeight: "700",
  },
  rideCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 15,
    marginBottom: 12,
  },
  rideTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  rideIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rideIconText: {
    color: "#1D4ED8",
    fontSize: 21,
    fontWeight: "800",
  },
  rideMain: {
    flex: 1,
  },
  rideTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  rideDate: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 5,
  },
  rideAmountBlock: {
    alignItems: "flex-end",
    marginLeft: 8,
  },
  rideAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
  },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  paidBadge: {
    backgroundColor: "#DCFCE7",
  },
  paidBadgeText: {
    color: "#166534",
  },
  pendingBadge: {
    backgroundColor: "#FEF3C7",
  },
  pendingBadgeText: {
    color: "#92400E",
  },
  unknownBadge: {
    backgroundColor: "#E5E7EB",
  },
  unknownBadgeText: {
    color: "#374151",
  },
  routeBlock: {
    marginTop: 13,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 5,
  },
  routeText: {
    fontSize: 12,
    color: "#4B5563",
    lineHeight: 17,
  },
  paymentMethod: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 9,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  centerMessage: {
    padding: 35,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
  },
  mutedText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 19,
    marginTop: 10,
  },
  errorCard: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
  },
  errorText: {
    color: "#991B1B",
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: "#111827",
    borderRadius: 9,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  disclaimer: {
    marginTop: 12,
    fontSize: 11,
    lineHeight: 17,
    color: "#6B7280",
  },
});
