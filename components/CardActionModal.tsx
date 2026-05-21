import { icons } from "@/constants/icons";
import { useAuth } from "@/context/AuthContext";
import {
    FavoriteType,
    WatchStatus,
    addLocalFavorite,
    addRecentActivity,
    addToWatchlist,
    getWatchlistItem,
    isLocalFavorite,
    removeFromWatchlist,
    removeLocalFavorite,
} from "@/services/localFavorites";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Image,
    Modal,
    PanResponder,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const SHEET_HEIGHT = Dimensions.get("window").height * 0.75;

interface CardActionModalProps {
	visible: boolean;
	onClose: () => void;
	item: {
		item_id: number;
		type: FavoriteType;
		title: string;
		poster_url: string;
		vote_average: number;
		year: string;
	};
}

const WATCH_STATUSES: { label: string; value: WatchStatus; emoji: string }[] = [
	{ label: "Plan to Watch", value: "plan_to_watch", emoji: "📋" },
	{ label: "Watching", value: "watching", emoji: "▶️" },
	{ label: "Completed", value: "completed", emoji: "✅" },
	{ label: "On Hold", value: "on_hold", emoji: "⏸️" },
	{ label: "Dropped", value: "dropped", emoji: "❌" },
];

const STATUS_COLORS: Record<WatchStatus, string> = {
	plan_to_watch: "#a8b5db",
	watching: "#4ade80",
	completed: "#ab8bff",
	on_hold: "#facc15",
	dropped: "#f87171",
};

