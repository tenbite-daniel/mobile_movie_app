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

export const getTrendingMovies = async (): Promise<
	TrendingMovie[] | undefined
> => {
	try {
		const { data, error } = await supabase
			.from("search_metrics")
			.select("search_term, movie_id, title, poster_url, count")
			.order("count", { ascending: false })
			.limit(5);

		if (error) throw error;

		// Map to TrendingMovie shape
		return data.map((row) => ({
			searchTerm: row.search_term,
			movie_id: row.movie_id,
			title: row.title,
			poster_url: row.poster_url,
			count: row.count,
		}));
	} catch (error) {
		console.error("getTrendingMovies error:", error);
		return undefined;
	}
};

// ─── Favorites ────────────────────────────────────────────────────────────────

export const addFavorite = async (userId: string, movie: Movie): Promise<void> => {
	await supabase.from("favorites").upsert({
		user_id: userId,
		movie_id: movie.id,
		title: movie.title,
		poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
		vote_average: movie.vote_average,
		release_date: movie.release_date,
	});
};

export const removeFavorite = async (userId: string, movieId: number): Promise<void> => {
	await supabase
		.from("favorites")
		.delete()
		.eq("user_id", userId)
		.eq("movie_id", movieId);
};

export const getFavorites = async (userId: string): Promise<TrendingMovie[]> => {
	const { data } = await supabase
		.from("favorites")
		.select("*")
		.eq("user_id", userId)
		.order("created_at", { ascending: false });
	return data ?? [];
};

export const isFavorite = async (userId: string, movieId: number): Promise<boolean> => {
	const { data } = await supabase
		.from("favorites")
		.select("id")
		.eq("user_id", userId)
		.eq("movie_id", movieId)
		.single();
	return !!data;
};

// ─── Watchlist ────────────────────────────────────────────────────────────────

export const addToWatchlist = async (userId: string, movie: Movie): Promise<void> => {
	await supabase.from("watchlist").upsert({
		user_id: userId,
		movie_id: movie.id,
		title: movie.title,
		poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
		vote_average: movie.vote_average,
		release_date: movie.release_date,
	});
};

export const removeFromWatchlist = async (userId: string, movieId: number): Promise<void> => {
	await supabase
		.from("watchlist")
		.delete()
		.eq("user_id", userId)
		.eq("movie_id", movieId);
};

export const getWatchlist = async (userId: string) => {
	const { data } = await supabase
		.from("watchlist")
		.select("*")
		.eq("user_id", userId)
		.order("created_at", { ascending: false });
	return data ?? [];
};

export const isInWatchlist = async (userId: string, movieId: number): Promise<boolean> => {
	const { data } = await supabase
		.from("watchlist")
		.select("id")
		.eq("user_id", userId)
		.eq("movie_id", movieId)
		.single();
	return !!data;
};

// ─── Watched ──────────────────────────────────────────────────────────────────

export const markAsWatched = async (userId: string, movie: Movie): Promise<void> => {
	await supabase.from("watched").upsert({
		user_id: userId,
		movie_id: movie.id,
		title: movie.title,
		poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
		vote_average: movie.vote_average,
		release_date: movie.release_date,
	});
};

export const removeFromWatched = async (userId: string, movieId: number): Promise<void> => {
	await supabase
		.from("watched")
		.delete()
		.eq("user_id", userId)
		.eq("movie_id", movieId);
};

export const getWatched = async (userId: string) => {
	const { data } = await supabase
		.from("watched")
		.select("*")
		.eq("user_id", userId)
		.order("watched_at", { ascending: false });
	return data ?? [];
};

// ─── Profile ──────────────────────────────────────────────────────────────────

export const getProfileStats = async (userId: string) => {
	const [favorites, watchlist, watched] = await Promise.all([
		supabase.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", userId),
		supabase.from("watchlist").select("id", { count: "exact", head: true }).eq("user_id", userId),
		supabase.from("watched").select("id", { count: "exact", head: true }).eq("user_id", userId),
	]);
	return {
		favorites: favorites.count ?? 0,
		watchlist: watchlist.count ?? 0,
		watched: watched.count ?? 0,
	};
};
