import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
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

import { addVehicle } from "../../services/driverService";

export default function AddVehicleScreen() {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [seatingCapacity, setSeatingCapacity] = useState("");
  const [vehicleType, setVehicleType] = useState("");

  const [loading, setLoading] = useState(false);

  const handleAddVehicle = async () => {
    const driverId = await AsyncStorage.getItem("firebaseUid");

    if (!driverId) {
      Alert.alert(
        "Error",
        "Driver information not found. Please login again."
      );
      return;
    }

    if (
      !make.trim() ||
      !model.trim() ||
      !year.trim() ||
      !color.trim() ||
      !registrationNumber.trim() ||
      !seatingCapacity.trim() ||
      !vehicleType.trim()
    ) {
      Alert.alert("Validation", "Please fill all fields.");
      return;
    }

    const vehicleYear = Number(year);

    if (
      isNaN(vehicleYear) ||
      vehicleYear < 1900 ||
      vehicleYear > new Date().getFullYear() + 1
    ) {
      Alert.alert("Validation", "Please enter a valid vehicle year.");
      return;
    }

    const capacity = Number(seatingCapacity);

    if (isNaN(capacity) || capacity <= 0) {
      Alert.alert(
        "Validation",
        "Please enter a valid seating capacity."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await addVehicle(driverId, {
        make: make.trim(),
        model: model.trim(),
        year: vehicleYear,
        color: color.trim(),
        registrationNumber: registrationNumber.trim(),
        seatingCapacity: capacity,
        vehicleType: vehicleType.trim(),
        tariffId: "default",
      });

      console.log("ADD VEHICLE RESPONSE:", response);

      Alert.alert(
        "Vehicle Added",
        "Your vehicle has been added successfully.",
        [
          {
            text: "OK",
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("ADD VEHICLE FAILED:", error);

      Alert.alert(
        "Error",
        error?.message || "Unable to add vehicle."
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
        <Text style={styles.logo}>🚗</Text>

        <Text style={styles.title}>Add Vehicle</Text>

        <Text style={styles.subtitle}>
          Add another vehicle to your account
        </Text>

        <TextInput
          placeholder="Vehicle Make"
          value={make}
          onChangeText={setMake}
          style={styles.input}
        />

        <TextInput
          placeholder="Vehicle Model"
          value={model}
          onChangeText={setModel}
          style={styles.input}
        />

        <TextInput
          placeholder="Year"
          keyboardType="numeric"
          value={year}
          onChangeText={setYear}
          style={styles.input}
          maxLength={4}
        />

        <TextInput
          placeholder="Color"
          value={color}
          onChangeText={setColor}
          style={styles.input}
        />

        <TextInput
          placeholder="Registration Number"
          value={registrationNumber}
          onChangeText={setRegistrationNumber}
          style={styles.input}
          autoCapitalize="characters"
        />

        <TextInput
          placeholder="Seating Capacity"
          keyboardType="numeric"
          value={seatingCapacity}
          onChangeText={setSeatingCapacity}
          style={styles.input}
        />

        <TextInput
          placeholder="Vehicle Type (Car / Auto / Bike)"
          value={vehicleType}
          onChangeText={setVehicleType}
          style={styles.input}
        />

        <TouchableOpacity
          style={[
            styles.button,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleAddVehicle}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Saving..." : "Add Vehicle"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.backText}>Cancel</Text>
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
    backgroundColor: "#FFFFFF",
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
    borderColor: "#DDD",
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
    color: "#FFFFFF",
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