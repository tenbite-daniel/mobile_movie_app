import { AuthProvider, useAuth } from "@/context/AuthContext";
import { router, Stack } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StatusBar, View } from "react-native";
import "./globals.css";

function RootLayoutNav() {
	const { session, loading } = useAuth();

	useEffect(() => {
		if (loading) return;
		if (session) {
			router.replace("/(tabs)");
		} else {
			router.replace("/(auth)/login");
		}
	}, [session, loading]);

	if (loading) {
		return (
			<View className="flex-1 bg-primary items-center justify-center">
				<ActivityIndicator size="large" color="#AB8BFF" />
			</View>
		);
	}

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="(auth)" />
			<Stack.Screen name="(tabs)" />
			<Stack.Screen name="movies/[id]" />
		</Stack>
	);
}

export default function RootLayout() {
	return (
		<AuthProvider>
			<StatusBar hidden={true} />
			<RootLayoutNav />
		</AuthProvider>
	);
}
