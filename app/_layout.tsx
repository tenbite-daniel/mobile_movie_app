import { AuthProvider } from "@/context/AuthContext";
import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import "./globals.css";

export default function RootLayout() {
	return (
		<AuthProvider>
			<StatusBar hidden={true} />
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name="(tabs)" />
				<Stack.Screen name="(auth)" />
				<Stack.Screen name="movies/[id]" />
				<Stack.Screen name="tv/[id]" />
				<Stack.Screen name="anime/[id]" />
				<Stack.Screen name="watchlist" />
			</Stack>
		</AuthProvider>
	);
}
