import {
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "./firebase";

// -----------------------------------
// DRIVER TYPE
// -----------------------------------

export interface Driver {
  userId: string;
  fullName: string;
  email: string;
  mobile: string;
  licenseNumber: string;
  make: string;
  model: string;
  year: number;
  color: string;
  registrationNumber: string;
  seatingCapacity: number;
  vehicleType: string;
}

// -----------------------------------
// REGISTER DRIVER
// -----------------------------------

export async function registerDriver(
  driver: Driver
) {
  const driverRef = doc(
    db,
    "drivers",
    driver.userId
  );

  await setDoc(driverRef, {
    userId: driver.userId,

    fullName: driver.fullName,
    email: driver.email,
    mobile: driver.mobile,

    licenseNumber:
      driver.licenseNumber,

    make:
      driver.make,

    model:
      driver.model,

    year:
      driver.year,

    color:
      driver.color,

    registrationNumber:
      driver.registrationNumber,

    seatingCapacity:
      driver.seatingCapacity,

    vehicleType:
      driver.vehicleType,

    // Driver starts offline
    isAvailable: false,

    createdAt:
      serverTimestamp(),
  });

  console.log(
    "✅ Driver saved to Firestore:",
    driver.userId
  );

  return {
    success: true,
    userId: driver.userId,
  };
}

// -----------------------------------
// UPDATE DRIVER ONLINE/OFFLINE STATUS
// -----------------------------------

export async function updateDriverStatus(
  driverId: string,
  isOnline: boolean
) {
  if (!driverId) {
    throw new Error(
      "Firebase driver UID is missing."
    );
  }

  const driverRef = doc(
    db,
    "drivers",
    driverId
  );

  await updateDoc(driverRef, {
    isAvailable: isOnline,

    lastStatusUpdate:
      serverTimestamp(),
  });

  console.log(
    `✅ Driver status updated: ${
      isOnline ? "ONLINE" : "OFFLINE"
    }`
  );

  return {
    success: true,
    driverId: driverId,
    isAvailable: isOnline,
  };
}

// -----------------------------------
// UPDATE DRIVER LOCATION
// -----------------------------------

export async function updateDriverLocation(
  driverId: string,
  latitude: number,
  longitude: number
) {
  if (!driverId) {
    throw new Error(
      "Firebase driver UID is missing."
    );
  }

  const driverRef = doc(
    db,
    "drivers",
    driverId
  );

  await updateDoc(driverRef, {
    latitude: latitude,
    longitude: longitude,

    locationUpdatedAt:
      serverTimestamp(),
  });

  console.log(
    "📍 Driver location updated:",
    latitude,
    longitude
  );

  return {
    success: true,
    driverId: driverId,
    latitude: latitude,
    longitude: longitude,
  };
}