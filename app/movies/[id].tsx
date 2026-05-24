import WatchlistModal from "@/components/WatchlistModal";
import { icons } from "@/constants/icons";
import { fetchMovieDetails } from "@/services/api";
import {
    addLocalFavorite,
    getWatchlistItem,
    isLocalFavorite,
    removeLocalFavorite,
    WatchStatus,
} from "@/services/localFavorites";
import { useAuth } from "@/context/AuthContext";
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

interface MovieInfoProps {
	label: string;
	value?: string | number | null;
}

const MovieInfo = ({ label, value }: MovieInfoProps) => (
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

const MovieDetails = () => {
	const { id } = useLocalSearchParams();
	const insets = useSafeAreaInsets();
	const { user } = useAuth();
	const [favorited, setFavorited] = useState(false);
	const [favLoading, setFavLoading] = useState(false);
	const [watchlistVisible, setWatchlistVisible] = useState(false);
	const [watchStatus, setWatchStatus] = useState<WatchStatus | null>(null);

	const { data: movie, loading } = useFetch(() =>
		fetchMovieDetails(id as string),
	);

	useEffect(() => {
		if (!movie) return;
		isLocalFavorite(movie.id, "movie").then(setFavorited);
		getWatchlistItem(movie.id, "movie").then((w) => setWatchStatus(w?.status ?? null));
	}, [movie]);

	const toggleFavorite = async () => {
		if (!user) { router.push("/(auth)/login"); return; }
		if (!movie) return;
		setFavLoading(true);
		try {
			if (favorited) {
				await removeLocalFavorite(movie.id, "movie");
				setFavorited(false);
			} else {
				await addLocalFavorite({
					item_id: movie.id,
					type: "movie",
					title: movie.title,
					poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
					vote_average: movie.vote_average,
					year: movie.release_date?.split("-")[0] ?? "",
				});
				setFavorited(true);
			}
		} finally {
			setFavLoading(false);
		}
	};

	const cast = movie?.credits?.cast?.slice(0, 20) ?? [];

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
									uri: `https://image.tmdb.org/t/p/w500${movie?.poster_path}`,
								}}
								className="w-full h-[500px]"
								resizeMode="stretch"
							/>
						</View>

						<View className="flex-col items-start justify-center mt-5 px-5">
							<View className="flex-row items-start justify-between w-full">
								<Text className="text-white font-bold text-xl flex-1 mr-3">
									{movie?.title}
								</Text>
								{/* Action buttons */}
								<View className="flex-row items-center gap-x-3 mt-1">
									{/* Add to List button */}
									<TouchableOpacity
										onPress={() => user ? setWatchlistVisible(true) : router.push("/(auth)/login")}
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
									{movie?.release_date?.split("-")[0]}
								</Text>
								<Text className="text-light-200 text-sm">
									{movie?.runtime}m
								</Text>
							</View>

							<View className="flex-row items-center bg-dark-100 px-2 py-1 rounded-md gap-x-1 mt-2">
								<Image source={icons.star} className="size-4" />
								<Text className="text-white font-bold text-sm">
									{Math.round(movie?.vote_average ?? 0)}/10
								</Text>
								<Text className="text-light-200 text-sm">
									({movie?.vote_count} votes)
								</Text>
							</View>

							<MovieInfo label="Overview" value={movie?.overview} />
							<MovieInfo
								label="Genres"
								value={movie?.genres?.map((g) => g.name).join(" - ") || "N/A"}
							/>
							<View className="flex flex-row justify-between w-1/2">
								<MovieInfo
									label="Budget"
									value={`$${movie?.budget / 1_000_000} million`}
								/>
								<MovieInfo
									label="Revenue"
									value={`$${Math.round(movie?.revenue) / 1_000_000}`}
								/>
							</View>
							<MovieInfo
								label="Production Companies"
								value={
									movie?.production_companies?.map((c) => c.name).join(" - ") || "N/A"
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
					{movie && (
						<WatchlistModal
							visible={watchlistVisible}
							onClose={() => {
								setWatchlistVisible(false);
								getWatchlistItem(movie.id, "movie").then((w) =>
									setWatchStatus(w?.status ?? null),
								);
							}}
							item={{
								item_id: movie.id,
								type: "movie",
								title: movie.title,
								poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
								vote_average: movie.vote_average,
								year: movie.release_date?.split("-")[0] ?? "",
							}}
						/>
					)}
				</>
			)}
		</View>
	);
};

export default MovieDetails;
