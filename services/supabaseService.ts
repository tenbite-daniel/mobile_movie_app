import { supabase } from "./supabase";

// ─── Search Metrics (Trending) ───────────────────────────────────────────────

export const updateSearchCount = async (
	query: string,
	movie: Movie,
): Promise<void> => {
	try {
		const { data: existing } = await supabase
			.from("search_metrics")
			.select("id, count")
			.eq("search_term", query)
			.single();

		if (existing) {
			await supabase
				.from("search_metrics")
				.update({ count: existing.count + 1, updated_at: new Date().toISOString() })
				.eq("id", existing.id);
		} else {
			await supabase.from("search_metrics").insert({
				search_term: query,
				movie_id: movie.id,
				title: movie.title,
				poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
				count: 1,
			});
		}
	} catch (error) {
		console.error("updateSearchCount error:", error);
	}
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type FavoriteType = "movie" | "tv" | "anime" | "kdrama";
export type WatchStatus = "plan_to_watch" | "watching" | "completed" | "on_hold" | "dropped";

export interface FavoriteItem {
	id?: number;
	user_id: string;
	item_id: number;
	type: FavoriteType;
	title: string;
	poster_url: string;
	vote_average: number;
	year: string;
	created_at?: string;
}

export interface WatchlistItem {
	id?: number;
	user_id: string;
	item_id: number;
	type: FavoriteType;
	status: WatchStatus;
	title: string;
	poster_url: string;
	vote_average: number;
	year: string;
	added_at?: string;
}

// ─── Favorites ────────────────────────────────────────────────────────────────

export const sbAddFavorite = async (
	userId: string,
	item: Omit<FavoriteItem, "user_id" | "id" | "created_at">,
): Promise<void> => {
	await supabase.from("favorites").upsert(
		{
			user_id: userId,
			item_id: item.item_id,
			type: item.type,
			title: item.title,
			poster_url: item.poster_url,
			vote_average: item.vote_average,
			year: item.year,
		},
		{ onConflict: "user_id,item_id,type" },
	);
};

export const sbRemoveFavorite = async (
	userId: string,
	itemId: number,
	type: FavoriteType,
): Promise<void> => {
	await supabase
		.from("favorites")
		.delete()
		.eq("user_id", userId)
		.eq("item_id", itemId)
		.eq("type", type);
};

export const sbGetFavorites = async (
	userId: string,
): Promise<FavoriteItem[]> => {
	const { data } = await supabase
		.from("favorites")
		.select("*")
		.eq("user_id", userId)
		.order("created_at", { ascending: false });
	return (data as FavoriteItem[]) ?? [];
};

// ─── Watchlist ────────────────────────────────────────────────────────────────

export const sbAddToWatchlist = async (
	userId: string,
	item: Omit<WatchlistItem, "user_id" | "id" | "added_at">,
): Promise<void> => {
	await supabase.from("watchlist").upsert(
		{
			user_id: userId,
			item_id: item.item_id,
			type: item.type,
			status: item.status,
			title: item.title,
			poster_url: item.poster_url,
			vote_average: item.vote_average,
			year: item.year,
		},
		{ onConflict: "user_id,item_id,type" },
	);
};

export const sbRemoveFromWatchlist = async (
	userId: string,
	itemId: number,
	type: FavoriteType,
): Promise<void> => {
	await supabase
		.from("watchlist")
		.delete()
		.eq("user_id", userId)
		.eq("item_id", itemId)
		.eq("type", type);
};

export const sbGetWatchlist = async (
	userId: string,
): Promise<WatchlistItem[]> => {
	const { data } = await supabase
		.from("watchlist")
		.select("*")
		.eq("user_id", userId)
		.order("added_at", { ascending: false });
	return (data as WatchlistItem[]) ?? [];
};

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export interface WishlistItem {
	id?: number;
	user_id: string;
	item_id: number;
	type: FavoriteType;
	title: string;
	poster_url: string;
	vote_average: number;
	year: string;
	saved_at?: string;
}

export const sbAddToWishlist = async (
	userId: string,
	item: Omit<WishlistItem, "user_id" | "id" | "saved_at">,
): Promise<void> => {
	await supabase.from("wishlist").upsert(
		{
			user_id: userId,
			item_id: item.item_id,
			type: item.type,
			title: item.title,
			poster_url: item.poster_url,
			vote_average: item.vote_average,
			year: item.year,
		},
		{ onConflict: "user_id,item_id,type" },
	);
};

export const sbRemoveFromWishlist = async (
	userId: string,
	itemId: number,
	type: FavoriteType,
): Promise<void> => {
	await supabase
		.from("wishlist")
		.delete()
		.eq("user_id", userId)
		.eq("item_id", itemId)
		.eq("type", type);
};

export const sbGetWishlist = async (userId: string): Promise<WishlistItem[]> => {
	const { data } = await supabase
		.from("wishlist")
		.select("*")
		.eq("user_id", userId)
		.order("saved_at", { ascending: false });
	return (data as WishlistItem[]) ?? [];
};

// ─── Playlists ────────────────────────────────────────────────────────────────

export interface SbPlaylistItem {
	item_id: number;
	type: FavoriteType;
	title: string;
	poster_url: string;
	vote_average: number;
	year: string;
	added_at: string;
}

export interface SbPlaylist {
	id: string;
	user_id: string;
	name: string;
	description?: string;
	items: SbPlaylistItem[];
	created_at: string;
	updated_at: string;
}

export const sbGetPlaylists = async (userId: string): Promise<SbPlaylist[]> => {
	const { data } = await supabase
		.from("playlists")
		.select("*")
		.eq("user_id", userId)
		.order("created_at", { ascending: false });
	return (data as SbPlaylist[]) ?? [];
};

export const sbCreatePlaylist = async (
	userId: string,
	name: string,
	description?: string,
	id?: string,
	created_at?: string,
): Promise<SbPlaylist | null> => {
	const now = new Date().toISOString();
	const { data } = await supabase
		.from("playlists")
		.insert({
			id: id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
			user_id: userId,
			name: name.trim(),
			description: description?.trim() || null,
			items: [],
			created_at: created_at ?? now,
			updated_at: now,
		})
		.select()
		.single();
	return data as SbPlaylist | null;
};

export const sbUpdatePlaylist = async (
	userId: string,
	id: string,
	updates: { name?: string; description?: string; items?: SbPlaylistItem[] },
): Promise<void> => {
	const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
	if (updates.name !== undefined) payload.name = updates.name.trim();
	if (updates.description !== undefined) payload.description = updates.description.trim() || null;
	if (updates.items !== undefined) payload.items = updates.items;
	await supabase.from("playlists").update(payload).eq("id", id).eq("user_id", userId);
};

export const sbDeletePlaylist = async (userId: string, id: string): Promise<void> => {
	await supabase.from("playlists").delete().eq("id", id).eq("user_id", userId);
};

// ─── Profile stats ────────────────────────────────────────────────────────────

export const getProfileStats = async (userId: string) => {
	const [favorites, watchlist] = await Promise.all([
		supabase
			.from("favorites")
			.select("id", { count: "exact", head: true })
			.eq("user_id", userId),
		supabase
			.from("watchlist")
			.select("id", { count: "exact", head: true })
			.eq("user_id", userId),
	]);
	return {
		favorites: favorites.count ?? 0,
		watchlist: watchlist.count ?? 0,
	};
};
