import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { useAuth } from "@/context/AuthContext";
import { WatchStatus, getLocalFavorites, getWatchlist, getWatchlistCounts, getWishlist } from "@/services/localFavorites";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

const STATUS_LABELS: { status: WatchStatus; label: string; emoji: string }[] = [
	{ status: "plan_to_watch", label: "Plan to Watch", emoji: "📋" },
	{ status: "watching", label: "Watching", emoji: "▶️" },
	{ status: "completed", label: "Completed", emoji: "✅" },
	{ status: "on_hold", label: "On Hold", emoji: "⏸️" },
	{ status: "dropped", label: "Dropped", emoji: "❌" },
];

export default function Profile() {
	const { user, signOut } = useAuth();
	const [favCount, setFavCount] = useState(0);
	const [wishlistCount, setWishlistCount] = useState(0);
	const [watchCounts, setWatchCounts] = useState<Record<WatchStatus, number>>({
		plan_to_watch: 0,
		watching: 0,
		completed: 0,
		on_hold: 0,
		dropped: 0,
	});

	// Reload counts every time the tab is focused
	useFocusEffect(
		useCallback(() => {
			getLocalFavorites().then((favs) => setFavCount(favs.length));
			getWatchlistCounts().then(setWatchCounts);
			getWishlist().then((items) => setWishlistCount(items.length));
		}, []),
	);

	const username =
		user?.user_metadata?.username ?? user?.email?.split("@")[0] ?? "User";
	const email = user?.email ?? "";

	const totalInList = Object.values(watchCounts).reduce((a, b) => a + b, 0);

	const handleSignOut = () => {
		Alert.alert("Sign Out", "Are you sure you want to sign out?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Sign Out",
				style: "destructive",
				onPress: async () => {
					await signOut();
					// Auth state change will update the tab bar automatically.
					// Navigate to home tab so the user isn't left on the profile screen.
					setTimeout(() => router.replace("/(tabs)"), 0);
				},
			},
		]);
	};

	// Guest screen
	if (!user) {
		return (
			<View className="flex-1 bg-primary items-center justify-center px-8">
				<Image source={images.bg} className="absolute w-full z-0" />
				<View className="w-20 h-20 rounded-full bg-dark-100 items-center justify-center mb-6">
					<Image source={icons.person} className="size-10" tintColor="#a8b5db" />
				</View>
				<Text className="text-white text-xl font-bold mb-2 text-center">You're not signed in</Text>
				<Text className="text-light-300 text-sm text-center mb-8">
					Sign in to track your watchlist, favorites and activity.
				</Text>
				<TouchableOpacity
					onPress={() => router.push("/(auth)/login")}
					className="bg-accent px-8 py-3 rounded-full"
				>
					<Text className="text-white font-bold text-base">Sign In</Text>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={() => router.push("/(auth)/register")}
					className="mt-3"
				>
					<Text className="text-light-300 text-sm">
						No account? <Text className="text-accent font-semibold">Sign Up</Text>
					</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<View className="flex-1 bg-primary">
			<Image source={images.bg} className="absolute w-full z-0" />
			<ScrollView
				className="flex-1 px-6"
				contentContainerStyle={{ paddingBottom: 40 }}
				showsVerticalScrollIndicator={false}
			>
				{/* Avatar + name */}
				<View className="mt-20 mb-8 items-center">
					<View className="w-20 h-20 rounded-full bg-dark-100 items-center justify-center mb-4">
						<Image source={icons.person} className="size-10" tintColor="#AB8BFF" />
					</View>
					<Text className="text-white text-xl font-bold">{username}</Text>
					<Text className="text-light-300 text-sm mt-1">{email}</Text>
				</View>

				{/* Quick stats */}
				<View className="flex-row justify-around bg-dark-200 rounded-2xl py-5 mb-6">
					<TouchableOpacity
						className="items-center"
						onPress={() => router.push("/(tabs)/saved")}
					>
						<Text className="text-white text-xl font-bold">{favCount}</Text>
						<Text className="text-light-300 text-xs mt-1">Favorites</Text>
					</TouchableOpacity>
					<View className="w-px bg-dark-100" />
					<TouchableOpacity
						className="items-center"
						onPress={() => router.push("/(tabs)/saved")}
					>
						<Text className="text-white text-xl font-bold">{totalInList}</Text>
						<Text className="text-light-300 text-xs mt-1">My List</Text>
					</TouchableOpacity>
					<View className="w-px bg-dark-100" />
					<TouchableOpacity
						className="items-center"
						onPress={() => router.push("/(tabs)/wishlist")}
					>
						<Text className="text-white text-xl font-bold">{wishlistCount}</Text>
						<Text className="text-light-300 text-xs mt-1">Wishlist</Text>
					</TouchableOpacity>
				</View>

				{/* My List section */}
				<Text className="text-white text-lg font-bold mb-3">My List</Text>
				<View className="bg-dark-200 rounded-2xl overflow-hidden mb-6">
					{STATUS_LABELS.map((item, index) => (
						<TouchableOpacity
							key={item.status}
							onPress={() =>
								router.push(`/watchlist?status=${item.status}`)
							}
							className={`flex-row items-center justify-between px-4 py-4 ${
								index < STATUS_LABELS.length - 1 ? "border-b border-dark-100" : ""
							}`}
						>
							<View className="flex-row items-center gap-x-3">
								<Text className="text-lg">{item.emoji}</Text>
								<Text className="text-white font-medium">{item.label}</Text>
							</View>
							<View className="flex-row items-center gap-x-2">
								<View className="bg-accent/20 px-2.5 py-0.5 rounded-full">
									<Text className="text-accent text-sm font-bold">
										{watchCounts[item.status]}
									</Text>
								</View>
								<Image
									source={icons.arrow}
									className="size-4"
									tintColor="#a8b5db"
								/>
							</View>
						</TouchableOpacity>
					))}
				</View>

				{/* Sign out */}
				{user && (
					<TouchableOpacity
						onPress={handleSignOut}
						className="bg-dark-200 rounded-xl py-4 items-center"
					>
						<Text className="text-red-400 font-semibold text-base">Sign Out</Text>
					</TouchableOpacity>
				)}
			</ScrollView>
		</View>
	);
}
