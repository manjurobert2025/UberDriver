import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  updateDoc,
  where,
} from "firebase/firestore";

import * as Location from "expo-location";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import DriverMap from "../components/DriverMap.web";

import {
  selectActiveVehicle,
  updateDriverLocation,
  updateDriverStatus,
} from "../../services/driverService";

import { db } from "../../services/firebase";

// ============================================================
// VEHICLE INTERFACE
// ============================================================

interface Vehicle {
  id: string;
  vehicleType: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  registrationNumber: string;
  seatingCapacity?: number;
  tariffId?: string;
  isActive: boolean;
}

// ============================================================
// DRIVER HOME
// ============================================================

export default function DriverHome() {

  // ==========================================================
  // DRIVER ID
  // ==========================================================

  const [driverId, setDriverId] =
    useState<string | null>(null);

  // ==========================================================
  // VEHICLES
  // ==========================================================

  const [vehicles, setVehicles] =
    useState<Vehicle[]>([]);

  const [activeVehicle, setActiveVehicle] =
    useState<Vehicle | null>(null);

  // ==========================================================
  // ONLINE / OFFLINE
  // ==========================================================

  const [isOnline, setIsOnline] =
    useState(false);

  // ==========================================================
  // REQUESTED RIDE
  // ==========================================================

  const [assignedRide, setAssignedRide] =
    useState<any>(null);

  // ==========================================================
  // CURRENT ACTIVE RIDE
  // ==========================================================

  const [activeRideId, setActiveRideId] =
    useState<string | null>(null);

  const [activeRideStatus, setActiveRideStatus] =
    useState<string | null>(null);

  const [activeRide, setActiveRide] =
    useState<any>(null);

  // ==========================================================
  // DRIVER GPS
  // ==========================================================

  const [driverLatitude, setDriverLatitude] =
    useState<number | null>(null);

  const [driverLongitude, setDriverLongitude] =
    useState<number | null>(null);

  // ==========================================================
  // LOCATION SUBSCRIPTION
  // ==========================================================

  const locationSubscription =
    useRef<Location.LocationSubscription | null>(null);

  // ==========================================================
  // TRACKED RIDE
  // ==========================================================

  const trackedRideId =
    useRef<string | null>(null);

  // ==========================================================
  // LOAD DRIVER ID
  // ==========================================================

  useEffect(() => {

    const loadDriver = async () => {

      try {

        const storedFirebaseUid =
          await AsyncStorage.getItem(
            "firebaseUid"
          );

        console.log(
          "Firebase UID from storage:",
          storedFirebaseUid
        );

        if (!storedFirebaseUid) {

          Alert.alert(
            "Error",
            "Driver information not found. Please login again."
          );

          return;
        }

        setDriverId(
          storedFirebaseUid
        );

      } catch (error) {

        console.error(
          "Failed to load driver:",
          error
        );

      }

    };

    loadDriver();

  }, []);

  // ==========================================================
  // LOAD DRIVER VEHICLES
  // ==========================================================

  useEffect(() => {

    if (!driverId) {
      return;
    }

    console.log(
      "🚗 Listening for vehicles:",
      driverId
    );

    const vehiclesRef =
      collection(
        db,
        "drivers",
        driverId,
        "vehicles"
      );

    const unsubscribe =
      onSnapshot(
        vehiclesRef,

        (snapshot) => {

          const vehicleList: Vehicle[] =
            snapshot.docs.map(
              (vehicleDoc) => ({
                id: vehicleDoc.id,
                ...vehicleDoc.data(),
              })
            ) as Vehicle[];

          console.log(
            "🚗 Vehicles loaded:",
            vehicleList
          );

          setVehicles(
            vehicleList
          );

          const currentVehicle =
            vehicleList.find(
              (vehicle) =>
                vehicle.isActive === true
            );

          setActiveVehicle(
            currentVehicle ?? null
          );

        },

        (error) => {

          console.error(
            "Vehicle listener error:",
            error
          );

        }
      );

    return () => {
      unsubscribe();
    };

  }, [driverId]);

  // ==========================================================
  // STOP LOCATION WHEN SCREEN CLOSES
  // ==========================================================

  useEffect(() => {

    return () => {

      stopDriverLocationTracking();

    };

  }, []);

  // ==========================================================
  // LISTEN FOR REQUESTED RIDES
  // ==========================================================

  useEffect(() => {

    if (!isOnline) {

      setAssignedRide(null);

      return;
    }

    if (!driverId) {
      return;
    }

    console.log(
      "🚕 Driver is ONLINE - listening for rides assigned to:",
      driverId
    );

    const ridesQuery =
      query(
        collection(db, "rides"),

        where(
          "driverId",
          "==",
          driverId
        ),

        where(
          "status",
          "==",
          "requested"
        )
      );

    const unsubscribe =
      onSnapshot(
        ridesQuery,

        (snapshot) => {

          console.log(
            "Requested rides:",
            snapshot.size
          );

          if (snapshot.empty) {

            setAssignedRide(null);

            return;
          }

          const rideDoc =
            snapshot.docs[0];

          const rideData =
            rideDoc.data();

          const ride = {
            id: rideDoc.id,
            ...rideData,
          };

          console.log(
            "🚕 New ride request:",
            ride
          );

          setAssignedRide(
            ride
          );

        },

        (error) => {

          console.error(
            "Ride listener error:",
            error
          );

        }
      );

    return () => {
      unsubscribe();
    };

  }, [
    isOnline,
    driverId,
  ]);

  // ==========================================================
  // LISTEN FOR ACTIVE RIDE
  // ==========================================================

  useEffect(() => {

    if (!isOnline) {
      return;
    }

    if (!driverId) {
      return;
    }

    console.log(
      "🔎 Looking for active ride..."
    );

    const activeRideQuery =
      query(
        collection(db, "rides"),

        where(
          "driverId",
          "==",
          driverId
        ),

        where(
          "status",
          "in",
          [
            "accepted",
            "driverArrived",
            "inProgress",
          ]
        )
      );

    const unsubscribe =
      onSnapshot(
        activeRideQuery,

        (snapshot) => {

          console.log(
            "Active rides for driver:",
            snapshot.size
          );

          if (snapshot.empty) {

            setActiveRideId(null);
            setActiveRideStatus(null);
            setActiveRide(null);

            trackedRideId.current = null;

            return;
          }

          const rideDoc =
            snapshot.docs[0];

          const currentRideId =
            rideDoc.id;

          const rideData =
            rideDoc.data();

          console.log(
            "✅ Active ride found:",
            currentRideId,
            rideData.status
          );

          setActiveRideId(
            currentRideId
          );

          setActiveRideStatus(
            rideData.status
          );

          setActiveRide({
            id: currentRideId,
            ...rideData,
          });

          if (
            typeof rideData.driverLatitude ===
              "number" &&
            typeof rideData.driverLongitude ===
              "number"
          ) {

            setDriverLatitude(
              rideData.driverLatitude
            );

            setDriverLongitude(
              rideData.driverLongitude
            );

          }

          if (
            trackedRideId.current ===
            currentRideId
          ) {

            console.log(
              "Location tracking already running."
            );

            return;
          }

          trackedRideId.current =
            currentRideId;

          startDriverLocationTracking(
            currentRideId
          );

        },

        (error) => {

          console.error(
            "Active ride listener error:",
            error
          );

        }
      );

    return () => {
      unsubscribe();
    };

  }, [
    isOnline,
    driverId,
  ]);

  // ==========================================================
  // ONLINE / OFFLINE
  // ==========================================================

  const handleAvailabilityChange =
    async (
      value: boolean
    ) => {

      if (!driverId) {

        Alert.alert(
          "Error",
          "Driver ID not found."
        );

        return;
      }

      try {

        await updateDriverStatus(
          driverId,
          value
        );

        setIsOnline(
          value
        );

        if (value) {

          console.log(
            "🟢 Driver going ONLINE."
          );

          await startDriverLocationTracking(
            null
          );

        }

        if (!value) {

          console.log(
            "🔴 Driver going OFFLINE."
          );

          stopDriverLocationTracking();

          setActiveRideId(
            null
          );

          setActiveRideStatus(
            null
          );

          setActiveRide(
            null
          );

          setAssignedRide(
            null
          );

          trackedRideId.current =
            null;

        }

      } catch (error: any) {

        console.error(
          "Update status failed:",
          error
        );

        Alert.alert(
          "Error",
          "Could not update driver availability."
        );

      }

    };

  // ==========================================================
  // START DRIVER GPS TRACKING
  // ==========================================================

  const startDriverLocationTracking =
    async (
      currentRideId: string | null
    ) => {

      try {

        console.log(
          "📍 Starting GPS tracking.",
          currentRideId
            ? `Ride: ${currentRideId}`
            : "No active ride"
        );

        const {
          status,
        } =
          await Location.requestForegroundPermissionsAsync();

        if (
          status !==
          "granted"
        ) {

          Alert.alert(
            "Location Permission",
            "Please allow location access so nearby riders can find you."
          );

          trackedRideId.current =
            null;

          return;
        }

        console.log(
          "📍 Location permission granted."
        );

        if (
          locationSubscription.current
        ) {

          locationSubscription.current.remove();

          locationSubscription.current =
            null;
        }

        // INITIAL LOCATION

        try {

          const currentLocation =
            await Location.getCurrentPositionAsync(
              {
                accuracy:
                  Location.Accuracy.High,
              }
            );

          const latitude =
            currentLocation.coords.latitude;

          const longitude =
            currentLocation.coords.longitude;

          console.log(
            "📍 INITIAL DRIVER LOCATION:",
            latitude,
            longitude
          );

          setDriverLatitude(
            latitude
          );

          setDriverLongitude(
            longitude
          );

          if (driverId) {

            await updateDriverLocation(
              driverId,
              latitude,
              longitude
            );

          }

          if (currentRideId) {

            const rideRef =
              doc(
                db,
                "rides",
                currentRideId
              );

            await updateDoc(
              rideRef,
              {
                driverLatitude:
                  latitude,

                driverLongitude:
                  longitude,
              }
            );

          }

        } catch (error) {

          console.error(
            "Initial location error:",
            error
          );

        }

        // CONTINUOUS LOCATION

        locationSubscription.current =
          await Location.watchPositionAsync(
            {
              accuracy:
                Location.Accuracy.High,

              timeInterval:
                3000,

              distanceInterval:
                5,
            },

            async (
              location
            ) => {

              const latitude =
                location.coords.latitude;

              const longitude =
                location.coords.longitude;

              console.log(
                "📍 DRIVER GPS:",
                latitude,
                longitude
              );

              setDriverLatitude(
                latitude
              );

              setDriverLongitude(
                longitude
              );

              try {

                if (driverId) {

                  await updateDriverLocation(
                    driverId,
                    latitude,
                    longitude
                  );

                }

              } catch (error) {

                console.error(
                  "Failed to update driver location:",
                  error
                );

              }

              if (currentRideId) {

                try {

                  const rideRef =
                    doc(
                      db,
                      "rides",
                      currentRideId
                    );

                  await updateDoc(
                    rideRef,
                    {
                      driverLatitude:
                        latitude,

                      driverLongitude:
                        longitude,
                    }
                  );

                } catch (error) {

                  console.error(
                    "Failed to update ride location:",
                    error
                  );

                }

              }

            }
          );

        console.log(
          "✅ GPS watcher started."
        );

      } catch (error) {

        console.error(
          "LOCATION TRACKING ERROR:",
          error
        );

        trackedRideId.current =
          null;

      }

    };

  // ==========================================================
  // STOP DRIVER GPS TRACKING
  // ==========================================================

  const stopDriverLocationTracking =
    () => {

      if (
        locationSubscription.current
      ) {

        locationSubscription.current.remove();

        locationSubscription.current =
          null;

      }

      console.log(
        "📍 GPS tracking stopped."
      );

    };

  // ==========================================================
  // SELECT ACTIVE VEHICLE
  // ==========================================================

  const handleSelectVehicle =
    async (
      vehicle: Vehicle
    ) => {

      if (!driverId) {

        Alert.alert(
          "Error",
          "Driver ID not found."
        );

        return;
      }

      if (vehicle.isActive) {

        Alert.alert(
          "Vehicle Selected",
          `${vehicle.make} ${vehicle.model} is already your active vehicle.`
        );

        return;
      }

      try {

        console.log(
          "🚗 Selecting vehicle:",
          vehicle.id
        );

        await selectActiveVehicle(
          driverId,
          vehicle.id
        );

        Alert.alert(
          "Vehicle Selected",
          `${vehicle.make} ${vehicle.model} is now your active vehicle.`
        );

      } catch (error: any) {

        console.error(
          "Select vehicle failed:",
          error
        );

        Alert.alert(
          "Error",
          error?.message ||
            "Could not select vehicle."
        );

      }

    };

  // ==========================================================
  // ACCEPT RIDE
  // ==========================================================

  const handleAcceptRide =
    async () => {

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

      if (!activeVehicle) {

        Alert.alert(
          "Vehicle Required",
          "Please add or select an active vehicle before accepting a ride."
        );

        return;
      }

      try {

        console.log(
          "🚕 Accepting ride:",
          assignedRide.id
        );

        const rideRef =
          doc(
            db,
            "rides",
            assignedRide.id
          );

        await runTransaction(
          db,

          async (
            transaction
          ) => {

            const rideSnapshot =
              await transaction.get(
                rideRef
              );

            if (
              !rideSnapshot.exists()
            ) {

              throw new Error(
                "Ride no longer exists."
              );

            }

            const currentRide =
              rideSnapshot.data();

            if (
              currentRide.status !==
              "requested"
            ) {

              throw new Error(
                "This ride has already been accepted."
              );

            }

            transaction.update(
              rideRef,
              {
                status:
                  "accepted",

                driverId:
                  driverId,

                driverName:
                  "Driver",

                vehicleName:
                  `${activeVehicle.make} ${activeVehicle.model}`,

                vehicleNumber:
                  activeVehicle.registrationNumber,

                vehicleType:
                  activeVehicle.vehicleType,

                acceptedAt:
                  new Date(),
              }
            );

          }
        );

        console.log(
          "✅ Ride accepted."
        );

        setActiveRideId(
          assignedRide.id
        );

        setActiveRideStatus(
          "accepted"
        );

        setActiveRide(
          assignedRide
        );

        trackedRideId.current =
          assignedRide.id;

        await startDriverLocationTracking(
          assignedRide.id
        );

        Alert.alert(
          "Success",
          "Ride accepted and location tracking started."
        );

        setAssignedRide(
          null
        );

      } catch (error: any) {

        console.error(
          "Accept ride failed:",
          error
        );

        Alert.alert(
          "Error",
          error?.message ||
            "Ride could not be accepted."
        );

      }

    };

  // ==========================================================
  // REJECT RIDE
  // ==========================================================

  const handleRejectRide =
    () => {

      console.log(
        "Reject ride:",
        assignedRide
      );

      setAssignedRide(
        null
      );

    };

  // ==========================================================
  // DRIVER ARRIVED
  // ==========================================================

  const handleDriverArrived =
    async () => {

      if (!activeRideId) {

        Alert.alert(
          "Error",
          "No active ride found."
        );

        return;
      }

      try {

        const rideRef =
          doc(
            db,
            "rides",
            activeRideId
          );

        await updateDoc(
          rideRef,
          {
            status:
              "driverArrived",

            driverArrivedAt:
              new Date(),
          }
        );

        setActiveRideStatus(
          "driverArrived"
        );

        console.log(
          "✅ Driver arrival updated."
        );

      } catch (error) {

        console.error(
          "Driver arrived error:",
          error
        );

        Alert.alert(
          "Error",
          "Could not update driver arrival."
        );

      }

    };

  // ==========================================================
  // START RIDE
  // ==========================================================

  const handleStartRide =
    async () => {

      if (!activeRideId) {

        Alert.alert(
          "Error",
          "No active ride found."
        );

        return;
      }

      try {

        const rideRef =
          doc(
            db,
            "rides",
            activeRideId
          );

        await updateDoc(
          rideRef,
          {
            status:
              "inProgress",

            startedAt:
              new Date(),
          }
        );

        setActiveRideStatus(
          "inProgress"
        );

        console.log(
          "✅ Ride started."
        );

      } catch (error) {

        console.error(
          "Start ride error:",
          error
        );

        Alert.alert(
          "Error",
          "Could not start the ride."
        );

      }

    };

  // ==========================================================
  // COMPLETE RIDE
  // ==========================================================

  const handleCompleteRide =
    async () => {

      if (!activeRideId) {

        Alert.alert(
          "Error",
          "No active ride found."
        );

        return;
      }

      try {

        const rideRef =
          doc(
            db,
            "rides",
            activeRideId
          );

        await updateDoc(
          rideRef,
          {
            status:
              "completed",

            completedAt:
              new Date(),
          }
        );

        console.log(
          "✅ Ride completed."
        );

        setActiveRideStatus(
          "completed"
        );

        setActiveRideId(
          null
        );

        setActiveRide(
          null
        );

        Alert.alert(
          "Ride Completed",
          "The ride has been completed successfully."
        );

      } catch (error) {

        console.error(
          "Complete ride error:",
          error
        );

        Alert.alert(
          "Error",
          "Could not complete the ride."
        );

      }

    };

  // ==========================================================
  // UI
  // ==========================================================

  return (

    <ScrollView
      contentContainerStyle={
        styles.container
      }
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={true}
    >

      {/* TITLE */}

      <Text
        style={
          styles.title
        }
      >
        Driver Home
      </Text>

      {/* DRIVER ID */}

      <Text
        style={
          styles.driverText
        }
      >
        Driver ID:
      </Text>

      <Text
        style={
          styles.driverId
        }
      >
        {driverId ??
          "Loading..."}
      </Text>

      {/* CURRENT VEHICLE */}

      {activeVehicle && (

        <View
          style={
            styles.vehicleCard
          }
        >

          <Text
            style={
              styles.vehicleTitle
            }
          >
            🚗 Current Vehicle
          </Text>

          <Text
            style={
              styles.vehicleName
            }
          >
            {activeVehicle.make}{" "}
            {activeVehicle.model}
          </Text>

          <Text
            style={
              styles.vehicleText
            }
          >
            {activeVehicle.registrationNumber}
          </Text>

          <Text
            style={
              styles.vehicleText
            }
          >
            {activeVehicle.vehicleType}
          </Text>

          {activeVehicle.color && (

            <Text
              style={
                styles.vehicleText
              }
            >
              Color:{" "}
              {activeVehicle.color}
            </Text>

          )}

          <Text
            style={
              styles.activeVehicleText
            }
          >
            ✓ Active
          </Text>

        </View>

      )}

      {/* MY VEHICLES */}

      <View
        style={
          styles.myVehiclesCard
        }
      >

        <Text
          style={
            styles.myVehiclesTitle
          }
        >
          My Vehicles
        </Text>

        {vehicles.length === 0 && (

          <Text
            style={
              styles.noVehicleText
            }
          >
            No vehicles found.
          </Text>

        )}

        {vehicles.map(
          (vehicle) => (

            <View
              key={
                vehicle.id
              }
              style={
                styles.vehicleRow
              }
            >

              <View
                style={
                  styles.vehicleInfo
                }
              >

                <Text
                  style={
                    styles.vehicleName
                  }
                >
                  {vehicle.make}{" "}
                  {vehicle.model}
                </Text>

                <Text
                  style={
                    styles.vehicleText
                  }
                >
                  {vehicle.registrationNumber}
                </Text>

                <Text
                  style={
                    styles.vehicleText
                  }
                >
                  {vehicle.vehicleType}
                </Text>

                {vehicle.color && (

                  <Text
                    style={
                      styles.vehicleText
                    }
                  >
                    Color:{" "}
                    {vehicle.color}
                  </Text>

                )}

              </View>

              <View
                style={
                  styles.vehicleAction
                }
              >

                {vehicle.isActive ? (

                  <Text
                    style={
                      styles.activeVehicleText
                    }
                  >
                    ✓ Active
                  </Text>

                ) : (

                  <Pressable
                    style={
                      styles.selectVehicleButton
                    }
                    onPress={() =>
                      handleSelectVehicle(
                        vehicle
                      )
                    }
                  >

                    <Text
                      style={
                        styles.selectVehicleButtonText
                      }
                    >
                      Select
                    </Text>

                  </Pressable>

                )}

              </View>

            </View>

          )
        )}

        {/* ADD VEHICLE BUTTON */}

        <Pressable
          style={
            styles.addVehicleButton
          }
          onPress={() =>
            router.push(
              "/add-vehicle"
            )
          }
        >

          <Text
            style={
              styles.addVehicleButtonText
            }
          >
            + Add Vehicle
          </Text>

        </Pressable>

      </View>

      {/* MAP */}

      <View
        style={
          styles.mapContainer
        }
      >

        <DriverMap
          latitude={
            driverLatitude ??
            8.5241
          }
          longitude={
            driverLongitude ??
            76.9366
          }
        />

      </View>

      {/* ONLINE / OFFLINE */}

      <View
        style={
          styles.onlineRow
        }
      >

        <Text
          style={[
            styles.onlineText,
            {
              color:
                isOnline
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
          value={
            isOnline
          }
          onValueChange={
            handleAvailabilityChange
          }
        />

      </View>

      {/* ACTIVE RIDE */}

      {activeRideId && (

        <View
          style={
            styles.activeRideCard
          }
        >

          <Text
            style={
              styles.activeRideTitle
            }
          >
            🚕 Active Ride
          </Text>

          <Text
            style={
              styles.activeRideText
            }
          >
            Ride ID:
          </Text>

          <Text
            style={
              styles.activeRideId
            }
          >
            {activeRideId}
          </Text>

          <Text
            style={
              styles.statusLabel
            }
          >
            Current Status
          </Text>

          <Text
            style={
              styles.statusText
            }
          >
            {activeRideStatus ===
            "accepted"
              ? "🚗 Driver is coming"
              : activeRideStatus ===
                "driverArrived"
              ? "📍 Driver has arrived"
              : activeRideStatus ===
                "inProgress"
              ? "▶ Ride in progress"
              : activeRideStatus}
          </Text>

          {driverLatitude !==
            null &&
            driverLongitude !==
              null && (

              <Text
                style={
                  styles.locationText
                }
              >
                📍 Live Location:{" "}
                {driverLatitude.toFixed(
                  6
                )}
                ,{" "}
                {driverLongitude.toFixed(
                  6
                )}
              </Text>

            )}

          <Text
            style={
              styles.trackingText
            }
          >
            🟢 Sharing location with rider
          </Text>

          {/* ARRIVED */}

          {activeRideStatus ===
            "accepted" && (

            <Pressable
              style={
                styles.arrivedButton
              }
              onPress={
                handleDriverArrived
              }
            >

              <Text
                style={
                  styles.actionButtonText
                }
              >
                📍 I Have Arrived
              </Text>

            </Pressable>

          )}

          {/* START */}

          {activeRideStatus ===
            "driverArrived" && (

            <Pressable
              style={
                styles.startButton
              }
              onPress={
                handleStartRide
              }
            >

              <Text
                style={
                  styles.actionButtonText
                }
              >
                ▶ Start Ride
              </Text>

            </Pressable>

          )}

          {/* COMPLETE */}

          {activeRideStatus ===
            "inProgress" && (

            <Pressable
              style={
                styles.completeButton
              }
              onPress={
                handleCompleteRide
              }
            >

              <Text
                style={
                  styles.actionButtonText
                }
              >
                🏁 Complete Ride
              </Text>

            </Pressable>

          )}

        </View>

      )}

      {/* RIDE REQUEST */}

      {assignedRide && (

        <View
          style={
            styles.rideCard
          }
        >

          <Text
            style={
              styles.rideTitle
            }
          >
            🚕 New Ride Request
          </Text>

          <Text
            style={
              styles.label
            }
          >
            Pickup
          </Text>

          <Text
            style={
              styles.rideText
            }
          >
            {assignedRide.pickupLocation ||
              "Not available"}
          </Text>

          <Text
            style={
              styles.label
            }
          >
            Dropoff
          </Text>

          <Text
            style={
              styles.rideText
            }
          >
            {assignedRide.dropLocation ||
              "Not available"}
          </Text>

          <Text
            style={
              styles.label
            }
          >
            Ride ID
          </Text>

          <Text
            style={
              styles.rideId
            }
          >
            {assignedRide.id}
          </Text>

          <View
            style={
              styles.buttonRow
            }
          >

            <Pressable
              style={
                styles.acceptButton
              }
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
              style={
                styles.rejectButton
              }
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

      {/* WAITING */}

      {!assignedRide &&
        !activeRideId &&
        isOnline && (

          <Text
            style={
              styles.waitingText
            }
          >
            Waiting for ride requests...
          </Text>

        )}

      {/* OFFLINE */}

      {!isOnline && (

        <Text
          style={
            styles.offlineText
          }
        >
          Go online to receive ride requests.
        </Text>

      )}

    </ScrollView>

  );
}

// ============================================================
// STYLES
// ============================================================

const styles =
  StyleSheet.create({

    container: {
      flexGrow: 1,
      padding: 20,
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      paddingBottom: 40,
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

    // ========================================================
    // VEHICLES
    // ========================================================

    vehicleCard: {
      width: "100%",
      maxWidth: 500,
      marginTop: 10,
      padding: 18,
      borderRadius: 15,
      backgroundColor: "#F5F7FA",
      borderWidth: 1,
      borderColor: "#D9E1E8",
    },

    vehicleTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 12,
    },

    myVehiclesCard: {
      width: "100%",
      maxWidth: 500,
      marginTop: 15,
      padding: 18,
      borderRadius: 15,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#D9E1E8",
    },

    myVehiclesTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 15,
    },

    vehicleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#EEEEEE",
    },

    vehicleInfo: {
      flex: 1,
    },

    vehicleAction: {
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 10,
    },

    vehicleName: {
      fontSize: 17,
      fontWeight: "bold",
      marginBottom: 5,
    },

    vehicleText: {
      fontSize: 14,
      color: "#555555",
      marginBottom: 4,
    },

    activeVehicleText: {
      fontSize: 14,
      fontWeight: "bold",
      color: "green",
      marginTop: 5,
    },

    selectVehicleButton: {
      backgroundColor: "#0A84FF",
      paddingVertical: 9,
      paddingHorizontal: 16,
      borderRadius: 8,
    },

    selectVehicleButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "bold",
    },

    noVehicleText: {
      fontSize: 14,
      color: "#999999",
    },

    addVehicleButton: {
      marginTop: 15,
      backgroundColor: "#0A84FF",
      paddingVertical: 13,
      borderRadius: 10,
      alignItems: "center",
      width: "100%",
    },

    addVehicleButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "bold",
    },

    // ========================================================
    // MAP
    // ========================================================

    mapContainer: {
      width: "100%",
      maxWidth: 500,
      marginTop: 20,
      overflow: "hidden",
      borderRadius: 15,
    },

    // ========================================================
    // ONLINE
    // ========================================================

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

    // ========================================================
    // ACTIVE RIDE
    // ========================================================

    activeRideCard: {
      width: "100%",
      maxWidth: 500,
      marginTop: 20,
      padding: 18,
      borderRadius: 15,
      backgroundColor: "#EAF7EE",
      borderWidth: 1,
      borderColor: "#B7E4C7",
    },

    activeRideTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 10,
    },

    activeRideText: {
      fontSize: 13,
      color: "#666666",
    },

    activeRideId: {
      fontSize: 12,
      color: "#555555",
      marginBottom: 10,
    },

    statusLabel: {
      fontSize: 13,
      fontWeight: "bold",
      color: "#777777",
      marginTop: 5,
    },

    statusText: {
      fontSize: 18,
      fontWeight: "bold",
      marginTop: 5,
      marginBottom: 8,
    },

    locationText: {
      fontSize: 13,
      color: "#333333",
      marginTop: 5,
    },

    trackingText: {
      fontSize: 14,
      color: "#16A34A",
      fontWeight: "600",
      marginTop: 10,
    },

    arrivedButton: {
      marginTop: 15,
      backgroundColor: "#2563EB",
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: "center",
    },

    startButton: {
      marginTop: 15,
      backgroundColor: "#16A34A",
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: "center",
    },

    completeButton: {
      marginTop: 15,
      backgroundColor: "#7C3AED",
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: "center",
    },

    actionButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "bold",
    },

    // ========================================================
    // RIDE CARD
    // ========================================================

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

    offlineText: {
      marginTop: 20,
      fontSize: 15,
      color: "#999999",
      textAlign: "center",
    },

  });