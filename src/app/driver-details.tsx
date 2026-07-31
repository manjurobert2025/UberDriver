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
  const driver = {
    userId,
    licenseNumber,
    make,
    model,
    year: Number(year),
    color,
    registrationNumber,
    seatingCapacity: Number(seatingCapacity),
    vehicleType,
  };

  try {
    const response = await registerDriver(driver);

    console.log(response.data);

    alert("Driver Registered Successfully!");

    router.replace("/");
  } catch (error: any) {
    console.error(error);

    if (error.response) {
      alert(error.response.data);
    } else {
      alert("Unable to connect to server.");
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

        <Text style={styles.title}>Driver Details</Text>

        <Text style={styles.subtitle}>
          Complete your vehicle information
        </Text>

        <TextInput
          placeholder="License Number"
          value={licenseNumber}
          onChangeText={setLicenseNumber}
          style={styles.input}
        />

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
          style={styles.button}
          onPress={handleFinish}
        >
          <Text style={styles.buttonText}>
            Finish Registration
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
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