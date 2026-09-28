import {
    collection,
    getDocs,
    query,
    where,
} from "firebase/firestore";

import { db } from "./firebase";

export interface VehicleType {
  id: string;
  name: string;
  code: string;
  icon: string;
  isActive: boolean;
}

export const getVehicleTypes = async (): Promise<VehicleType[]> => {
  try {
    const vehicleTypesRef = collection(db, "vehicleTypes");

    const q = query(
      vehicleTypesRef,
      where("isActive", "==", true)
    );

    const snapshot = await getDocs(q);

    const vehicleTypes: VehicleType[] = snapshot.docs.map(
      (doc) => ({
        id: doc.id,
        ...doc.data(),
      } as VehicleType)
    );

    return vehicleTypes;
  } catch (error) {
    console.error("Error loading vehicle types:", error);
    throw error;
  }
};