import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { updateDriverDetails } from "../../services/driverService";
import { auth, db } from "../../services/firebase";

const CLOUDINARY_CLOUD_NAME = "mzwzgcw1";
const CLOUDINARY_UPLOAD_PRESET = "driver_photos";

const showMessage = (title: string, message: string, onOk?: () => void) => {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
    onOk?.();
    return;
  }
  Alert.alert(title, message, [{ text: "OK", onPress: onOk }]);
};

type FormState = {
  fullName: string;
  email: string;
  mobile: string;
  licenseNumber: string;
  photoUrl: string;
  make: string;
  model: string;
  year: string;
  color: string;
  registrationNumber: string;
  seatingCapacity: string;
  vehicleTypeId: string;
  vehicleType: string;
};

const emptyForm: FormState = {
  fullName: "",
  email: "",
  mobile: "",
  licenseNumber: "",
  photoUrl: "",
  make: "",
  model: "",
  year: "",
  color: "",
  registrationNumber: "",
  seatingCapacity: "",
  vehicleTypeId: "",
  vehicleType: "",
};

export default function EditDriverDetailsScreen() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [newPhotoUri, setNewPhotoUri] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);

  const setField = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const loadProfile = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        showMessage("Sign in required", "Please sign in again to edit your driver profile.", () => router.replace("/"));
        return;
      }

      // registerDriver stores the driver document using the Firebase UID as its ID.
      const currentDriverId = user.uid;
      const driverRef = doc(db, "drivers", currentDriverId);
      const driverSnap = await getDoc(driverRef);

      if (!driverSnap.exists()) {
        showMessage("Profile not found", "Your driver profile could not be found. Please contact support.");
        return;
      }

      const driverData = driverSnap.data();
      const vehiclesRef = collection(db, "drivers", currentDriverId, "vehicles");
      const vehiclesSnap = await getDocs(vehiclesRef);
      const activeVehicle = vehiclesSnap.docs.find((item) => item.data().isActive === true);
      const vehicleData = activeVehicle?.data();

      if (!activeVehicle || !vehicleData) {
        showMessage("Vehicle not found", "No active vehicle was found. Select or add a vehicle before editing these details.");
        return;
      }

      setDriverId(currentDriverId);
      setVehicleId(activeVehicle.id);
      setForm({
        fullName: String(driverData.fullName ?? ""),
        email: String(driverData.email ?? user.email ?? ""),
        mobile: String(driverData.mobile ?? ""),
        licenseNumber: String(driverData.licenseNumber ?? ""),
        photoUrl: String(driverData.photoUrl ?? ""),
        make: String(vehicleData.make ?? ""),
        model: String(vehicleData.model ?? ""),
        year: vehicleData.year != null ? String(vehicleData.year) : "",
        color: String(vehicleData.color ?? ""),
        registrationNumber: String(vehicleData.registrationNumber ?? ""),
        seatingCapacity: vehicleData.seatingCapacity != null ? String(vehicleData.seatingCapacity) : "",
        vehicleTypeId: String(vehicleData.vehicleTypeId ?? ""),
        vehicleType: String(vehicleData.vehicleType ?? ""),
      });
    } catch (error) {
      console.error("Failed to load driver profile:", error);
      showMessage("Unable to load", "Could not load your driver details. Check your connection and try again.");
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const choosePhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showMessage("Permission needed", "Allow photo-library access to choose a driver photo.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setNewPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Photo picker error:", error);
      showMessage("Photo error", "Could not open the photo library.");
    }
  };

  const uploadPhoto = async (uri: string): Promise<string> => {
    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const data = new FormData();

    if (Platform.OS === "web") {
      const response = await fetch(uri);
      const blob = await response.blob();
      data.append("file", blob, "driver-photo.jpg");
    } else {
      const filename = uri.split("/").pop() || "driver-photo.jpg";
      const extension = filename.includes(".") ? filename.split(".").pop() : "jpg";
      const mimeType = extension?.toLowerCase() === "png" ? "image/png" : "image/jpeg";
      data.append("file", { uri, name: filename, type: mimeType } as any);
    }
    data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(endpoint, { method: "POST", body: data });
    const result = await response.json();
    if (!response.ok || !result.secure_url) {
      console.error("Cloudinary upload failed:", result);
      throw new Error(result.error?.message || "Photo upload failed.");
    }
    return String(result.secure_url);
  };

  const handleSave = async () => {
    if (!driverId || !vehicleId) {
      showMessage("Profile unavailable", "The driver or vehicle profile has not loaded. Please reopen this screen.");
      return;
    }

    const required: Array<[keyof FormState, string]> = [
      ["fullName", "Full name"],
      ["email", "Email"],
      ["mobile", "Mobile number"],
      ["licenseNumber", "Driving licence number"],
      ["make", "Vehicle make"],
      ["model", "Vehicle model"],
      ["year", "Vehicle year"],
      ["color", "Vehicle colour"],
      ["registrationNumber", "Registration number"],
      ["seatingCapacity", "Seating capacity"],
      ["vehicleTypeId", "Vehicle type ID"],
      ["vehicleType", "Vehicle type"],
    ];
    const missing = required.find(([key]) => !form[key].trim());
    if (missing) {
      showMessage("Required field", `Please enter ${missing[1].toLowerCase()}.`);
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      showMessage("Invalid email", "Please enter a valid email address.");
      return;
    }
    if (!/^\d{4}$/.test(form.year.trim()) || Number(form.year) < 1950 || Number(form.year) > new Date().getFullYear() + 1) {
      showMessage("Invalid vehicle year", "Enter a valid four-digit vehicle year.");
      return;
    }
    if (!/^\d+$/.test(form.seatingCapacity.trim()) || Number(form.seatingCapacity) < 1) {
      showMessage("Invalid seating capacity", "Enter a positive whole number for seating capacity.");
      return;
    }

    setSaving(true);
    try {
      let photoUrl = form.photoUrl.trim();
      if (newPhotoUri) {
        photoUrl = await uploadPhoto(newPhotoUri);
      }

      await updateDriverDetails(driverId, {
       
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        licenseNumber: form.licenseNumber.trim(),
        photoUrl,
        make: form.make.trim(),
        model: form.model.trim(),
        year: Number(form.year),
        color: form.color.trim(),
        registrationNumber: form.registrationNumber.trim().toUpperCase(),
        seatingCapacity: Number(form.seatingCapacity),
        vehicleTypeId: form.vehicleTypeId.trim(),
        vehicleType: form.vehicleType.trim(),
      });

      showMessage("Changes saved", "Your driver profile and vehicle details have been updated.", () => router.back());
    } catch (error) {
      console.error("Failed to update driver details:", error);
      const message = error instanceof Error ? error.message : "Please try again.";
      showMessage("Save failed", message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1769aa" />
        <Text style={styles.loadingText}>Loading driver details...</Text>
      </View>
    );
  }

  const displayedPhoto = newPhotoUri || form.photoUrl;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Edit Driver Details</Text>
        <Text style={styles.subtitle}>Update your personal information, photo and vehicle details.</Text>

        <View style={styles.photoSection}>
          {displayedPhoto ? (
            <Image source={{ uri: displayedPhoto }} style={styles.photo} />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Text style={styles.photoPlaceholderText}>No photo</Text>
            </View>
          )}
          <TouchableOpacity style={styles.photoButton} onPress={choosePhoto} disabled={saving}>
            <Text style={styles.photoButtonText}>{newPhotoUri ? "Choose Another Photo" : "Change Driver Photo"}</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>Your new photo will be uploaded when you save changes.</Text>
        </View>

        <Text style={styles.sectionTitle}>Personal details</Text>
        <Field label="Full name" value={form.fullName} onChangeText={(v) => setField("fullName", v)} editable={!saving} />
        <Field label="Email address" value={form.email} onChangeText={(v) => setField("email", v)} keyboardType="email-address" autoCapitalize="none" editable={!saving} />
        <Field label="Mobile number" value={form.mobile} onChangeText={(v) => setField("mobile", v)} keyboardType="phone-pad" editable={!saving} />
        <Field label="Driving licence number" value={form.licenseNumber} onChangeText={(v) => setField("licenseNumber", v)} autoCapitalize="characters" editable={!saving} />

        <Text style={styles.sectionTitle}>Vehicle details</Text>
        <Field label="Vehicle type" value={form.vehicleType} onChangeText={(v) => setField("vehicleType", v)} editable={!saving} />
        <Field label="Vehicle type ID" value={form.vehicleTypeId} onChangeText={(v) => setField("vehicleTypeId", v)} autoCapitalize="none" editable={!saving} />
        <Field label="Make" value={form.make} onChangeText={(v) => setField("make", v)} editable={!saving} />
        <Field label="Model" value={form.model} onChangeText={(v) => setField("model", v)} editable={!saving} />
        <Field label="Year" value={form.year} onChangeText={(v) => setField("year", v.replace(/\D/g, "").slice(0, 4))} keyboardType="number-pad" editable={!saving} />
        <Field label="Colour" value={form.color} onChangeText={(v) => setField("color", v)} editable={!saving} />
        <Field label="Registration number" value={form.registrationNumber} onChangeText={(v) => setField("registrationNumber", v.toUpperCase())} autoCapitalize="characters" editable={!saving} />
        <Field label="Seating capacity" value={form.seatingCapacity} onChangeText={(v) => setField("seatingCapacity", v.replace(/\D/g, ""))} keyboardType="number-pad" editable={!saving} />

        <TouchableOpacity style={[styles.saveButton, saving && styles.disabledButton]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} disabled={saving}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "email-address" | "phone-pad" | "number-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  editable?: boolean;
};