const CardActionModal = ({ visible, onClose, item }: CardActionModalProps) => {
	const { user } = useAuth();
	const [favorited, setFavorited] = useState(false);
	const [currentStatus, setCurrentStatus] = useState<WatchStatus | null>(null);
	const [feedback, setFeedback] = useState<string | null>(null);

	const requireAuth = () => {
		onClose();
		router.push("/(auth)/login");
	};

	const translateY = useRef(new Animated.Value(0)).current;

	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onPanResponderMove: (_, gs) => {
				if (gs.dy > 0) translateY.setValue(gs.dy);
			},
			onPanResponderRelease: (_, gs) => {
				if (gs.dy > 80) {
					Animated.timing(translateY, {
						toValue: SHEET_HEIGHT,
						duration: 200,
						useNativeDriver: true,
					}).start(() => {
						translateY.setValue(0);
						onClose();
					});
				} else {
					Animated.spring(translateY, {
						toValue: 0,
						useNativeDriver: true,
					}).start();
				}
			},
		}),
	).current;

	// Reset position when modal opens
	useEffect(() => {
		if (visible) translateY.setValue(0);
	}, [visible]);

	useEffect(() => {
		if (visible) {
			setFeedback(null);
			isLocalFavorite(item.item_id, item.type).then(setFavorited);
			getWatchlistItem(item.item_id, item.type).then((w) =>
				setCurrentStatus(w?.status ?? null),
			);
		}
	}, [visible, item.item_id, item.type]);

	const handleFavorite = async () => {
		if (!user) { requireAuth(); return; }
		if (favorited) {
			await removeLocalFavorite(item.item_id, item.type);
			setFavorited(false);
			setFeedback("Removed from Favorites");
		} else {
			await addLocalFavorite(item);
			await addRecentActivity({ ...item, action: "favorited" });
			setFavorited(true);
			setFeedback("Added to Favorites ✓");
		}
		setTimeout(onClose, 700);
	};

	const handleWatchStatus = async (status: WatchStatus) => {
		if (!user) { requireAuth(); return; }
		if (currentStatus === status) {
			await removeFromWatchlist(item.item_id, item.type);
			setCurrentStatus(null);
			setFeedback("Removed from list");
		} else {
			await addToWatchlist({ ...item, status });
			await addRecentActivity({ ...item, action: "watchlisted", status });
			setCurrentStatus(status);
			const label = WATCH_STATUSES.find((s) => s.value === status)?.label ?? status;
			setFeedback(`Saved as "${label}" ✓`);
		}
		setTimeout(onClose, 700);
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType="slide"
			onRequestClose={onClose}
		>
			<TouchableOpacity
				className="flex-1 bg-black/60 justify-end"
				activeOpacity={1}
				onPress={onClose}
			>
				<TouchableOpacity activeOpacity={1}>
					<Animated.View
						style={{ transform: [{ translateY }] }}
						className="bg-dark-100 rounded-t-3xl px-5 pt-4 pb-10"
					>
						{/* Draggable handle */}
						<View {...panResponder.panHandlers} className="items-center pb-4">
							<View className="w-10 h-1 bg-light-300 rounded-full" />
						</View>

						{/* Movie header */}
						<View className="flex-row items-center gap-x-3 mb-4">
							<Image
								source={{ uri: item.poster_url }}
								className="w-12 h-16 rounded-lg"
								resizeMode="cover"
							/>
							<View className="flex-1">
								<Text className="text-white font-bold text-base" numberOfLines={2}>
									{item.title}
								</Text>
								<Text className="text-light-300 text-xs mt-0.5">{item.year}</Text>
								{currentStatus && (
									<View
										className="mt-1.5 self-start px-2 py-0.5 rounded-full"
										style={{ backgroundColor: STATUS_COLORS[currentStatus] + "33" }}
									>
										<Text className="text-xs font-semibold" style={{ color: STATUS_COLORS[currentStatus] }}>
											{WATCH_STATUSES.find((s) => s.value === currentStatus)?.emoji}{" "}
											{WATCH_STATUSES.find((s) => s.value === currentStatus)?.label}
										</Text>
									</View>
								)}
							</View>
						</View>

						{/* Feedback banner */}
						{feedback && (
							<View className="bg-accent/20 rounded-xl py-2 px-3 mb-4">
								<Text className="text-accent text-sm text-center font-semibold">{feedback}</Text>
							</View>
						)}

						{/* Sign-in prompt for guests */}
						{!user && (
							<View className="bg-dark-200 rounded-xl py-3 px-4 mb-4 flex-row items-center gap-x-2">
								<Text className="text-light-300 text-sm flex-1">Sign in to save favorites and track your watchlist</Text>
								<TouchableOpacity onPress={requireAuth} className="bg-accent px-3 py-1.5 rounded-full">
									<Text className="text-white text-xs font-bold">Sign In</Text>
								</TouchableOpacity>
							</View>
						)}

						{/* ── Section: Favorites ─────────────────────────── */}
						<Text className="text-light-300 text-xs font-semibold uppercase tracking-widest mb-1 mt-1">
							Favorites
						</Text>
						<TouchableOpacity
							onPress={handleFavorite}
							className="flex-row items-center gap-x-3 py-3 px-3 rounded-xl mb-3"
							style={{ backgroundColor: favorited ? "#ab8bff22" : "#0F0D2322" }}
						>
							<Image
								source={icons.save}
								className="size-5"
								tintColor={favorited ? "#ab8bff" : "#a8b5db"}
							/>
							<View className="flex-1">
								<Text className="text-base font-semibold" style={{ color: favorited ? "#ab8bff" : "#fff" }}>
									{favorited ? "Remove from Favorites" : "Add to Favorites"}
								</Text>
								{favorited && (
									<Text className="text-xs text-light-300 mt-0.5">Already in your favorites</Text>
								)}
							</View>
							{favorited && <View className="w-2 h-2 rounded-full bg-accent" />}
						</TouchableOpacity>

						{/* ── Section: Add to List ───────────────────────── */}
						<Text className="text-light-300 text-xs font-semibold uppercase tracking-widest mb-1">
							Add to List
						</Text>
						{currentStatus && (
							<Text className="text-light-300 text-xs mb-2">
								Currently:{" "}
								<Text style={{ color: STATUS_COLORS[currentStatus] }} className="font-semibold">
									{WATCH_STATUSES.find((s) => s.value === currentStatus)?.label}
								</Text>
								{" · tap again to remove"}
							</Text>
						)}
						{WATCH_STATUSES.map((s) => {
							const isActive = currentStatus === s.value;
							return (
								<TouchableOpacity
									key={s.value}
									onPress={() => handleWatchStatus(s.value)}
									className="flex-row items-center gap-x-3 py-2.5 px-3 rounded-xl mb-1"
									style={{ backgroundColor: isActive ? STATUS_COLORS[s.value] + "22" : "transparent" }}
								>
									<Text className="text-lg w-6 text-center">{s.emoji}</Text>
									<Text
										className="text-base flex-1"
										style={{ color: isActive ? STATUS_COLORS[s.value] : "#fff", fontWeight: isActive ? "700" : "400" }}
									>
										{s.label}
									</Text>
									{isActive && (
										<View className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.value] }} />
									)}
								</TouchableOpacity>
							);
						})}

						{/* Cancel */}
						<TouchableOpacity onPress={onClose} className="mt-4 py-3 items-center">
							<Text className="text-light-300 font-semibold">Cancel</Text>
						</TouchableOpacity>
					</Animated.View>
				</TouchableOpacity>
			</TouchableOpacity>
		</Modal>
	);
};

export default CardActionModal;
