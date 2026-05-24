import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { useAuth } from "@/context/AuthContext";
import {
	Playlist,
	createPlaylist,
	deletePlaylist,
	getPlaylists,
	updatePlaylist,
} from "@/services/localPlaylists";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	FlatList,
	Image,
	Modal,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

// ─── Create / Edit modal ──────────────────────────────────────────────────────

const PlaylistFormModal = ({
	visible,
	initial,
	onSave,
	onClose,
}: {
	visible: boolean;
	initial?: { name: string; description?: string };
	onSave: (name: string, description: string) => void;
	onClose: () => void;
}) => {
	const [name, setName] = useState(initial?.name ?? "");
	const [description, setDescription] = useState(initial?.description ?? "");
	const [nameError, setNameError] = useState("");

	// Reset fields when modal opens
	React.useEffect(() => {
		if (visible) {
			setName(initial?.name ?? "");
			setDescription(initial?.description ?? "");
			setNameError("");
		}
	}, [visible]);

	const handleSave = () => {
		if (!name.trim()) {
			setNameError("Playlist name is required");
			return;
		}
		onSave(name.trim(), description.trim());
	};

	const isEdit = !!initial;

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
						{/* Handle */}
						<View style={{ alignItems: "center", marginBottom: 16 }}>
							<View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#a8b5db" }} />
						</View>

						<Text style={{ color: "#fff", fontSize: 18, fontWeight: "800", marginBottom: 20 }}>
							{isEdit ? "Edit Playlist" : "New Playlist"}
						</Text>

						{/* Name */}
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

						{/* Description */}
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
							<Text style={{ color: "#fff", fontSize: 15, fontWeight: "800" }}>
								{isEdit ? "Save Changes" : "Create Playlist"}
							</Text>
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

// ─── Playlist card ────────────────────────────────────────────────────────────

const PlaylistCard = ({
	playlist,
	onEdit,
	onDelete,
	onPress,
}: {
	playlist: Playlist;
	onEdit: (p: Playlist) => void;
	onDelete: (p: Playlist) => void;
	onPress: (p: Playlist) => void;
}) => {
	const covers = playlist.items.slice(0, 4).map((i) => i.poster_url);

	return (
		<TouchableOpacity
			onPress={() => onPress(playlist)}
			style={{
				backgroundColor: "#1a1a2e",
				borderRadius: 16,
				marginBottom: 12,
				overflow: "hidden",
				borderWidth: 1,
				borderColor: "#2a2a4a",
			}}
		>
			{/* Cover grid */}
			<View style={{ height: 100, flexDirection: "row" }}>
				{covers.length === 0 ? (
					<View
						style={{
							flex: 1,
							backgroundColor: "#0f0D23",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Text style={{ fontSize: 32 }}>🎬</Text>
					</View>
				) : covers.length < 4 ? (
					<Image
						source={{ uri: covers[0] }}
						style={{ flex: 1 }}
						resizeMode="cover"
					/>
				) : (
					<View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap" }}>
						{covers.map((uri, i) => (
							<Image
								key={i}
								source={{ uri }}
								style={{ width: "50%", height: "50%" }}
								resizeMode="cover"
							/>
						))}
					</View>
				)}
			</View>

			{/* Info row */}
			<View style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
				<View style={{ flexDirection: "row", alignItems: "center" }}>
					<View style={{ flex: 1 }}>
						<Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }} numberOfLines={1}>
							{playlist.name}
						</Text>
						{playlist.description ? (
							<Text style={{ color: "#a8b5db", fontSize: 12, marginTop: 2 }} numberOfLines={1}>
								{playlist.description}
							</Text>
						) : null}
						<Text style={{ color: "#4a4a6a", fontSize: 11, marginTop: 4 }}>
							{playlist.items.length} / 1000 items
						</Text>
					</View>
					<View style={{ flexDirection: "row", gap: 8 }}>
						<TouchableOpacity
							onPress={() => onEdit(playlist)}
							style={{
								backgroundColor: "#ab8bff22",
								borderRadius: 20,
								paddingHorizontal: 10,
								paddingVertical: 6,
								borderWidth: 1,
								borderColor: "#ab8bff44",
							}}
						>
							<Text style={{ color: "#ab8bff", fontSize: 12, fontWeight: "700" }}>Edit</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => onDelete(playlist)}
							style={{
								backgroundColor: "#f8717122",
								borderRadius: 20,
								paddingHorizontal: 10,
								paddingVertical: 6,
								borderWidth: 1,
								borderColor: "#f8717144",
							}}
						>
							<Text style={{ color: "#f87171", fontSize: 12, fontWeight: "700" }}>Delete</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</TouchableOpacity>
	);
};

