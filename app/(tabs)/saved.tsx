import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { useAuth } from "@/context/AuthContext";
import {
    FavoriteType,
    LocalFavorite,
    getLocalFavorites,
    removeLocalFavorite,
} from "@/services/localFavorites";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type FilterTab = "all" | FavoriteType;

const TABS: { label: string; value: FilterTab }[] = [
	{ label: "All", value: "all" },
	{ label: "Movies", value: "movie" },
	{ label: "TV Shows", value: "tv" },
	{ label: "K-Dramas", value: "kdrama" },
	{ label: "Anime", value: "anime" },
];

const FavoriteCard = ({
	item,
	onRemove,
}: {
	item: LocalFavorite;
	onRemove: (id: number, type: FavoriteType) => void;
}) => {
	const handlePress = () => {
		if (item.type === "movie") router.push(`/movies/${item.item_id}`);
		else if (item.type === "tv" || item.type === "kdrama") router.push(`/tv/${item.item_id}`);
		else router.push(`/anime/${item.item_id}`);
	};

	const typeBadge =
		item.type === "movie" ? "Movie"
		: item.type === "tv" ? "TV"
		: item.type === "kdrama" ? "K-Drama"
		: "Anime";

	return (
		<TouchableOpacity
			onPress={handlePress}
			className="flex-row bg-dark-100 rounded-xl mb-3 overflow-hidden"
		>
			<Image source={{ uri: item.poster_url }} className="w-20 h-28" resizeMode="cover" />
			<View className="flex-1 px-3 py-3 justify-between">
				<View>
					<View className="flex-row items-center gap-x-2 mb-1">
						<View className="bg-accent px-2 py-0.5 rounded-full">
							<Text className="text-white text-xs font-semibold">{typeBadge}</Text>
						</View>
					</View>
					<Text className="text-white font-bold text-sm" numberOfLines={2}>
						{item.title}
					</Text>
					<View className="flex-row items-center gap-x-1 mt-1">
						<Image source={icons.star} className="size-3" />
						<Text className="text-light-300 text-xs">{item.vote_average?.toFixed(1)}</Text>
						{item.year ? <Text className="text-light-300 text-xs">· {item.year}</Text> : null}
					</View>
				</View>
				<TouchableOpacity onPress={() => onRemove(item.item_id, item.type)} className="self-start mt-2">
					<Text className="text-red-400 text-xs font-semibold">Remove</Text>
				</TouchableOpacity>
			</View>
		</TouchableOpacity>
	);
};

const Favorites = () => {
	const { user } = useAuth();
	const [activeTab, setActiveTab] = useState<FilterTab>("all");
	const [favorites, setFavorites] = useState<LocalFavorite[]>([]);
	const [loading, setLoading] = useState(false);

	// ALL hooks must be called unconditionally — no early returns before this point
	useFocusEffect(
		useCallback(() => {
			if (!user) return; // skip loading if guest
			const load = async () => {
				setLoading(true);
				try {
					const type = activeTab === "all" ? undefined : activeTab;
					const data = await getLocalFavorites(type);
					setFavorites(data);
				} finally {
					setLoading(false);
				}
			};
			load();
		}, [user, activeTab]),
	);

	const handleRemove = async (itemId: number, type: FavoriteType) => {
		await removeLocalFavorite(itemId, type);
		setFavorites((prev) => prev.filter((f) => !(f.item_id === itemId && f.type === type)));
	};

	// Guest screen — rendered after all hooks
	if (!user) {
		return (
			<View className="flex-1 bg-primary items-center justify-center px-8">
				<Image source={images.bg} className="absolute w-full z-0" />
				<Image source={icons.save} className="size-16 mb-6" tintColor="#a8b5db" />
				<Text className="text-white text-xl font-bold mb-2 text-center">
					Sign in to see your Favorites
				</Text>
				<Text className="text-light-300 text-sm text-center mb-8">
					Save movies, shows and anime to access them anytime.
				</Text>
				<TouchableOpacity
					onPress={() => router.push("/(auth)/login")}
					className="bg-accent px-8 py-3 rounded-full"
				>
					<Text className="text-white font-bold text-base">Sign In</Text>
				</TouchableOpacity>
				<TouchableOpacity onPress={() => router.push("/(auth)/register")} className="mt-3">
					<Text className="text-light-300 text-sm">
						No account?{" "}
						<Text className="text-accent font-semibold">Sign Up</Text>
					</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<View className="bg-primary flex-1">
			<Image source={images.bg} className="absolute w-full z-0" />
			<FlatList
				data={favorites}
				keyExtractor={(item) => `${item.type}-${item.item_id}`}
				renderItem={({ item }) => <FavoriteCard item={item} onRemove={handleRemove} />}
				className="px-5"
				contentContainerStyle={{ paddingBottom: 40 }}
				ListHeaderComponent={
					<>
						<View className="w-full flex-row justify-center mt-20 mb-6 items-center">
							<Image source={icons.logo} className="w-12 h-10" />
						</View>
						<Text className="text-white text-2xl font-bold mb-5">My Favorites</Text>

						<View className="flex-row gap-x-2 mb-5 flex-wrap gap-y-2">
							{TABS.map((tab) => (
								<TouchableOpacity
									key={tab.value}
									onPress={() => setActiveTab(tab.value)}
									className={`px-4 py-2 rounded-full ${activeTab === tab.value ? "bg-accent" : "bg-dark-200"}`}
								>
									<Text className={`text-sm font-semibold ${activeTab === tab.value ? "text-white" : "text-light-300"}`}>
										{tab.label}
									</Text>
								</TouchableOpacity>
							))}
						</View>

						{loading && <ActivityIndicator size="large" color="#0000ff" className="my-5" />}
					</>
				}
				ListEmptyComponent={
					!loading ? (
						<View className="mt-10 items-center">
							<Image source={icons.save} className="size-12 mb-4" tintColor="#a8b5db" />
							<Text className="text-light-300 text-base text-center">No favorites yet</Text>
							<Text className="text-light-300 text-sm text-center mt-1">
								Long-press any title to add it here
							</Text>
						</View>
					) : null
				}
			/>
		</View>
	);
};

export default Favorites;
