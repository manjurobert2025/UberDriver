import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { registerDriver } from "../../services/driverService";

// =====================================================
// CLOUDINARY CONFIGURATION
// =====================================================

const CLOUDINARY_CLOUD_NAME = "mzwzgcw1";

const CLOUDINARY_UPLOAD_PRESET =
  "driver_photos";

// =====================================================
// DRIVER DETAILS SCREEN
// =====================================================

export default function DriverDetailsScreen() {
  // =====================================================
  // ROUTER PARAMETERS
  // =====================================================

  const {
    firebaseUid,
    fullName,
    email,
    mobile,
    vehicleTypeId,
    vehicleType,
    photoUri,
  } = useLocalSearchParams();

  // =====================================================
  // DRIVER / VEHICLE DETAILS
  // =====================================================

  const [licenseNumber, setLicenseNumber] =
    useState("");

  const [make, setMake] =
    useState("");

  const [model, setModel] =
    useState("");

  const [year, setYear] =
    useState("");

  const [color, setColor] =
    useState("");

  const [registrationNumber, setRegistrationNumber] =
    useState("");

  const [seatingCapacity, setSeatingCapacity] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  // =====================================================
  // GET PARAMETER VALUES
  // =====================================================

  const actualUserId =
    Array.isArray(firebaseUid)
      ? firebaseUid[0]
      : firebaseUid;

  const actualFullName =
    Array.isArray(fullName)
      ? fullName[0]
      : fullName || "";

  const actualEmail =
    Array.isArray(email)
      ? email[0]
      : email || "";

  const actualMobile =
    Array.isArray(mobile)
      ? mobile[0]
      : mobile || "";

  const actualVehicleTypeId =
    Array.isArray(vehicleTypeId)
      ? vehicleTypeId[0]
      : vehicleTypeId || "";

  const actualVehicleType =
    Array.isArray(vehicleType)
      ? vehicleType[0]
      : vehicleType || "";

  const actualPhotoUri =
    Array.isArray(photoUri)
      ? photoUri[0]
      : photoUri || "";

  // =====================================================
  // VEHICLE ICON
  // =====================================================

  const getVehicleIcon = () => {
    if (actualVehicleType === "Car") {
      return "🚗";
    }

    if (actualVehicleType === "Bike") {
      return "🏍️";
    }

    if (actualVehicleType === "Auto") {
      return "🛺";
    }

    return "🚙";
  };

  // =====================================================
  // UPLOAD DRIVER PHOTO TO CLOUDINARY
  // =====================================================

  const uploadDriverPhoto = async (
    photoUriValue: string
  ): Promise<string> => {
    try {
      console.log(
        "================================="
      );

      console.log(
        "STARTING CLOUDINARY UPLOAD..."
      );

      console.log(
        "PHOTO URI:",
        photoUriValue
      );

      console.log(
        "PLATFORM:",
        Platform.OS
      );

      console.log(
        "CLOUD NAME:",
        CLOUDINARY_CLOUD_NAME
      );

      console.log(
        "UPLOAD PRESET:",
        CLOUDINARY_UPLOAD_PRESET
      );

      console.log(
        "================================="
      );

      const formData = new FormData();

      // =================================================
      // WEB
      // =================================================

      if (Platform.OS === "web") {
        console.log(
          "WEB PHOTO UPLOAD"
        );

        // Convert the selected URI into a Blob.
        const imageResponse =
          await fetch(photoUriValue);

        if (!imageResponse.ok) {
          throw new Error(
            "Unable to read the selected photo."
          );
        }

        const blob =
          await imageResponse.blob();

        console.log(
          "WEB PHOTO TYPE:",
          blob.type
        );

        console.log(
          "WEB PHOTO SIZE:",
          blob.size
        );

        formData.append(
          "file",
          blob,
          "driver-photo.jpg"
        );
      }

      // =================================================
      // ANDROID / IOS
      // =================================================

      else {
        console.log(
          "NATIVE PHOTO UPLOAD"
        );

        formData.append(
          "file",
          {
            uri: photoUriValue,
            type: "image/jpeg",
            name: "driver-photo.jpg",
          } as any
        );
      }

      // =================================================
      // CLOUDINARY UPLOAD PRESET
      // =================================================

      formData.append(
        "upload_preset",
        CLOUDINARY_UPLOAD_PRESET
      );

      // =================================================
      // CLOUDINARY API URL
      // =================================================

      const uploadUrl =
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

      console.log(
        "CLOUDINARY URL:",
        uploadUrl
      );

      // =================================================
      // SEND PHOTO
      // =================================================

      const response =
        await fetch(
          uploadUrl,
          {
            method: "POST",
            body: formData,
          }
        );

      console.log(
        "CLOUDINARY RESPONSE STATUS:",
        response.status
      );

      const data =
        await response.json();

      console.log(
        "CLOUDINARY RESPONSE:",
        data
      );

      // =================================================
      // HANDLE ERROR
      // =================================================

      if (!response.ok) {
        throw new Error(
          data?.error?.message ||
          "Cloudinary upload failed."
        );
      }

      // =================================================
      // CHECK SECURE URL
      // =================================================

      if (!data?.secure_url) {
        throw new Error(
          "Cloudinary did not return an image URL."
        );
      }

      console.log(
        "================================="
      );

      console.log(
        "CLOUDINARY UPLOAD SUCCESS"
      );

      console.log(
        "PHOTO URL:",
        data.secure_url
      );

      console.log(
        "================================="
      );

      return data.secure_url;

    } catch (error: any) {

      console.error(
        "================================="
      );

      console.error(
        "CLOUDINARY UPLOAD ERROR:",
        error
      );

      console.error(
        "================================="
      );

      throw error;
    }
  };

  // =====================================================
  // FINISH REGISTRATION
  // =====================================================

  const handleFinish = async () => {
    console.log(
      "================================="
    );

    console.log(
      "STARTING DRIVER REGISTRATION"
    );

    console.log(
      "================================="
    );

    console.log(
      "FIREBASE UID:",
      actualUserId
    );

    console.log(
      "FULL NAME:",
      actualFullName
    );

    console.log(
      "EMAIL:",
      actualEmail
    );

    console.log(
      "MOBILE:",
      actualMobile
    );

    console.log(
      "VEHICLE TYPE ID:",
      actualVehicleTypeId
    );

    console.log(
      "VEHICLE TYPE:",
      actualVehicleType
    );

    console.log(
      "PHOTO URI:",
      actualPhotoUri
    );

    // =================================================
    // VALIDATE FIREBASE USER
    // =================================================

    if (!actualUserId) {
      Alert.alert(
        "Error",
        "Firebase User ID is missing."
      );

      return;
    }

    // =================================================
    // VALIDATE VEHICLE TYPE
    // =================================================

    if (
      !actualVehicleTypeId ||
      !actualVehicleType
    ) {
      Alert.alert(
        "Validation",
        "Vehicle type is missing. Please go back and select a vehicle type."
      );

      return;
    }

    // =================================================
    // VALIDATE DRIVER PHOTO
    // =================================================

    if (!actualPhotoUri) {
      Alert.alert(
        "Driver Photo",
        "Please select a driver photo before completing registration."
      );

      return;
    }

    // =================================================
    // VALIDATE VEHICLE DETAILS
    // =================================================

    if (
      !licenseNumber.trim() ||
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

    // =================================================
    // VALIDATE YEAR
    // =================================================

    const vehicleYear =
      Number(year);

    if (
      isNaN(vehicleYear) ||
      vehicleYear < 1900 ||
      vehicleYear >
        new Date().getFullYear() + 1
    ) {
      Alert.alert(
        "Validation",
        "Please enter a valid vehicle year."
      );

      return;
    }

    // =================================================
    // VALIDATE SEATING CAPACITY
    // =================================================

    const capacity =
      Number(seatingCapacity);

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

    // =================================================
    // START SAVING
    // =================================================

    try {
      setLoading(true);

      // =================================================
      // UPLOAD DRIVER PHOTO
      // =================================================

      console.log(
        "Uploading driver photo..."
      );

      const photoUrl =
        await uploadDriverPhoto(
          actualPhotoUri
        );

      console.log(
        "DRIVER PHOTO URL:",
        photoUrl
      );

      // =================================================
      // CREATE DRIVER OBJECT
      // =================================================

      const driver = {
        userId:
          actualUserId,

        fullName:
          actualFullName,

        email:
          actualEmail,

        mobile:
          actualMobile,

        // Driver photo
        photoUrl:
          photoUrl,

        // License
        licenseNumber:
          licenseNumber.trim(),

        // Vehicle details
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

        // Vehicle Type Master
        vehicleTypeId:
          actualVehicleTypeId,

        vehicleType:
          actualVehicleType.trim(),
      };

      console.log(
        "================================="
      );

      console.log(
        "DRIVER FIRESTORE DATA:",
        driver
      );

      console.log(
        "================================="
      );

      // =================================================
      // SAVE DRIVER TO FIRESTORE
      // =================================================

      const response =
        await registerDriver(
          driver
        );

      console.log(
        "DRIVER REGISTRATION RESPONSE:",
        response
      );

      // =================================================
      // SUCCESS
      // =================================================

      Alert.alert(
        "Registration Successful",
        "Driver profile and photo have been saved successfully.",
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

      console.error(
        "DRIVER REGISTRATION FAILED:",
        error
      );

      Alert.alert(
        "Registration Error",
        error?.message ||
          "Unable to complete driver registration."
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
      contentContainerStyle={
        styles.container
      }
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>

        {/* ============================================= */}
        {/* LOGO */}
        {/* ============================================= */}

        <Text style={styles.logo}>
          🚖
        </Text>

        {/* ============================================= */}
        {/* TITLE */}
        {/* ============================================= */}

        <Text style={styles.title}>
          Driver Details
        </Text>

        <Text style={styles.subtitle}>
          Complete your vehicle information
        </Text>

        {/* ============================================= */}
        {/* DRIVER PHOTO */}
        {/* ============================================= */}

        <Text
          style={
            styles.photoLabel
          }
        >
          Driver Photo
        </Text>

        <View
          style={
            styles.photoContainer
          }
        >
          {actualPhotoUri ? (
            <Image
              source={{
                uri: actualPhotoUri,
              }}
              style={
                styles.driverPhoto
              }
            />
          ) : (
            <View
              style={
                styles.noPhoto
              }
            >
              <Text
                style={
                  styles.noPhotoIcon
                }
              >
                👤
              </Text>

              <Text
                style={
                  styles.noPhotoText
                }
              >
                No Photo
              </Text>
            </View>
          )}
        </View>

        {/* ============================================= */}
        {/* SELECTED VEHICLE TYPE */}
        {/* ============================================= */}

        <Text
          style={
            styles.vehicleLabel
          }
        >
          Vehicle Type
        </Text>

        <View
          style={
            styles.selectedVehicle
          }
        >
          <Text
            style={
              styles.vehicleIcon
            }
          >
            {getVehicleIcon()}
          </Text>

          <Text
            style={
              styles.selectedVehicleText
            }
          >
            {actualVehicleType ||
              "Not selected"}
          </Text>
        </View>

        {/* ============================================= */}
        {/* LICENSE NUMBER */}
        {/* ============================================= */}

        <TextInput
          placeholder="License Number"
          value={
            licenseNumber
          }
          onChangeText={
            setLicenseNumber
          }
          style={
            styles.input
          }
          autoCapitalize="characters"
        />

        {/* ============================================= */}
        {/* VEHICLE MAKE */}
        {/* ============================================= */}

        <TextInput
          placeholder="Vehicle Make"
          value={make}
          onChangeText={
            setMake
          }
          style={
            styles.input
          }
        />

        {/* ============================================= */}
        {/* VEHICLE MODEL */}
        {/* ============================================= */}

        <TextInput
          placeholder="Vehicle Model"
          value={model}
          onChangeText={
            setModel
          }
          style={
            styles.input
          }
        />

        {/* ============================================= */}
        {/* YEAR */}
        {/* ============================================= */}

        <TextInput
          placeholder="Year"
          keyboardType="numeric"
          value={year}
          onChangeText={
            setYear
          }
          style={
            styles.input
          }
          maxLength={4}
        />

        {/* ============================================= */}
        {/* COLOR */}
        {/* ============================================= */}

        <TextInput
          placeholder="Color"
          value={color}
          onChangeText={
            setColor
          }
          style={
            styles.input
          }
        />

        {/* ============================================= */}
        {/* REGISTRATION NUMBER */}
        {/* ============================================= */}

        <TextInput
          placeholder="Registration Number"
          value={
            registrationNumber
          }
          onChangeText={
            setRegistrationNumber
          }
          style={
            styles.input
          }
          autoCapitalize="characters"
        />

        {/* ============================================= */}
        {/* SEATING CAPACITY */}
        {/* ============================================= */}

        <TextInput
          placeholder="Seating Capacity"
          keyboardType="numeric"
          value={
            seatingCapacity
          }
          onChangeText={
            setSeatingCapacity
          }
          style={
            styles.input
          }
        />

        {/* ============================================= */}
        {/* FINISH REGISTRATION */}
        {/* ============================================= */}

        <TouchableOpacity
          style={[
            styles.button,
            loading &&
              styles.buttonDisabled,
          ]}
          onPress={
            handleFinish
          }
          disabled={loading}
        >

          {loading ? (
            <View
              style={
                styles.loadingContainer
              }
            >
              <ActivityIndicator
                color="#fff"
              />

              <Text
                style={
                  styles.buttonText
                }
              >
                Uploading & Saving...
              </Text>
            </View>
          ) : (
            <Text
              style={
                styles.buttonText
              }
            >
              Finish Registration
            </Text>
          )}

        </TouchableOpacity>

        {/* ============================================= */}
        {/* BACK BUTTON */}
        {/* ============================================= */}

        <TouchableOpacity
          onPress={() => {

            if (
              router.canGoBack()
            ) {
              router.back();
            } else {
              router.replace(
                "/register"
              );
            }

          }}
          disabled={loading}
        >
          <Text
            style={
              styles.backText
            }
          >
            Back
          </Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles =
  StyleSheet.create({

    container: {
      flexGrow: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#F4F6F8",
      padding: 20,
    },

    card: {
      width: "100%",
      maxWidth: 400,
      backgroundColor:
        "#fff",
      borderRadius: 20,
      padding: 25,
      elevation: 5,
    },

    logo: {
      fontSize: 55,
      textAlign:
        "center",
      marginBottom: 10,
    },

    title: {
      fontSize: 28,
      fontWeight:
        "bold",
      textAlign:
        "center",
    },

    subtitle: {
      textAlign:
        "center",
      color: "gray",
      marginTop: 5,
      marginBottom: 25,
    },

    // =================================================
    // PHOTO
    // =================================================

    photoLabel: {
      fontSize: 16,
      fontWeight:
        "600",
      marginBottom: 10,
    },

    photoContainer: {
      alignItems:
        "center",
      justifyContent:
        "center",
      marginBottom: 20,
    },

    driverPhoto: {
      width: 130,
      height: 130,
      borderRadius: 65,
      borderWidth: 3,
      borderColor:
        "#0A84FF",
    },

    noPhoto: {
      width: 130,
      height: 130,
      borderRadius: 65,
      backgroundColor:
        "#F0F0F0",
      borderWidth: 2,
      borderColor:
        "#DDD",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    noPhotoIcon: {
      fontSize: 40,
    },

    noPhotoText: {
      marginTop: 5,
      color: "gray",
    },

    // =================================================
    // INPUT
    // =================================================

    input: {
      borderWidth: 1,
      borderColor:
        "#ddd",
      borderRadius: 10,
      padding: 14,
      marginBottom: 15,
      fontSize: 16,
      backgroundColor:
        "#fff",
    },

    // =================================================
    // VEHICLE
    // =================================================

    vehicleLabel: {
      fontSize: 16,
      fontWeight:
        "600",
      marginBottom: 10,
    },

    selectedVehicle: {
      flexDirection:
        "row",
      alignItems:
        "center",
      borderWidth: 1,
      borderColor:
        "#0A84FF",
      backgroundColor:
        "#EAF3FF",
      borderRadius: 12,
      padding: 12,
      marginBottom: 15,
    },

    vehicleIcon: {
      fontSize: 30,
      marginRight: 12,
    },

    selectedVehicleText: {
      fontSize: 17,
      fontWeight:
        "bold",
      color:
        "#0A84FF",
    },

    // =================================================
    // BUTTON
    // =================================================

    button: {
      backgroundColor:
        "#0A84FF",
      padding: 15,
      borderRadius: 10,
      alignItems:
        "center",
      justifyContent:
        "center",
      marginTop: 10,
      minHeight: 52,
    },

    buttonDisabled: {
      opacity: 0.7,
    },

    buttonText: {
      color: "#fff",
      fontWeight:
        "bold",
      fontSize: 18,
      marginLeft: 8,
    },

    loadingContainer: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    // =================================================
    // BACK
    // =================================================

    backText: {
      textAlign:
        "center",
      color:
        "#0A84FF",
      marginTop: 20,
      fontWeight:
        "600",
      fontSize: 16,
    },

  });