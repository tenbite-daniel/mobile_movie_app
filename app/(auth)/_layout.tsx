import { useAuth } from "@/context/AuthContext";
import { Redirect, Stack } from "expo-router";

export default function AuthLayout() {
	const { user, loading } = useAuth();

	// If already logged in, send them to home — no reason to see login/register
	if (!loading && user) {
		return <Redirect href="/(tabs)" />;
	}

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="login" />
			<Stack.Screen name="register" />
		</Stack>
	);
}
