import api from "./api";

export const acceptRide = (
  rideId: string,
  driverId: string
) => {
  return api.post(
    `/Ride/${rideId}/accept`,
    null,
    {
      params: {
        driverId,
      },
    }
  );
};