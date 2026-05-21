import WatchlistModal from "@/components/WatchlistModal";
import { icons } from "@/constants/icons";
import { fetchTVShowDetails } from "@/services/api";
import {
    addLocalFavorite,
    getWatchlistItem,
    isLocalFavorite,
    removeLocalFavorite,
    WatchStatus,
} from "@/services/localFavorites";
import useFetch from "@/services/useFetch";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface InfoProps {
	label: string;
	value?: string | number | null;
}

const Info = ({ label, value }: InfoProps) => (
	<View className="flex-col items-start justify-center mt-5">
		<Text className="text-light-200 font-normal text-sm">{label}</Text>
		<Text className="text-light-100 font-bold text-sm mt-2">
			{value || "N/A"}
		</Text>
	</View>
);

const CastCard = ({
	member,
}: {
	member: { id: number; name: string; character: string; profile_path: string | null };
}) => (
	<View className="items-center mr-4 w-20">
		{member.profile_path ? (
			<Image
				source={{
					uri: `https://image.tmdb.org/t/p/w185${member.profile_path}`,
				}}
				className="w-16 h-16 rounded-full"
				resizeMode="cover"
			/>
		) : (
			<View className="w-16 h-16 rounded-full bg-dark-200 items-center justify-center">
				<Image source={icons.person} className="size-8" tintColor="#a8b5db" />
			</View>
		)}
		<Text
			className="text-white text-xs font-semibold text-center mt-2"
			numberOfLines={2}
		>
			{member.name}
		</Text>
		<Text
			className="text-light-300 text-xs text-center mt-0.5"
			numberOfLines={2}
		>
			{member.character}
		</Text>
	</View>
);

