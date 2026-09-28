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

// =====================================================
// DRIVER INTERFACE
// =====================================================

export interface Driver {
  userId: string;

  fullName: string;

  email: string;

  mobile: string;

  // Driver license
  licenseNumber: string;

  // Driver photo
  photoUrl?: string;

  // Vehicle details
  make: string;

  model: string;

  year: number;

  color: string;

  registrationNumber: string;

  seatingCapacity: number;

  // Vehicle Type Master
  vehicleTypeId: string;

  vehicleType: string;

  // Kept optional for compatibility
  vehicleTypeCode?: string;
}

// =====================================================
// REGISTER DRIVER + FIRST VEHICLE
// =====================================================

export async function registerDriver(
  driver: Driver
) {
  console.log(
    "===================================="
  );

  console.log(
    "REGISTERING DRIVER"
  );

  console.log(
    "DRIVER ID:",
    driver.userId
  );

  console.log(
    "DRIVER NAME:",
    driver.fullName
  );

  console.log(
    "DRIVER EMAIL:",
    driver.email
  );

  console.log(
    "DRIVER PHOTO:",
    driver.photoUrl
  );

  console.log(
    "VEHICLE TYPE:",
    driver.vehicleType
  );

  console.log(
    "===================================="
  );

  // ===================================================
  // DRIVER DOCUMENT
  // ===================================================

  const driverRef = doc(
    db,
    "drivers",
    driver.userId
  );

  // ===================================================
  // DRIVER DATA
  // ===================================================

  const driverData: any = {
    // Firebase user
    userId:
      driver.userId,

    // Personal details
    fullName:
      driver.fullName,

    email:
      driver.email,

    mobile:
      driver.mobile,

    // License
    licenseNumber:
      driver.licenseNumber,

    // Driver initially unavailable
    isAvailable:
      false,

    // Created date
    createdAt:
      serverTimestamp(),
  };

  // ===================================================
  // DRIVER PHOTO
  // ===================================================

  if (driver.photoUrl) {
    driverData.photoUrl =
      driver.photoUrl;
  }

  // ===================================================
  // CREATE / SAVE DRIVER DOCUMENT
  // ===================================================

  await setDoc(
    driverRef,
    driverData
  );

  console.log(
    "DRIVER DOCUMENT CREATED:",
    driver.userId
  );

  console.log(
    "DRIVER PHOTO SAVED:",
    driver.photoUrl || "No photo"
  );

  // ===================================================
  // CREATE FIRST VEHICLE
  // ===================================================

  const vehiclesRef =
    collection(
      db,
      "drivers",
      driver.userId,
      "vehicles"
    );

  // Create automatic vehicle document ID
  const vehicleRef =
    doc(vehiclesRef);

  // ===================================================
  // VEHICLE DATA
  // ===================================================

  const vehicleData: any = {
    // -----------------------------------------------
    // Vehicle Type Master
    // -----------------------------------------------

    vehicleTypeId:
      driver.vehicleTypeId,

    vehicleType:
      driver.vehicleType,

    // -----------------------------------------------
    // Vehicle information
    // -----------------------------------------------

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

    // -----------------------------------------------
    // Tariff
    // -----------------------------------------------

    tariffId:
      "default",

    // -----------------------------------------------
    // First vehicle is active
    // -----------------------------------------------

    isActive:
      true,

    // -----------------------------------------------
    // Created date
    // -----------------------------------------------

    createdAt:
      serverTimestamp(),
  };

  // ===================================================
  // KEEP VEHICLE TYPE CODE IF PROVIDED
  // ===================================================

  if (
    driver.vehicleTypeCode
  ) {
    vehicleData.vehicleTypeCode =
      driver.vehicleTypeCode;
  }

  // ===================================================
  // SAVE VEHICLE
  // ===================================================

  await setDoc(
    vehicleRef,
    vehicleData
  );

  console.log(
    "VEHICLE DOCUMENT CREATED:",
    vehicleRef.id
  );

  console.log(
    "VEHICLE TYPE:",
    driver.vehicleType
  );

  console.log(
    "VEHICLE MAKE:",
    driver.make
  );

  console.log(
    "VEHICLE MODEL:",
    driver.model
  );

  console.log(
    "VEHICLE REGISTRATION:",
    driver.registrationNumber
  );

  console.log(
    "===================================="
  );

  console.log(
    "DRIVER REGISTRATION COMPLETED"
  );

  console.log(
    "===================================="
  );

  // ===================================================
  // RETURN RESULT
  // ===================================================

  return {
    success: true,

    userId:
      driver.userId,

    vehicleId:
      vehicleRef.id,

    photoUrl:
      driver.photoUrl || null,
  };
}