function Field({ label, value, onChangeText, keyboardType = "default", autoCapitalize = "sentences", editable = true }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor="#8a8a8a"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f4f7fb" },
  container: { padding: 20, paddingBottom: 40, maxWidth: 680, width: "100%", alignSelf: "center" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f4f7fb" },
  loadingText: { marginTop: 12, color: "#444", fontSize: 15 },
  title: { fontSize: 26, fontWeight: "700", color: "#14283d", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#5e6d7c", marginBottom: 22, lineHeight: 20 },
  photoSection: { alignItems: "center", backgroundColor: "#fff", borderRadius: 14, padding: 18, marginBottom: 22 },
  photo: { width: 112, height: 112, borderRadius: 56, backgroundColor: "#e6ebf0" },
  photoPlaceholder: { alignItems: "center", justifyContent: "center" },
  photoPlaceholderText: { color: "#637080", fontSize: 13 },
  photoButton: { backgroundColor: "#e7f1fb", borderRadius: 9, paddingHorizontal: 16, paddingVertical: 10, marginTop: 12 },
  photoButtonText: { color: "#1769aa", fontWeight: "700" },
  hint: { marginTop: 8, color: "#6d7884", fontSize: 12, textAlign: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#14283d", marginTop: 8, marginBottom: 12 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, color: "#34495e", fontWeight: "600", marginBottom: 6 },
  input: { minHeight: 48, borderWidth: 1, borderColor: "#d6dee7", borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#fff", color: "#17212b", fontSize: 15 },
  inputDisabled: { opacity: 0.65 },
  saveButton: { minHeight: 50, backgroundColor: "#1769aa", borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 14 },
  disabledButton: { opacity: 0.65 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  cancelButton: { minHeight: 46, alignItems: "center", justifyContent: "center", marginTop: 8 },
  cancelButtonText: { color: "#425466", fontSize: 15, fontWeight: "600" },
});
