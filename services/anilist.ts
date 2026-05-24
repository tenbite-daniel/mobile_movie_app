const ANILIST_URL = "https://graphql.anilist.co";

// Query for fetching a list of popular anime
const POPULAR_ANIME_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, sort: POPULARITY_DESC, status_in: [RELEASING, FINISHED]) {
        id
        title {
          romaji
          english
        }
        coverImage {
          large
          extraLarge
        }
        bannerImage
        averageScore
        episodes
        status
        startDate {
          year
        }
        genres
        studios(isMain: true) {
          nodes {
            name
          }
        }
      }
    }
  }
`;

// Query for searching anime by title
const SEARCH_ANIME_QUERY = `
  query ($search: String, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, search: $search) {
        id
        title {
          romaji
          english
        }
        coverImage {
          large
          extraLarge
        }
        bannerImage
        averageScore
        episodes
        status
        startDate {
          year
        }
        genres
        studios(isMain: true) {
          nodes {
            name
          }
        }
      }
    }
  }
`;

// Query for fetching a single anime by ID
const ANIME_DETAILS_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        extraLarge
        large
      }
      bannerImage
      averageScore
      meanScore
      episodes
      duration
      status
      startDate {
        year
        month
        day
      }
      endDate {
        year
      }
      genres
      description(asHtml: false)
      studios(isMain: true) {
        nodes {
          name
        }
      }
      rankings {
        rank
        type
        allTime
      }
    }
  }
`;

const HENTAI_GENRES = ["Hentai", "Ecchi"];

const filterAdultAnime = (list: Anime[]): Anime[] =>
	list.filter(
		(a) => !a.genres?.some((g) => HENTAI_GENRES.includes(g)),
	);

export const fetchPopularAnime = async (page = 1): Promise<Anime[]> => {
	const response = await fetch(ANILIST_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify({
			query: POPULAR_ANIME_QUERY,
			variables: { page, perPage: 20 },
		}),
	});

	if (!response.ok) throw new Error("Failed to fetch anime");

	const json = await response.json();

	if (json.errors) {
		throw new Error(json.errors[0]?.message || "AniList API error");
	}

	return filterAdultAnime(json.data.Page.media as Anime[]);
};

export const fetchAnimeDetails = async (id: string): Promise<AnimeDetails> => {
	const response = await fetch(ANILIST_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify({
			query: ANIME_DETAILS_QUERY,
			variables: { id: parseInt(id, 10) },
		}),
	});

	if (!response.ok) throw new Error("Failed to fetch anime details");

	const json = await response.json();

	if (json.errors) {
		throw new Error(json.errors[0]?.message || "AniList API error");
	}

	return json.data.Media as AnimeDetails;
};

export const searchAnime = async (query: string, page = 1): Promise<Anime[]> => {
	const response = await fetch(ANILIST_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify({
			query: SEARCH_ANIME_QUERY,
			variables: { search: query, page, perPage: 20 },
		}),
	});

	if (!response.ok) throw new Error("Failed to search anime");

	const json = await response.json();

	if (json.errors) {
		throw new Error(json.errors[0]?.message || "AniList API error");
	}

	return filterAdultAnime(json.data.Page.media as Anime[]);
};
