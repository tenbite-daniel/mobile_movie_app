import AnimeCard from "@/components/AnimeCard";
import MovieCard from "@/components/MovieCard";
import SearchBar from "@/components/SearchBar";
import TVShowCard from "@/components/TVShowCard";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import {
    addSearchHistory,
    clearSearchHistory,
    getSearchHistory,
    removeSearchHistoryItem,
} from "@/services/localFavorites";
import { updateSearchCount } from "@/services/supabaseService";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import RN, {
    ActivityIndicator,
    Animated,
    FlatList,
    Image,
    Modal,
    PanResponder,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// Compute card width once at module level
const SCREEN_WIDTH = RN.Dimensions.get("window").width;
const SCREEN_HEIGHT = RN.Dimensions.get("window").height;
const HORIZONTAL_PADDING = 40;
const GAP = 12;
const NUM_COLS = 3;
const CARD_WIDTH = Math.floor(
	(SCREEN_WIDTH - HORIZONTAL_PADDING - GAP * (NUM_COLS - 1)) / NUM_COLS,
);
// Sheet height — roughly 75% of screen
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.75;

type FilterType = "all" | "movies" | "tv" | "anime" | "kdrama";
type SortOption = "popularity" | "rating" | "newest" | "oldest" | "latest_update";
type StatusOption = "any" | "ongoing" | "completed" | "upcoming";

const TYPE_FILTERS: { label: string; value: FilterType }[] = [
	{ label: "All", value: "all" },
	{ label: "Movies", value: "movies" },
	{ label: "TV Shows", value: "tv" },
	{ label: "K-Dramas", value: "kdrama" },
	{ label: "Anime", value: "anime" },
];

const MOVIE_GENRES = [
	{ label: "Action", value: "28" },
	{ label: "Comedy", value: "35" },
	{ label: "Drama", value: "18" },
	{ label: "Horror", value: "27" },
	{ label: "Romance", value: "10749" },
	{ label: "Sci-Fi", value: "878" },
	{ label: "Thriller", value: "53" },
	{ label: "Animation", value: "16" },
	{ label: "Documentary", value: "99" },
	{ label: "Fantasy", value: "14" },
];

const TV_GENRES = [
	{ label: "Action", value: "10759" },
	{ label: "Comedy", value: "35" },
	{ label: "Drama", value: "18" },
	{ label: "Sci-Fi", value: "10765" },
	{ label: "Reality", value: "10764" },
	{ label: "Documentary", value: "99" },
	{ label: "Animation", value: "16" },
	{ label: "Mystery", value: "9648" },
];

const ANIME_GENRES = [
	"Action", "Adventure", "Comedy", "Drama", "Fantasy",
	"Horror", "Mecha", "Music", "Mystery", "Psychological",
	"Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller",
];

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
	{ label: "Most Popular", value: "popularity" },
	{ label: "Top Rated", value: "rating" },
	{ label: "Newest First", value: "newest" },
	{ label: "Oldest First", value: "oldest" },
	{ label: "Latest Update", value: "latest_update" },
];

const STATUS_OPTIONS: { label: string; value: StatusOption }[] = [
	{ label: "Any", value: "any" },
	{ label: "Ongoing", value: "ongoing" },
	{ label: "Completed", value: "completed" },
	{ label: "Upcoming", value: "upcoming" },
];

