import { router } from "expo-router";

import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where
} from "firebase/firestore";

import { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { auth, db } from "../../services/firebase";

export default function AddVehicleScreen() {
  const [vehicleType, setVehicleType] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [seatingCapacity, setSeatingCapacity] = useState("");
  const [category, setCategory] = useState("Car");

  const [loading, setLoading] = useState(false);

  const handleAddVehicle = async () => {
    console.log("========== ADD VEHICLE ==========");

    try {
      // --------------------------------------------------
      // Check Firebase login
      // --------------------------------------------------

      const currentUser = auth.currentUser;

      if (!currentUser) {
        Alert.alert(
          "Login Required",
          "Driver is not logged in. Please login again."
        );
        return;
      }

      console.log("Firebase UID:", currentUser.uid);

      // --------------------------------------------------
      // Validate fields
      // --------------------------------------------------

      if (
        !vehicleType.trim() ||
        !make.trim() ||
        !model.trim() ||
        !year.trim() ||
        !color.trim() ||
        !registrationNumber.trim() ||
        !seatingCapacity.trim()
      ) {
        Alert.alert(
          "Validation",
          "Please fill all vehicle details."
        );
        return;
      }

      // --------------------------------------------------
      // Validate year
      // --------------------------------------------------

      const vehicleYear = Number(year);

      if (
        !Number.isInteger(vehicleYear) ||
        vehicleYear < 1900 ||
        vehicleYear > new Date().getFullYear() + 1
      ) {
        Alert.alert(
          "Validation",
          "Please enter a valid vehicle year."
        );
        return;
      }

      // --------------------------------------------------
      // Validate seating capacity
      // --------------------------------------------------

      const capacity = Number(seatingCapacity);

      if (
        !Number.isInteger(capacity) ||
        capacity <= 0 ||
        capacity > 20
      ) {
        Alert.alert(
          "Validation",
          "Please enter a valid seating capacity."
        );
        return;
      }

      // --------------------------------------------------
      // Clean registration number
      // --------------------------------------------------

      // Removes accidental quotes and normalizes spaces.
      const cleanRegistrationNumber =
        registrationNumber
          .replace(/["']/g, "")
          .replace(/\s+/g, " ")
          .trim()
          .toUpperCase();

      // --------------------------------------------------
      // Find driver's Firestore document
      // --------------------------------------------------

      console.log(
        "Finding driver document using Firebase UID..."
      );

      const driversQuery = query(
        collection(db, "drivers"),
        where("userId", "==", currentUser.uid)
      );

      const driverSnapshot =
        await getDocs(driversQuery);

      if (driverSnapshot.empty) {
        Alert.alert(
          "Driver Profile Error",
          "Driver profile was not found. Please login again or check the drivers collection."
        );
        return;
      }

      const driverDoc =
        driverSnapshot.docs[0];

      const driverId = driverDoc.id;

      console.log(
        "Firestore Driver ID:",
        driverId
      );

      // --------------------------------------------------
      // Add vehicle under:
      //
      // drivers/{driverId}/vehicles
      // --------------------------------------------------

      const vehiclesRef = collection(
        db,
        "drivers",
        driverId,
        "vehicles"
      );

      // --------------------------------------------------
      // Check duplicate registration number
      // --------------------------------------------------

      const existingVehicleQuery = query(
        vehiclesRef,
        where(
          "registrationNumber",
          "==",
          cleanRegistrationNumber
        )
      );

      const existingSnapshot =
        await getDocs(existingVehicleQuery);

      if (!existingSnapshot.empty) {
        Alert.alert(
          "Vehicle Already Exists",
          "A vehicle with this registration number is already registered."
        );
        return;
      }

      // --------------------------------------------------
      // Check whether driver already has an active vehicle
      // --------------------------------------------------

      const activeVehicleQuery = query(
        vehiclesRef,
        where("isActive", "==", true)
      );

      const activeVehicleSnapshot =
        await getDocs(activeVehicleQuery);

      // New vehicle becomes active only when there is
      // currently no active vehicle.
      const makeActive =
        activeVehicleSnapshot.empty;

      console.log(
        "Existing active vehicles:",
        activeVehicleSnapshot.size
      );

      console.log(
        "New vehicle active:",
        makeActive
      );

      // --------------------------------------------------
      // Create vehicle
      // --------------------------------------------------

      const vehicleData = {
        driverId,
        vehicleType:
          vehicleType.trim(),
        make: make.trim(),
        model: model.trim(),
        year: vehicleYear,
        color: color.trim(),
        registrationNumber:
          cleanRegistrationNumber,
        seatingCapacity: capacity,
        category:
          category.trim() || "Car",
        isActive: makeActive,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log(
        "VEHICLE DATA:",
        vehicleData
      );

      setLoading(true);

      const vehicleDoc =
        await addDoc(
          vehiclesRef,
          vehicleData
        );

      console.log(
        "VEHICLE CREATED:",
        vehicleDoc.id
      );

      setLoading(false);

      Alert.alert(
        "Vehicle Added",
        `${make.trim()} ${model.trim()} has been added successfully.`
      );

      router.replace("/driver-home");
    } catch (error: any) {
      console.error(
        "ADD VEHICLE ERROR:",
        error
      );

      setLoading(false);

      Alert.alert(
        "Add Vehicle Error",
        error?.message ||
          "Unable to add vehicle. Please try again."
      );
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.title}>
          Add Vehicle
        </Text>

        <Text style={styles.subtitle}>
          Enter your vehicle details
        </Text>

        <TextInput
          placeholder="Vehicle Type"
          value={vehicleType}
          onChangeText={setVehicleType}
          style={styles.input}
          autoCapitalize="words"
          editable={!loading}
        />

        <TextInput
          placeholder="Vehicle Make"
          value={make}
          onChangeText={setMake}
          style={styles.input}
          autoCapitalize="words"
          editable={!loading}
        />

        <TextInput
          placeholder="Vehicle Model"
          value={model}
          onChangeText={setModel}
          style={styles.input}
          autoCapitalize="words"
          editable={!loading}
        />

        <TextInput
          placeholder="Year"
          value={year}
          onChangeText={setYear}
          style={styles.input}
          keyboardType="numeric"
          maxLength={4}
          editable={!loading}
        />

        <TextInput
          placeholder="Color"
          value={color}
          onChangeText={setColor}
          style={styles.input}
          autoCapitalize="words"
          editable={!loading}
        />

        <TextInput
          placeholder="Registration Number"
          value={registrationNumber}
          onChangeText={setRegistrationNumber}
          style={styles.input}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!loading}
        />

        <TextInput
          placeholder="Seating Capacity"
          value={seatingCapacity}
          onChangeText={setSeatingCapacity}
          style={styles.input}
          keyboardType="numeric"
          editable={!loading}
        />

        <TextInput
          placeholder="Category"
          value={category}
          onChangeText={setCategory}
          style={styles.input}
          autoCapitalize="words"
          editable={!loading}
        />

        <TouchableOpacity
          style={[
            styles.button,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleAddVehicle}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <Text style={styles.buttonText}>
              Add Vehicle
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.cancelText}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F5F6F8",
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 25,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: "#777777",
    textAlign: "center",
    marginBottom: 20,
  },

  input: {
    width: "100%",
    height: 52,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    backgroundColor: "#FFFFFF",
    fontSize: 16,
  },

  button: {
    height: 54,
    backgroundColor: "#1687F8",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },

  cancelButton: {
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 10,
  },

  cancelText: {
    color: "#0066FF",
    fontSize: 15,
  },
});
