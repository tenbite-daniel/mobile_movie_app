interface Movie {
  id: number;
  title: string;
  adult: boolean;
  backdrop_path: string;
  genre_ids: number[];
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string;
  release_date: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

interface MovieDetails {
  adult: boolean;
  backdrop_path: string | null;
  belongs_to_collection: {
    id: number;
    name: string;
    poster_path: string;
    backdrop_path: string;
  } | null;
  budget: number;
  genres: {
    id: number;
    name: string;
  }[];
  homepage: string | null;
  id: number;
  imdb_id: string | null;
  original_language: string;
  original_title: string;
  overview: string | null;
  popularity: number;
  poster_path: string | null;
  production_companies: {
    id: number;
    logo_path: string | null;
    name: string;
    origin_country: string;
  }[];
  production_countries: {
    iso_3166_1: string;
    name: string;
  }[];
  release_date: string;
  revenue: number;
  runtime: number | null;
  spoken_languages: {
    english_name: string;
    iso_639_1: string;
    name: string;
  }[];
  status: string;
  tagline: string | null;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
  credits?: {
    cast: CastMember[];
  };
}

interface TVShow {
  id: number;
  name: string;
  adult: boolean;
  backdrop_path: string;
  genre_ids: number[];
  original_language: string;
  original_name: string;
  overview: string;
  popularity: number;
  poster_path: string;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
}

interface TVShowDetails {
  id: number;
  name: string;
  adult: boolean;
  backdrop_path: string | null;
  first_air_date: string;
  genres: { id: number; name: string }[];
  homepage: string | null;
  number_of_episodes: number;
  number_of_seasons: number;
  overview: string | null;
  popularity: number;
  poster_path: string | null;
  status: string;
  tagline: string | null;
  vote_average: number;
  vote_count: number;
  production_companies: {
    id: number;
    logo_path: string | null;
    name: string;
    origin_country: string;
  }[];
  credits?: {
    cast: CastMember[];
  };
}

interface Anime {
  id: number;
  title: {
    romaji: string;
    english: string | null;
  };
  coverImage: {
    large: string;
    extraLarge: string;
  };
  bannerImage: string | null;
  averageScore: number | null;
  episodes: number | null;
  status: string;
  startDate: {
    year: number | null;
  };
  genres: string[];
  studios: {
    nodes: { name: string }[];
  };
}

interface AnimeDetails {
  id: number;
  title: {
    romaji: string;
    english: string | null;
    native: string | null;
  };
  coverImage: {
    extraLarge: string;
    large: string;
  };
  bannerImage: string | null;
  averageScore: number | null;
  meanScore: number | null;
  episodes: number | null;
  duration: number | null;
  status: string;
  startDate: {
    year: number | null;
    month: number | null;
    day: number | null;
  };
  endDate: {
    year: number | null;
  };
  genres: string[];
  description: string | null;
  studios: {
    nodes: { name: string }[];
  };
  rankings: {
    rank: number;
    type: string;
    allTime: boolean;
  }[];
}

interface FavoriteItem {
  id?: number;
  user_id: string;
  item_id: number;
  type: "movie" | "tv" | "anime";
  title: string;
  poster_url: string;
  vote_average: number;
  year: string;
}
