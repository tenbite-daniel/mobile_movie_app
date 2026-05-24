import WatchlistModal from "@/components/WatchlistModal";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { useAuth } from "@/context/AuthContext";
import {
	FavoriteType,
	WatchStatus,
	WishlistItem,
	addRecentActivity,
	addToWatchlist,
	getWishlist,
	removeFromWishlist,
} from "@/services/localFavorites";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Image,
	Modal,
	ScrollView,
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

const WATCH_STATUSES: { label: string; value: WatchStatus; emoji: string; color: string }[] = [
	{ label: "Plan to Watch", value: "plan_to_watch", emoji: "📋", color: "#a8b5db" },
	{ label: "Watching",      value: "watching",      emoji: "▶️",  color: "#4ade80" },
	{ label: "Completed",     value: "completed",     emoji: "✅",  color: "#ab8bff" },
	{ label: "On Hold",       value: "on_hold",       emoji: "⏸️",  color: "#facc15" },
	{ label: "Dropped",       value: "dropped",       emoji: "❌",  color: "#f87171" },
];

// ─── Bulk action sheet ────────────────────────────────────────────────────────

const BulkActionSheet = ({
	visible,
	count,
	loading,
	feedback,
	onAddToList,
	onClose,
}: {
	visible: boolean;
	count: number;
	loading: boolean;
	feedback: string | null;
	onAddToList: (status: WatchStatus) => void;
	onClose: () => void;
}) => (
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

					<Text style={{ color: "#fff", fontSize: 16, fontWeight: "800", marginBottom: 4 }}>
						Add {count} item{count !== 1 ? "s" : ""} to list…
					</Text>

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
						<ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
							{WATCH_STATUSES.map((s) => (
								<TouchableOpacity
									key={s.value}
									onPress={() => onAddToList(s.value)}
									disabled={count === 0}
									style={{
										flexDirection: "row",
										alignItems: "center",
										gap: 12,
										backgroundColor: "#1a1a2e",
										borderRadius: 14,
										paddingVertical: 14,
										paddingHorizontal: 16,
										marginBottom: 8,
										borderWidth: 1,
										borderColor: s.color + "44",
									}}
								>
									<Text style={{ fontSize: 20, width: 28, textAlign: "center" }}>{s.emoji}</Text>
									<Text style={{ color: s.color, fontSize: 15, fontWeight: "600", flex: 1 }}>
										{s.label}
									</Text>
								</TouchableOpacity>
							))}
						</ScrollView>
					)}

					<TouchableOpacity
						onPress={onClose}
						style={{ marginTop: 12, paddingVertical: 12, alignItems: "center" }}
					>
						<Text style={{ color: "#a8b5db", fontSize: 15, fontWeight: "600" }}>Cancel</Text>
					</TouchableOpacity>
				</View>
			</TouchableOpacity>
		</TouchableOpacity>
	</Modal>
);

// ─── Wishlist card ────────────────────────────────────────────────────────────