// ─── Main screen ──────────────────────────────────────────────────────────────

const PlaylistsTab = () => {
	const { user } = useAuth();
	const [playlists, setPlaylists] = useState<Playlist[]>([]);
	const [loading, setLoading] = useState(false);
	const [formVisible, setFormVisible] = useState(false);
	const [editTarget, setEditTarget] = useState<Playlist | null>(null);

	const load = useCallback(async () => {
		if (!user) return;
		setLoading(true);
		try {
			setPlaylists(await getPlaylists());
		} finally {
			setLoading(false);
		}
	}, [user]);

	useFocusEffect(useCallback(() => { load(); }, [load]));

	const handleCreate = async (name: string, description: string) => {
		await createPlaylist(name, description || undefined);
		setFormVisible(false);
		load();
	};

	const handleEdit = async (name: string, description: string) => {
		if (!editTarget) return;
		await updatePlaylist(editTarget.id, { name, description: description || undefined });
		setEditTarget(null);
		load();
	};

	const handleDelete = (playlist: Playlist) => {
		Alert.alert(
			"Delete Playlist",
			`Delete "${playlist.name}"? This cannot be undone.`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						await deletePlaylist(playlist.id);
						load();
					},
				},
			],
		);
	};

	if (!user) {
		return (
			<View className="flex-1 bg-primary items-center justify-center px-8">
				<Image source={images.bg} className="absolute w-full z-0" />
				<Text className="text-4xl mb-4">🎬</Text>
				<Text className="text-white text-xl font-bold mb-2 text-center">
					Sign in to use Playlists
				</Text>
				<Text className="text-light-300 text-sm text-center mb-8">
					Create and manage custom playlists with movies, shows, anime, and more.
				</Text>
				<TouchableOpacity
					onPress={() => router.push("/(auth)/login")}
					className="bg-accent px-8 py-3 rounded-full"
				>
					<Text className="text-white font-bold text-base">Sign In</Text>
				</TouchableOpacity>
				<TouchableOpacity onPress={() => router.push("/(auth)/register")} className="mt-3">
					<Text className="text-light-300 text-sm">
						No account? <Text className="text-accent font-semibold">Sign Up</Text>
					</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<View className="bg-primary flex-1">
			<Image source={images.bg} className="absolute w-full z-0" />

			<FlatList
				data={playlists}
				keyExtractor={(p) => p.id}
				renderItem={({ item }) => (
					<PlaylistCard
						playlist={item}
						onEdit={(p) => setEditTarget(p)}
						onDelete={handleDelete}
						onPress={(p) => router.push(`/playlists/${p.id}`)}
					/>
				)}
				className="px-5"
				contentContainerStyle={{ paddingBottom: 40 }}
				ListHeaderComponent={
					<>
						<View className="w-full flex-row justify-center mt-20 mb-2 items-center">
							<Image source={icons.logo} className="w-12 h-10" />
						</View>
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "space-between",
								marginBottom: 20,
							}}
						>
							<Text className="text-white text-2xl font-bold">My Playlists</Text>
							<TouchableOpacity
								onPress={() => setFormVisible(true)}
								style={{
									backgroundColor: "#ab8bff",
									borderRadius: 20,
									paddingHorizontal: 14,
									paddingVertical: 8,
									flexDirection: "row",
									alignItems: "center",
									gap: 4,
								}}
							>
								<Text style={{ color: "#fff", fontSize: 20, lineHeight: 22 }}>+</Text>
								<Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>New</Text>
							</TouchableOpacity>
						</View>
						{loading && <ActivityIndicator size="large" color="#ab8bff" className="my-5" />}
					</>
				}
				ListEmptyComponent={
					!loading ? (
						<View className="mt-10 items-center px-4">
							<Text className="text-5xl mb-4">🎬</Text>
							<Text className="text-light-300 text-base text-center font-semibold">
								No playlists yet
							</Text>
							<Text className="text-light-300 text-sm text-center mt-2">
								Tap "+ New" to create your first playlist
							</Text>
						</View>
					) : null
				}
			/>

			{/* Create modal */}
			<PlaylistFormModal
				visible={formVisible}
				onSave={handleCreate}
				onClose={() => setFormVisible(false)}
			/>

			{/* Edit modal */}
			<PlaylistFormModal
				visible={!!editTarget}
				initial={editTarget ? { name: editTarget.name, description: editTarget.description } : undefined}
				onSave={handleEdit}
				onClose={() => setEditTarget(null)}
			/>
		</View>
	);
};

export default PlaylistsTab;