const TVShowDetailsPage = () => {
	const { id } = useLocalSearchParams();
	const insets = useSafeAreaInsets();
	const [favorited, setFavorited] = useState(false);
	const [favLoading, setFavLoading] = useState(false);
	const [watchlistVisible, setWatchlistVisible] = useState(false);
	const [watchStatus, setWatchStatus] = useState<WatchStatus | null>(null);

	const { data: show, loading } = useFetch(() =>
		fetchTVShowDetails(id as string),
	);

	// Determine if this is a K-Drama based on origin country
	const isKDrama =
		(show as any)?.origin_country?.includes("KR") ||
		(show as any)?.original_language === "ko";
	const contentType = isKDrama ? "kdrama" : "tv";

	useEffect(() => {
		if (!show) return;
		isLocalFavorite(show.id, contentType).then(setFavorited);
		getWatchlistItem(show.id, contentType).then((w) => setWatchStatus(w?.status ?? null));
	}, [show, contentType]);

	const toggleFavorite = async () => {
		if (!show) return;
		setFavLoading(true);
		try {
			if (favorited) {
				await removeLocalFavorite(show.id, contentType);
				setFavorited(false);
			} else {
				await addLocalFavorite({
					item_id: show.id,
					type: contentType,
					title: show.name,
					poster_url: `https://image.tmdb.org/t/p/w500${show.poster_path}`,
					vote_average: show.vote_average,
					year: show.first_air_date?.split("-")[0] ?? "",
				});
				setFavorited(true);
			}
		} finally {
			setFavLoading(false);
		}
	};

	const cast = show?.credits?.cast?.slice(0, 20) ?? [];

	return (
		<View className="bg-primary flex-1">
			{loading ? (
				<ActivityIndicator
					size="large"
					color="#ab8bff"
					className="mt-20 self-center"
				/>
			) : (
				<>
					<ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
						{/* Poster */}
						<View>
							<Image
								source={{
									uri: `https://image.tmdb.org/t/p/w500${show?.poster_path}`,
								}}
								className="w-full h-[500px]"
								resizeMode="stretch"
							/>
						</View>

						<View className="flex-col items-start justify-center mt-5 px-5">
							<View className="flex-row items-start justify-between w-full">
								<Text className="text-white font-bold text-xl flex-1 mr-3">
									{show?.name}
								</Text>
								{/* Action buttons */}
								<View className="flex-row items-center gap-x-3 mt-1">
									{/* Add to List button */}
									<TouchableOpacity
										onPress={() => setWatchlistVisible(true)}
										className="flex-row items-center bg-dark-100 px-3 py-1.5 rounded-full gap-x-1.5"
										style={watchStatus ? { borderWidth: 1, borderColor: "#ab8bff" } : {}}
									>
										<Text
											className="text-xs font-semibold"
											style={{ color: watchStatus ? "#ab8bff" : "#a8b5db" }}
										>
											{watchStatus ? "✓ In List" : "+ List"}
										</Text>
									</TouchableOpacity>
									{/* Favorite button */}
									<TouchableOpacity
										onPress={toggleFavorite}
										disabled={favLoading}
									>
										<Image
											source={icons.save}
											className="size-7"
											tintColor={favorited ? "#ab8bff" : "#a8b5db"}
										/>
									</TouchableOpacity>
								</View>
							</View>

							<View className="flex-row items-center gap-x-1 mt-2">
								<Text className="text-light-200 text-sm">
									{show?.first_air_date?.split("-")[0]}
								</Text>
								<Text className="text-light-200 text-sm">
									{show?.number_of_seasons}{" "}
									{show?.number_of_seasons === 1 ? "Season" : "Seasons"}
								</Text>
							</View>

							<View className="flex-row items-center bg-dark-100 px-2 py-1 rounded-md gap-x-1 mt-2">
								<Image source={icons.star} className="size-4" />
								<Text className="text-white font-bold text-sm">
									{Math.round(show?.vote_average ?? 0)}/10
								</Text>
								<Text className="text-light-200 text-sm">
									({show?.vote_count} votes)
								</Text>
							</View>

							<Info label="Overview" value={show?.overview} />
							<Info
								label="Genres"
								value={show?.genres?.map((g) => g.name).join(" - ") || "N/A"}
							/>
							<Info label="Episodes" value={show?.number_of_episodes} />
							<Info label="Status" value={show?.status} />
							<Info
								label="Production Companies"
								value={
									show?.production_companies?.map((c) => c.name).join(" - ") || "N/A"
								}
							/>

							{/* Cast section */}
							{cast.length > 0 && (
								<View className="mt-6 w-full">
									<Text className="text-white font-bold text-base mb-3">
										Cast
									</Text>
									<FlatList
										data={cast}
										keyExtractor={(item) => String(item.id)}
										renderItem={({ item }) => <CastCard member={item} />}
										horizontal
										showsHorizontalScrollIndicator={false}
										scrollEnabled
									/>
								</View>
							)}
						</View>
					</ScrollView>

					{/* Fixed back button — always on top */}
					<TouchableOpacity
						onPress={router.back}
						style={{ top: insets.top + 8, position: "absolute", left: 16, zIndex: 50, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 999, padding: 8 }}
					>
						<Image
							source={icons.arrow}
							style={{ width: 20, height: 20, transform: [{ rotate: "180deg" }] }}
							tintColor="#fff"
						/>
					</TouchableOpacity>

					{/* Watchlist modal */}
					{show && (
						<WatchlistModal
							visible={watchlistVisible}
							onClose={() => {
								setWatchlistVisible(false);
								getWatchlistItem(show.id, contentType).then((w) =>
									setWatchStatus(w?.status ?? null),
								);
							}}
							item={{
								item_id: show.id,
								type: contentType,
								title: show.name,
								poster_url: `https://image.tmdb.org/t/p/w500${show.poster_path}`,
								vote_average: show.vote_average,
								year: show.first_air_date?.split("-")[0] ?? "",
							}}
						/>
					)}
				</>
			)}
		</View>
	);
};

export default TVShowDetailsPage;