const WishlistCard = React.memo(({
	item,
	selectionMode,
	selected,
	onRemove,
	onAddToList,
	onPress,
	onLongPress,
}: {
	item: WishlistItem;
	selectionMode: boolean;
	selected: boolean;
	onRemove: (id: number, type: FavoriteType) => void;
	onAddToList: (item: WishlistItem) => void;
	onPress: () => void;
	onLongPress: () => void;
}) => {
	const typeBadge =
		item.type === "movie" ? "Movie"
		: item.type === "tv" ? "TV"
		: item.type === "kdrama" ? "K-Drama"
		: "Anime";

	return (
		<TouchableOpacity
			onPress={onPress}
			onLongPress={onLongPress}
			className="flex-row bg-dark-100 rounded-xl mb-3 overflow-hidden"
			style={{
				borderWidth: 1.5,
				borderColor: selected ? "#ab8bff" : "transparent",
			}}
		>
			{/* Selection checkbox */}
			{selectionMode && (
				<View
					style={{
						width: 44,
						alignItems: "center",
						justifyContent: "center",
						backgroundColor: selected ? "#ab8bff18" : "transparent",
					}}
				>
					<View
						style={{
							width: 22,
							height: 22,
							borderRadius: 11,
							borderWidth: 2,
							borderColor: selected ? "#ab8bff" : "#a8b5db",
							backgroundColor: selected ? "#ab8bff" : "transparent",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						{selected && (
							<Text style={{ color: "#fff", fontSize: 12, fontWeight: "800" }}>✓</Text>
						)}
					</View>
				</View>
			)}

			<Image
				source={{ uri: item.poster_url }}
				className="w-20 h-28"
				resizeMode="cover"
			/>
			<View className="flex-1 px-3 py-3 justify-between">
				<View>
					<View className="flex-row items-center gap-x-2 mb-1 flex-wrap">
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
				{!selectionMode && (
					<View className="flex-row items-center gap-x-3 mt-2">
						<TouchableOpacity
							onPress={() => onAddToList(item)}
							style={{
								backgroundColor: "#ab8bff22",
								borderRadius: 12,
								paddingHorizontal: 10,
								paddingVertical: 4,
								borderWidth: 1,
								borderColor: "#ab8bff55",
							}}
						>
							<Text style={{ color: "#ab8bff", fontSize: 11, fontWeight: "700" }}>
								＋ Add to List
							</Text>
						</TouchableOpacity>
						<TouchableOpacity onPress={() => onRemove(item.item_id, item.type)}>
							<Text className="text-red-400 text-xs font-semibold">Remove</Text>
						</TouchableOpacity>
					</View>
				)}
			</View>
		</TouchableOpacity>
	);
});

// ─── Main screen ──────────────────────────────────────────────────────────────

const WishlistTab = () => {
	const { user } = useAuth();
	const [activeType, setActiveType] = useState<TypeFilter>("all");
	const [items, setItems] = useState<WishlistItem[]>([]);
	const [loading, setLoading] = useState(false);

	// Single-item modal
	const [listModalItem, setListModalItem] = useState<WishlistItem | null>(null);

	// Multi-select state
	const [selectionMode, setSelectionMode] = useState(false);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [sheetVisible, setSheetVisible] = useState(false);
	const [bulkLoading, setBulkLoading] = useState(false);
	const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);

	const load = useCallback(async () => {
		if (!user) return;
		setLoading(true);
		try {
			const type = activeType === "all" ? undefined : activeType;
			const data = await getWishlist(type);
			setItems(data);
		} finally {
			setLoading(false);
		}
	}, [activeType, user]);

	useFocusEffect(
		useCallback(() => {
			load();
		}, [load]),
	);

	const exitSelection = useCallback(() => {
		setSelectionMode(false);
		setSelectedIds(new Set());
	}, []);

	const toggleSelect = useCallback((item: WishlistItem) => {
		const key = `${item.type}-${item.item_id}`;
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			if (next.size === 0) setSelectionMode(false);
			return next;
		});
	}, []);

	const handleCardPress = useCallback((item: WishlistItem) => {
		if (selectionMode) {
			toggleSelect(item);
		} else {
			if (item.type === "movie") router.push(`/movies/${item.item_id}`);
			else if (item.type === "tv" || item.type === "kdrama") router.push(`/tv/${item.item_id}`);
			else router.push(`/anime/${item.item_id}`);
		}
	}, [selectionMode, toggleSelect]);

	const handleLongPress = useCallback((item: WishlistItem) => {
		if (!selectionMode) {
			setSelectionMode(true);
			setSelectedIds(new Set([`${item.type}-${item.item_id}`]));
		}
	}, [selectionMode]);

	const handleRemove = useCallback(async (itemId: number, type: FavoriteType) => {
		await removeFromWishlist(itemId, type);
		setItems((prev) => prev.filter((w) => !(w.item_id === itemId && w.type === type)));
	}, []);

	const handleAddToList = useCallback((i: WishlistItem) => setListModalItem(i), []);

	const selectedItems = items.filter((i) => selectedIds.has(`${i.type}-${i.item_id}`));
	const allSelected = selectedIds.size === items.length && items.length > 0;

	const toggleSelectAll = () => {
		if (allSelected) {
			setSelectedIds(new Set());
			setSelectionMode(false);
		} else {
			setSelectedIds(new Set(items.map((i) => `${i.type}-${i.item_id}`)));
		}
	};

	const handleBulkAddToList = async (status: WatchStatus) => {
		if (!user || selectedItems.length === 0) return;
		setBulkLoading(true);
		try {
			await Promise.all(
				selectedItems.map(async (item) => {
					await addToWatchlist({ ...item, status });
					await addRecentActivity({ ...item, action: "watchlisted", status });
				}),
			);
			const label = WATCH_STATUSES.find((s) => s.value === status)?.label ?? status;
			setBulkFeedback(`${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""} added to "${label}" ✓`);
			setTimeout(() => {
				setBulkFeedback(null);
				setSheetVisible(false);
				exitSelection();
			}, 1400);
		} finally {
			setBulkLoading(false);
		}
	};

	const renderItem = useCallback(({ item }: { item: WishlistItem }) => (
		<WishlistCard
			item={item}
			selectionMode={selectionMode}
			selected={selectedIds.has(`${item.type}-${item.item_id}`)}
			onRemove={handleRemove}
			onAddToList={handleAddToList}
			onPress={() => handleCardPress(item)}
			onLongPress={() => handleLongPress(item)}
		/>
	), [selectionMode, selectedIds, handleRemove, handleAddToList, handleCardPress, handleLongPress]);

	const ListHeader = useCallback(() => (
		<>
			<View className="w-full flex-row justify-center mt-20 mb-2 items-center">
				<Image source={icons.logo} className="w-12 h-10" />
			</View>
			<Text className="text-white text-2xl font-bold mb-1">Wishlist</Text>
			<Text className="text-light-300 text-sm mb-5">
				Long-press any card to select multiple items and add them to a list at once.
			</Text>
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
								activeType === tab.value ? "text-accent" : "text-light-300"
							}`}
						>
							{tab.label}
						</Text>
					</TouchableOpacity>
				))}
			</View>
			{loading && (
				<ActivityIndicator size="large" color="#ab8bff" className="my-5" />
			)}
		</>
	), [activeType, loading]);

	if (!user) {
		return (
			<View className="flex-1 bg-primary items-center justify-center px-8">
				<Image source={images.bg} className="absolute w-full z-0" />
				<Text className="text-4xl mb-4">🔖</Text>
				<Text className="text-white text-xl font-bold mb-2 text-center">
					Sign in to use Wishlist
				</Text>
				<Text className="text-light-300 text-sm text-center mb-8">
					Save titles you want to watch and assign them to lists whenever you're ready.
				</Text>
				<TouchableOpacity
					onPress={() => router.push("/(auth)/login")}
					className="bg-accent px-8 py-3 rounded-full"
				>
					<Text className="text-white font-bold text-base">Sign In</Text>
				</TouchableOpacity>
				<TouchableOpacity onPress={() => router.push("/(auth)/register")} className="mt-3">
					<Text className="text-light-300 text-sm">
						No account?{" "}
						<Text className="text-accent font-semibold">Sign Up</Text>
					</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<View className="bg-primary flex-1">
			<Image source={images.bg} className="absolute w-full z-0" />

			<FlatList
				data={items}
				keyExtractor={(item) => `${item.type}-${item.item_id}`}
				renderItem={renderItem}
				className="px-5"
				contentContainerStyle={{ paddingBottom: 40, paddingTop: selectionMode ? 130 : 0 }}
				ListHeaderComponent={ListHeader}
				ListEmptyComponent={
					!loading ? (
						<View className="mt-10 items-center px-4">
							<Text className="text-5xl mb-4">🔖</Text>
							<Text className="text-light-300 text-base text-center font-semibold">
								Your wishlist is empty
							</Text>
							<Text className="text-light-300 text-sm text-center mt-2">
								Long-press any movie, show, or anime card, select what you want, then tap "Add to Wishlist"
							</Text>
						</View>
					) : null
				}
			/>

			{/* ── Selection top bar ── */}
			{selectionMode && (
				<View
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
						paddingHorizontal: 16,
						paddingTop: 52,
						paddingBottom: 12,
						backgroundColor: "#030014ee",
						borderBottomWidth: 1,
						borderBottomColor: "#1f1d3a",
					}}
				>
					<View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 }}>
						<TouchableOpacity
							onPress={exitSelection}
							style={{
								backgroundColor: "#1f1d3a",
								borderRadius: 20,
								paddingHorizontal: 12,
								paddingVertical: 6,
							}}
						>
							<Text style={{ color: "#a8b5db", fontSize: 13, fontWeight: "600" }}>✕ Cancel</Text>
						</TouchableOpacity>
						<Text style={{ color: "#fff", fontSize: 14, fontWeight: "700", flex: 1 }}>
							{selectedIds.size} selected
						</Text>
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

					<View style={{ flexDirection: "row", gap: 8 }}>
						<TouchableOpacity
							onPress={() => { setBulkFeedback(null); setSheetVisible(true); }}
							disabled={selectedIds.size === 0}
							style={{
								flex: 1,
								backgroundColor: selectedIds.size > 0 ? "#ab8bff" : "#ab8bff55",
								borderRadius: 30,
								paddingVertical: 12,
								alignItems: "center",
							}}
						>
							<Text style={{ color: "#fff", fontSize: 14, fontWeight: "800" }}>
								Add {selectedIds.size > 0 ? `${selectedIds.size} ` : ""}to List
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={async () => {
								await Promise.all(
									selectedItems.map((i) => removeFromWishlist(i.item_id, i.type))
								);
								setItems((prev) =>
									prev.filter((i) => !selectedIds.has(`${i.type}-${i.item_id}`))
								);
								exitSelection();
							}}
							disabled={selectedIds.size === 0}
							style={{
								flex: 1,
								backgroundColor: selectedIds.size > 0 ? "#f8717122" : "#f8717111",
								borderRadius: 30,
								paddingVertical: 12,
								alignItems: "center",
								borderWidth: 1,
								borderColor: selectedIds.size > 0 ? "#f87171" : "#f8717144",
							}}
						>
							<Text style={{ color: selectedIds.size > 0 ? "#f87171" : "#f8717166", fontSize: 14, fontWeight: "800" }}>
								Remove {selectedIds.size > 0 ? selectedIds.size : ""}
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			)}

			{/* Single-item modal */}
			{listModalItem && (
				<WatchlistModal
					visible={!!listModalItem}
					onClose={() => setListModalItem(null)}
					item={{
						item_id: listModalItem.item_id,
						type: listModalItem.type,
						title: listModalItem.title,
						poster_url: listModalItem.poster_url,
						vote_average: listModalItem.vote_average,
						year: listModalItem.year,
					}}
				/>
			)}

			{/* Bulk action sheet */}
			<BulkActionSheet
				visible={sheetVisible}
				count={selectedItems.length}
				loading={bulkLoading}
				feedback={bulkFeedback}
				onAddToList={handleBulkAddToList}
				onClose={() => setSheetVisible(false)}
			/>
		</View>
	);
};

export default WishlistTab;
