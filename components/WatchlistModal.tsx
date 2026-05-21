import {
    FavoriteType,
    WatchStatus,
    addRecentActivity,
    addToWatchlist,
    getWatchlistItem,
    removeFromWatchlist
} from "@/services/localFavorites";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Image,
    Modal,
    PanResponder,
    Text,
    TouchableOpacity,
    View
} from "react-native";

const SHEET_HEIGHT = Dimensions.get("window").height * 0.75;

interface WatchlistModalProps {
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

const WatchlistModal = ({ visible, onClose, item }: WatchlistModalProps) => {
	const [currentStatus, setCurrentStatus] = useState<WatchStatus | null>(null);
	const [loading, setLoading] = useState(false);
	const [feedback, setFeedback] = useState<string | null>(null);

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
			getWatchlistItem(item.item_id, item.type).then((w) =>
				setCurrentStatus(w?.status ?? null),
			);
		}
	}, [visible, item.item_id, item.type]);

	const handleSelect = async (status: WatchStatus) => {
		setLoading(true);
		try {
			await addToWatchlist({ ...item, status });
			await addRecentActivity({ ...item, action: "watchlisted", status });
			setCurrentStatus(status);
			const label = WATCH_STATUSES.find((s) => s.value === status)?.label ?? status;
			setFeedback(`Saved as "${label}"`);
			setTimeout(onClose, 700);
		} finally {
			setLoading(false);
		}
	};

	const handleRemove = async () => {
		setLoading(true);
		try {
			await removeFromWatchlist(item.item_id, item.type);
			setCurrentStatus(null);
			setFeedback("Removed from list");
			setTimeout(onClose, 700);
		} finally {
			setLoading(false);
		}
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
				{/* Prevent taps inside the sheet from closing */}
				<TouchableOpacity activeOpacity={1}>
					<Animated.View
						style={{ transform: [{ translateY }] }}
						className="bg-dark-100 rounded-t-3xl px-5 pt-4 pb-10"
					>
						{/* Draggable handle */}
						<View {...panResponder.panHandlers} className="items-center pb-4">
							<View className="w-10 h-1 bg-light-300 rounded-full" />
						</View>

						{/* Movie info header */}
						<View className="flex-row items-center gap-x-3 mb-5">
							<Image
								source={{ uri: item.poster_url }}
								className="w-12 h-16 rounded-lg"
								resizeMode="cover"
							/>
							<View className="flex-1">
								<Text
									className="text-white font-bold text-base"
									numberOfLines={2}
								>
									{item.title}
								</Text>
								<Text className="text-light-300 text-xs mt-0.5">
									{item.year}
								</Text>
								{currentStatus && (
									<View className="mt-1 self-start bg-accent/20 px-2 py-0.5 rounded-full">
										<Text className="text-accent text-xs font-semibold">
											{WATCH_STATUSES.find((s) => s.value === currentStatus)?.label}
										</Text>
									</View>
								)}
							</View>
						</View>

						{/* Feedback banner */}
						{feedback && (
							<View className="bg-accent/20 rounded-xl py-2 px-3 mb-4">
								<Text className="text-accent text-sm text-center font-semibold">
									{feedback}
								</Text>
							</View>
						)}

						{loading ? (
							<ActivityIndicator color="#ab8bff" className="my-4" />
						) : (
							<>
								<Text className="text-light-300 text-xs font-semibold uppercase tracking-widest mb-2">
									Add to list
								</Text>

								{WATCH_STATUSES.map((s) => {
									const isActive = currentStatus === s.value;
									return (
										<TouchableOpacity
											key={s.value}
											onPress={() => handleSelect(s.value)}
											className={`flex-row items-center gap-x-3 py-3 px-3 rounded-xl mb-1 ${
												isActive ? "bg-accent/20" : ""
											}`}
										>
											<Text className="text-lg w-6 text-center">{s.emoji}</Text>
											<Text
												className={`text-base flex-1 ${
													isActive
														? "text-accent font-bold"
														: "text-white"
												}`}
											>
												{s.label}
											</Text>
											{isActive && (
												<View className="w-2 h-2 rounded-full bg-accent" />
											)}
										</TouchableOpacity>
									);
								})}

								{/* Remove from list option */}
								{currentStatus && (
									<TouchableOpacity
										onPress={handleRemove}
										className="flex-row items-center gap-x-3 py-3 px-3 rounded-xl mb-1 mt-1 border border-red-400/30"
									>
										<Text className="text-lg w-6 text-center">🗑️</Text>
										<Text className="text-red-400 text-base">
											Remove from list
										</Text>
									</TouchableOpacity>
								)}
							</>
						)}

						{/* Cancel */}
						<TouchableOpacity
							onPress={onClose}
							className="mt-4 py-3 items-center"
						>
							<Text className="text-light-300 font-semibold">Cancel</Text>
						</TouchableOpacity>
					</Animated.View>
				</TouchableOpacity>
			</TouchableOpacity>
		</Modal>
	);
};

export default WatchlistModal;
