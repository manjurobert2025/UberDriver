import axios from "axios";

const API_BASE_URL = "https://localhost:7197/api";

export const updateDriverStatus = (
  driverId: string,
  isOnline: boolean
) => {
  return axios.put(
    `${API_BASE_URL}/Driver/${driverId}/status`,
    {
      isOnline: isOnline,
    }
  );
};