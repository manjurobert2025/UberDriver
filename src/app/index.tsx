import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { loginUser } from "../../services/authService";
export default function LoginScreen() {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
  const handleLogin = async () => {
    if (!email || !password) {
        alert("Please enter email and password");
        return;
    }

    try {
        const response = await loginUser({
            email,
            password
        });

        const { token, driverId } = response.data;

await AsyncStorage.setItem("token", token);
await AsyncStorage.setItem("driverId", driverId);

console.log("Token:", token);
console.log("DriverId:", driverId);

      alert("Login Successful!");
      router.replace("/driver-home");
        // Next we'll store the token and navigate
        // router.replace("/home");

    } catch (error: any) {
        console.log(error);

        if (error.response) {
            alert(error.response.data);
        } else {
            alert("Invalid email or password");
        }
    }
};
  return (
    
    <View style={styles.container}>

      <View style={styles.card}>

        <Text style={styles.logo}>🚖</Text>

        <Text style={styles.title}>Ride Driver</Text>

        <Text style={styles.subtitle}>
          Sign in to start accepting rides
        </Text>

        <TextInput
    style={styles.input}
    placeholder="Email"
    value={email}
    onChangeText={setEmail}
    keyboardType="email-address"
    autoCapitalize="none"
/>

<TextInput
    style={styles.input}
    placeholder="Password"
    value={password}
    onChangeText={setPassword}
    secureTextEntry
/>
<Pressable
    style={styles.button}
    onPress={handleLogin}
>
    <Text style={styles.buttonText}>Login</Text>
</Pressable>
<Pressable
  onPress={() => router.push("/forgot-password")}
>
  <Text style={styles.forgotPassword}>
    Forgot Password?
  </Text>
</Pressable>
    
        <Pressable onPress={() => router.push("/register")}>
  <Text style={styles.register}>
    New Driver? Register
  </Text>
</Pressable>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F6F8',
    padding: 20,
  },
  forgotPassword: {
  textAlign: "right",
  marginTop: 8,
  marginBottom: 15,
  fontSize: 14,
  fontWeight: "600",
},
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    elevation: 5,
  },

  logo: {
    fontSize: 55,
    textAlign: 'center',
    marginBottom: 10,
  },

  title: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  subtitle: {
    textAlign: 'center',
    color: 'gray',
    marginBottom: 30,
    marginTop: 5,
  },

  input: {
  width: "100%",
  borderWidth: 1,
  borderColor: "#D1D5DB",
  borderRadius: 10,
  paddingHorizontal: 15,
  paddingVertical: 12,
  fontSize: 16,
  backgroundColor: "#FFFFFF",
  marginBottom: 15, // <-- This adds space below each textbox
},

  button: {
  backgroundColor: '#0A84FF',
  paddingVertical: 15,
  borderRadius: 10,
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 10,
  width: '100%',
},

buttonText: {
  color: 'white',
  fontSize: 18,
  fontWeight: 'bold',
},

  register: {
    marginTop: 25,
    textAlign: 'center',
    color: '#0A84FF',
    fontWeight: '600',
  },

});