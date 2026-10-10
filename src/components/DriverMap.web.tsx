
import { useEffect, useRef } from "react";

type Props = {
  latitude: number;
  longitude: number;
};

export default function DriverMap({
  latitude,
  longitude,
}: Props) {
  const mapContainerRef =
    useRef<HTMLDivElement | null>(null);

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    const loadMap = async () => {
      try {
        const leafletModule = await import("leaflet");
        const L = leafletModule.default;

        if (cancelled || !mapContainerRef.current) {
          return;
        }

        if (!mapRef.current) {
          mapRef.current = L.map(
            mapContainerRef.current
          ).setView([latitude, longitude], 15);

          L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
              attribution:
                "&copy; OpenStreetMap contributors",
              maxZoom: 19,
            }
          ).addTo(mapRef.current);

          markerRef.current = L.circleMarker(
            [latitude, longitude],
            {
              radius: 10,
              weight: 3,
              fillOpacity: 0.8,
            }
          ).addTo(mapRef.current);

          markerRef.current.bindPopup("Driver Location");
        } else {
          mapRef.current.setView(
            [latitude, longitude],
            15
          );

          markerRef.current?.setLatLng([
            latitude,
            longitude,
          ]);
        }
      } catch (error) {
        console.error("Leaflet map error:", error);
      }
    };

    loadMap();

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: "100%",
        height: "280px",
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: "#E9EEF3",
        position: "relative",
      }}
    />
  );
}
