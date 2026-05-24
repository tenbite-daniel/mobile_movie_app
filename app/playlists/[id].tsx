import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { FavoriteType } from "@/services/localFavorites";
import {
	Playlist,
	PlaylistItem,
	getPlaylist,
	removeItemFromPlaylist,
	updatePlaylist,
} from "@/services/localPlaylists";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Image,
	Modal,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

// Re-import FavoriteType from localPlaylists re-exports localFavorites type
// but localPlaylists imports it from localFavorites — just use it directly.

// ─── Edit modal (inline, reused from playlists tab) ──────────────────────────

const EditModal = ({
	visible,
	initial,
	onSave,
	onClose,
}: {
	visible: boolean;
	initial: { name: string; description?: string };
	onSave: (name: string, description: string) => void;
	onClose: () => void;
}) => {
	const [name, setName] = useState(initial.name);
	const [description, setDescription] = useState(initial.description ?? "");
	const [nameError, setNameError] = useState("");

	React.useEffect(() => {
		if (visible) {
			setName(initial.name);
			setDescription(initial.description ?? "");
			setNameError("");
		}
	}, [visible]);

	const handleSave = () => {
		if (!name.trim()) { setNameError("Playlist name is required"); return; }
		onSave(name.trim(), description.trim());
	};

	return (
		<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
			<TouchableOpacity
				style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}
				activeOpacity={1}
				onPress={onClose}
			>
				<TouchableOpacity activeOpacity={1}>
					<View
						style={{
							backgroundColor: "#0f0D23",
							borderTopLeftRadius: 24,
							borderTopRightRadius: 24,
							paddingHorizontal: 20,
							paddingTop: 16,
							paddingBottom: 40,
						}}
					>
						<View style={{ alignItems: "center", marginBottom: 16 }}>
							<View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#a8b5db" }} />
						</View>
						<Text style={{ color: "#fff", fontSize: 18, fontWeight: "800", marginBottom: 20 }}>
							Edit Playlist
						</Text>

						<Text style={{ color: "#a8b5db", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
							PLAYLIST NAME <Text style={{ color: "#f87171" }}>*</Text>
						</Text>
						<TextInput
							value={name}
							onChangeText={(t) => { setName(t); if (t.trim()) setNameError(""); }}
							placeholder="e.g. Weekend Binge"
							placeholderTextColor="#4a4a6a"
							style={{
								backgroundColor: "#1a1a2e",
								borderRadius: 12,
								paddingHorizontal: 14,
								paddingVertical: 12,
								color: "#fff",
								fontSize: 15,
								borderWidth: 1,
								borderColor: nameError ? "#f87171" : "#2a2a4a",
								marginBottom: 4,
							}}
						/>
						{nameError ? (
							<Text style={{ color: "#f87171", fontSize: 12, marginBottom: 8 }}>{nameError}</Text>
						) : (
							<View style={{ height: 12 }} />
						)}

						<Text style={{ color: "#a8b5db", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
							DESCRIPTION{" "}
							<Text style={{ color: "#4a4a6a", fontWeight: "400" }}>(optional)</Text>
						</Text>
						<TextInput
							value={description}
							onChangeText={setDescription}
							placeholder="What's this playlist about?"
							placeholderTextColor="#4a4a6a"
							multiline
							numberOfLines={3}
							style={{
								backgroundColor: "#1a1a2e",
								borderRadius: 12,
								paddingHorizontal: 14,
								paddingVertical: 12,
								color: "#fff",
								fontSize: 15,
								borderWidth: 1,
								borderColor: "#2a2a4a",
								marginBottom: 24,
								minHeight: 80,
								textAlignVertical: "top",
							}}
						/>

						<TouchableOpacity
							onPress={handleSave}
							style={{
								backgroundColor: "#ab8bff",
								borderRadius: 30,
								paddingVertical: 14,
								alignItems: "center",
								marginBottom: 10,
							}}
						>
							<Text style={{ color: "#fff", fontSize: 15, fontWeight: "800" }}>Save Changes</Text>
						</TouchableOpacity>
						<TouchableOpacity onPress={onClose} style={{ paddingVertical: 10, alignItems: "center" }}>
							<Text style={{ color: "#a8b5db", fontSize: 14, fontWeight: "600" }}>Cancel</Text>
						</TouchableOpacity>
					</View>
				</TouchableOpacity>
			</TouchableOpacity>
		</Modal>
	);
};

// ─── Item card ────────────────────────────────────────────────────────────────

const ItemCard = React.memo(({
	item,
	onRemove,
	onPress,
}: {
	item: PlaylistItem;
	onRemove: (itemId: number, type: FavoriteType) => void;
	onPress: () => void;
}) => {
	const typeBadge =
		item.type === "movie" ? "Movie"
		: item.type === "tv" ? "TV"
		: item.type === "kdrama" ? "K-Drama"
		: "Anime";

	return (
		<TouchableOpacity
			onPress={onPress}
			style={{
				flexDirection: "row",
				backgroundColor: "#1a1a2e",
				borderRadius: 14,
				marginBottom: 10,
				overflow: "hidden",
				borderWidth: 1,
				borderColor: "#2a2a4a",
			}}
		>
			<Image source={{ uri: item.poster_url }} style={{ width: 72, height: 100 }} resizeMode="cover" />
			<View style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 10, justifyContent: "space-between" }}>
				<View>
					<View
						style={{
							alignSelf: "flex-start",
							backgroundColor: "#ab8bff",
							borderRadius: 20,
							paddingHorizontal: 8,
							paddingVertical: 2,
							marginBottom: 4,
						}}
					>
						<Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>{typeBadge}</Text>
					</View>
					<Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }} numberOfLines={2}>
						{item.title}
					</Text>
					<View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
						<Image source={icons.star} style={{ width: 11, height: 11 }} />
						<Text style={{ color: "#a8b5db", fontSize: 11 }}>{item.vote_average?.toFixed(1)}</Text>
						{item.year ? <Text style={{ color: "#a8b5db", fontSize: 11 }}>· {item.year}</Text> : null}
					</View>
				</View>
				<TouchableOpacity onPress={() => onRemove(item.item_id, item.type)}>
					<Text style={{ color: "#f87171", fontSize: 11, fontWeight: "600" }}>Remove</Text>
				</TouchableOpacity>
			</View>
		</TouchableOpacity>
	);
});

