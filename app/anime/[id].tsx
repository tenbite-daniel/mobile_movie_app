import WatchlistModal from "@/components/WatchlistModal";
import { icons } from "@/constants/icons";
import { fetchAnimeDetails } from "@/services/anilist";
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
			{value ?? "N/A"}
		</Text>
	</View>
);

const stripHtml = (str: string) =>
	str.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ").trim();

const AnimeDetailsPage = () => {
	const { id } = useLocalSearchParams();
	const insets = useSafeAreaInsets();
	const [favorited, setFavorited] = useState(false);
	const [favLoading, setFavLoading] = useState(false);
	const [watchlistVisible, setWatchlistVisible] = useState(false);
	const [watchStatus, setWatchStatus] = useState<WatchStatus | null>(null);

	const { data: anime, loading } = useFetch(() =>
		fetchAnimeDetails(id as string),
	);

	const displayTitle = anime?.title?.english || anime?.title?.romaji;
	const score = anime?.averageScore
		? `${(anime.averageScore / 10).toFixed(1)}/10`
		: "N/A";
	const startYear = anime?.startDate?.year ?? "TBA";
	const studio = anime?.studios?.nodes?.[0]?.name ?? "N/A";
	const allTimeRank = anime?.rankings?.find(
		(r) => r.allTime && r.type === "POPULAR",
	);

	useEffect(() => {
		if (!anime) return;
		isLocalFavorite(anime.id, "anime").then(setFavorited);
		getWatchlistItem(anime.id, "anime").then((w) => setWatchStatus(w?.status ?? null));
	}, [anime]);

	const toggleFavorite = async () => {
		if (!anime) return;
		setFavLoading(true);
		try {
			if (favorited) {
				await removeLocalFavorite(anime.id, "anime");
				setFavorited(false);
			} else {
				await addLocalFavorite({
					item_id: anime.id,
					type: "anime",
					title: displayTitle ?? anime.title.romaji,
					poster_url: anime.coverImage?.extraLarge || anime.coverImage?.large,
					vote_average: anime.averageScore ? anime.averageScore / 10 : 0,
					year: String(anime.startDate?.year ?? ""),
				});
				setFavorited(true);
			}
		} finally {
			setFavLoading(false);
		}
	};

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
									uri:
										anime?.coverImage?.extraLarge ||
										anime?.coverImage?.large,
								}}
								className="w-full h-[500px]"
								resizeMode="cover"
							/>
						</View>

						<View className="flex-col items-start justify-center mt-5 px-5">
							{anime?.title?.native && (
								<Text className="text-light-300 text-sm mb-1">
									{anime.title.native}
								</Text>
							)}

							<View className="flex-row items-start justify-between w-full">
								<Text className="text-white font-bold text-xl flex-1 mr-3">
									{displayTitle}
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

							<View className="flex-row items-center gap-x-2 mt-2 flex-wrap">
								<Text className="text-light-200 text-sm">{startYear}</Text>
								{anime?.episodes && (
									<Text className="text-light-200 text-sm">
										{anime.episodes}{" "}
										{anime.episodes === 1 ? "Episode" : "Episodes"}
									</Text>
								)}
								{anime?.duration && (
									<Text className="text-light-200 text-sm">
										{anime.duration}m / ep
									</Text>
								)}
							</View>

							<View className="flex-row items-center bg-dark-100 px-2 py-1 rounded-md gap-x-1 mt-2">
								<Image source={icons.star} className="size-4" />
								<Text className="text-white font-bold text-sm">{score}</Text>
								{allTimeRank && (
									<Text className="text-light-200 text-sm">
										· #{allTimeRank.rank} All Time
									</Text>
								)}
							</View>

							<Info label="Status" value={anime?.status} />
							<Info
								label="Description"
								value={anime?.description ? stripHtml(anime.description) : null}
							/>
							<Info
								label="Genres"
								value={anime?.genres?.join(" · ") || "N/A"}
							/>
							<Info label="Studio" value={studio} />
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
					{anime && (
						<WatchlistModal
							visible={watchlistVisible}
							onClose={() => {
								setWatchlistVisible(false);
								getWatchlistItem(anime.id, "anime").then((w) =>
									setWatchStatus(w?.status ?? null),
								);
							}}
							item={{
								item_id: anime.id,
								type: "anime",
								title: displayTitle ?? anime.title.romaji,
								poster_url:
									anime.coverImage?.extraLarge || anime.coverImage?.large,
								vote_average: anime.averageScore
									? anime.averageScore / 10
									: 0,
								year: String(anime.startDate?.year ?? ""),
							}}
						/>
					)}
				</>
			)}
		</View>
	);
};

export default AnimeDetailsPage;