// =====================================================
// UPDATE DRIVER AVAILABILITY
// =====================================================

export async function updateDriverStatus(
  driverId: string,
  isAvailable: boolean
) {
  const driverRef =
    doc(
      db,
      "drivers",
      driverId
    );

  await updateDoc(
    driverRef,
    {
      isAvailable:
        isAvailable,

      updatedAt:
        serverTimestamp(),
    }
  );

  console.log(
    "DRIVER AVAILABILITY UPDATED:",
    isAvailable
  );

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
  const driverRef =
    doc(
      db,
      "drivers",
      driverId
    );

  await updateDoc(
    driverRef,
    {
      latitude:
        latitude,

      longitude:
        longitude,

      updatedAt:
        serverTimestamp(),
    }
  );

  console.log(
    "DRIVER LOCATION UPDATED:",
    latitude,
    longitude
  );

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

    // Optional for compatibility
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
  // ===================================================
  // VEHICLES COLLECTION
  // ===================================================

  const vehiclesRef =
    collection(
      db,
      "drivers",
      driverId,
      "vehicles"
    );

  // ===================================================
  // CREATE NEW VEHICLE
  // ===================================================

  const vehicleRef =
    await addDoc(
      vehiclesRef,
      {
        // ---------------------------------------------
        // Vehicle Type Master
        // ---------------------------------------------

        vehicleTypeId:
          vehicle.vehicleTypeId,

        vehicleType:
          vehicle.vehicleType,

        // ---------------------------------------------
        // Optional old field
        // ---------------------------------------------

        ...(vehicle.vehicleTypeCode
          ? {
              vehicleTypeCode:
                vehicle.vehicleTypeCode,
            }
          : {}),

        // ---------------------------------------------
        // Vehicle details
        // ---------------------------------------------

        make:
          vehicle.make,

        model:
          vehicle.model,

        year:
          vehicle.year,

        color:
          vehicle.color,

        registrationNumber:
          vehicle.registrationNumber,

        seatingCapacity:
          vehicle.seatingCapacity,

        // ---------------------------------------------
        // Tariff
        // ---------------------------------------------

        tariffId:
          vehicle.tariffId ||
          "default",

        // ---------------------------------------------
        // New vehicle starts inactive
        // ---------------------------------------------

        isActive:
          false,

        // ---------------------------------------------
        // Created date
        // ---------------------------------------------

        createdAt:
          serverTimestamp(),
      }
    );

  console.log(
    "VEHICLE ADDED:",
    vehicleRef.id
  );

  return {
    success: true,

    vehicleId:
      vehicleRef.id,
  };
}

// =====================================================
// SELECT ACTIVE VEHICLE
// =====================================================

export async function selectActiveVehicle(
  driverId: string,
  vehicleId: string
) {
  // ===================================================
  // VEHICLES COLLECTION
  // ===================================================

  const vehiclesRef =
    collection(
      db,
      "drivers",
      driverId,
      "vehicles"
    );

  // ===================================================
  // GET ALL DRIVER VEHICLES
  // ===================================================

  const snapshot =
    await getDocs(
      vehiclesRef
    );

  // ===================================================
  // UPDATE VEHICLES
  // ===================================================

  for (
    const vehicleDoc of
      snapshot.docs
  ) {
    await updateDoc(
      vehicleDoc.ref,
      {
        isActive:
          vehicleDoc.id ===
          vehicleId,

        updatedAt:
          serverTimestamp(),
      }
    );
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