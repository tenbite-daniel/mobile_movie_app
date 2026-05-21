import AnimeCard from "@/components/AnimeCard";
import KDramaCard from "@/components/KDramaCard";
import MovieCard from "@/components/MovieCard";
import TVShowCard from "@/components/TVShowCard";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { useAuth } from "@/context/AuthContext";
import { fetchPopularAnime } from "@/services/anilist";
import { fetchKDramas, fetchMovies, fetchTVShows } from "@/services/api";
import {
    RecentActivityItem,
    WatchStatus,
    getRecentActivity,
} from "@/services/localFavorites";
import useFetch from "@/services/useFetch";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// ─── Section header ───────────────────────────────────────────────────────────

const SectionHeader = ({
	title,
	filter,
}: {
	title: string;
	filter?: string;
}) => (
	<View className="flex-row items-center justify-between mt-8 mb-3">
		<Text className="text-lg text-white font-bold">{title}</Text>
		{filter && (
			<TouchableOpacity
				onPress={() => router.push(`/(tabs)/search?filter=${filter}`)}
				className="flex-row items-center gap-x-1"
			>
				<Text className="text-accent text-sm font-semibold">View More</Text>
				<Text className="text-accent text-sm">→</Text>
			</TouchableOpacity>
		)}
	</View>
);

// ─── Status colours / labels ──────────────────────────────────────────────────

const STATUS_COLORS: Record<WatchStatus, string> = {
	plan_to_watch: "#a8b5db",
	watching: "#4ade80",
	completed: "#ab8bff",
	on_hold: "#facc15",
	dropped: "#f87171",
};

const STATUS_LABELS: Record<WatchStatus, string> = {
	plan_to_watch: "Plan to Watch",
	watching: "Watching",
	completed: "Completed",
	on_hold: "On Hold",
	dropped: "Dropped",
};

// ─── Recent Activity card ─────────────────────────────────────────────────────

const RecentCard = ({ item }: { item: RecentActivityItem }) => {
	const handlePress = () => {
		if (item.type === "movie") router.push(`/movies/${item.item_id}`);
		else if (item.type === "tv" || item.type === "kdrama")
			router.push(`/tv/${item.item_id}`);
		else router.push(`/anime/${item.item_id}`);
	};

	const timeAgo = (iso: string) => {
		const diff = Date.now() - new Date(iso).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return "just now";
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		return `${Math.floor(hrs / 24)}d ago`;
	};

	return (
		<TouchableOpacity
			onPress={handlePress}
			className="mr-3 w-28"
		>
			<View className="relative">
				<Image
					source={{ uri: item.poster_url }}
					className="w-28 h-40 rounded-xl"
					resizeMode="cover"
				/>
				{/* Action badge */}
				<View
					className="absolute top-2 left-2 px-2 py-0.5 rounded-full"
					style={{
						backgroundColor:
							item.action === "favorited"
								? "#ab8bff44"
								: item.status
								? STATUS_COLORS[item.status] + "44"
								: "#ffffff22",
					}}
				>
					<Text
						className="text-xs font-bold"
						style={{
							color:
								item.action === "favorited"
									? "#ab8bff"
									: item.status
									? STATUS_COLORS[item.status]
									: "#fff",
						}}
					>
						{item.action === "favorited"
							? "★ Saved"
							: item.status
							? STATUS_LABELS[item.status]
							: "Listed"}
					</Text>
				</View>
			</View>
			<Text
				className="text-white text-xs font-semibold mt-2"
				numberOfLines={1}
			>
				{item.title}
			</Text>
			<Text className="text-light-300 text-xs mt-0.5">
				{timeAgo(item.timestamp)}
			</Text>
		</TouchableOpacity>
	);
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Index() {
	const { user } = useAuth();
	const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);

	// Reload recent activity every time the tab is focused
	useFocusEffect(
		useCallback(() => {
			if (user) {
				getRecentActivity().then(setRecentActivity);
			}
		}, [user]),
	);

	const {
		data: anime,
		loading: animeLoading,
		error: animeError,
	} = useFetch(fetchPopularAnime);

	const {
		data: kdramas,
		loading: kdramaLoading,
		error: kdramaError,
	} = useFetch(fetchKDramas);

	const {
		data: tvShows,
		loading: tvLoading,
		error: tvError,
	} = useFetch(() => fetchTVShows({ query: "" }));

	const {
		data: movies,
		loading: moviesLoading,
		error: moviesError,
	} = useFetch(() => fetchMovies({ query: "" }));

	const isLoading = animeLoading || kdramaLoading || tvLoading || moviesLoading;
	const hasError = animeError || kdramaError || tvError || moviesError;
	const errorMessage =
		animeError?.message ||
		kdramaError?.message ||
		tvError?.message ||
		moviesError?.message;

	return (
		<View className="flex-1 bg-primary">
			<Image source={images.bg} className="absolute w-full z-0" />
			<ScrollView
				className="flex-1 px-5"
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ minHeight: "100%", paddingBottom: 100 }}
			>
				<Image
					source={icons.logo}
					className="w-12 h-10 mt-20 mb-5 mx-auto"
				/>

				{isLoading ? (
					<ActivityIndicator
						size="large"
						color="#0000ff"
						className="mt-10 self-center"
					/>
				) : hasError ? (
					<Text className="text-white mt-10">Error: {errorMessage}</Text>
				) : (
					<View className="flex-1 mt-5">
						{/* Recent Activity — logged-in users only */}
						{user && recentActivity.length > 0 && (
							<>
								<SectionHeader title="Recent Activity" />
								<FlatList
									horizontal
									showsHorizontalScrollIndicator={false}
									ItemSeparatorComponent={() => <View className="w-1" />}
									className="mb-4"
									data={recentActivity}
									renderItem={({ item }) => <RecentCard item={item} />}
									keyExtractor={(item) =>
										`activity-${item.type}-${item.item_id}-${item.action}`
									}
								/>
							</>
						)}

						{/* Anime */}
						<SectionHeader title="Popular Anime" filter="anime" />
						<FlatList
							data={anime}
							renderItem={({ item }) => <AnimeCard {...item} />}
							keyExtractor={(item) => `anime-${item.id}`}
							horizontal
							showsHorizontalScrollIndicator={false}
							ItemSeparatorComponent={() => <View className="w-4" />}
						/>

						{/* K-Dramas */}
						<SectionHeader title="Popular K-Dramas" filter="kdrama" />
						<FlatList
							data={kdramas}
							renderItem={({ item }) => <KDramaCard {...item} />}
							keyExtractor={(item) => `kdrama-${item.id}`}
							horizontal
							showsHorizontalScrollIndicator={false}
							ItemSeparatorComponent={() => <View className="w-4" />}
						/>

						{/* TV Shows */}
						<SectionHeader title="Popular TV Shows" filter="tv" />
						<FlatList
							data={tvShows}
							renderItem={({ item }) => <TVShowCard {...item} />}
							keyExtractor={(item) => `tv-${item.id}`}
							horizontal
							showsHorizontalScrollIndicator={false}
							ItemSeparatorComponent={() => <View className="w-4" />}
						/>

						{/* Movies */}
						<SectionHeader title="Popular Movies" filter="movies" />
						<FlatList
							data={movies}
							renderItem={({ item }) => <MovieCard {...item} />}
							keyExtractor={(item) => `movie-${item.id}`}
							horizontal
							showsHorizontalScrollIndicator={false}
							ItemSeparatorComponent={() => <View className="w-4" />}
							className="mb-10"
						/>
					</View>
				)}
			</ScrollView>
		</View>
	);
}
