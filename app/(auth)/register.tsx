import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { supabase } from "@/services/supabase";
import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function Register() {
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

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
			options: {
				data: { username },
			},
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

	return (
		<View className="flex-1 bg-primary px-6 justify-center">
			<Image
				source={images.bg}
				className="absolute w-full h-full z-0"
				resizeMode="cover"
			/>

			<View className="items-center mb-10">
				<Image source={icons.logo} className="w-16 h-14 mb-4" />
				<Text className="text-white text-3xl font-bold">Watchly</Text>
				<Text className="text-light-200 text-sm mt-2">
					Create your account
				</Text>
			</View>

			<View className="gap-y-4">
				<View className="bg-dark-200 rounded-xl px-4 py-3">
					<Text className="text-light-300 text-xs mb-1">Username</Text>
					<TextInput
						value={username}
						onChangeText={setUsername}
						placeholder="your_username"
						placeholderTextColor="#9CA4AB"
						autoCapitalize="none"
						className="text-white text-base"
					/>
				</View>

				<View className="bg-dark-200 rounded-xl px-4 py-3">
					<Text className="text-light-300 text-xs mb-1">Email</Text>
					<TextInput
						value={email}
						onChangeText={setEmail}
						placeholder="you@example.com"
						placeholderTextColor="#9CA4AB"
						keyboardType="email-address"
						autoCapitalize="none"
						className="text-white text-base"
					/>
				</View>

				<View className="bg-dark-200 rounded-xl px-4 py-3">
					<Text className="text-light-300 text-xs mb-1">Password</Text>
					<TextInput
						value={password}
						onChangeText={setPassword}
						placeholder="••••••••"
						placeholderTextColor="#9CA4AB"
						secureTextEntry
						className="text-white text-base"
					/>
				</View>

				<TouchableOpacity
					onPress={handleRegister}
					disabled={loading}
					className="bg-accent rounded-xl py-4 items-center mt-2"
				>
					{loading ? (
						<ActivityIndicator color="#fff" />
					) : (
						<Text className="text-white font-bold text-base">
							Create Account
						</Text>
					)}
				</TouchableOpacity>

				<TouchableOpacity
					onPress={() => router.back()}
					className="items-center mt-2"
				>
					<Text className="text-light-200 text-sm">
						Already have an account?{" "}
						<Text className="text-accent font-semibold">
							Sign In
						</Text>
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}
