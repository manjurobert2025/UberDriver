
import { StyleSheet, Text, View } from "react-native";

type Props = {
  latitude: number;
  longitude: number;
};

export default function DriverMap({
  latitude,
  longitude,
}: Props) {
  const mapUrl =
    `https://www.openstreetmap.org/export/embed.html?bbox=` +
    `${longitude - 0.01}%2C${latitude - 0.01}%2C` +
    `${longitude + 0.01}%2C${latitude + 0.01}` +
    `&layer=mapnik&marker=${latitude}%2C${longitude}`;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Driver location: {latitude.toFixed(5)},{" "}
        {longitude.toFixed(5)}
      </Text>

      <iframe
        title="Driver location map"
        src={mapUrl}
        style={{
          width: "100%",
          height: 240,
          border: 0,
        }}
        loading="lazy"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 280,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  label: {
    padding: 8,
    fontSize: 12,
  },
});
