import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "./firebase";

// =====================================================
// DRIVER INTERFACE
// =====================================================

export interface Driver {
  userId: string;
  fullName: string;
  email: string;
  mobile: string;
  licenseNumber: string;
  photoUrl?: string;
  make: string;
  model: string;
  year: number;
  color: string;
  registrationNumber: string;
  seatingCapacity: number;
  vehicleTypeId: string;
  vehicleType: string;
  // Kept optional for compatibility
  vehicleTypeCode?: string;
}

// =====================================================
// REGISTER DRIVER + FIRST VEHICLE
// =====================================================

export async function registerDriver(driver: Driver) {
  console.log("====================================");
  console.log("REGISTERING DRIVER");
  console.log("DRIVER ID:", driver.userId);
  console.log("DRIVER NAME:", driver.fullName);
  console.log("DRIVER EMAIL:", driver.email);
  console.log("DRIVER PHOTO:", driver.photoUrl);
  console.log("VEHICLE TYPE:", driver.vehicleType);
  console.log("====================================");

  // Driver document uses the Firebase user ID as its document ID.
  const driverRef = doc(db, "drivers", driver.userId);

  const driverData: Record<string, unknown> = {
    userId: driver.userId,
    fullName: driver.fullName,
    email: driver.email,
    mobile: driver.mobile,
    licenseNumber: driver.licenseNumber,
    isAvailable: false,
    createdAt: serverTimestamp(),
  };

  if (driver.photoUrl) {
    driverData.photoUrl = driver.photoUrl;
  }

  await setDoc(driverRef, driverData);

  console.log("DRIVER DOCUMENT CREATED:", driver.userId);
  console.log("DRIVER PHOTO SAVED:", driver.photoUrl || "No photo");

  // Create the first vehicle under drivers/{driverId}/vehicles.
  const vehiclesRef = collection(
    db,
    "drivers",
    driver.userId,
    "vehicles"
  );

  const vehicleRef = doc(vehiclesRef);

  const vehicleData: Record<string, unknown> = {
    vehicleTypeId: driver.vehicleTypeId,
    vehicleType: driver.vehicleType,
    make: driver.make,
    model: driver.model,
    year: driver.year,
    color: driver.color,
    registrationNumber: driver.registrationNumber,
    seatingCapacity: driver.seatingCapacity,
    tariffId: "default",
    isActive: true,
    createdAt: serverTimestamp(),
  };

  if (driver.vehicleTypeCode) {
    vehicleData.vehicleTypeCode = driver.vehicleTypeCode;
  }

  await setDoc(vehicleRef, vehicleData);

  console.log("VEHICLE DOCUMENT CREATED:", vehicleRef.id);
  console.log("VEHICLE TYPE:", driver.vehicleType);
  console.log("VEHICLE MAKE:", driver.make);
  console.log("VEHICLE MODEL:", driver.model);
  console.log("VEHICLE REGISTRATION:", driver.registrationNumber);
  console.log("====================================");
  console.log("DRIVER REGISTRATION COMPLETED");
  console.log("====================================");

  return {
    success: true,
    userId: driver.userId,
    vehicleId: vehicleRef.id,
    photoUrl: driver.photoUrl || null,
  };
}

// =====================================================
// UPDATE DRIVER DETAILS
// Updates the existing driver and their active vehicle.
// Does not create a new driver or vehicle.
// =====================================================

export interface UpdateDriverDetailsInput {
  fullName: string;
  email: string;
  mobile: string;
  licenseNumber: string;
  photoUrl?: string;
  make: string;
  model: string;
  year: number;
  color: string;
  registrationNumber: string;
  seatingCapacity: number;
  vehicleTypeId: string;
  vehicleType: string;
}

