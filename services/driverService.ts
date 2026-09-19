import {
  addDoc,
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "./firebase";

export interface Driver {
  userId: string;
  fullName: string;
  email: string;
  mobile: string;
  licenseNumber: string;

  // First vehicle details
  make: string;
  model: string;
  year: number;
  color: string;
  registrationNumber: string;
  seatingCapacity: number;
  vehicleType: string;
}

// =====================================================
// REGISTER DRIVER + FIRST VEHICLE
// =====================================================

export async function registerDriver(driver: Driver) {
  const driverRef = doc(
    db,
    "drivers",
    driver.userId
  );

  // Create driver document
  await setDoc(driverRef, {
    userId: driver.userId,
    fullName: driver.fullName,
    email: driver.email,
    mobile: driver.mobile,
    licenseNumber: driver.licenseNumber,
    isAvailable: false,
    createdAt: serverTimestamp(),
  });

  console.log(
    "DRIVER DOCUMENT CREATED:",
    driver.userId
  );

  // Create first vehicle
  const vehiclesRef = collection(
    db,
    "drivers",
    driver.userId,
    "vehicles"
  );

  const vehicleRef = doc(vehiclesRef);

  await setDoc(vehicleRef, {
    vehicleType: driver.vehicleType,
    make: driver.make,
    model: driver.model,
    year: driver.year,
    color: driver.color,
    registrationNumber:
      driver.registrationNumber,
    seatingCapacity:
      driver.seatingCapacity,

    tariffId: "default",

    // First vehicle becomes active
    isActive: true,

    createdAt: serverTimestamp(),
  });

  console.log(
    "VEHICLE DOCUMENT CREATED:",
    vehicleRef.id
  );

  return {
    success: true,
    userId: driver.userId,
    vehicleId: vehicleRef.id,
  };
}

// =====================================================
// UPDATE DRIVER AVAILABILITY
// =====================================================

export async function updateDriverStatus(
  driverId: string,
  isAvailable: boolean
) {
  const driverRef = doc(
    db,
    "drivers",
    driverId
  );

  await updateDoc(driverRef, {
    isAvailable,
  });

  console.log(
    "DRIVER AVAILABILITY UPDATED:",
    isAvailable
  );
}

// =====================================================
// UPDATE DRIVER LOCATION
// =====================================================

export async function updateDriverLocation(
  driverId: string,
  latitude: number,
  longitude: number
) {
  const driverRef = doc(
    db,
    "drivers",
    driverId
  );

  await updateDoc(driverRef, {
    latitude,
    longitude,
    updatedAt: serverTimestamp(),
  });

  console.log(
    "DRIVER LOCATION UPDATED:",
    latitude,
    longitude
  );
}

// =====================================================
// ADD ANOTHER VEHICLE
// =====================================================

export async function addVehicle(
  driverId: string,
  vehicle: {
    vehicleType: string;
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

  const vehicleRef = await addDoc(
    vehiclesRef,
    {
      vehicleType: vehicle.vehicleType,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      registrationNumber:
        vehicle.registrationNumber,
      seatingCapacity:
        vehicle.seatingCapacity,

      tariffId:
        vehicle.tariffId || "default",

      // Newly added vehicle is inactive
      isActive: false,

      createdAt: serverTimestamp(),
    }
  );

  console.log(
    "VEHICLE ADDED:",
    vehicleRef.id
  );

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

  // Get all vehicles belonging to this driver
  const snapshot = await getDocs(
    vehiclesRef
  );

  // Set selected vehicle active
  // and all other vehicles inactive
  for (const vehicleDoc of snapshot.docs) {
    await updateDoc(vehicleDoc.ref, {
      isActive:
        vehicleDoc.id === vehicleId,
    });
  }

  console.log(
    "ACTIVE VEHICLE SELECTED:",
    vehicleId
  );

  return {
    success: true,
    vehicleId,
  };
}