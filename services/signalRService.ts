import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";

const SIGNALR_URL = "http://localhost:5150/rideHub";

let connection: HubConnection | null = null;
let currentDriverId: string | null = null;

export const startSignalR = async (driverId: string) => {
  currentDriverId = driverId;

  // Already connected
  if (
    connection &&
    connection.state === HubConnectionState.Connected
  ) {
    return connection;
  }

  // Create connection
  if (!connection) {
    connection = new HubConnectionBuilder()
      .withUrl(SIGNALR_URL)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    // -----------------------------------
    // NEW RIDE REQUEST
    // -----------------------------------
    connection.on("NewRideRequest", (ride) => {
      console.log(
        "🚕 NEW RIDE REQUEST RECEIVED:",
        ride
      );
    });

    // -----------------------------------
    // RECONNECTED
    // -----------------------------------
    connection.onreconnected(async (connectionId) => {
      console.log(
        "🔄 SignalR reconnected:",
        connectionId
      );

      if (currentDriverId) {
        try {
          await connection?.invoke(
            "JoinDriver",
            currentDriverId
          );

          console.log(
            "✅ Driver rejoined SignalR group:",
            currentDriverId
          );
        } catch (error) {
          console.error(
            "❌ Failed to rejoin driver group:",
            error
          );
        }
      }
    });

    // -----------------------------------
    // RECONNECTING
    // -----------------------------------
    connection.onreconnecting((error) => {
      console.log(
        "🔄 SignalR reconnecting...",
        error
      );
    });

    // -----------------------------------
    // CLOSED
    // -----------------------------------
    connection.onclose((error) => {
      console.log(
        "🔴 SignalR connection closed:",
        error
      );
    });
  }

  try {
    await connection.start();

    console.log("✅ SignalR connected!");

    console.log(
      "Connection ID:",
      connection.connectionId
    );

    // Join driver-specific group
    await connection.invoke(
      "JoinDriver",
      driverId
    );

    console.log(
      "✅ Driver joined SignalR group:",
      driverId
    );
  } catch (error) {
    console.error(
      "❌ SignalR connection failed:",
      error
    );
  }

  return connection;
};

export const stopSignalR = async () => {
  if (connection) {
    await connection.stop();

    connection = null;
    currentDriverId = null;

    console.log("SignalR disconnected");
  }
};

export const getSignalRConnection = () => {
  return connection;
};