export async function updateDriverDetails(
  driverId: string,
  driver: UpdateDriverDetailsInput
) {
  if (!driverId) {
    throw new Error("Driver ID is missing.");
  }

  // Find and verify the existing driver first.
  const driverRef = doc(db, "drivers", driverId);
  const driverSnapshot = await getDoc(driverRef);

  if (!driverSnapshot.exists()) {
    throw new Error("Driver profile not found.");
  }

  // Find the active vehicle before saving any changes.
  const vehiclesRef = collection(
    db,
    "drivers",
    driverId,
    "vehicles"
  );

  const vehiclesSnapshot = await getDocs(vehiclesRef);

  const activeVehicle = vehiclesSnapshot.docs.find(
    (vehicleDoc) => vehicleDoc.data().isActive === true
  );

  if (!activeVehicle) {
    throw new Error(
      "No active vehicle was found. Please select an active vehicle first."
    );
  }

  // Update personal details without overwriting availability,
  // location, account identifiers, or other existing fields.
  const driverUpdates: Record<string, unknown> = {
    fullName: driver.fullName.trim(),
    email: driver.email.trim(),
    mobile: driver.mobile.trim(),
    licenseNumber: driver.licenseNumber.trim(),
    updatedAt: serverTimestamp(),
  };

  // Only update the photo URL when one is provided.
  // If the user keeps the existing photo, its URL is preserved.
  if (driver.photoUrl) {
    driverUpdates.photoUrl = driver.photoUrl;
  }

  await updateDoc(driverRef, driverUpdates);

  // Update the existing active vehicle; do not add a new vehicle.
  await updateDoc(activeVehicle.ref, {
    vehicleTypeId: driver.vehicleTypeId,
    vehicleType: driver.vehicleType,
    make: driver.make.trim(),
    model: driver.model.trim(),
    year: driver.year,
    color: driver.color.trim(),
    registrationNumber: driver.registrationNumber.trim(),
    seatingCapacity: driver.seatingCapacity,
    updatedAt: serverTimestamp(),
  });

  console.log("DRIVER DETAILS UPDATED:", driverId);
  console.log("ACTIVE VEHICLE UPDATED:", activeVehicle.id);

  return {
    success: true,
    userId: driverId,
    vehicleId: activeVehicle.id,
  };
}

// =====================================================
// UPDATE DRIVER AVAILABILITY
// =====================================================

export async function updateDriverStatus(
  driverId: string,
  isAvailable: boolean
) {
  const driverRef = doc(db, "drivers", driverId);

  await updateDoc(driverRef, {
    isAvailable,
    updatedAt: serverTimestamp(),
  });

  console.log("DRIVER AVAILABILITY UPDATED:", isAvailable);

  return {
    success: true,
    isAvailable,
  };
}

// =====================================================
// UPDATE DRIVER LOCATION
// =====================================================

export async function updateDriverLocation(
  driverId: string,
  latitude: number,
  longitude: number
) {
  const driverRef = doc(db, "drivers", driverId);

  await updateDoc(driverRef, {
    latitude,
    longitude,
    updatedAt: serverTimestamp(),
  });

  console.log("DRIVER LOCATION UPDATED:", latitude, longitude);

  return {
    success: true,
  };
}

// =====================================================
// ADD ANOTHER VEHICLE
// =====================================================

export async function addVehicle(
  driverId: string,
  vehicle: {
    vehicleTypeId: string;
    vehicleType: string;
    vehicleTypeCode?: string;
    make: string;
    model: string;
    year: number;
    color: string;
    registrationNumber: string;
    seatingCapacity: number;
    tariffId?: string;
  }
) {
  const vehiclesRef = collection(
    db,
    "drivers",
    driverId,
    "vehicles"
  );

  const vehicleData: Record<string, unknown> = {
    vehicleTypeId: vehicle.vehicleTypeId,
    vehicleType: vehicle.vehicleType,
    ...(vehicle.vehicleTypeCode
      ? { vehicleTypeCode: vehicle.vehicleTypeCode }
      : {}),
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color,
    registrationNumber: vehicle.registrationNumber,
    seatingCapacity: vehicle.seatingCapacity,
    tariffId: vehicle.tariffId || "default",
    isActive: false,
    createdAt: serverTimestamp(),
  };

  const vehicleRef = await addDoc(vehiclesRef, vehicleData);

  console.log("VEHICLE ADDED:", vehicleRef.id);

  return {
    success: true,
    vehicleId: vehicleRef.id,
  };
}

// =====================================================
// SELECT ACTIVE VEHICLE
// =====================================================

export async function selectActiveVehicle(
  driverId: string,
  vehicleId: string
) {
  const vehiclesRef = collection(
    db,
    "drivers",
    driverId,
    "vehicles"
  );

  const snapshot = await getDocs(vehiclesRef);

  if (!snapshot.docs.some((vehicleDoc) => vehicleDoc.id === vehicleId)) {
    throw new Error("Vehicle not found for this driver.");
  }

  // Set the selected vehicle active and all other vehicles inactive.
  for (const vehicleDoc of snapshot.docs) {
    await updateDoc(vehicleDoc.ref, {
      isActive: vehicleDoc.id === vehicleId,
      updatedAt: serverTimestamp(),
    });
  }

  console.log("ACTIVE VEHICLE SELECTED:", vehicleId);

  return {
    success: true,
    vehicleId,
  };
}
