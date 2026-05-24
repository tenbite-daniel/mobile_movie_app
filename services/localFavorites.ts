import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    FavoriteType,
    WatchStatus,
    sbAddFavorite,
    sbAddToWatchlist,
    sbAddToWishlist,
    sbGetFavorites,
    sbGetWatchlist,
    sbGetWishlist,
    sbRemoveFavorite,
    sbRemoveFromWatchlist,
    sbRemoveFromWishlist,
} from "./supabaseService";

// Re-export types so all existing imports keep working
export type { FavoriteType, WatchStatus };

// ─── Current user reference ───────────────────────────────────────────────────
// Set by AuthContext on login, cleared on logout.
// Lets all functions access the userId without it being passed as a parameter,
// so no calling components need to change.

let _currentUserId: string | null = null;

export const setCurrentUserId = (id: string | null) => {
	_currentUserId = id;
};

// ─── User-scoped cache key helpers ───────────────────────────────────────────

const favKey      = (uid: string) => `local_favorites_${uid}`;
const listKey     = (uid: string) => `local_watchlist_${uid}`;
const recentKey   = (uid: string) => `recent_activity_${uid}`;
const wishlistKey = (uid: string) => `wishlist_${uid}`;

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface LocalFavorite {
	item_id: number;
	type: FavoriteType;
	title: string;
	poster_url: string;
	vote_average: number;
	year: string;
	saved_at: string;
}

export interface WishlistItem {
	item_id: number;
	type: FavoriteType;
	title: string;
	poster_url: string;
	vote_average: number;
	year: string;
	saved_at: string;
}

export interface WatchlistItem {
	item_id: number;
	type: FavoriteType;
	status: WatchStatus;
	title: string;
	poster_url: string;
	vote_average: number;
	year: string;
	added_at: string;
}

// ─── Sync helpers ─────────────────────────────────────────────────────────────

/**
 * Called by AuthContext after login.
 * Pulls the user's data from Supabase and writes it into the local cache.
 * This is what makes data follow the account across devices.
 */
export const syncFromSupabase = async (userId: string): Promise<void> => {
	try {
		const [sbFavs, sbList, sbWish] = await Promise.all([
			sbGetFavorites(userId),
			sbGetWatchlist(userId),
			sbGetWishlist(userId),
		]);

		const localFavs: LocalFavorite[] = sbFavs.map((f) => ({
			item_id: f.item_id,
			type: f.type,
			title: f.title,
			poster_url: f.poster_url,
			vote_average: f.vote_average,
			year: f.year,
			saved_at: f.created_at ?? new Date().toISOString(),
		}));

		const localList: WatchlistItem[] = sbList.map((w) => ({
			item_id: w.item_id,
			type: w.type,
			status: w.status,
			title: w.title,
			poster_url: w.poster_url,
			vote_average: w.vote_average,
			year: w.year,
			added_at: w.added_at ?? new Date().toISOString(),
		}));

		const localWish: WishlistItem[] = sbWish.map((w) => ({
			item_id: w.item_id,
			type: w.type,
			title: w.title,
			poster_url: w.poster_url,
			vote_average: w.vote_average,
			year: w.year,
			saved_at: w.saved_at ?? new Date().toISOString(),
		}));

		await Promise.all([
			AsyncStorage.setItem(favKey(userId), JSON.stringify(localFavs)),
			AsyncStorage.setItem(listKey(userId), JSON.stringify(localList)),
			AsyncStorage.setItem(wishlistKey(userId), JSON.stringify(localWish)),
		]);
	} catch (e) {
		// Non-fatal — app still works from whatever is already in cache
		console.warn("syncFromSupabase failed:", e);
	}
};

/**
 * Called by AuthContext on logout.
 * Removes this user's cached data so the next account starts clean.
 */
export const clearUserCache = async (userId: string): Promise<void> => {
	try {
		await Promise.all([
			AsyncStorage.removeItem(favKey(userId)),
			AsyncStorage.removeItem(listKey(userId)),
			AsyncStorage.removeItem(recentKey(userId)),
			AsyncStorage.removeItem(wishlistKey(userId)),
		]);
	} catch {}
};

// ─── Favorites ────────────────────────────────────────────────────────────────

