import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { registerUser } from "../../services/authService";
import {
  getVehicleTypes,
  VehicleType,
} from "../../services/vehicleService";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");

  // Vehicle
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [selectedVehicleType, setSelectedVehicleType] =
    useState<VehicleType | null>(null);

  // Driver photo
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  // =====================================================
  // LOAD VEHICLE TYPES
  // =====================================================

  useEffect(() => {
    const loadVehicleTypes = async () => {
      try {
        const types = await getVehicleTypes();

        console.log("VEHICLE TYPES:", types);

        setVehicleTypes(types);
      } catch (error) {
        console.error("Failed to load vehicle types:", error);

        Alert.alert(
          "Error",
          "Unable to load vehicle types."
        );
      } finally {
        setLoadingVehicles(false);
      }
    };

    loadVehicleTypes();
  }, []);

  // =====================================================
  // SELECT DRIVER PHOTO
  // =====================================================

  const handleChoosePhoto = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow photo library access to select your driver photo."
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

      if (!result.canceled && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        const selectedUri = selectedAsset.uri;

        // Maximum allowed driver photo size: 2 MB
        const MAX_PHOTO_SIZE = 2 * 1024 * 1024;

        if (
          selectedAsset.fileSize !== undefined &&
          selectedAsset.fileSize > MAX_PHOTO_SIZE
        ) {
          const sizeInMB = (
            selectedAsset.fileSize /
            (1024 * 1024)
          ).toFixed(2);

          Alert.alert(
            "Photo Too Large",
            `The selected photo is ${sizeInMB} MB. Please choose a photo smaller than 2 MB.`
          );

          return;
        }

        console.log("SELECTED DRIVER PHOTO:", selectedUri);
        console.log("PHOTO SIZE:", selectedAsset.fileSize, "bytes");

        setPhotoUri(selectedUri);
      }
    } catch (error) {
      console.error("PHOTO PICKER ERROR:", error);

      Alert.alert(
        "Error",
        "Unable to select the photo."
      );
    }
  };

  // =====================================================
  // REMOVE PHOTO
  // =====================================================

  const handleRemovePhoto = () => {
    setPhotoUri(null);
  };

  // =====================================================
  // REGISTER
  // =====================================================

  const handleRegister = async () => {
    // -------------------------------------------------
    // Validation
    // -------------------------------------------------

    if (!fullName.trim()) {
      Alert.alert(
        "Validation",
        "Please enter your full name."
      );
      return;
    }

    if (!email.trim()) {
      Alert.alert(
        "Validation",
        "Please enter your email."
      );
      return;
    }

    if (!mobile.trim()) {
      Alert.alert(
        "Validation",
        "Please enter your mobile number."
      );
      return;
    }

    if (!password) {
      Alert.alert(
        "Validation",
        "Please enter a password."
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Validation",
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (!selectedVehicleType) {
      Alert.alert(
        "Validation",
        "Please select your vehicle type."
      );
      return;
    }

    // -------------------------------------------------
    // Photo validation
    // -------------------------------------------------

    if (!photoUri) {
      Alert.alert(
        "Validation",
        "Please select a driver photo."
      );
      return;
    }

    try {
      setLoading(true);

      // -------------------------------------------------
      // Firebase registration
      // -------------------------------------------------

      const user = await registerUser(
        email.trim(),
        password
      );

      console.log("FIREBASE USER:", user);
      console.log("FIREBASE UID:", user.uid);

      // -------------------------------------------------
      // Go to Driver Details
      // -------------------------------------------------

      router.push({
        pathname: "/driver-details",

        params: {
          firebaseUid: user.uid,

          fullName: fullName.trim(),

          email: email.trim(),

          mobile: mobile.trim(),

          // Vehicle information
          vehicleTypeId: selectedVehicleType.id,

          vehicleType: selectedVehicleType.name,

          // Driver photo
          photoUri: photoUri,
        },
      });
    } catch (error: any) {
      console.log(
        "FIREBASE REGISTRATION ERROR:",
        error
      );

      let message = "Registration failed.";

      if (
        error?.code ===
        "auth/email-already-in-use"
      ) {
        message =
          "This email is already registered.";
      } else if (
        error?.code === "auth/invalid-email"
      ) {
        message =
          "Please enter a valid email address.";
      } else if (
        error?.code === "auth/weak-password"
      ) {
        message =
          "The password is too weak.";
      } else if (error?.message) {
        message = error.message;
      }

      Alert.alert(
        "Registration Error",
        message
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>

        {/* Logo */}

        <Text style={styles.logo}>
          🚖
        </Text>

        {/* Title */}

        <Text style={styles.title}>
          Driver Registration
        </Text>

        <Text style={styles.subtitle}>
          Create your driver account
        </Text>

        {/* ================================================= */}
        {/* DRIVER PHOTO */}
        {/* ================================================= */}

        <Text style={styles.label}>
          Driver Photo
        </Text>

        <TouchableOpacity
          style={styles.photoContainer}
          onPress={handleChoosePhoto}
          disabled={loading}
        >
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={styles.photo}
            />
          ) : (
            <>
              <Text style={styles.cameraIcon}>
                📷
              </Text>

              <Text style={styles.photoText}>
                Add Driver Photo
              </Text>

              <Text style={styles.photoHint}>
                Tap to choose a photo
              </Text>

              <Text style={styles.photoSizeHint}>
                Maximum size: 2 MB
              </Text>
            </>
          )}
        </TouchableOpacity>

        {photoUri && (
          <View style={styles.photoActions}>
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={handleChoosePhoto}
              disabled={loading}
            >
              <Text style={styles.changePhotoText}>
                Change Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.removePhotoButton}
              onPress={handleRemovePhoto}
              disabled={loading}
            >
              <Text style={styles.removePhotoText}>
                Remove
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================================================= */}
        {/* FULL NAME */}
        {/* ================================================= */}

        <TextInput
          placeholder="Full Name"
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
        />

        {/* ================================================= */}
        {/* EMAIL */}
        {/* ================================================= */}

        <TextInput
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        {/* ================================================= */}
        {/* MOBILE */}
        {/* ================================================= */}

        <TextInput
          placeholder="Mobile Number"
          keyboardType="phone-pad"
          style={styles.input}
          value={mobile}
          onChangeText={setMobile}
        />

        {/* ================================================= */}
        {/* PASSWORD */}
        {/* ================================================= */}

        <TextInput
          placeholder="Password"
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        {/* ================================================= */}
        {/* VEHICLE TYPE */}
        {/* ================================================= */}

        <Text style={styles.label}>
          Vehicle Type
        </Text>

        {loadingVehicles ? (
          <Text style={styles.loadingText}>
            Loading vehicle types...
          </Text>
        ) : (
          <View style={styles.vehicleContainer}>
            {vehicleTypes.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={[
                  styles.vehicleButton,
                  selectedVehicleType?.id ===
                    vehicle.id &&
                    styles.vehicleButtonSelected,
                ]}
                onPress={() =>
                  setSelectedVehicleType(vehicle)
                }
                disabled={loading}
              >
                <Text
                  style={[
                    styles.vehicleText,
                    selectedVehicleType?.id ===
                      vehicle.id &&
                      styles.vehicleTextSelected,
                  ]}
                >
                  {vehicle.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ================================================= */}
        {/* REGISTER BUTTON */}
        {/* ================================================= */}

        <TouchableOpacity
          style={[
            styles.button,
            loading &&
              styles.buttonDisabled,
          ]}
          onPress={handleRegister}
          disabled={
            loading ||
            loadingVehicles
          }
        >
          <Text style={styles.buttonText}>
            {loading
              ? "Registering..."
              : "Register"}
          </Text>
        </TouchableOpacity>

        {/* ================================================= */}
        {/* LOGIN */}
        {/* ================================================= */}

        <TouchableOpacity
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.loginText}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

// =====================================================
// STYLES
// =====================================================

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

  // =====================================================
  // PHOTO
  // =====================================================

  photoContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: "#0A84FF",
    borderStyle: "dashed",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 10,
    backgroundColor: "#F4F8FF",
  },

  photo: {
    width: "100%",
    height: "100%",
  },

  cameraIcon: {
    fontSize: 35,
    marginBottom: 5,
  },

  photoText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0A84FF",
  },

  photoHint: {
    fontSize: 12,
    color: "gray",
    marginTop: 4,
  },

  photoSizeHint: {
    fontSize: 11,
    color: "gray",
    marginTop: 2,
  },

  photoActions: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
  },

  changePhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  changePhotoText: {
    color: "#0A84FF",
    fontWeight: "600",
  },

  removePhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  removePhotoText: {
    color: "#FF3B30",
    fontWeight: "600",
  },

  // =====================================================
  // INPUT
  // =====================================================

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    marginBottom: 15,
    fontSize: 16,
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },

  loadingText: {
    color: "gray",
    marginBottom: 15,
  },

  // =====================================================
  // VEHICLE
  // =====================================================

  vehicleContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },

  vehicleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 4,
    alignItems: "center",
    backgroundColor: "#fff",
  },

  vehicleButtonSelected: {
    backgroundColor: "#0A84FF",
    borderColor: "#0A84FF",
  },

  vehicleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  vehicleTextSelected: {
    color: "#fff",
  },

  // =====================================================
  // BUTTON
  // =====================================================

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

  loginText: {
    textAlign: "center",
    color: "#0A84FF",
    marginTop: 25,
    fontWeight: "600",
  },
});