import { AuthProvider } from "@/context/AuthContext";
import { SelectionProvider } from "@/context/SelectionContext";
import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./globals.css";

export default function RootLayout() {
	return (
		<SafeAreaProvider>
			<AuthProvider>
				<SelectionProvider>
					<StatusBar hidden={true} />
					<Stack screenOptions={{ headerShown: false }}>
						<Stack.Screen name="(tabs)" />
						<Stack.Screen name="(auth)" />
						<Stack.Screen name="movies/[id]" />
						<Stack.Screen name="tv/[id]" />
						<Stack.Screen name="anime/[id]" />
						<Stack.Screen name="watchlist" />
						<Stack.Screen name="bulk-add" />
					</Stack>
				</SelectionProvider>
			</AuthProvider>
		</SafeAreaProvider>
	);
}
