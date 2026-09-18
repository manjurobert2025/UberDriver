import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { registerDriver } from "../../services/driverService";

export default function DriverDetailsScreen() {
  // Get Firebase user information passed from register.tsx
  const {
    firebaseUid,
    fullName,
    email,
    mobile,
  } = useLocalSearchParams();

  const [licenseNumber, setLicenseNumber] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [seatingCapacity, setSeatingCapacity] = useState("");
  const [vehicleType, setVehicleType] = useState("");

  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    // Convert Firebase UID to a normal string
    const actualUserId = Array.isArray(firebaseUid)
      ? firebaseUid[0]
      : firebaseUid;

    console.log("FIREBASE UID RECEIVED:", actualUserId);

    // Check if Firebase UID exists
    if (!actualUserId) {
      Alert.alert(
        "Error",
        "Firebase User ID is missing."
      );

      console.log("ERROR: Firebase UID is missing");

      return;
    }

    // Basic validation
    if (
      !licenseNumber.trim() ||
      !make.trim() ||
      !model.trim() ||
      !year.trim() ||
      !color.trim() ||
      !registrationNumber.trim() ||
      !seatingCapacity.trim() ||
      !vehicleType.trim()
    ) {
      Alert.alert(
        "Validation",
        "Please fill all fields."
      );

      return;
    }

    // Validate year
    const vehicleYear = Number(year);

    if (
      isNaN(vehicleYear) ||
      vehicleYear < 1900 ||
      vehicleYear > new Date().getFullYear() + 1
    ) {
      Alert.alert(
        "Validation",
        "Please enter a valid vehicle year."
      );

      return;
    }

    // Validate seating capacity
    const capacity = Number(seatingCapacity);

    if (
      isNaN(capacity) ||
      capacity <= 0
    ) {
      Alert.alert(
        "Validation",
        "Please enter a valid seating capacity."
      );

      return;
    }

    // Create driver object
    const driver = {
      userId: actualUserId,

      fullName: Array.isArray(fullName)
        ? fullName[0]
        : fullName || "",

      email: Array.isArray(email)
        ? email[0]
        : email || "",

      mobile: Array.isArray(mobile)
        ? mobile[0]
        : mobile || "",

      licenseNumber:
        licenseNumber.trim(),

      make:
        make.trim(),

      model:
        model.trim(),

      year:
        vehicleYear,

      color:
        color.trim(),

      registrationNumber:
        registrationNumber.trim(),

      seatingCapacity:
        capacity,

      vehicleType:
        vehicleType.trim(),
    };

    console.log(
      "DRIVER FIRESTORE DATA:",
      driver
    );

    try {
      setLoading(true);

      // Save driver details to Firestore
      const response =
        await registerDriver(driver);

      console.log(
        "DRIVER REGISTRATION RESPONSE:",
        response
      );

      Alert.alert(
        "Registration Successful",
        "Your driver details have been saved successfully.",
        [
          {
            text: "OK",
            onPress: () => {
              router.replace("/");
            },
          },
        ]
      );
    } catch (error: any) {
      console.log(
        "DRIVER REGISTRATION FAILED:",
        error
      );

      Alert.alert(
        "Registration Error",
        error?.message ||
          "Unable to save driver details."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>

        <Text style={styles.logo}>
          🚖
        </Text>

        <Text style={styles.title}>
          Driver Details
        </Text>

        <Text style={styles.subtitle}>
          Complete your vehicle information
        </Text>

        {/* License Number */}

        <TextInput
          placeholder="License Number"
          value={licenseNumber}
          onChangeText={setLicenseNumber}
          style={styles.input}
          autoCapitalize="characters"
        />

        {/* Vehicle Make */}

        <TextInput
          placeholder="Vehicle Make"
          value={make}
          onChangeText={setMake}
          style={styles.input}
        />

        {/* Vehicle Model */}

        <TextInput
          placeholder="Vehicle Model"
          value={model}
          onChangeText={setModel}
          style={styles.input}
        />

        {/* Year */}

        <TextInput
          placeholder="Year"
          keyboardType="numeric"
          value={year}
          onChangeText={setYear}
          style={styles.input}
          maxLength={4}
        />

        {/* Color */}

        <TextInput
          placeholder="Color"
          value={color}
          onChangeText={setColor}
          style={styles.input}
        />

        {/* Registration Number */}

        <TextInput
          placeholder="Registration Number"
          value={registrationNumber}
          onChangeText={setRegistrationNumber}
          style={styles.input}
          autoCapitalize="characters"
        />

        {/* Seating Capacity */}

        <TextInput
          placeholder="Seating Capacity"
          keyboardType="numeric"
          value={seatingCapacity}
          onChangeText={setSeatingCapacity}
          style={styles.input}
        />

        {/* Vehicle Type */}

        <TextInput
          placeholder="Vehicle Type (Car / Auto / Bike)"
          value={vehicleType}
          onChangeText={setVehicleType}
          style={styles.input}
        />

        {/* Finish Registration Button */}

        <TouchableOpacity
          style={[
            styles.button,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleFinish}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading
              ? "Saving..."
              : "Finish Registration"}
          </Text>
        </TouchableOpacity>

        {/* Back Button */}

        <TouchableOpacity
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.backText}>
            Back
          </Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F6F8",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    elevation: 5,
  },

  logo: {
    fontSize: 55,
    textAlign: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },

  subtitle: {
    textAlign: "center",
    color: "gray",
    marginTop: 5,
    marginBottom: 25,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    marginBottom: 15,
    fontSize: 16,
  },

  button: {
    backgroundColor: "#0A84FF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },

  backText: {
    textAlign: "center",
    color: "#0A84FF",
    marginTop: 20,
    fontWeight: "600",
  },
});