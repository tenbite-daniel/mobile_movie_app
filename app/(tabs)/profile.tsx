import { icons } from "@/constants/icons";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";

export default function Profile() {
	const { user, signOut } = useAuth();

	const username =
		user?.user_metadata?.username ?? user?.email?.split("@")[0] ?? "User";
	const email = user?.email ?? "";

	const handleSignOut = () => {
		Alert.alert("Sign Out", "Are you sure you want to sign out?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Sign Out",
				style: "destructive",
				onPress: async () => {
					await signOut();
					router.replace("/(auth)/login");
				},
			},
		]);
	};

	return (
		<View className="flex-1 bg-primary px-6">
			{/* Header */}
			<View className="mt-20 mb-8 items-center">
				<View className="w-20 h-20 rounded-full bg-dark-100 items-center justify-center mb-4">
					<Image
						source={icons.person}
						className="size-10"
						tintColor="#AB8BFF"
					/>
				</View>
				<Text className="text-white text-xl font-bold">{username}</Text>
				<Text className="text-light-300 text-sm mt-1">{email}</Text>
			</View>

			{/* Stats row — placeholder for now */}
			<View className="flex-row justify-around bg-dark-200 rounded-2xl py-5 mb-8">
				<View className="items-center">
					<Text className="text-white text-xl font-bold">0</Text>
					<Text className="text-light-300 text-xs mt-1">Favorites</Text>
				</View>
				<View className="w-px bg-dark-100" />
				<View className="items-center">
					<Text className="text-white text-xl font-bold">0</Text>
					<Text className="text-light-300 text-xs mt-1">Watchlist</Text>
				</View>
				<View className="w-px bg-dark-100" />
				<View className="items-center">
					<Text className="text-white text-xl font-bold">0</Text>
					<Text className="text-light-300 text-xs mt-1">Watched</Text>
				</View>
			</View>

			{/* Sign out */}
			<TouchableOpacity
				onPress={handleSignOut}
				className="bg-dark-200 rounded-xl py-4 items-center"
			>
				<Text className="text-red-400 font-semibold text-base">
					Sign Out
				</Text>
			</TouchableOpacity>
		</View>
	);
}