const YEAR_OPTIONS = ["Any", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016"];

// ─── Sort mappers ─────────────────────────────────────────────────────────────

const tmdbSort = (sort: SortOption) => {
	switch (sort) {
		case "rating": return "vote_average.desc";
		case "newest": return "primary_release_date.desc";
		case "oldest": return "primary_release_date.asc";
		case "latest_update": return "popularity.desc"; // TMDB doesn't have "updated_at" — use popularity as proxy
		default: return "popularity.desc";
	}
};

const tvSort = (sort: SortOption) => {
	switch (sort) {
		case "rating": return "vote_average.desc";
		case "newest": return "first_air_date.desc";
		case "oldest": return "first_air_date.asc";
		case "latest_update": return "popularity.desc";
		default: return "popularity.desc";
	}
};

const anilistSort = (sort: SortOption) => {
	switch (sort) {
		case "rating": return "SCORE_DESC";
		case "newest": return "START_DATE_DESC";
		case "oldest": return "START_DATE";
		case "latest_update": return "UPDATED_AT_DESC";
		default: return "POPULARITY_DESC";
	}
};

// TMDB status filter values
const tmdbMovieStatus = (status: StatusOption) => {
	switch (status) {
		case "upcoming": return "upcoming";
		case "ongoing": return "now_playing";
		default: return null;
	}
};

const tmdbTVStatus = (status: StatusOption) => {
	switch (status) {
		case "ongoing": return "0"; // in_production
		case "completed": return "5"; // ended
		case "upcoming": return "2"; // planned
		default: return null;
	}
};

const anilistStatus = (status: StatusOption) => {
	switch (status) {
		case "ongoing": return "RELEASING";
		case "completed": return "FINISHED";
		case "upcoming": return "NOT_YET_RELEASED";
		default: return null;
	}
};

// ─── Fetch functions ──────────────────────────────────────────────────────────

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_HEADERS = {
	accept: "application/json",
	Authorization: `Bearer ${process.env.EXPO_PUBLIC_MOVIE_API_KEY}`,
};
const ANILIST_URL = "https://graphql.anilist.co";

const discoverMovies = async (
	query: string, genre: string, year: string,
	sort: SortOption, status: StatusOption,
	page = 1,
): Promise<{ results: Movie[]; hasNextPage: boolean }> => {
	if (query.trim()) {
		const res = await fetch(
			`${TMDB_BASE}/search/movie?query=${encodeURIComponent(query)}&page=${page}`,
			{ headers: TMDB_HEADERS },
		);
		const data = await res.json();
		return { results: data.results ?? [], hasNextPage: page < (data.total_pages ?? 1) };
	}
	// Status-based endpoints
	const statusVal = tmdbMovieStatus(status);
	if (statusVal === "upcoming") {
		const res = await fetch(`${TMDB_BASE}/movie/upcoming?page=${page}`, { headers: TMDB_HEADERS });
		const data = await res.json();
		return { results: data.results ?? [], hasNextPage: page < (data.total_pages ?? 1) };
	}
	if (statusVal === "now_playing") {
		const res = await fetch(`${TMDB_BASE}/movie/now_playing?page=${page}`, { headers: TMDB_HEADERS });
		const data = await res.json();
		return { results: data.results ?? [], hasNextPage: page < (data.total_pages ?? 1) };
	}
	const params = new URLSearchParams({ sort_by: tmdbSort(sort), page: String(page) });
	if (genre) params.set("with_genres", genre);
	if (year && year !== "Any") params.set("primary_release_year", year);
	const res = await fetch(`${TMDB_BASE}/discover/movie?${params}`, { headers: TMDB_HEADERS });
	const data = await res.json();
	return { results: data.results ?? [], hasNextPage: page < (data.total_pages ?? 1) };
};

const discoverTV = async (
	query: string, genre: string, year: string,
	sort: SortOption, status: StatusOption,
	page = 1,
): Promise<{ results: TVShow[]; hasNextPage: boolean }> => {
	if (query.trim()) {
		const res = await fetch(
			`${TMDB_BASE}/search/tv?query=${encodeURIComponent(query)}&page=${page}`,
			{ headers: TMDB_HEADERS },
		);
		const data = await res.json();
		const all: TVShow[] = data.results ?? [];
		return {
			results: all.filter(
				(show: any) =>
					show.original_language !== "ko" &&
					!(Array.isArray(show.origin_country) && show.origin_country.includes("KR")),
			),
			hasNextPage: page < (data.total_pages ?? 1),
		};
	}
	const params = new URLSearchParams({ sort_by: tvSort(sort), page: String(page) });
	if (genre) params.set("with_genres", genre);
	if (year && year !== "Any") params.set("first_air_date_year", year);
	const tvStatusVal = tmdbTVStatus(status);
	if (tvStatusVal) params.set("with_status", tvStatusVal);
	const res = await fetch(`${TMDB_BASE}/discover/tv?${params}`, { headers: TMDB_HEADERS });
	const data = await res.json();
	return { results: data.results ?? [], hasNextPage: page < (data.total_pages ?? 1) };
};

const discoverKDrama = async (
	query: string, genre: string, year: string,
	sort: SortOption, status: StatusOption,
	page = 1,
): Promise<{ results: TVShow[]; hasNextPage: boolean }> => {
	if (query.trim()) {
		const res = await fetch(
			`${TMDB_BASE}/search/tv?query=${encodeURIComponent(query)}&page=${page}`,
			{ headers: TMDB_HEADERS },
		);
		const data = await res.json();
		const all: TVShow[] = data.results ?? [];
		return {
			results: all.filter(
				(show: any) =>
					show.original_language === "ko" ||
					(Array.isArray(show.origin_country) && show.origin_country.includes("KR")),
			),
			hasNextPage: page < (data.total_pages ?? 1),
		};
	}
	const params = new URLSearchParams({
		sort_by: tvSort(sort),
		with_origin_country: "KR",
		with_original_language: "ko",
		with_genres: genre || "18",
		page: String(page),
	});
	if (year && year !== "Any") params.set("first_air_date_year", year);
	const tvStatusVal = tmdbTVStatus(status);
	if (tvStatusVal) params.set("with_status", tvStatusVal);
	const res = await fetch(`${TMDB_BASE}/discover/tv?${params}`, { headers: TMDB_HEADERS });
	const data = await res.json();
	return { results: data.results ?? [], hasNextPage: page < (data.total_pages ?? 1) };
};

const DISCOVER_ANIME_QUERY = `
  query ($search: String, $genre: String, $year: Int, $sort: [MediaSort], $status: MediaStatus, $page: Int) {
    Page(page: $page, perPage: 20) {
      pageInfo { hasNextPage currentPage }
      media(type: ANIME, search: $search, genre: $genre, seasonYear: $year, sort: $sort, status: $status) {
        id
        title { romaji english }
        coverImage { large extraLarge }
        bannerImage
        averageScore
        episodes
        status
        startDate { year }
        genres
        studios(isMain: true) { nodes { name } }
      }
    }
  }
`;

const HENTAI_GENRES = ["Hentai", "Ecchi"];

const discoverAnime = async (
	query: string, genre: string, year: string,
	sort: SortOption, status: StatusOption,
	page = 1,
): Promise<{ results: Anime[]; hasNextPage: boolean }> => {
	const variables: Record<string, any> = { sort: [anilistSort(sort)], page };
	if (query.trim()) variables.search = query.trim();
	if (genre) variables.genre = genre;
	if (year && year !== "Any") variables.year = parseInt(year, 10);
	const animeStatus = anilistStatus(status);
	if (animeStatus) variables.status = animeStatus;

	const res = await fetch(ANILIST_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json", Accept: "application/json" },
		body: JSON.stringify({ query: DISCOVER_ANIME_QUERY, variables }),
	});
	const json = await res.json();
	if (json.errors) throw new Error(json.errors[0]?.message || "AniList error");
	const media: Anime[] = (json.data?.Page?.media ?? []).filter(
		(a: Anime) => !a.genres?.some((g) => HENTAI_GENRES.includes(g)),
	);
	return { results: media, hasNextPage: json.data?.Page?.pageInfo?.hasNextPage ?? false };
};

