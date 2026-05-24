import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { useAuth } from "@/context/AuthContext";
import { SelectableItem, useSelection } from "@/context/SelectionContext";
import {
	WatchStatus,
	addLocalFavorite,
	addRecentActivity,
	addToWatchlist,
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
	ActivityIndicator,
	Animated,
	Dimensions,
	FlatList,
	Image,
	Modal,
	PanResponder,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

const SHEET_HEIGHT = Dimensions.get("window").height * 0.75;

// ─── Constants ────────────────────────────────────────────────────────────────

const WATCH_STATUSES: {
	label: string;
	value: WatchStatus;
	emoji: string;
	color: string;
}[] = [
	{ label: "Plan to Watch", value: "plan_to_watch", emoji: "📋", color: "#a8b5db" },
	{ label: "Watching",      value: "watching",      emoji: "▶️",  color: "#4ade80" },
	{ label: "Completed",     value: "completed",     emoji: "✅",  color: "#ab8bff" },
	{ label: "On Hold",       value: "on_hold",       emoji: "⏸️",  color: "#facc15" },
	{ label: "Dropped",       value: "dropped",       emoji: "❌",  color: "#f87171" },
];

// ─── Item row — matches WatchlistCard / FavoriteCard style ────────────────────

const ItemRow = ({
	item,
	checked,
	onToggle,
}: {
	item: SelectableItem;
	checked: boolean;
	onToggle: () => void;
}) => {
	const typeBadge =
		item.type === "movie"   ? "Movie"
		: item.type === "tv"    ? "TV"
		: item.type === "kdrama" ? "K-Drama"
		: "Anime";

	return (
		<TouchableOpacity
			onPress={onToggle}
			activeOpacity={0.8}
			className="flex-row bg-dark-100 rounded-xl mb-3 overflow-hidden"
			style={{
				borderWidth: 1.5,
				borderColor: checked ? "#ab8bff" : "transparent",
			}}
		>
			{/* Checkbox — left side */}
			<View
				style={{
					width: 48,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: checked ? "#ab8bff18" : "transparent",
				}}
			>
				<View
					style={{
						width: 22,
						height: 22,
						borderRadius: 11,
						borderWidth: 2,
						borderColor: checked ? "#ab8bff" : "#a8b5db",
						backgroundColor: checked ? "#ab8bff" : "transparent",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					{checked && (
						<Text style={{ color: "#fff", fontSize: 12, fontWeight: "800" }}>✓</Text>
					)}
				</View>
			</View>

			{/* Poster */}
			<Image
				source={{ uri: item.poster_url }}
				className="w-20 h-28"
				resizeMode="cover"
			/>

			{/* Info */}
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
						<Text className="text-light-300 text-xs">
							{item.vote_average?.toFixed(1)}
						</Text>
						{item.year ? (
							<Text className="text-light-300 text-xs">· {item.year}</Text>
						) : null}
					</View>
				</View>
			</View>
		</TouchableOpacity>
	);
};

// ─── Action sheet modal ───────────────────────────────────────────────────────

const ActionSheet = ({
	visible,
	checkedCount,
	loading,
	feedback,
	translateY,
	panHandlers,
	onAddToFavorites,
	onAddToList,
	onAddToPlaylist,
	onClose,
}: {
	visible: boolean;
	checkedCount: number;
	loading: boolean;
	feedback: string | null;
	translateY: Animated.Value;
	panHandlers: object;
	onAddToFavorites: () => void;
	onAddToList: (status: WatchStatus) => void;
	onAddToPlaylist: () => void;
	onClose: () => void;
}) => (
	<Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
		<TouchableOpacity
			style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}
			activeOpacity={1}
			onPress={onClose}
		>
			<TouchableOpacity activeOpacity={1}>
				<Animated.View
					style={{
						transform: [{ translateY }],
						backgroundColor: "#0f0D23",
						borderTopLeftRadius: 24,
						borderTopRightRadius: 24,
						paddingHorizontal: 20,
						paddingTop: 16,
						paddingBottom: 40,
					}}
				>
					{/* Handle */}
					<View {...panHandlers} style={{ alignItems: "center", marginBottom: 16 }}>
						<View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#a8b5db" }} />
					</View>

					<Text style={{ color: "#fff", fontSize: 16, fontWeight: "800", marginBottom: 4 }}>
						Add {checkedCount} item{checkedCount !== 1 ? "s" : ""} to…
					</Text>

					{/* Feedback */}
					{feedback && (
						<View
							style={{
								backgroundColor: "#ab8bff22",
								borderRadius: 10,
								paddingVertical: 8,
								paddingHorizontal: 12,
								marginTop: 8,
								marginBottom: 4,
								borderWidth: 1,
								borderColor: "#ab8bff44",
							}}
						>
							<Text style={{ color: "#ab8bff", fontSize: 13, fontWeight: "700", textAlign: "center" }}>
								{feedback}
							</Text>
						</View>
					)}

					{loading ? (
						<ActivityIndicator color="#ab8bff" style={{ marginVertical: 24 }} />
					) : (
						<ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
							{/* Favorites */}
							<Text
								style={{
									color: "#a8b5db",
									fontSize: 10,
									fontWeight: "700",
									textTransform: "uppercase",
									letterSpacing: 1.2,
									marginTop: 16,
									marginBottom: 8,
								}}
							>
								Favorites
							</Text>
							<TouchableOpacity
								onPress={onAddToFavorites}
								disabled={checkedCount === 0}
								style={{
									flexDirection: "row",
									alignItems: "center",
									gap: 12,
									backgroundColor: checkedCount > 0 ? "#ab8bff22" : "#1a1a2e",
									borderRadius: 14,
									paddingVertical: 14,
									paddingHorizontal: 16,
									marginBottom: 20,
									borderWidth: 1,
									borderColor: checkedCount > 0 ? "#ab8bff55" : "transparent",
								}}
							>
								<Image
									source={icons.save}
									style={{ width: 20, height: 20 }}
									tintColor={checkedCount > 0 ? "#ab8bff" : "#555"}
								/>
								<Text
									style={{
										color: checkedCount > 0 ? "#ab8bff" : "#555",
										fontSize: 15,
										fontWeight: "700",
										flex: 1,
									}}
								>
									Add to Favorites
								</Text>
							</TouchableOpacity>

							{/* List statuses */}
							<Text
								style={{
									color: "#a8b5db",
									fontSize: 10,
									fontWeight: "700",
									textTransform: "uppercase",
									letterSpacing: 1.2,
									marginBottom: 8,
								}}
							>
								Add to List
							</Text>
							{WATCH_STATUSES.map((s) => (
								<TouchableOpacity
									key={s.value}
									onPress={() => onAddToList(s.value)}
									disabled={checkedCount === 0}
									style={{
										flexDirection: "row",
										alignItems: "center",
										gap: 12,
										backgroundColor: checkedCount > 0 ? "#1a1a2e" : "#111",
										borderRadius: 14,
										paddingVertical: 14,
										paddingHorizontal: 16,
										marginBottom: 8,
										borderWidth: 1,
										borderColor: checkedCount > 0 ? s.color + "44" : "transparent",
									}}
								>
									<Text style={{ fontSize: 20, width: 28, textAlign: "center" }}>{s.emoji}</Text>
									<Text
										style={{
											color: checkedCount > 0 ? s.color : "#555",
											fontSize: 15,
											fontWeight: "600",
											flex: 1,
										}}
									>
										{s.label}
									</Text>
								</TouchableOpacity>
							))}

							{/* Playlists */}
							<Text
								style={{
									color: "#a8b5db",
									fontSize: 10,
									fontWeight: "700",
									textTransform: "uppercase",
									letterSpacing: 1.2,
									marginTop: 8,
									marginBottom: 8,
								}}
							>
								Playlists
							</Text>
							<TouchableOpacity
								onPress={onAddToPlaylist}
								disabled={checkedCount === 0}
								style={{
									flexDirection: "row",
									alignItems: "center",
									gap: 12,
									backgroundColor: checkedCount > 0 ? "#1a1a2e" : "#111",
									borderRadius: 14,
									paddingVertical: 14,
									paddingHorizontal: 16,
									marginBottom: 8,
									borderWidth: 1,
									borderColor: checkedCount > 0 ? "#ab8bff44" : "transparent",
								}}
							>
								<Text style={{ fontSize: 20, width: 28, textAlign: "center" }}>🎬</Text>
								<Text
									style={{
										color: checkedCount > 0 ? "#ab8bff" : "#555",
										fontSize: 15,
										fontWeight: "600",
										flex: 1,
									}}
								>
									Add to Playlist
								</Text>
							</TouchableOpacity>
						</ScrollView>
					)}

					{/* Cancel */}
					<TouchableOpacity
						onPress={onClose}
						style={{ marginTop: 12, paddingVertical: 12, alignItems: "center" }}
					>
						<Text style={{ color: "#a8b5db", fontSize: 15, fontWeight: "600" }}>Cancel</Text>
					</TouchableOpacity>
				</Animated.View>
			</TouchableOpacity>
		</TouchableOpacity>
	</Modal>
);

// ─── Main screen ──────────────────────────────────────────────────────────────

const BulkAddScreen = () => {
	const { user } = useAuth();
	const { selectedItems, exitSelectionMode } = useSelection();

	// All items start checked
	const [checkedIds, setCheckedIds] = useState<Set<string>>(
		new Set(selectedItems.map((i) => `${i.type}-${i.item_id}`)),
	);
	const [sheetVisible, setSheetVisible] = useState(false);
	const [loading, setLoading] = useState(false);
	const [feedback, setFeedback] = useState<string | null>(null);
	const [playlistPickerVisible, setPlaylistPickerVisible] = useState(false);
	const [playlists, setPlaylists] = useState<Playlist[]>([]);
	const [creatingPlaylist, setCreatingPlaylist] = useState(false);
	const [newPlaylistName, setNewPlaylistName] = useState("");

	const playlistTranslateY = useRef(new Animated.Value(0)).current;
	const sheetTranslateY = useRef(new Animated.Value(0)).current;

	const sheetPanResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onPanResponderMove: (_, gs) => {
				if (gs.dy > 0) sheetTranslateY.setValue(gs.dy);
			},
			onPanResponderRelease: (_, gs) => {
				if (gs.dy > 80) {
					Animated.timing(sheetTranslateY, {
						toValue: SHEET_HEIGHT,
						duration: 200,
						useNativeDriver: true,
					}).start(() => {
						sheetTranslateY.setValue(0);
						setSheetVisible(false);
					});
				} else {
					Animated.spring(sheetTranslateY, { toValue: 0, useNativeDriver: true }).start();
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
					Animated.spring(playlistTranslateY, { toValue: 0, useNativeDriver: true }).start();
				}
			},
		}),
	).current;

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
		if (sheetVisible) {
			sheetTranslateY.setValue(SHEET_HEIGHT);
			Animated.timing(sheetTranslateY, {
				toValue: 0,
				duration: 280,
				useNativeDriver: true,
			}).start();
		}
	}, [sheetVisible]);

	const toggleCheck = (item: SelectableItem) => {
		const key = `${item.type}-${item.item_id}`;
		setCheckedIds((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	};

	const allSelected = checkedIds.size === selectedItems.length;

	const toggleSelectAll = () => {
		if (allSelected) {
			setCheckedIds(new Set());
		} else {
			setCheckedIds(new Set(selectedItems.map((i) => `${i.type}-${i.item_id}`)));
		}
	};

	const checkedItems = selectedItems.filter((i) =>
		checkedIds.has(`${i.type}-${i.item_id}`),
	);

	const handleAddToList = async (status: WatchStatus) => {
		if (!user) { router.push("/(auth)/login"); return; }
		if (checkedItems.length === 0) return;
		setLoading(true);
		try {
			await Promise.all(
				checkedItems.map(async (item) => {
					await addToWatchlist({ ...item, status });
					await addRecentActivity({ ...item, action: "watchlisted", status });
				}),
			);
			const label = WATCH_STATUSES.find((s) => s.value === status)?.label ?? status;
			setFeedback(
				`${checkedItems.length} item${checkedItems.length > 1 ? "s" : ""} added to "${label}" ✓`,
			);
		} finally {
			setLoading(false);
		}
	};

	const handleAddToFavorites = async () => {
		if (!user) { router.push("/(auth)/login"); return; }
		if (checkedItems.length === 0) return;
		setLoading(true);
		try {
			await Promise.all(
				checkedItems.map(async (item) => {
					await addLocalFavorite(item);
					await addRecentActivity({ ...item, action: "favorited" });
				}),
			);
			setFeedback(
				`${checkedItems.length} item${checkedItems.length > 1 ? "s" : ""} added to Favorites ✓`,
			);
		} finally {
			setLoading(false);
		}
	};

	const handleOpenPlaylistPicker = async () => {
		if (!user) { router.push("/(auth)/login"); return; }
		const all = await getPlaylists();
		setPlaylists(all);
		setCreatingPlaylist(false);
		setNewPlaylistName("");
		setSheetVisible(false);
		setPlaylistPickerVisible(true);
	};

	const handleCreatePlaylist = async () => {
		const name = newPlaylistName.trim();
		if (!name) return;
		const created = await createPlaylist(name);
		setLoading(true);
		try {
			let added = 0;
			for (const item of checkedItems) {
				const result = await addItemToPlaylist(created.id, item);
				if (result.success) added++;
			}
			setFeedback(`${added} item${added !== 1 ? "s" : ""} added to "${created.name}" ✓`);
		} finally {
			setLoading(false);
			setPlaylistPickerVisible(false);
			setCreatingPlaylist(false);
			setNewPlaylistName("");
		}
	};

	const handleAddToPlaylist = async (playlistId: string) => {
		if (checkedItems.length === 0) return;
		setLoading(true);
		try {
			let added = 0;
			for (const item of checkedItems) {
				const result = await addItemToPlaylist(playlistId, item);
				if (result.success) added++;
			}
			setFeedback(`${added} item${added !== 1 ? "s" : ""} added to playlist ✓`);
		} finally {
			setLoading(false);
			setPlaylistPickerVisible(false);
		}
	};

	const handleDone = () => {
		exitSelectionMode();
		router.replace("/(tabs)/wishlist");
	};

	return (
		<View style={{ flex: 1, backgroundColor: "#030014" }}>
			<Image source={images.bg} style={{ position: "absolute", width: "100%" }} />

			{/* ── Header ── */}
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					paddingTop: 56,
					paddingBottom: 14,
					paddingHorizontal: 16,
					gap: 12,
					borderBottomWidth: 1,
					borderBottomColor: "#1f1d3a",
				}}
			>
				<TouchableOpacity
					onPress={() => router.back()}
					style={{ backgroundColor: "#1f1d3a", borderRadius: 20, padding: 8 }}
				>
					<Image
						source={icons.arrow}
						style={{ width: 20, height: 20, transform: [{ rotate: "180deg" }] }}
						tintColor="#fff"
					/>
				</TouchableOpacity>

				<View style={{ flex: 1 }}>
					<Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>
						Add to Wishlist
					</Text>
					<Text style={{ color: "#a8b5db", fontSize: 12, marginTop: 1 }}>
						{checkedItems.length} of {selectedItems.length} selected
					</Text>
				</View>

				<TouchableOpacity
					onPress={toggleSelectAll}
					style={{
						backgroundColor: "#1f1d3a",
						borderRadius: 20,
						paddingHorizontal: 12,
						paddingVertical: 6,
					}}
				>
					<Text style={{ color: "#ab8bff", fontSize: 12, fontWeight: "700" }}>
						{allSelected ? "Deselect All" : "Select All"}
					</Text>
				</TouchableOpacity>
			</View>

			{/* ── List ── */}
			<FlatList
				data={selectedItems}
				keyExtractor={(item) => `${item.type}-${item.item_id}`}
				renderItem={({ item }) => (
					<ItemRow
						item={item}
						checked={checkedIds.has(`${item.type}-${item.item_id}`)}
						onToggle={() => toggleCheck(item)}
					/>
				)}
				contentContainerStyle={{
					paddingHorizontal: 16,
					paddingTop: 16,
					paddingBottom: 120,
				}}
				showsVerticalScrollIndicator={false}
				ListEmptyComponent={
					<View style={{ marginTop: 60, alignItems: "center" }}>
						<Text style={{ color: "#a8b5db", fontSize: 15 }}>No items selected</Text>
					</View>
				}
			/>

			{/* ── Bottom bar ── */}
			<View
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					paddingHorizontal: 16,
					paddingTop: 12,
					paddingBottom: 36,
					backgroundColor: "#030014ee",
					borderTopWidth: 1,
					borderTopColor: "#1f1d3a",
					flexDirection: "row",
					gap: 10,
				}}
			>
				<TouchableOpacity
					onPress={handleDone}
					style={{
						flex: 1,
						backgroundColor: "#1f1d3a",
						borderRadius: 30,
						paddingVertical: 14,
						alignItems: "center",
					}}
				>
					<Text style={{ color: "#a8b5db", fontSize: 15, fontWeight: "700" }}>Done</Text>
				</TouchableOpacity>

				<TouchableOpacity
					onPress={() => {
						setFeedback(null);
						setSheetVisible(true);
					}}
					disabled={checkedItems.length === 0}
					style={{
						flex: 2,
						backgroundColor: checkedItems.length > 0 ? "#ab8bff" : "#ab8bff55",
						borderRadius: 30,
						paddingVertical: 14,
						alignItems: "center",
					}}
				>
					<Text style={{ color: "#fff", fontSize: 15, fontWeight: "800" }}>
						Add {checkedItems.length > 0 ? `${checkedItems.length} ` : ""}Selected
					</Text>
				</TouchableOpacity>
			</View>

			{/* ── Action sheet ── */}
			<ActionSheet
				visible={sheetVisible}
				checkedCount={checkedItems.length}
				loading={loading}
				feedback={feedback}
				translateY={sheetTranslateY}
				panHandlers={sheetPanResponder.panHandlers}
				onAddToFavorites={handleAddToFavorites}
				onAddToList={handleAddToList}
				onAddToPlaylist={handleOpenPlaylistPicker}
				onClose={() => setSheetVisible(false)}
			/>

			{/* ── Playlist picker ── */}
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
							{/* Draggable handle */}
							<View {...playlistPanResponder.panHandlers} style={{ alignItems: "center", marginBottom: 16 }}>
								<View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#a8b5db" }} />
							</View>

							{/* Header row with + New button */}
							<View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
								<Text style={{ color: "#fff", fontSize: 17, fontWeight: "800", flex: 1 }}>
									Add {checkedItems.length} item{checkedItems.length !== 1 ? "s" : ""} to Playlist
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

							{/* Inline create form */}
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

							{loading ? (
								<ActivityIndicator color="#ab8bff" style={{ marginVertical: 32 }} />
							) : playlists.length === 0 && !creatingPlaylist ? (
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
									style={{ maxHeight: 320, marginTop: 12 }}
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
		</View>
	);
};

export default BulkAddScreen;
