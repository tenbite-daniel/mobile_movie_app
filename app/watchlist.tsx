import WatchlistModal from "@/components/WatchlistModal";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import {
    FavoriteType,
    WatchStatus,
    WatchlistItem,
    getWatchlist,
    removeFromWatchlist,
} from "@/services/localFavorites";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type TypeFilter = "all" | FavoriteType;

const TYPE_TABS: { label: string; value: TypeFilter }[] = [
	{ label: "All", value: "all" },
	{ label: "Movies", value: "movie" },
	{ label: "TV Shows", value: "tv" },
	{ label: "K-Dramas", value: "kdrama" },
	{ label: "Anime", value: "anime" },
];

const STATUS_LABELS: Record<WatchStatus, string> = {
	plan_to_watch: "Plan to Watch",
	watching: "Watching",
	completed: "Completed",
	on_hold: "On Hold",
	dropped: "Dropped",
};

const STATUS_COLORS: Record<WatchStatus, string> = {
	plan_to_watch: "#a8b5db",
	watching: "#4ade80",
	completed: "#ab8bff",
	on_hold: "#facc15",
	dropped: "#f87171",
};

const WatchlistCard = ({
	item,
	onRemove,
	onChangeStatus,
}: {
	item: WatchlistItem;
	onRemove: (id: number, type: FavoriteType) => void;
	onChangeStatus: (item: WatchlistItem) => void;
}) => {
	const handlePress = () => {
		if (item.type === "movie") router.push(`/movies/${item.item_id}`);
		else if (item.type === "tv" || item.type === "kdrama")
			router.push(`/tv/${item.item_id}`);
		else router.push(`/anime/${item.item_id}`);
	};

	const typeBadge =
		item.type === "movie"
			? "Movie"
			: item.type === "tv"
			? "TV"
			: item.type === "kdrama"
			? "K-Drama"
			: "Anime";

	const statusColor = STATUS_COLORS[item.status];

	return (
		<TouchableOpacity
			onPress={handlePress}
			className="flex-row bg-dark-100 rounded-xl mb-3 overflow-hidden"
		>
			<Image
				source={{ uri: item.poster_url }}
				className="w-20 h-28"
				resizeMode="cover"
			/>
			<View className="flex-1 px-3 py-3 justify-between">
				<View>
					<View className="flex-row items-center gap-x-2 mb-1 flex-wrap">
						<View className="bg-accent px-2 py-0.5 rounded-full">
							<Text className="text-white text-xs font-semibold">
								{typeBadge}
							</Text>
						</View>
						{/* Tappable status badge */}
						<TouchableOpacity
							onPress={() => onChangeStatus(item)}
							className="px-2 py-0.5 rounded-full border"
							style={{ borderColor: statusColor }}
						>
							<Text className="text-xs font-semibold" style={{ color: statusColor }}>
								{STATUS_LABELS[item.status]}
							</Text>
						</TouchableOpacity>
					</View>
					<Text
						className="text-white font-bold text-sm"
						numberOfLines={2}
					>
						{item.title}
					</Text>
					<View className="flex-row items-center gap-x-1 mt-1">
						<Image source={icons.star} className="size-3" />
						<Text className="text-light-300 text-xs">
							{item.vote_average?.toFixed(1)}
						</Text>
						{item.year ? (
							<Text className="text-light-300 text-xs">· {item.year}</Text>
						) : null}
					</View>
				</View>
				<View className="flex-row items-center gap-x-3 mt-2">
					{/* Change status shortcut */}
					<TouchableOpacity onPress={() => onChangeStatus(item)}>
						<Text className="text-accent text-xs font-semibold">
							Change Status
						</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => onRemove(item.item_id, item.type)}>
						<Text className="text-red-400 text-xs font-semibold">Remove</Text>
					</TouchableOpacity>
				</View>
			</View>
		</TouchableOpacity>
	);
};

