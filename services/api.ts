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