const readFavorites = async (uid: string): Promise<LocalFavorite[]> => {
	try {
		const raw = await AsyncStorage.getItem(favKey(uid));
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
};

const writeFavorites = async (uid: string, items: LocalFavorite[]): Promise<void> => {
	await AsyncStorage.setItem(favKey(uid), JSON.stringify(items));
};

export const addLocalFavorite = async (
	item: Omit<LocalFavorite, "saved_at">,
): Promise<void> => {
	const uid = _currentUserId;
	if (!uid) return;

	const all = await readFavorites(uid);
	const exists = all.some((f) => f.item_id === item.item_id && f.type === item.type);
	if (exists) return;

	const newItem: LocalFavorite = { ...item, saved_at: new Date().toISOString() };
	await writeFavorites(uid, [newItem, ...all]);

	// Background sync — fire and forget, never blocks the UI
	sbAddFavorite(uid, item).catch((e) => console.warn("sbAddFavorite failed:", e));
};

export const removeLocalFavorite = async (
	itemId: number,
	type: FavoriteType,
): Promise<void> => {
	const uid = _currentUserId;
	if (!uid) return;

	const all = await readFavorites(uid);
	await writeFavorites(uid, all.filter((f) => !(f.item_id === itemId && f.type === type)));

	sbRemoveFavorite(uid, itemId, type).catch((e) =>
		console.warn("sbRemoveFavorite failed:", e),
	);
};

export const getLocalFavorites = async (
	type?: FavoriteType,
): Promise<LocalFavorite[]> => {
	const uid = _currentUserId;
	if (!uid) return [];

	const all = await readFavorites(uid);
	return type ? all.filter((f) => f.type === type) : all;
};

export const isLocalFavorite = async (
	itemId: number,
	type: FavoriteType,
): Promise<boolean> => {
	const uid = _currentUserId;
	if (!uid) return false;

	const all = await readFavorites(uid);
	return all.some((f) => f.item_id === itemId && f.type === type);
};

// ─── Wishlist (simple saved list, no status) ─────────────────────────────────

const readWishlist = async (uid: string): Promise<WishlistItem[]> => {
	try {
		const raw = await AsyncStorage.getItem(wishlistKey(uid));
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
};

const writeWishlist = async (uid: string, items: WishlistItem[]): Promise<void> => {
	await AsyncStorage.setItem(wishlistKey(uid), JSON.stringify(items));
};

export const addToWishlist = async (
	item: Omit<WishlistItem, "saved_at">,
): Promise<void> => {
	const uid = _currentUserId;
	if (!uid) return;
	const all = await readWishlist(uid);
	const exists = all.some((w) => w.item_id === item.item_id && w.type === item.type);
	if (exists) return;
	await writeWishlist(uid, [{ ...item, saved_at: new Date().toISOString() }, ...all]);

	sbAddToWishlist(uid, item).catch((e) => console.warn("sbAddToWishlist failed:", e));
};

export const removeFromWishlist = async (
	itemId: number,
	type: FavoriteType,
): Promise<void> => {
	const uid = _currentUserId;
	if (!uid) return;
	const all = await readWishlist(uid);
	await writeWishlist(uid, all.filter((w) => !(w.item_id === itemId && w.type === type)));

	sbRemoveFromWishlist(uid, itemId, type).catch((e) =>
		console.warn("sbRemoveFromWishlist failed:", e),
	);
};

export const getWishlist = async (type?: FavoriteType): Promise<WishlistItem[]> => {
	const uid = _currentUserId;
	if (!uid) return [];
	const all = await readWishlist(uid);
	return type ? all.filter((w) => w.type === type) : all;
};

export const isInWishlist = async (
	itemId: number,
	type: FavoriteType,
): Promise<boolean> => {
	const uid = _currentUserId;
	if (!uid) return false;
	const all = await readWishlist(uid);
	return all.some((w) => w.item_id === itemId && w.type === type);
};

// ─── Watchlist ────────────────────────────────────────────────────────────────

const readWatchlist = async (uid: string): Promise<WatchlistItem[]> => {
	try {
		const raw = await AsyncStorage.getItem(listKey(uid));
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
};

const writeWatchlist = async (uid: string, items: WatchlistItem[]): Promise<void> => {
	await AsyncStorage.setItem(listKey(uid), JSON.stringify(items));
};

export const addToWatchlist = async (
	item: Omit<WatchlistItem, "added_at">,
): Promise<void> => {
	const uid = _currentUserId;
	if (!uid) return;

	const all = await readWatchlist(uid);
	// Remove existing entry for same item (handles status change)
	const filtered = all.filter(
		(w) => !(w.item_id === item.item_id && w.type === item.type),
	);
	const newItem: WatchlistItem = { ...item, added_at: new Date().toISOString() };
	await writeWatchlist(uid, [newItem, ...filtered]);

	sbAddToWatchlist(uid, item).catch((e) =>
		console.warn("sbAddToWatchlist failed:", e),
	);
};

export const removeFromWatchlist = async (
	itemId: number,
	type: FavoriteType,
): Promise<void> => {
	const uid = _currentUserId;
	if (!uid) return;

	const all = await readWatchlist(uid);
	await writeWatchlist(uid, all.filter((w) => !(w.item_id === itemId && w.type === type)));

	sbRemoveFromWatchlist(uid, itemId, type).catch((e) =>
		console.warn("sbRemoveFromWatchlist failed:", e),
	);
};

export const getWatchlist = async (
	status?: WatchStatus,
	type?: FavoriteType,
): Promise<WatchlistItem[]> => {
	const uid = _currentUserId;
	if (!uid) return [];

	const all = await readWatchlist(uid);
	return all.filter(
		(w) => (!status || w.status === status) && (!type || w.type === type),
	);
};

export const getWatchlistItem = async (
	itemId: number,
	type: FavoriteType,
): Promise<WatchlistItem | null> => {
	const uid = _currentUserId;
	if (!uid) return null;

	const all = await readWatchlist(uid);
	return all.find((w) => w.item_id === itemId && w.type === type) ?? null;
};

export const getWatchlistCounts = async (): Promise<Record<WatchStatus, number>> => {
	const uid = _currentUserId;
	if (!uid) {
		return { plan_to_watch: 0, watching: 0, completed: 0, on_hold: 0, dropped: 0 };
	}

	const all = await readWatchlist(uid);
	return {
		plan_to_watch: all.filter((w) => w.status === "plan_to_watch").length,
		watching:      all.filter((w) => w.status === "watching").length,
		completed:     all.filter((w) => w.status === "completed").length,
		on_hold:       all.filter((w) => w.status === "on_hold").length,
		dropped:       all.filter((w) => w.status === "dropped").length,
	};
};

// ─── Search History (local only, not synced) ──────────────────────────────────

const SEARCH_HISTORY_KEY = "search_history";
const MAX_HISTORY = 15;

export const addSearchHistory = async (query: string): Promise<void> => {
	const trimmed = query.trim();
	if (!trimmed) return;
	try {
		const raw = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
		const existing: string[] = raw ? JSON.parse(raw) : [];
		const deduped = [trimmed, ...existing.filter((q) => q !== trimmed)].slice(
			0,
			MAX_HISTORY,
		);
		await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(deduped));
	} catch {}
};

export const getSearchHistory = async (): Promise<string[]> => {
	try {
		const raw = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
};

export const removeSearchHistoryItem = async (query: string): Promise<void> => {
	try {
		const raw = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
		const existing: string[] = raw ? JSON.parse(raw) : [];
		await AsyncStorage.setItem(
			SEARCH_HISTORY_KEY,
			JSON.stringify(existing.filter((q) => q !== query)),
		);
	} catch {}
};

export const clearSearchHistory = async (): Promise<void> => {
	await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
};

// ─── Recent Activity (local only, per-user) ───────────────────────────────────

const MAX_RECENT = 10;

export interface RecentActivityItem {
	item_id: number;
	type: FavoriteType;
	title: string;
	poster_url: string;
	vote_average: number;
	year: string;
	action: "favorited" | "watchlisted";
	status?: WatchStatus;
	timestamp: string;
}

export const addRecentActivity = async (
	item: Omit<RecentActivityItem, "timestamp">,
): Promise<void> => {
	const uid = _currentUserId;
	if (!uid) return;
	try {
		const raw = await AsyncStorage.getItem(recentKey(uid));
		const existing: RecentActivityItem[] = raw ? JSON.parse(raw) : [];
		// Remove same item+action duplicate
		const deduped = existing.filter(
			(a) =>
				!(
					a.item_id === item.item_id &&
					a.type === item.type &&
					a.action === item.action
				),
		);
		const updated = [
			{ ...item, timestamp: new Date().toISOString() },
			...deduped,
		].slice(0, MAX_RECENT);
		await AsyncStorage.setItem(recentKey(uid), JSON.stringify(updated));
	} catch {}
};

export const getRecentActivity = async (): Promise<RecentActivityItem[]> => {
	const uid = _currentUserId;
	if (!uid) return [];
	try {
		const raw = await AsyncStorage.getItem(recentKey(uid));
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
};
