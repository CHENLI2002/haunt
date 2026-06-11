import { registerRootComponent } from "expo";
import App from "./App";

// Classic Expo entry. expo-router is deferred to v1 (mobile-app skill §0/§1) — adding it
// pulls react-native-screens/react-dom versions that conflict with this SDK 52 skeleton.
registerRootComponent(App);
