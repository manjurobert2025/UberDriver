
import { Platform, Text } from 'react-native';

export default function DriverMap() {
  if (Platform.OS === 'web') {
    return <Text>Web Map View</Text>;
  }

  return <Text>Native Mobile Map View</Text>;
}