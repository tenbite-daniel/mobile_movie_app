import { icons } from "@/constants/icons";
import { useAuth } from "@/context/AuthContext";
import { useSelection } from "@/context/SelectionContext";
import {
    FavoriteType,
    WatchStatus,
    addLocalFavorite,
    addRecentActivity,
    addToWishlist,
    addToWatchlist,
    getWatchlistItem,
    isInWishlist,
    isLocalFavorite,
    removeFromWatchlist,
    removeFromWishlist,
    removeLocalFavorite,
} from "@/services/localFavorites";
import {
    Playlist,
    addItemToPlaylist,
    createPlaylist,
    getPlaylists,
} from "@/services/localPlaylists";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    Modal,
    PanResponder,
    Text,
    TextInput,
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
	const { enterSelectionMode } = useSelection();
	const [favorited, setFavorited] = useState(false);
	const [wishlisted, setWishlisted] = useState(false);
	const [currentStatus, setCurrentStatus] = useState<WatchStatus | null>(null);
	const [feedback, setFeedback] = useState<string | null>(null);
	const [playlistPickerVisible, setPlaylistPickerVisible] = useState(false);
	const [playlists, setPlaylists] = useState<Playlist[]>([]);
	const [creatingPlaylist, setCreatingPlaylist] = useState(false);
	const [newPlaylistName, setNewPlaylistName] = useState("");

	const translateY = useRef(new Animated.Value(0)).current;
	const playlistTranslateY = useRef(new Animated.Value(0)).current;

	const animatedClose = () => {
		Animated.timing(translateY, {
			toValue: SHEET_HEIGHT,
			duration: 200,
			useNativeDriver: true,
		}).start(() => {
			translateY.setValue(0);
			onClose();
		});
	};

	const requireAuth = () => {
		animatedClose();
		router.push("/(auth)/login");
	};

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

	const playlistPanResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onPanResponderMove: (_, gs) => {
				if (gs.dy > 0) playlistTranslateY.setValue(gs.dy);
			},
			onPanResponderRelease: (_, gs) => {
				if (gs.dy > 80) {
					Animated.timing(playlistTranslateY, {
						toValue: SHEET_HEIGHT,
						duration: 200,
						useNativeDriver: true,
					}).start(() => {
						playlistTranslateY.setValue(0);
						setPlaylistPickerVisible(false);
					});
				} else {
					Animated.spring(playlistTranslateY, {
						toValue: 0,
						useNativeDriver: true,
					}).start();
				}
			},
		}),
	).current;

	// Slide in when modal opens, reset on close
	useEffect(() => {
		if (visible) {
			translateY.setValue(SHEET_HEIGHT);
			Animated.timing(translateY, {
				toValue: 0,
				duration: 280,
				useNativeDriver: true,
			}).start();
		}
	}, [visible]);

	useEffect(() => {
		if (playlistPickerVisible) {
			playlistTranslateY.setValue(SHEET_HEIGHT);
			Animated.timing(playlistTranslateY, {
				toValue: 0,
				duration: 280,
				useNativeDriver: true,
			}).start();
		}
	}, [playlistPickerVisible]);

	useEffect(() => {
		if (visible) {
			setFeedback(null);
			isLocalFavorite(item.item_id, item.type).then(setFavorited);
			isInWishlist(item.item_id, item.type).then(setWishlisted);
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
		// No auto-close — user dismisses manually
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
		// No auto-close — user dismisses manually
	};

	const handleAddToWishlist = async () => {
		if (!user) { requireAuth(); return; }
		if (wishlisted) {
			await removeFromWishlist(item.item_id, item.type);
			setWishlisted(false);
			setFeedback("Removed from Wishlist");
		} else {
			await addToWishlist(item);
			setWishlisted(true);
			setFeedback("Added to Wishlist ✓");
		}
	};

	const handleOpenPlaylistPicker = async () => {
		if (!user) { requireAuth(); return; }
		const all = await getPlaylists();
		setPlaylists(all);
		setCreatingPlaylist(false);
		setNewPlaylistName("");
		setPlaylistPickerVisible(true);
	};

	const handleCreatePlaylist = async () => {
		const name = newPlaylistName.trim();
		if (!name) return;
		const created = await createPlaylist(name);
		const result = await addItemToPlaylist(created.id, item);
		setPlaylistPickerVisible(false);
		setCreatingPlaylist(false);
		setNewPlaylistName("");
		setFeedback(result.success ? `Added to "${created.name}" ✓` : (result.reason ?? "Failed"));
	};

	const handleAddToPlaylist = async (playlistId: string) => {
		const result = await addItemToPlaylist(playlistId, item);
		setPlaylistPickerVisible(false);
		setFeedback(result.success ? "Added to Playlist ✓" : (result.reason ?? "Failed"));
	};

	const handleSelectMode = () => {
		enterSelectionMode(item);
		translateY.setValue(0);
		onClose();
	};

	return (
		<>
		<Modal
			visible={visible}
			transparent
			animationType="none"
			onRequestClose={animatedClose}
		>
			<TouchableOpacity
				className="flex-1 bg-black/60 justify-end"
				activeOpacity={1}
				onPress={animatedClose}
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

						{/* ── Section: Wishlist & Multi-select ──────────── */}
						<Text className="text-light-300 text-xs font-semibold uppercase tracking-widest mb-1 mt-3">
							Wishlist
						</Text>
						<TouchableOpacity
							onPress={handleAddToWishlist}
							className="flex-row items-center gap-x-3 py-2.5 px-3 rounded-xl mb-1"
							style={{ backgroundColor: wishlisted ? "#a8b5db22" : "#a8b5db11" }}
						>
							<Text className="text-lg w-6 text-center">🔖</Text>
							<View className="flex-1">
								<Text className="text-base font-semibold" style={{ color: wishlisted ? "#a8b5db" : "#fff" }}>
									{wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
								</Text>
								{wishlisted && (
									<Text className="text-xs text-light-300 mt-0.5">Already in your wishlist</Text>
								)}
							</View>
							{wishlisted && <View className="w-2 h-2 rounded-full bg-light-300" />}
						</TouchableOpacity>
						<TouchableOpacity
							onPress={handleSelectMode}
							className="flex-row items-center gap-x-3 py-2.5 px-3 rounded-xl mb-1"
							style={{ backgroundColor: "#a8b5db11" }}
						>
							<Text className="text-lg w-6 text-center">☑️</Text>
							<Text className="text-white text-base flex-1">Select Multiple</Text>
						</TouchableOpacity>

						{/* ── Section: Playlists ────────────────────────── */}
						<Text className="text-light-300 text-xs font-semibold uppercase tracking-widest mb-1 mt-3">
							Playlists
						</Text>
						<TouchableOpacity
							onPress={handleOpenPlaylistPicker}
							className="flex-row items-center gap-x-3 py-2.5 px-3 rounded-xl mb-1"
							style={{ backgroundColor: "#a8b5db11" }}
						>
							<Text className="text-lg w-6 text-center">🎬</Text>
							<Text className="text-white text-base flex-1">Add to Playlist</Text>
						</TouchableOpacity>

						{/* Cancel */}
						<TouchableOpacity onPress={animatedClose} className="mt-4 py-3 items-center">
							<Text className="text-light-300 font-semibold">Cancel</Text>
						</TouchableOpacity>
					</Animated.View>
				</TouchableOpacity>
			</TouchableOpacity>
		</Modal>

		{/* ── Playlist picker ───────────────────────────────────────────── */}
		<Modal
			visible={playlistPickerVisible}
			transparent
			animationType="none"
			onRequestClose={() => setPlaylistPickerVisible(false)}
		>
			<TouchableOpacity
				style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}
				activeOpacity={1}
				onPress={() => setPlaylistPickerVisible(false)}
			>
				<TouchableOpacity activeOpacity={1}>
					<Animated.View
						style={{
							transform: [{ translateY: playlistTranslateY }],
							backgroundColor: "#0f0D23",
							borderTopLeftRadius: 24,
							borderTopRightRadius: 24,
							paddingHorizontal: 20,
							paddingTop: 16,
							paddingBottom: 40,
							maxHeight: 480,
						}}
					>
						<View {...playlistPanResponder.panHandlers} style={{ alignItems: "center", marginBottom: 16 }}>
							<View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#a8b5db" }} />
						</View>
						<View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
							<Text style={{ color: "#fff", fontSize: 17, fontWeight: "800", flex: 1 }}>
								Add to Playlist
							</Text>
							<TouchableOpacity
								onPress={() => { setCreatingPlaylist((v) => !v); setNewPlaylistName(""); }}
								style={{
									flexDirection: "row",
									alignItems: "center",
									gap: 4,
									backgroundColor: "#ab8bff22",
									borderRadius: 20,
									paddingHorizontal: 12,
									paddingVertical: 6,
								}}
							>
								<Text style={{ color: "#ab8bff", fontSize: 18, lineHeight: 20 }}>+</Text>
								<Text style={{ color: "#ab8bff", fontSize: 13, fontWeight: "700" }}>New</Text>
							</TouchableOpacity>
						</View>

						{creatingPlaylist && (
							<View style={{ marginBottom: 12 }}>
								<TextInput
									value={newPlaylistName}
									onChangeText={setNewPlaylistName}
									placeholder="Playlist name…"
									placeholderTextColor="#4a4a6a"
									autoFocus
									style={{
										backgroundColor: "#1a1a2e",
										borderRadius: 12,
										paddingHorizontal: 14,
										paddingVertical: 10,
										color: "#fff",
										fontSize: 14,
										borderWidth: 1,
										borderColor: "#ab8bff55",
										marginBottom: 8,
									}}
								/>
								<View style={{ flexDirection: "row", gap: 8 }}>
									<TouchableOpacity
										onPress={() => { setCreatingPlaylist(false); setNewPlaylistName(""); }}
										style={{ flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: "#1a1a2e", alignItems: "center" }}
									>
										<Text style={{ color: "#a8b5db", fontWeight: "600" }}>Cancel</Text>
									</TouchableOpacity>
									<TouchableOpacity
										onPress={handleCreatePlaylist}
										disabled={!newPlaylistName.trim()}
										style={{
											flex: 1, paddingVertical: 10, borderRadius: 12,
											backgroundColor: newPlaylistName.trim() ? "#ab8bff" : "#ab8bff44",
											alignItems: "center",
										}}
									>
										<Text style={{ color: "#fff", fontWeight: "700" }}>Create & Add</Text>
									</TouchableOpacity>
								</View>
							</View>
						)}

						{playlists.length === 0 && !creatingPlaylist ? (
							<View style={{ alignItems: "center", paddingVertical: 32 }}>
								<Text style={{ fontSize: 36, marginBottom: 10 }}>🎬</Text>
								<Text style={{ color: "#a8b5db", fontSize: 14, textAlign: "center" }}>
									No playlists yet.{"\n"}Tap <Text style={{ color: "#ab8bff", fontWeight: "700" }}>+ New</Text> to create one.
								</Text>
							</View>
						) : playlists.length > 0 ? (
							<FlatList
								data={playlists}
								keyExtractor={(p) => p.id}
								style={{ maxHeight: 320 }}
								renderItem={({ item: p }) => (
									<TouchableOpacity
										onPress={() => handleAddToPlaylist(p.id)}
										style={{
											flexDirection: "row",
											alignItems: "center",
											gap: 12,
											backgroundColor: "#1a1a2e",
											borderRadius: 14,
											paddingVertical: 12,
											paddingHorizontal: 14,
											marginBottom: 8,
											borderWidth: 1,
											borderColor: "#2a2a4a",
										}}
									>
										<Text style={{ fontSize: 20 }}>🎬</Text>
										<View style={{ flex: 1 }}>
											<Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }} numberOfLines={1}>
												{p.name}
											</Text>
											<Text style={{ color: "#4a4a6a", fontSize: 11, marginTop: 2 }}>
												{p.items.length} / 1000 items
											</Text>
										</View>
									</TouchableOpacity>
								)}
							/>
						) : null}
						<TouchableOpacity
							onPress={() => setPlaylistPickerVisible(false)}
							style={{ paddingVertical: 12, alignItems: "center", marginTop: 4 }}
						>
							<Text style={{ color: "#a8b5db", fontSize: 14, fontWeight: "600" }}>Cancel</Text>
						</TouchableOpacity>
					</Animated.View>
				</TouchableOpacity>
			</TouchableOpacity>
		</Modal>
	</>
	);
};

export default CardActionModal;
