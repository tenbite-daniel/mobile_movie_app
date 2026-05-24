import AsyncStorage from "@react-native-async-storage/async-storage";
import { FavoriteType } from "./localFavorites";
import {
	sbCreatePlaylist,
	sbDeletePlaylist,
	sbGetPlaylists,
	sbUpdatePlaylist,
} from "./supabaseService";

export interface PlaylistItem {
	item_id: number;
	type: FavoriteType;
	title: string;
	poster_url: string;
	vote_average: number;
	year: string;
	added_at: string;
}

export interface Playlist {
	id: string;
	name: string;
	description?: string;
	created_at: string;
	updated_at: string;
	items: PlaylistItem[];
}

const MAX_ITEMS = 1000;

let _currentUserId: string | null = null;
export const setPlaylistUserId = (id: string | null) => { _currentUserId = id; };

const playlistKey = (uid: string) => `playlists_${uid}`;

const readAll = async (uid: string): Promise<Playlist[]> => {
	try {
		const raw = await AsyncStorage.getItem(playlistKey(uid));
		return raw ? JSON.parse(raw) : [];
	} catch { return []; }
};

const writeAll = async (uid: string, playlists: Playlist[]): Promise<void> => {
	await AsyncStorage.setItem(playlistKey(uid), JSON.stringify(playlists));
};

export const getPlaylists = async (): Promise<Playlist[]> => {
	const uid = _currentUserId;
	if (!uid) return [];

	// Try to fetch from Supabase and sync local cache
	try {
		const remote = await sbGetPlaylists(uid);
		if (remote.length > 0) {
			await writeAll(uid, remote as Playlist[]);
			return remote as Playlist[];
		}
	} catch { /* fall through to local */ }

	return readAll(uid);
};

export const getPlaylist = async (id: string): Promise<Playlist | null> => {
	const uid = _currentUserId;
	if (!uid) return null;
	const all = await readAll(uid);
	return all.find((p) => p.id === id) ?? null;
};

export const createPlaylist = async (name: string, description?: string): Promise<Playlist> => {
	const uid = _currentUserId!;
	const now = new Date().toISOString();
	const playlist: Playlist = {
		id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
		name: name.trim(),
		description: description?.trim() || undefined,
		created_at: now,
		updated_at: now,
		items: [],
	};

	// Persist locally
	const all = await readAll(uid);
	await writeAll(uid, [playlist, ...all]);

	// Sync to Supabase (fire-and-forget, don't block UI)
	sbCreatePlaylist(uid, playlist.name, playlist.description, playlist.id, playlist.created_at).catch(console.error);

	return playlist;
};

export const updatePlaylist = async (
	id: string,
	updates: { name?: string; description?: string },
): Promise<void> => {
	const uid = _currentUserId;
	if (!uid) return;
	const all = await readAll(uid);
	const updated = all.map((p) =>
		p.id === id
			? {
					...p,
					...(updates.name !== undefined && { name: updates.name.trim() }),
					description:
						updates.description !== undefined
							? updates.description.trim() || undefined
							: p.description,
					updated_at: new Date().toISOString(),
				}
			: p,
	);
	await writeAll(uid, updated);

	// Sync to Supabase
	sbUpdatePlaylist(uid, id, updates).catch(console.error);
};

export const deletePlaylist = async (id: string): Promise<void> => {
	const uid = _currentUserId;
	if (!uid) return;
	const all = await readAll(uid);
	await writeAll(uid, all.filter((p) => p.id !== id));

	// Sync to Supabase
	sbDeletePlaylist(uid, id).catch(console.error);
};

export const addItemToPlaylist = async (
	playlistId: string,
	item: Omit<PlaylistItem, "added_at">,
): Promise<{ success: boolean; reason?: string }> => {
	const uid = _currentUserId;
	if (!uid) return { success: false, reason: "Not signed in" };
	const all = await readAll(uid);
	const idx = all.findIndex((p) => p.id === playlistId);
	if (idx === -1) return { success: false, reason: "Playlist not found" };

	const playlist = all[idx];
	if (playlist.items.length >= MAX_ITEMS)
		return { success: false, reason: `Playlist is full (max ${MAX_ITEMS} items)` };

	const exists = playlist.items.some(
		(i) => i.item_id === item.item_id && i.type === item.type,
	);
	if (exists) return { success: false, reason: "Already in this playlist" };

	const newItems = [{ ...item, added_at: new Date().toISOString() }, ...playlist.items];
	all[idx] = { ...playlist, items: newItems, updated_at: new Date().toISOString() };
	await writeAll(uid, all);

	// Sync updated items to Supabase
	sbUpdatePlaylist(uid, playlistId, { items: newItems }).catch(console.error);

	return { success: true };
};

export const removeItemFromPlaylist = async (
	playlistId: string,
	itemId: number,
	type: FavoriteType,
): Promise<void> => {
	const uid = _currentUserId;
	if (!uid) return;
	const all = await readAll(uid);
	const idx = all.findIndex((p) => p.id === playlistId);
	if (idx === -1) return;

	const newItems = all[idx].items.filter((i) => !(i.item_id === itemId && i.type === type));
	all[idx] = { ...all[idx], items: newItems, updated_at: new Date().toISOString() };
	await writeAll(uid, all);

	// Sync updated items to Supabase
	sbUpdatePlaylist(uid, playlistId, { items: newItems }).catch(console.error);
};

export const clearPlaylistCache = async (userId: string): Promise<void> => {
	await AsyncStorage.removeItem(playlistKey(userId)).catch(() => {});
};
