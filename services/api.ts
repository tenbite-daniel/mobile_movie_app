const ALLOWED_BASE_URL = "https://api.themoviedb.org/3";

const validateUrl = (url: string) => {
	if (!url.startsWith(ALLOWED_BASE_URL)) {
		throw new Error(`Request blocked: URL not in allowlist`);
	}
};

export const TMDB_CONFIG = {
	BASE_URL: "https://api.themoviedb.org/3",
	API_KEY: process.env.EXPO_PUBLIC_MOVIE_API_KEY,
	headers: {
		accept: "application/json",
		Authorization: `Bearer ${process.env.EXPO_PUBLIC_MOVIE_API_KEY}`,
	},
};

export const fetchMovies = async ({ query }: { query: string }) => {
	const endpoint = query
		? `${TMDB_CONFIG.BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
		: `${TMDB_CONFIG.BASE_URL}/discover/movie?sort_by=popularity.desc`;
	validateUrl(endpoint);
	const response = await fetch(endpoint, {
		method: "GET",
		headers: TMDB_CONFIG.headers,
	});

	if (!response.ok) {
		// @ts-ignore
		throw new Error("Failed to fetch movies", response.statusText);
	}

	const data = await response.json();

	return data.results;
};

export const fetchTVShows = async ({ query }: { query: string }) => {
	const endpoint = query
		? `${TMDB_CONFIG.BASE_URL}/search/tv?query=${encodeURIComponent(query)}`
		: `${TMDB_CONFIG.BASE_URL}/discover/tv?sort_by=popularity.desc`;
	validateUrl(endpoint);
	const response = await fetch(endpoint, {
		method: "GET",
		headers: TMDB_CONFIG.headers,
	});
	if (!response.ok) throw new Error("Failed to fetch TV shows");
	const data = await response.json();
	return data.results;
};

export const fetchKDramas = async () => {
	const endpoint = `${TMDB_CONFIG.BASE_URL}/discover/tv?with_origin_country=KR&with_original_language=ko&with_genres=18&sort_by=popularity.desc`;
	validateUrl(endpoint);
	const response = await fetch(endpoint, {
		method: "GET",
		headers: TMDB_CONFIG.headers,
	});
	if (!response.ok) throw new Error("Failed to fetch K-Dramas");
	const data = await response.json();
	return data.results;
};

export const fetchMovieDetails = async (
	movieId: string,
): Promise<MovieDetails> => {
	try {
		// append_to_response fetches credits in the same call — no extra request
		const url = `${TMDB_CONFIG.BASE_URL}/movie/${movieId}?append_to_response=credits`;
		validateUrl(url);
		const response = await fetch(url, {
			method: "GET",
			headers: TMDB_CONFIG.headers,
		});
		if (!response.ok) throw new Error("Failed to fetch movie details");
		return await response.json();
	} catch (error) {
		console.log(error);
		throw error;
	}
};

export type LatestItem = {
	id: number;
	type: "movie" | "tv" | "kdrama" | "anime";
	title: string;
	poster_url: string;
	vote_average: number;
	date: string; // ISO date string for sorting
};

export const fetchLatestAll = async (): Promise<LatestItem[]> => {
	const today = new Date().toISOString().split("T")[0];

	const [moviesRes, tvRes, kdramaRes, animeRes] = await Promise.all([
		fetch(
			`${TMDB_CONFIG.BASE_URL}/discover/movie?sort_by=primary_release_date.desc&primary_release_date.lte=${today}&vote_count.gte=10`,
			{ headers: TMDB_CONFIG.headers },
		),
		fetch(
			`${TMDB_CONFIG.BASE_URL}/discover/tv?sort_by=first_air_date.desc&first_air_date.lte=${today}&vote_count.gte=10&without_origin_country=KR`,
			{ headers: TMDB_CONFIG.headers },
		),
		fetch(
			`${TMDB_CONFIG.BASE_URL}/discover/tv?with_origin_country=KR&with_original_language=ko&with_genres=18&sort_by=first_air_date.desc&first_air_date.lte=${today}`,
			{ headers: TMDB_CONFIG.headers },
		),
		fetch("https://graphql.anilist.co", {
			method: "POST",
			headers: { "Content-Type": "application/json", Accept: "application/json" },
			body: JSON.stringify({
				query: `query { Page(page:1,perPage:20) { media(type:ANIME,sort:START_DATE_DESC,status_in:[RELEASING,FINISHED]) { id title{romaji english} coverImage{large} averageScore startDate{year month day} genres } } }`,
			}),
		}),
	]);

	const [moviesData, tvData, kdramaData, animeJson] = await Promise.all([
		moviesRes.json(),
		tvRes.json(),
		kdramaRes.json(),
		animeRes.json(),
	]);

	const HENTAI = ["Hentai", "Ecchi"];

	const movies: LatestItem[] = (moviesData.results ?? []).slice(0, 20).map((m: Movie) => ({
		id: m.id,
		type: "movie",
		title: m.title,
		poster_url: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "",
		vote_average: m.vote_average,
		date: m.release_date ?? "",
	}));

	const tvShows: LatestItem[] = (tvData.results ?? []).slice(0, 20).map((t: TVShow) => ({
		id: t.id,
		type: "tv",
		title: t.name,
		poster_url: t.poster_path ? `https://image.tmdb.org/t/p/w500${t.poster_path}` : "",
		vote_average: t.vote_average,
		date: t.first_air_date ?? "",
	}));

	const kdramas: LatestItem[] = (kdramaData.results ?? []).slice(0, 20).map((t: TVShow) => ({
		id: t.id,
		type: "kdrama",
		title: t.name,
		poster_url: t.poster_path ? `https://image.tmdb.org/t/p/w500${t.poster_path}` : "",
		vote_average: t.vote_average,
		date: t.first_air_date ?? "",
	}));

	const animeList: LatestItem[] = (animeJson?.data?.Page?.media ?? [])
		.filter((a: Anime) => !a.genres?.some((g: string) => HENTAI.includes(g)))
		.slice(0, 20)
		.map((a: Anime) => {
			const { year, month, day } = a.startDate as { year: number | null; month: number | null; day: number | null };
			const date = year
				? `${year}-${String(month ?? 1).padStart(2, "0")}-${String(day ?? 1).padStart(2, "0")}`
				: "";
			return {
				id: a.id,
				type: "anime" as const,
				title: a.title?.english || a.title?.romaji || "Unknown",
				poster_url: (a.coverImage as any)?.large ?? "",
				vote_average: a.averageScore ? a.averageScore / 10 : 0,
				date,
			};
		});

	return [...movies, ...tvShows, ...kdramas, ...animeList]
		.filter((item) => item.date)
		.sort((a, b) => b.date.localeCompare(a.date))
		.slice(0, 20);
};

export const fetchTVShowDetails = async (
	tvId: string,
): Promise<TVShowDetails> => {
	try {
		const url = `${TMDB_CONFIG.BASE_URL}/tv/${tvId}?append_to_response=credits`;
		validateUrl(url);
		const response = await fetch(url, {
			method: "GET",
			headers: TMDB_CONFIG.headers,
		});
		if (!response.ok) throw new Error("Failed to fetch TV show details");
		return await response.json();
	} catch (error) {
		console.log(error);
		throw error;
	}
};