const WatchlistScreen = () => {
	const params = useLocalSearchParams<{ status?: string }>();
	const initialStatus = (params.status as WatchStatus) ?? "plan_to_watch";

	const [activeStatus, setActiveStatus] = useState<WatchStatus>(initialStatus);
	const [activeType, setActiveType] = useState<TypeFilter>("all");
	const [items, setItems] = useState<WatchlistItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [modalItem, setModalItem] = useState<WatchlistItem | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const type = activeType === "all" ? undefined : activeType;
			const data = await getWatchlist(activeStatus, type);
			setItems(data);
		} finally {
			setLoading(false);
		}
	}, [activeStatus, activeType]);

	useFocusEffect(
		useCallback(() => {
			load();
		}, [load]),
	);

	const handleRemove = async (itemId: number, type: FavoriteType) => {
		await removeFromWatchlist(itemId, type);
		setItems((prev) =>
			prev.filter((w) => !(w.item_id === itemId && w.type === type)),
		);
	};

	const ALL_STATUSES: WatchStatus[] = [
		"plan_to_watch",
		"watching",
		"completed",
		"on_hold",
		"dropped",
	];

	return (
		<View className="bg-primary flex-1">
			<Image source={images.bg} className="absolute w-full z-0" />

			<FlatList
				data={items}
				keyExtractor={(item) => `${item.type}-${item.item_id}`}
				renderItem={({ item }) => (
					<WatchlistCard
						item={item}
						onRemove={handleRemove}
						onChangeStatus={(i) => setModalItem(i)}
					/>
				)}
				className="px-5"
				contentContainerStyle={{ paddingBottom: 120 }}
				ListHeaderComponent={
					<>
						{/* Header with back button */}
						<View className="flex-row items-center mt-14 mb-4 gap-x-3">
							<TouchableOpacity
								onPress={router.back}
								className="bg-dark-200 rounded-full p-2"
							>
								<Image
									source={icons.arrow}
									style={{ width: 20, height: 20, transform: [{ rotate: "180deg" }] }}
									tintColor="#fff"
								/>
							</TouchableOpacity>
							<Text className="text-white text-xl font-bold">My List</Text>
						</View>

						{/* Status filter tabs */}
						<View className="flex-row gap-x-2 mb-4 flex-wrap gap-y-2">
							{ALL_STATUSES.map((s) => (
								<TouchableOpacity
									key={s}
									onPress={() => setActiveStatus(s)}
									className={`px-3 py-1.5 rounded-full ${
										activeStatus === s ? "bg-accent" : "bg-dark-200"
									}`}
								>
									<Text
										className={`text-xs font-semibold ${
											activeStatus === s ? "text-white" : "text-light-300"
										}`}
									>
										{STATUS_LABELS[s]}
									</Text>
								</TouchableOpacity>
							))}
						</View>

						{/* Type filter tabs */}
						<View className="flex-row gap-x-2 mb-5 flex-wrap gap-y-2">
							{TYPE_TABS.map((tab) => (
								<TouchableOpacity
									key={tab.value}
									onPress={() => setActiveType(tab.value)}
									className={`px-4 py-2 rounded-full ${
										activeType === tab.value
											? "bg-dark-100 border border-accent"
											: "bg-dark-200"
									}`}
								>
									<Text
										className={`text-sm font-semibold ${
											activeType === tab.value
												? "text-accent"
												: "text-light-300"
										}`}
									>
										{tab.label}
									</Text>
								</TouchableOpacity>
							))}
						</View>

						{loading && (
							<ActivityIndicator
								size="large"
								color="#ab8bff"
								className="my-5"
							/>
						)}
					</>
				}
				ListEmptyComponent={
					!loading ? (
						<View className="mt-10 items-center">
							<Text className="text-light-300 text-base text-center">
								Nothing here yet
							</Text>
							<Text className="text-light-300 text-sm text-center mt-1">
								Tap the list icon on any title to add it
							</Text>
						</View>
					) : null
				}
			/>

			{/* Status change modal */}
			{modalItem && (
				<WatchlistModal
					visible={!!modalItem}
					onClose={() => {
						setModalItem(null);
						load(); // reload list after status change
					}}
					item={{
						item_id: modalItem.item_id,
						type: modalItem.type,
						title: modalItem.title,
						poster_url: modalItem.poster_url,
						vote_average: modalItem.vote_average,
						year: modalItem.year,
					}}
				/>
			)}
		</View>
	);
};

export default WatchlistScreen;
