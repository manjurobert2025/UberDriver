import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { registerDriver } from "../../services/driverService";

export default function DriverDetailsScreen() {
  // Get userId passed from register.tsx
  const { userId } = useLocalSearchParams();

  const [licenseNumber, setLicenseNumber] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [seatingCapacity, setSeatingCapacity] = useState("");
  const [vehicleType, setVehicleType] = useState("");

  const handleFinish = async () => {
    // Convert userId to a normal string
    const actualUserId = Array.isArray(userId)
      ? userId[0]
      : userId;

    console.log("USER ID RECEIVED:", actualUserId);

    // Check if userId exists
    if (!actualUserId) {
      alert("User ID is missing.");
      console.log("ERROR: User ID is missing");
      return;
    }

    // Basic validation
    if (
      !licenseNumber ||
      !make ||
      !model ||
      !year ||
      !color ||
      !registrationNumber ||
      !seatingCapacity ||
      !vehicleType
    ) {
      alert("Please fill all fields.");
      return;
    }

    const driver = {
      userId: actualUserId,
      licenseNumber: licenseNumber,
      make: make,
      model: model,
      year: Number(year),
      color: color,
      registrationNumber: registrationNumber,
      seatingCapacity: Number(seatingCapacity),
      vehicleType: vehicleType,
    };

    console.log("DRIVER PAYLOAD:", driver);

    try {
      const response = await registerDriver(driver);

      console.log("DRIVER RESPONSE:", response.data);

      alert("Driver Registered Successfully!");

      router.replace("/");
    } catch (error: any) {
      console.log("DRIVER REGISTRATION FAILED");

      console.log(
        "STATUS:",
        error.response?.status
      );

      console.log(
        "RESPONSE DATA:",
        error.response?.data
      );

      console.log(
        "REQUEST DATA:",
        error.config?.data
      );

      console.log(
        "REQUEST URL:",
        error.config?.url
      );

      if (error.response?.data) {
        alert(
          JSON.stringify(error.response.data)
        );
      } else {
        alert(
          error.message ||
            "Unable to connect to server."
        );
      }
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>

        <Text style={styles.logo}>🚖</Text>

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
          style={styles.button}
          onPress={handleFinish}
        >
          <Text style={styles.buttonText}>
            Finish Registration
          </Text>
        </TouchableOpacity>

        {/* Back Button */}

        <TouchableOpacity
          onPress={() => router.back()}
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