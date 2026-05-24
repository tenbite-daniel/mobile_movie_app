import { useAuth } from "@/context/AuthContext";
import { useSelection } from "@/context/SelectionContext";
import { addToWishlist } from "@/services/localFavorites";
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
	Modal,
	PanResponder,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SHEET_HEIGHT = Dimensions.get("window").height * 0.75;

/**
 * Floating bar shown at the top of the screen when multi-select mode is active.
 */
const SelectionBar = () => {
	const { user } = useAuth();
	const { selectionMode, selectedItems, exitSelectionMode } = useSelection();
	const insets = useSafeAreaInsets();

	const [loading, setLoading] = useState(false);
	const [feedback, setFeedback] = useState<string | null>(null);
	const [playlistPickerVisible, setPlaylistPickerVisible] = useState(false);
	const [playlists, setPlaylists] = useState<Playlist[]>([]);
	const [creatingPlaylist, setCreatingPlaylist] = useState(false);
	const [newPlaylistName, setNewPlaylistName] = useState("");

	const playlistTranslateY = useRef(new Animated.Value(0)).current;

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

	if (!selectionMode) return null;

	const count = selectedItems.length;

	const requireAuth = () => {
		exitSelectionMode();
		router.push("/(auth)/login");
	};

	const handleAddToWishlist = async () => {
		if (!user) { requireAuth(); return; }
		if (count === 0) return;

		const itemsToAdd = [...selectedItems];
		setLoading(true);
		try {
			for (const item of itemsToAdd) {
				await addToWishlist({
					item_id: item.item_id,
					type: item.type,
					title: item.title,
					poster_url: item.poster_url,
					vote_average: item.vote_average,
					year: item.year,
				});
			}
			setFeedback(`${itemsToAdd.length} item${itemsToAdd.length !== 1 ? "s" : ""} added to Wishlist ✓`);
			setTimeout(() => { setFeedback(null); exitSelectionMode(); }, 1200);
		} finally {
			setLoading(false);
		}
	};

	const handleOpenPlaylistPicker = async () => {
		if (!user) { requireAuth(); return; }
		if (count === 0) return;
		const all = await getPlaylists();
		setPlaylists(all);
		setCreatingPlaylist(false);
		setNewPlaylistName("");
		setPlaylistPickerVisible(true);
	};

	const handleAddToPlaylist = async (playlistId: string) => {
		setPlaylistPickerVisible(false);
		const itemsToAdd = [...selectedItems];
		setLoading(true);
		try {
			let added = 0;
			for (const item of itemsToAdd) {
				const result = await addItemToPlaylist(playlistId, {
					item_id: item.item_id,
					type: item.type,
					title: item.title,
					poster_url: item.poster_url,
					vote_average: item.vote_average,
					year: item.year,
				});
				if (result.success) added++;
			}
			setFeedback(`${added} item${added !== 1 ? "s" : ""} added to Playlist ✓`);
			setTimeout(() => { setFeedback(null); exitSelectionMode(); }, 1200);
		} finally {
			setLoading(false);
		}
	};

	const handleCreatePlaylist = async () => {
		const name = newPlaylistName.trim();
		if (!name) return;
		const created = await createPlaylist(name);
		setLoading(true);
		try {
			let added = 0;
			for (const item of selectedItems) {
				const result = await addItemToPlaylist(created.id, {
					item_id: item.item_id,
					type: item.type,
					title: item.title,
					poster_url: item.poster_url,
					vote_average: item.vote_average,
					year: item.year,
				});
				if (result.success) added++;
			}
			setFeedback(`${added} item${added !== 1 ? "s" : ""} added to "${created.name}" ✓`);
			setTimeout(() => { setFeedback(null); exitSelectionMode(); }, 1200);
		} finally {
			setLoading(false);
			setPlaylistPickerVisible(false);
			setCreatingPlaylist(false);
			setNewPlaylistName("");
		}
	};

	return (
		<>
		<View
			style={{
				position: "absolute",
				top: 0,
				left: 0,
				right: 0,
				zIndex: 100,
				backgroundColor: "#0f0D23",
				borderBottomWidth: 1,
				borderBottomColor: "#ab8bff44",
				paddingTop: insets.top + 8,
				paddingBottom: 12,
				paddingHorizontal: 16,
			}}
		>
			{feedback ? (
				<View
					style={{
						backgroundColor: "#ab8bff22",
						borderRadius: 12,
						paddingVertical: 10,
						paddingHorizontal: 14,
						borderWidth: 1,
						borderColor: "#ab8bff55",
						alignItems: "center",
					}}
				>
					<Text style={{ color: "#ab8bff", fontSize: 14, fontWeight: "700" }}>
						{feedback}
					</Text>
				</View>
			) : (
				<View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
					{/* Left: cancel + count */}
					<View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
						<TouchableOpacity
							onPress={exitSelectionMode}
							style={{
								backgroundColor: "#1f1d3a",
								borderRadius: 20,
								paddingHorizontal: 12,
								paddingVertical: 6,
							}}
						>
							<Text style={{ color: "#a8b5db", fontSize: 13, fontWeight: "600" }}>✕ Cancel</Text>
						</TouchableOpacity>
						<Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>
							{count} selected
						</Text>
					</View>

					{/* Right: action buttons */}
					{loading ? (
						<ActivityIndicator color="#ab8bff" />
					) : (
						<View style={{ flexDirection: "row", gap: 8 }}>
							<TouchableOpacity
								onPress={handleOpenPlaylistPicker}
								disabled={count === 0}
								style={{
									backgroundColor: count > 0 ? "#1f1d3a" : "#1f1d3a88",
									borderRadius: 20,
									paddingHorizontal: 12,
									paddingVertical: 8,
									borderWidth: 1,
									borderColor: count > 0 ? "#ab8bff66" : "#ab8bff22",
								}}
							>
								<Text style={{ color: count > 0 ? "#ab8bff" : "#ab8bff55", fontSize: 13, fontWeight: "700" }}>
									＋ Playlist
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={handleAddToWishlist}
								disabled={count === 0}
								style={{
									backgroundColor: count > 0 ? "#ab8bff" : "#ab8bff55",
									borderRadius: 20,
									paddingHorizontal: 14,
									paddingVertical: 8,
								}}
							>
								<Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>
									＋ Wishlist
								</Text>
							</TouchableOpacity>
						</View>
					)}
				</View>
			)}
		</View>

		{/* Playlist picker modal */}
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

						{/* Header row with + New button */}
						<View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
							<View style={{ flex: 1 }}>
								<Text style={{ color: "#fff", fontSize: 17, fontWeight: "800" }}>
									Add to Playlist
								</Text>
								<Text style={{ color: "#a8b5db", fontSize: 12, marginTop: 2 }}>
									{count} item{count !== 1 ? "s" : ""} will be added
								</Text>
							</View>
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

export default SelectionBar;