// ─── Relevance scoring ───────────────────────────────────────────────────────
// Scores how closely an item's title matches the search query.
// Higher = closer match. Used to sort the merged "all" results.

const scoreRelevance = (title: string, query: string): number => {
	if (!query.trim()) return 0;
	const t = title.toLowerCase();
	const q = query.toLowerCase().trim();
	if (t === q) return 100;                          // exact match
	if (t.startsWith(q)) return 90;                  // starts with query
	if (t.includes(` ${q}`)) return 80;              // word boundary match
	if (t.includes(q)) return 70;                    // substring match
	// Partial word overlap — count how many query words appear in title
	const queryWords = q.split(/\s+/);
	const matchedWords = queryWords.filter((w) => t.includes(w)).length;
	return (matchedWords / queryWords.length) * 60;  // 0–60 based on word overlap
};

const getItemTitle = (item: any): string => {
	// Movie / TV (TMDB): title or name
	if (typeof item.title === "string") return item.title;
	if (typeof item.name === "string") return item.name;
	// Anime (AniList): title.english or title.romaji
	if (item.title && typeof item.title === "object") {
		return item.title.english ?? item.title.romaji ?? "";
	}
	return "";
};

// ─── Chip ─────────────────────────────────────────────────────────────────────

const Chip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
	<TouchableOpacity
		onPress={onPress}
		className={`px-3 py-1.5 rounded-full mr-2 mb-2 ${active ? "bg-accent" : "bg-dark-200"}`}
	>
		<Text className={`text-xs font-semibold ${active ? "text-white" : "text-light-300"}`}>
			{label}
		</Text>
	</TouchableOpacity>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

