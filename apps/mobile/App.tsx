import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";

// Native fan client — v1 skeleton (mobile-app skill §0: v0 ships on Web/PWA).
// Just enough to boot and verify the monorepo wiring; real screens land in v1.
export default function App() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Haunt — native client (v1). See docs §11-3.</Text>
      <StatusBar style="auto" />
    </View>
  );
}
