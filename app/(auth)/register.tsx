import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { supabase } from "@/services/supabase";
import { makeRedirectUri } from "expo-auth-session";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function Register() {
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);

	const handleRegister = async () => {
		if (!username || !email || !password) {
			Alert.alert("Error", "Please fill in all fields");
			return;
		}
		if (password.length < 6) {
			Alert.alert("Error", "Password must be at least 6 characters");
			return;
		}
		setLoading(true);
		const { error } = await supabase.auth.signUp({
			email,
			password,
			options: { data: { username } },
		});
		setLoading(false);
		if (error) {
			Alert.alert("Registration Failed", error.message);
		} else {
			Alert.alert(
				"Account Created",
				"Check your email to confirm your account, then sign in.",
				[{ text: "OK", onPress: () => router.replace("/(auth)/login") }],
			);
		}
	};

	const handleGoogleLogin = async () => {
		setGoogleLoading(true);
		try {
			const redirectTo = makeRedirectUri({ scheme: "watchly" });
			const { data, error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: { redirectTo, skipBrowserRedirect: true },
			});
			if (error) throw error;
			if (!data.url) throw new Error("No OAuth URL returned");

			const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
			if (result.type === "success" && result.url) {
				const url = new URL(result.url);
				const accessToken = url.searchParams.get("access_token");
				const refreshToken = url.searchParams.get("refresh_token");
				if (accessToken && refreshToken) {
					await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
				}
			}
		} catch (e: any) {
			Alert.alert("Google Sign-In Failed", e.message);
		} finally {
			setGoogleLoading(false);
		}
	};

	return (
		<KeyboardAvoidingView
			className="flex-1 bg-primary"
			behavior={Platform.OS === "ios" ? "padding" : "height"}
		>
			<Image
				source={images.bg}
				className="absolute w-full h-full z-0"
				resizeMode="cover"
			/>
			<ScrollView
				contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 40 }}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
			>
				<View className="items-center mb-10">
					<Image source={icons.logo} className="w-16 h-14 mb-4" />
					<Text className="text-white text-3xl font-bold">Watchly</Text>
					<Text className="text-light-200 text-sm mt-2">Create your account</Text>
				</View>

				<View className="gap-y-4">
					{/* Username */}
					<View className="bg-dark-200 rounded-xl px-4 py-3">
						<Text className="text-light-300 text-xs mb-1">Username</Text>
						<TextInput
							value={username}
							onChangeText={setUsername}
							placeholder="your_username"
							placeholderTextColor="#9CA4AB"
							autoCapitalize="none"
							returnKeyType="next"
							className="text-white text-base"
						/>
					</View>

					{/* Email */}
					<View className="bg-dark-200 rounded-xl px-4 py-3">
						<Text className="text-light-300 text-xs mb-1">Email</Text>
						<TextInput
							value={email}
							onChangeText={setEmail}
							placeholder="you@example.com"
							placeholderTextColor="#9CA4AB"
							keyboardType="email-address"
							autoCapitalize="none"
							returnKeyType="next"
							className="text-white text-base"
						/>
					</View>

					{/* Password */}
					<View className="bg-dark-200 rounded-xl px-4 py-3">
						<Text className="text-light-300 text-xs mb-1">Password</Text>
						<View className="flex-row items-center">
							<TextInput
								value={password}
								onChangeText={setPassword}
								placeholder="••••••••"
								placeholderTextColor="#9CA4AB"
								secureTextEntry={!showPassword}
								returnKeyType="done"
								onSubmitEditing={handleRegister}
								className="text-white text-base flex-1"
							/>
							<TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
								<Text className="text-light-300 text-sm">{showPassword ? "Hide" : "Show"}</Text>
							</TouchableOpacity>
						</View>
					</View>

					{/* Create Account button */}
					<TouchableOpacity
						onPress={handleRegister}
						disabled={loading}
						className="bg-accent rounded-xl py-4 items-center mt-2"
					>
						{loading ? <ActivityIndicator color="#fff" /> : (
							<Text className="text-white font-bold text-base">Create Account</Text>
						)}
					</TouchableOpacity>

					{/* Divider */}
					<View className="flex-row items-center gap-x-3 my-1">
						<View className="flex-1 h-px bg-dark-200" />
						<Text className="text-light-300 text-xs">or</Text>
						<View className="flex-1 h-px bg-dark-200" />
					</View>

					{/* Google Sign Up */}
					<TouchableOpacity
						onPress={handleGoogleLogin}
						disabled={googleLoading}
						className="bg-dark-200 rounded-xl py-4 items-center flex-row justify-center gap-x-3"
					>
						{googleLoading ? <ActivityIndicator color="#fff" /> : (
							<>
								<Text className="text-2xl leading-none">G</Text>
								<Text className="text-white font-semibold text-base">Continue with Google</Text>
							</>
						)}
					</TouchableOpacity>

					<TouchableOpacity onPress={() => router.back()} className="items-center mt-2">
						<Text className="text-light-200 text-sm">
							Already have an account?{" "}
							<Text className="text-accent font-semibold">Sign In</Text>
						</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