const Search = () => {
	const params = useLocalSearchParams<{ filter?: string }>();

	const [searchQuery, setSearchQuery] = useState("");
	const [activeFilter, setActiveFilter] = useState<FilterType>(
		(params.filter as FilterType) ?? "all",
	);
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [selectedGenre, setSelectedGenre] = useState("");
	const [selectedYear, setSelectedYear] = useState("Any");
	const [selectedSort, setSelectedSort] = useState<SortOption>("popularity");
	const [selectedStatus, setSelectedStatus] = useState<StatusOption>("any");

	// Search history
	const [searchHistory, setSearchHistory] = useState<string[]>([]);
	const [searchFocused, setSearchFocused] = useState(false);

	// Pagination state
	const [results, setResults] = useState<any[]>([]);
	const [page, setPage] = useState(1);
	const [hasNextPage, setHasNextPage] = useState(false);
	const [loading, setLoading] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	// Load history on mount
	useEffect(() => {
		getSearchHistory().then(setSearchHistory);
	}, []);

	const handleSearchSubmit = async (query: string) => {
		const trimmed = query.trim();
		if (!trimmed) return;
		await addSearchHistory(trimmed);
		setSearchHistory(await getSearchHistory());
		setSearchFocused(false);
	};

	const handleHistorySelect = (query: string) => {
		setSearchQuery(query);
		setSearchFocused(false);
	};

	const handleRemoveHistory = async (query: string) => {
		await removeSearchHistoryItem(query);
		setSearchHistory(await getSearchHistory());
	};

	const handleClearHistory = async () => {
		await clearSearchHistory();
		setSearchHistory([]);
	};

	// Core fetch — fetches a single page and either replaces or appends results
	const fetchPage = async (pageNum: number, append: boolean) => {
		if (append) setLoadingMore(true);
		else { setLoading(true); setError(null); }

		try {
			let newResults: any[] = [];
			let nextPage = false;

			if (activeFilter === "movies") {
				const r = await discoverMovies(searchQuery, selectedGenre, selectedYear, selectedSort, selectedStatus, pageNum);
				newResults = r.results; nextPage = r.hasNextPage;
			} else if (activeFilter === "tv") {
				const r = await discoverTV(searchQuery, selectedGenre, selectedYear, selectedSort, selectedStatus, pageNum);
				newResults = r.results; nextPage = r.hasNextPage;
			} else if (activeFilter === "kdrama") {
				const r = await discoverKDrama(searchQuery, selectedGenre, selectedYear, selectedSort, selectedStatus, pageNum);
				newResults = r.results; nextPage = r.hasNextPage;
			} else if (activeFilter === "anime") {
				const r = await discoverAnime(searchQuery, selectedGenre, selectedYear, selectedSort, selectedStatus, pageNum);
				newResults = r.results; nextPage = r.hasNextPage;
			} else {
				// "all" — parallel fetch, no pagination (merge across 4 APIs)
				const [movies, tvShows, kdramas, anime] = await Promise.all([
					discoverMovies(searchQuery, selectedGenre, selectedYear, selectedSort, selectedStatus, pageNum).catch(() => ({ results: [], hasNextPage: false })),
					discoverTV(searchQuery, selectedGenre, selectedYear, selectedSort, selectedStatus, pageNum).catch(() => ({ results: [], hasNextPage: false })),
					discoverKDrama(searchQuery, selectedGenre, selectedYear, selectedSort, selectedStatus, pageNum).catch(() => ({ results: [], hasNextPage: false })),
					discoverAnime(searchQuery, selectedGenre, selectedYear, selectedSort, selectedStatus, pageNum).catch(() => ({ results: [], hasNextPage: false })),
				]);

				const taggedMovies  = movies.results.map((m) => ({ ...m, _type: "movies"  as const }));
				const taggedTV      = tvShows.results.map((t) => ({ ...t, _type: "tv"     as const }));
				const taggedKDramas = kdramas.results.map((k) => ({ ...k, _type: "kdrama" as const }));
				const taggedAnime   = anime.results.map((a)  => ({ ...a, _type: "anime"  as const }));
				nextPage = movies.hasNextPage || tvShows.hasNextPage || kdramas.hasNextPage || anime.hasNextPage;

				const all = [...taggedMovies, ...taggedTV, ...taggedKDramas, ...taggedAnime];

				if (searchQuery.trim()) {
					all.sort((a, b) => scoreRelevance(getItemTitle(b), searchQuery) - scoreRelevance(getItemTitle(a), searchQuery));
					newResults = all;
				} else {
					const merged: any[] = [];
					const maxLen = Math.max(taggedMovies.length, taggedTV.length, taggedKDramas.length, taggedAnime.length);
					for (let i = 0; i < maxLen; i++) {
						if (taggedMovies[i])  merged.push(taggedMovies[i]);
						if (taggedTV[i])      merged.push(taggedTV[i]);
						if (taggedKDramas[i]) merged.push(taggedKDramas[i]);
						if (taggedAnime[i])   merged.push(taggedAnime[i]);
					}
					newResults = merged;
				}
			}

			setResults((prev) => append ? [...prev, ...newResults] : newResults);
			setHasNextPage(nextPage);
			setPage(pageNum);
		} catch (err) {
			setError(err instanceof Error ? err : new Error("An error occurred"));
		} finally {
			setLoading(false);
			setLoadingMore(false);
		}
	};

	// Reset and refetch from page 1 whenever filters/query change
	useEffect(() => {
		setResults([]);
		setPage(1);
		setHasNextPage(false);
		const timeout = setTimeout(() => {
			fetchPage(1, false);
			if (searchQuery.trim()) handleSearchSubmit(searchQuery);
		}, 600);
		return () => clearTimeout(timeout);
	}, [searchQuery, activeFilter, selectedGenre, selectedYear, selectedSort, selectedStatus]);

	// Track search count for movies
	useEffect(() => {
		if (activeFilter === "movies" && results.length && (results[0] as Movie).title) {
			updateSearchCount(searchQuery, results[0] as Movie);
		}
	}, [results]);

	const handleLoadMore = () => {
		if (!hasNextPage || loadingMore || loading) return;
		fetchPage(page + 1, true);
	};

	// translateY must be declared before panResponder which references it
	const translateY = useRef(new Animated.Value(0)).current;

	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onPanResponderMove: (_, gs) => {
				if (gs.dy > 0) translateY.setValue(gs.dy);
			},
			onPanResponderRelease: (_, gs) => {
				if (gs.dy > 80) {
					// Dragged down enough — close
					Animated.timing(translateY, {
						toValue: SHEET_HEIGHT,
						duration: 200,
						useNativeDriver: true,
					}).start(() => {
						translateY.setValue(0);
						setShowAdvanced(false);
					});
				} else {
					// Snap back
					Animated.spring(translateY, {
						toValue: 0,
						useNativeDriver: true,
					}).start();
				}
			},
		}),
	).current;

	// Reset translateY when modal opens
	useEffect(() => {
		if (showAdvanced) translateY.setValue(0);
	}, [showAdvanced]);

	useEffect(() => {
		if (params.filter && ["movies", "tv", "kdrama", "anime"].includes(params.filter)) {
			setActiveFilter(params.filter as FilterType);
		}
	}, [params.filter]);

	const genres =
		activeFilter === "movies" ? MOVIE_GENRES.map((g) => g.label)
		: activeFilter === "tv" || activeFilter === "kdrama" ? TV_GENRES.map((g) => g.label)
		: activeFilter === "anime" ? ANIME_GENRES
		: []; // "all" — hide genre filter (too ambiguous across APIs)

	const getGenreValue = (label: string) => {
		if (activeFilter === "anime") return label;
		if (activeFilter === "all") return "";
		const list = activeFilter === "movies" ? MOVIE_GENRES : TV_GENRES;
		return list.find((g) => g.label === label)?.value ?? "";
	};

	const renderItem = ({ item }: { item: any }) => {
		// In "all" mode use the _type tag stamped during fetch.
		// In a specific tab mode use activeFilter directly.
		const effectiveType = activeFilter === "all" ? item._type : activeFilter;

		if (effectiveType === "movies") {
			if (typeof item.title !== "string") return null;
			return <MovieCard {...item} cardWidth={CARD_WIDTH} />;
		}
		if (effectiveType === "tv" || effectiveType === "kdrama") {
			if (typeof item.name !== "string") return null;
			return <TVShowCard {...item} cardWidth={CARD_WIDTH} />;
		}
		if (effectiveType === "anime") {
			if (!item?.title || typeof item.title !== "object") return null;
			return <AnimeCard {...item} cardWidth={CARD_WIDTH} />;
		}
		return null;
	};

	const getKey = (item: any) => {
		const effectiveType = activeFilter === "all" ? item._type : activeFilter;
		if (effectiveType === "movies") return `movie-${item.id}`;
		if (effectiveType === "tv")     return `tv-${item.id}`;
		if (effectiveType === "kdrama") return `kdrama-${item.id}`;
		return `anime-${item.id}`;
	};

	const placeholderLabel =
		activeFilter === "movies" ? "Search movies..."
		: activeFilter === "tv" ? "Search TV shows..."
		: activeFilter === "kdrama" ? "Search K-Dramas..."
		: activeFilter === "anime" ? "Search anime..."
		: "Search movies, shows, anime...";

	const hasActiveFilters =
		selectedGenre !== "" || selectedYear !== "Any" ||
		selectedSort !== "popularity" || selectedStatus !== "any";

	const resetFilters = () => {
		setSelectedGenre("");
		setSelectedYear("Any");
		setSelectedSort("popularity");
		setSelectedStatus("any");
	};

	return (
		<View className="flex-1 bg-primary">
			<Image source={images.bg} className="flex-1 absolute w-full z-0" resizeMode="cover" />

			<FlatList
				data={results ?? []}
				renderItem={renderItem}
				keyExtractor={getKey}
				className="px-5"
				numColumns={3}
				key={activeFilter}
				columnWrapperStyle={{ justifyContent: "flex-start", gap: GAP, marginVertical: 8 }}
				contentContainerStyle={{ paddingBottom: 40 }}
				onEndReached={handleLoadMore}
				onEndReachedThreshold={0.3}
				ListFooterComponent={
					loadingMore ? (
						<View className="py-6 items-center">
							<ActivityIndicator size="small" color="#ab8bff" />
							<Text className="text-light-300 text-xs mt-2">Loading more...</Text>
						</View>
					) : hasNextPage && results.length > 0 ? (
						<View className="py-4 items-center">
							<Text className="text-light-300 text-xs">Scroll for more</Text>
						</View>
					) : null
				}
				ListHeaderComponent={
					<>
						<View className="w-full flex-row justify-center mt-20 items-center">
							<Image source={icons.logo} className="w-12 h-10" />
						</View>

						<View className="flex-row items-center gap-x-2 my-5">
							<View className="flex-1">
								<SearchBar
									placeholder={placeholderLabel}
									value={searchQuery}
									onChangeText={(text) => {
										setSearchQuery(text);
										if (!text) setSearchFocused(true);
									}}
									onFocus={() => setSearchFocused(true)}
									onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
								/>
								{/* Search history dropdown */}
								{searchFocused && !searchQuery.trim() && searchHistory.length > 0 && (
									<View
										className="absolute left-0 right-0 bg-dark-100 rounded-2xl z-50"
										style={{
											top: 52,
											elevation: 10,
											shadowColor: "#000",
											shadowOpacity: 0.4,
											shadowRadius: 8,
											shadowOffset: { width: 0, height: 4 },
										}}
									>
										<View className="flex-row items-center justify-between px-4 pt-3 pb-2">
											<Text className="text-light-300 text-xs font-semibold uppercase tracking-widest">
												Recent Searches
											</Text>
											<TouchableOpacity onPress={handleClearHistory} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
												<Text className="text-red-400 text-xs font-semibold">Clear all</Text>
											</TouchableOpacity>
										</View>
										{searchHistory.map((q, index) => (
											<View
												key={q}
												className="flex-row items-center px-4"
												style={{ borderTopWidth: index === 0 ? 0 : 1, borderTopColor: "#1f1d3a" }}
											>
												<Image
													source={icons.search}
													className="size-4 mr-3"
													tintColor="#a8b5db"
												/>
												<TouchableOpacity
													onPress={() => handleHistorySelect(q)}
													className="flex-1 py-3"
												>
													<Text className="text-white text-sm" numberOfLines={1}>{q}</Text>
												</TouchableOpacity>
												<TouchableOpacity
													onPress={() => handleRemoveHistory(q)}
													hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
													className="pl-3 py-3"
												>
													<Text className="text-light-300 text-base">✕</Text>
												</TouchableOpacity>
											</View>
										))}
										<View className="h-2" />
									</View>
								)}
							</View>
							<TouchableOpacity
								onPress={() => setShowAdvanced(true)}
								className={`p-3 rounded-full ${hasActiveFilters ? "bg-accent" : "bg-dark-200"}`}
							>
								<Text className="text-white text-xs font-bold">⚙</Text>
							</TouchableOpacity>
						</View>

						{/* Type tabs — scrollable so all 4 fit */}
						<ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
							<View className="flex-row gap-x-2">
								{TYPE_FILTERS.map((filter) => (
									<TouchableOpacity
										key={filter.value}
										onPress={() => {
											setActiveFilter(filter.value);
											resetFilters();
										}}
										className={`px-4 py-2 rounded-full ${activeFilter === filter.value ? "bg-accent" : "bg-dark-200"}`}
									>
										<Text className={`text-sm font-semibold ${activeFilter === filter.value ? "text-white" : "text-light-300"}`}>
											{filter.label}
										</Text>
									</TouchableOpacity>
								))}
							</View>
						</ScrollView>

						{/* Active filter badges */}
						{hasActiveFilters && (
							<View className="flex-row flex-wrap gap-x-2 mb-3 items-center">
								<Text className="text-light-300 text-xs">Filters:</Text>
								{selectedGenre !== "" && (
									<View className="bg-accent/30 px-2 py-0.5 rounded-full">
										<Text className="text-accent text-xs">{selectedGenre}</Text>
									</View>
								)}
								{selectedYear !== "Any" && (
									<View className="bg-accent/30 px-2 py-0.5 rounded-full">
										<Text className="text-accent text-xs">{selectedYear}</Text>
									</View>
								)}
								{selectedSort !== "popularity" && (
									<View className="bg-accent/30 px-2 py-0.5 rounded-full">
										<Text className="text-accent text-xs">
											{SORT_OPTIONS.find((s) => s.value === selectedSort)?.label}
										</Text>
									</View>
								)}
								{selectedStatus !== "any" && (
									<View className="bg-accent/30 px-2 py-0.5 rounded-full">
										<Text className="text-accent text-xs">
											{STATUS_OPTIONS.find((s) => s.value === selectedStatus)?.label}
										</Text>
									</View>
								)}
								<TouchableOpacity onPress={resetFilters}>
									<Text className="text-red-400 text-xs font-semibold">Clear</Text>
								</TouchableOpacity>
							</View>
						)}

						{loading && <ActivityIndicator size="large" color="#0000ff" className="my-3" />}
						{error && <Text className="text-red-500 px-5 my-3">Error: {error.message}</Text>}
						{!loading && !error && searchQuery.trim() && (results?.length ?? 0) > 0 && (
							<Text className="text-xl text-white font-bold mb-2">
								Results for <Text className="text-accent">{searchQuery}</Text>
							</Text>
						)}
					</>
				}
				ListEmptyComponent={
					!loading && !error ? (
						<View className="mt-10 px-5">
							<Text className="text-center text-gray-500">
								{searchQuery.trim() ? "No results found" : placeholderLabel}
							</Text>
						</View>
					) : null
				}
			/>

			{/* Advanced Filters Modal with drag-to-dismiss */}
			<Modal
				visible={showAdvanced}
				animationType="slide"
				transparent
				onRequestClose={() => setShowAdvanced(false)}
			>
				<TouchableOpacity
					className="flex-1 justify-end"
					activeOpacity={1}
					onPress={() => setShowAdvanced(false)}
				>
					<TouchableOpacity activeOpacity={1}>
						<Animated.View
							style={{
								transform: [{ translateY }],
								backgroundColor: "#1a1a2e",
								borderTopLeftRadius: 24,
								borderTopRightRadius: 24,
								paddingHorizontal: 20,
								paddingTop: 12,
								paddingBottom: 40,
								maxHeight: SHEET_HEIGHT,
							}}
						>
							{/* Draggable handle */}
							<View {...panResponder.panHandlers} className="items-center pb-4">
								<View className="w-10 h-1.5 bg-light-300 rounded-full" />
							</View>

							<View className="flex-row items-center justify-between mb-5">
								<Text className="text-white text-lg font-bold">Advanced Filters</Text>
								<TouchableOpacity onPress={() => setShowAdvanced(false)}>
									<Text className="text-accent font-semibold">Done</Text>
								</TouchableOpacity>
							</View>

							<ScrollView showsVerticalScrollIndicator={false}>
								{/* Sort */}
								<Text className="text-light-200 text-sm font-semibold mb-3">Sort By</Text>
								<View className="flex-row flex-wrap mb-5">
									{SORT_OPTIONS.map((opt) => (
										<Chip
											key={opt.value}
											label={opt.label}
											active={selectedSort === opt.value}
											onPress={() => setSelectedSort(opt.value)}
										/>
									))}
								</View>

								{/* Status */}
								<Text className="text-light-200 text-sm font-semibold mb-3">Status</Text>
								<View className="flex-row flex-wrap mb-5">
									{STATUS_OPTIONS.map((opt) => (
										<Chip
											key={opt.value}
											label={opt.label}
											active={selectedStatus === opt.value}
											onPress={() => setSelectedStatus(opt.value)}
										/>
									))}
								</View>

								{/* Genre */}
								<Text className="text-light-200 text-sm font-semibold mb-3">Genre</Text>
								<View className="flex-row flex-wrap mb-5">
									<Chip label="Any" active={selectedGenre === ""} onPress={() => setSelectedGenre("")} />
									{genres.map((g) => (
										<Chip
											key={g}
											label={g}
											active={selectedGenre === getGenreValue(g)}
											onPress={() =>
												setSelectedGenre(selectedGenre === getGenreValue(g) ? "" : getGenreValue(g))
											}
										/>
									))}
								</View>

								{/* Year */}
								<Text className="text-light-200 text-sm font-semibold mb-3">Year</Text>
								<View className="flex-row flex-wrap mb-5">
									{YEAR_OPTIONS.map((y) => (
										<Chip
											key={y}
											label={y}
											active={selectedYear === y}
											onPress={() => setSelectedYear(y)}
										/>
									))}
								</View>

								<TouchableOpacity
									onPress={resetFilters}
									className="bg-dark-200 rounded-xl py-3 items-center mt-2 mb-4"
								>
									<Text className="text-light-300 font-semibold">Reset All Filters</Text>
								</TouchableOpacity>
							</ScrollView>
						</Animated.View>
					</TouchableOpacity>
				</TouchableOpacity>
			</Modal>
		</View>
	);
};

export default Search;