// ─── Detail screen ────────────────────────────────────────────────────────────

const PlaylistDetail = () => {
	const { id } = useLocalSearchParams<{ id: string }>();
	const [playlist, setPlaylist] = useState<Playlist | null>(null);
	const [loading, setLoading] = useState(true);
	const [editVisible, setEditVisible] = useState(false);

	const load = useCallback(async () => {
		if (!id) return;
		setLoading(true);
		try {
			setPlaylist(await getPlaylist(id));
		} finally {
			setLoading(false);
		}
	}, [id]);

	useFocusEffect(useCallback(() => { load(); }, [load]));

	const handleRemove = useCallback(async (itemId: number, type: FavoriteType) => {
		if (!id) return;
		await removeItemFromPlaylist(id, itemId, type);
		setPlaylist((prev) =>
			prev
				? { ...prev, items: prev.items.filter((i) => !(i.item_id === itemId && i.type === type)) }
				: prev,
		);
	}, [id]);

	const handleItemPress = useCallback((item: PlaylistItem) => {
		if (item.type === "movie") router.push(`/movies/${item.item_id}`);
		else if (item.type === "tv" || item.type === "kdrama") router.push(`/tv/${item.item_id}`);
		else router.push(`/anime/${item.item_id}`);
	}, []);

	const handleEditSave = async (name: string, description: string) => {
		if (!id) return;
		await updatePlaylist(id, { name, description: description || undefined });
		setEditVisible(false);
		load();
	};

	if (loading) {
		return (
			<View style={{ flex: 1, backgroundColor: "#030014", alignItems: "center", justifyContent: "center" }}>
				<ActivityIndicator size="large" color="#ab8bff" />
			</View>
		);
	}

	if (!playlist) {
		return (
			<View style={{ flex: 1, backgroundColor: "#030014", alignItems: "center", justifyContent: "center", padding: 24 }}>
				<Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
					Playlist not found
				</Text>
				<TouchableOpacity onPress={() => router.back()}>
					<Text style={{ color: "#ab8bff", fontSize: 14 }}>Go back</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<View style={{ flex: 1, backgroundColor: "#030014" }}>
			<Image source={images.bg} style={{ position: "absolute", width: "100%" }} />

			<FlatList
				data={playlist.items}
				keyExtractor={(item) => `${item.type}-${item.item_id}`}
				renderItem={({ item }) => (
					<ItemCard
						item={item}
						onRemove={handleRemove}
						onPress={() => handleItemPress(item)}
					/>
				)}
				contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
				ListHeaderComponent={
					<>
						{/* Back + Edit header */}
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								marginTop: 52,
								marginBottom: 20,
								gap: 12,
							}}
						>
							<TouchableOpacity
								onPress={() => router.back()}
								style={{
									backgroundColor: "#1a1a2e",
									borderRadius: 20,
									paddingHorizontal: 12,
									paddingVertical: 8,
								}}
							>
								<Image source={icons.arrow} style={{ width: 16, height: 16 }} tintColor="#a8b5db" />
							</TouchableOpacity>
							<View style={{ flex: 1 }}>
								<Text style={{ color: "#fff", fontSize: 20, fontWeight: "800" }} numberOfLines={1}>
									{playlist.name}
								</Text>
								{playlist.description ? (
									<Text style={{ color: "#a8b5db", fontSize: 12, marginTop: 2 }} numberOfLines={2}>
										{playlist.description}
									</Text>
								) : null}
							</View>
							<TouchableOpacity
								onPress={() => setEditVisible(true)}
								style={{
									backgroundColor: "#ab8bff22",
									borderRadius: 20,
									paddingHorizontal: 12,
									paddingVertical: 8,
									borderWidth: 1,
									borderColor: "#ab8bff44",
								}}
							>
								<Text style={{ color: "#ab8bff", fontSize: 13, fontWeight: "700" }}>Edit</Text>
							</TouchableOpacity>
						</View>

						<Text style={{ color: "#4a4a6a", fontSize: 12, marginBottom: 14 }}>
							{playlist.items.length} / 1000 items
						</Text>

						{playlist.items.length === 0 && (
							<View style={{ alignItems: "center", marginTop: 60 }}>
								<Text style={{ fontSize: 48, marginBottom: 12 }}>🎬</Text>
								<Text style={{ color: "#a8b5db", fontSize: 15, fontWeight: "600", textAlign: "center" }}>
									This playlist is empty
								</Text>
								<Text style={{ color: "#4a4a6a", fontSize: 13, textAlign: "center", marginTop: 6 }}>
									Long-press any card and choose "Add to Playlist" to add items here
								</Text>
							</View>
						)}
					</>
				}
			/>

			<EditModal
				visible={editVisible}
				initial={{ name: playlist.name, description: playlist.description }}
				onSave={handleEditSave}
				onClose={() => setEditVisible(false)}
			/>
		</View>
	);
};

export default PlaylistDetail;
