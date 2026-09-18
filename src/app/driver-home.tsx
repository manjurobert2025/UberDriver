import AsyncStorage from "@react-native-async-storage/async-storage";

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

  StyleSheet,

  Switch,

  Text,

  View,
} from "react-native";

import DriverMap from "../components/DriverMap.web";

import {
  updateDriverLocation,

  updateDriverStatus,
} from "../../services/driverService";

import { db } from "../../services/firebase";

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

    if (activeRideId) {

      setAssignedRide(null);

      console.log(

        "🚕 Driver is busy. Not listening for new ride requests."

      );

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

    activeRideId,

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

          // ----------------------------------------------------

          // No active ride

          // ----------------------------------------------------

          if (snapshot.empty) {

            console.log(

              "No active ride found."

            );

            setActiveRideId(null);

            setActiveRideStatus(null);

            setActiveRide(null);

            trackedRideId.current = null;

            // IMPORTANT:

            // Do NOT stop GPS here.

            //

            // Driver is online and needs to keep

            // sharing location for driver matching.

            return;

          }

          // ----------------------------------------------------

          // Existing active ride

          // ----------------------------------------------------

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

          // ----------------------------------------------------

          // Read driver location from ride

          // ----------------------------------------------------

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

          // ----------------------------------------------------

          // Don't start another GPS watcher

          // ----------------------------------------------------

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

          // ----------------------------------------------------

          // GPS is already running while online.

          //

          // startDriverLocationTracking() can safely

          // restart it and associate it with this ride.

          // ----------------------------------------------------

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

      if (!value && activeRideId) {

        Alert.alert(

          "Active Ride",

          "You cannot go offline while a ride is active. Please complete the current ride first."

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

        // ----------------------------------------------------

        // Driver going ONLINE

        // ----------------------------------------------------

        if (value) {

          console.log(

            "🟢 Driver going ONLINE."

          );

          // Start GPS even when there is

          // no active ride.

          await startDriverLocationTracking(

            null

          );

        }

        // ----------------------------------------------------

        // Driver going OFFLINE

        // ----------------------------------------------------

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

        // ----------------------------------------------------

        // Request permission

        // ----------------------------------------------------

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

        // ----------------------------------------------------

        // Stop old watcher

        // ----------------------------------------------------

        if (

          locationSubscription.current

        ) {

          locationSubscription.current.remove();

          locationSubscription.current =

            null;

        }

        // ----------------------------------------------------

        // Get initial location

        // ----------------------------------------------------

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

          // --------------------------------------------------

          // IMPORTANT:

          // Save location to driver document.

          // This is what nearest-driver matching will use.

          // --------------------------------------------------

          if (driverId) {

            await updateDriverLocation(

              driverId,

              latitude,

              longitude

            );

          }

          // --------------------------------------------------

          // If an active ride exists, also save location

          // to the ride document.

          // --------------------------------------------------

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

            console.log(

              "✅ Initial driver location saved to ride."

            );

          }

        } catch (error) {

          console.error(

            "Initial location error:",

            error

          );

        }

        // ----------------------------------------------------

        // Watch location continuously

        // ----------------------------------------------------

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

              // ------------------------------------------------

              // Update DRIVER document

              // ------------------------------------------------

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

              // ------------------------------------------------

              // Update RIDE document if active ride exists

              // ------------------------------------------------

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

                  console.log(

                    "✅ Driver location updated in ride."

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

        const driverRef =

          doc(

            db,

            "drivers",

            driverId

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

            const driverSnapshot =

              await transaction.get(

                driverRef

              );

            if (

              !rideSnapshot.exists()

            ) {

              throw new Error(

                "Ride no longer exists."

              );

            }

            if (

              !driverSnapshot.exists()

            ) {

              throw new Error(

                "Driver profile no longer exists."

              );

            }

            const currentRide =

              rideSnapshot.data();

            const currentDriver =

              driverSnapshot.data();

            if (

              currentRide.status !==

              "requested"

            ) {

              throw new Error(

                "This ride has already been accepted."

              );

            }

            if (

              currentDriver.activeRideId

            ) {

              throw new Error(

                "You already have an active ride. Complete the current ride before accepting another ride."

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

                  currentDriver.fullName ||

                  "Driver",

                vehicleName:

                  currentDriver.vehicleName ||

                  "Vehicle",

                vehicleNumber:

                  currentDriver.vehicleNumber ||

                  "Not available",

                acceptedAt:

                  new Date(),

              }

            );

            transaction.update(

              driverRef,

              {

                activeRideId:

                  assignedRide.id,

                isAvailable:

                  false,

              }

            );

          }

        );

        console.log(

          "✅ Ride accepted."

        );

        // ------------------------------------------------------

        // Start tracking immediately for this ride

        // ------------------------------------------------------

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

        // ------------------------------------------------------

        // Remove request from UI

        // ------------------------------------------------------

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

        console.log(

          "📍 Driver arrived:",

          activeRideId

        );

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

        console.log(

          "▶ Starting ride:",

          activeRideId

        );

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

        console.log(

          "🏁 Completing ride:",

          activeRideId

        );

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

        const driverRef =

          doc(

            db,

            "drivers",

            driverId

          );

        await updateDoc(

          driverRef,

          {

            activeRideId:

              null,

            isAvailable:

              true,

          }

        );

        console.log(

          "✅ Driver is available for the next ride."

        );

        // ------------------------------------------------------

        // Stop GPS after completion

        // ------------------------------------------------------

        // Driver should remain available for matching

        // if they are still online.

        //

        // Therefore we DO NOT stop GPS here.

        //

        // The driver location should continue updating

        // while the driver remains online.

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

  // ============================================================

  // UI

  // ============================================================

  return (

    <View

      style={

        styles.container

      }

    >

      {/* ====================================================

          TITLE

      ==================================================== */}

      <Text

        style={

          styles.title

        }

      >

        Driver Home

      </Text>

      {/* ====================================================

          DRIVER ID

      ==================================================== */}

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

      {/* ====================================================

          MAP

      ==================================================== */}

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

      {/* ====================================================

          ONLINE / OFFLINE

      ==================================================== */}

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

      {/* ====================================================

          ACTIVE RIDE

      ==================================================== */}

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

          {/* ==================================================

              RIDE STATUS

          ================================================== */}

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

            {activeRideStatus === "accepted"

              ? "🚗 Ride accepted"

              : activeRideStatus === "driverArrived"

              ? "📍 Driver has arrived"

              : activeRideStatus === "inProgress"

              ? "▶ Ride in progress"

              : activeRideStatus}

          </Text>

          {/* ==================================================

              LIVE LOCATION

          ================================================== */}

          {driverLatitude !== null &&

            driverLongitude !== null && (

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

          {/* ==================================================

              DRIVER ARRIVED BUTTON

          ================================================== */}

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

          {/* ==================================================

              START RIDE BUTTON

          ================================================== */}

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

          {/* ==================================================

              COMPLETE RIDE BUTTON

          ================================================== */}

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

      {/* ====================================================

          RIDE REQUEST

      ==================================================== */}

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

          {/* PICKUP */}

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

          {/* DROP */}

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

          {/* RIDE ID */}

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

          {/* BUTTONS */}

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

      {/* ====================================================

          WAITING

      ==================================================== */}

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

      {/* ====================================================

          OFFLINE

      ==================================================== */}

      {!isOnline && (

        <Text

          style={

            styles.offlineText

          }

        >

          Go online to receive ride requests.

        </Text>

      )}

    </View>

  );

}

// ============================================================

// STYLES

// ============================================================

const styles =

  StyleSheet.create({

    container: {

      flex: 1,

      padding: 20,

      alignItems:

        "center",

      backgroundColor:

        "#FFFFFF",

    },

    title: {

      fontSize: 28,

      fontWeight:

        "bold",

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

      flexDirection:

        "row",

      alignItems:

        "center",

      justifyContent:

        "center",

      marginTop: 20,

    },

    onlineText: {

      fontSize: 18,

      fontWeight:

        "bold",

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

      backgroundColor:

        "#EAF7EE",

      borderWidth: 1,

      borderColor:

        "#B7E4C7",

    },

    activeRideTitle: {

      fontSize: 20,

      fontWeight:

        "bold",

      marginBottom: 10,

    },

    activeRideText: {

      fontSize: 13,

      color:

        "#666666",

    },

    activeRideId: {

      fontSize: 12,

      color:

        "#555555",

      marginBottom: 10,

    },

    statusLabel: {

      fontSize: 13,

      fontWeight:

        "bold",

      color:

        "#777777",

      marginTop: 5,

    },

    statusText: {

      fontSize: 18,

      fontWeight:

        "bold",

      marginTop: 5,

      marginBottom: 8,

    },

    locationText: {

      fontSize: 13,

      color:

        "#333333",

      marginTop: 5,

    },

    trackingText: {

      fontSize: 14,

      color:

        "#16A34A",

      fontWeight:

        "600",

      marginTop: 10,

    },

    // ========================================================

    // ACTION BUTTONS

    // ========================================================

    arrivedButton: {

      marginTop: 15,

      backgroundColor:

        "#2563EB",

      paddingVertical: 14,

      borderRadius: 10,

      alignItems:

        "center",

    },

    startButton: {

      marginTop: 15,

      backgroundColor:

        "#16A34A",

      paddingVertical: 14,

      borderRadius: 10,

      alignItems:

        "center",

    },

    completeButton: {

      marginTop: 15,

      backgroundColor:

        "#7C3AED",

      paddingVertical: 14,

      borderRadius: 10,

      alignItems:

        "center",

    },

    actionButtonText: {

      color:

        "#FFFFFF",

      fontSize: 16,

      fontWeight:

        "bold",

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

      backgroundColor:

        "#F5F7FA",

      elevation: 4,

      shadowColor:

        "#000",

      shadowOpacity:

        0.15,

      shadowRadius: 5,

      shadowOffset: {

        width: 0,

        height: 2,

      },

    },

    rideTitle: {

      fontSize: 22,

      fontWeight:

        "bold",

      marginBottom: 18,

    },

    label: {

      fontSize: 13,

      fontWeight:

        "bold",

      color:

        "#777777",

      marginTop: 8,

      marginBottom: 3,

    },

    rideText: {

      fontSize: 17,

      marginBottom: 5,

    },

    rideId: {

      fontSize: 12,

      color:

        "#666666",

    },

    // ========================================================

    // BUTTONS

    // ========================================================

    buttonRow: {

      flexDirection:

        "row",

      marginTop: 20,

      gap: 10,

    },

    acceptButton: {

      flex: 1,

      backgroundColor:

        "#16A34A",

      paddingVertical: 14,

      borderRadius: 10,

      alignItems:

        "center",

    },

    acceptButtonText: {

      color:

        "#FFFFFF",

      fontSize: 16,

      fontWeight:

        "bold",

    },

    rejectButton: {

      flex: 1,

      backgroundColor:

        "#DC2626",

      paddingVertical: 14,

      borderRadius: 10,

      alignItems:

        "center",

    },

    rejectButtonText: {

      color:

        "#FFFFFF",

      fontSize: 16,

      fontWeight:

        "bold",

    },

    waitingText: {

      marginTop: 20,

      fontSize: 16,

      color:

        "#777777",

    },

    offlineText: {

      marginTop: 20,

      fontSize: 15,

      color:

        "#999999",

      textAlign:

        "center",

    },

  });


