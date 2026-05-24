-- ============================================================
-- Supabase Schema for mobile_movie_app
-- ============================================================

-- ─── search_metrics ──────────────────────────────────────────
CREATE TABLE search_metrics (
  id          BIGSERIAL PRIMARY KEY,
  search_term TEXT        NOT NULL,
  movie_id    BIGINT,
  title       TEXT,
  poster_url  TEXT,
  count       INTEGER     NOT NULL DEFAULT 1,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── favorites ───────────────────────────────────────────────
CREATE TABLE favorites (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id      BIGINT      NOT NULL,
  type         TEXT        NOT NULL CHECK (type IN ('movie', 'tv', 'anime', 'kdrama')),
  title        TEXT        NOT NULL,
  poster_url   TEXT        NOT NULL,
  vote_average NUMERIC     NOT NULL,
  year         TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, item_id, type)
);

-- ─── watchlist ───────────────────────────────────────────────
CREATE TABLE watchlist (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id      BIGINT      NOT NULL,
  type         TEXT        NOT NULL CHECK (type IN ('movie', 'tv', 'anime', 'kdrama')),
  status       TEXT        NOT NULL CHECK (status IN ('plan_to_watch', 'watching', 'completed', 'on_hold', 'dropped')),
  title        TEXT        NOT NULL,
  poster_url   TEXT        NOT NULL,
  vote_average NUMERIC     NOT NULL,
  year         TEXT        NOT NULL,
  added_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, item_id, type)
);

-- ─── wishlist ────────────────────────────────────────────────
CREATE TABLE wishlist (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id      BIGINT      NOT NULL,
  type         TEXT        NOT NULL CHECK (type IN ('movie', 'tv', 'anime', 'kdrama')),
  title        TEXT        NOT NULL,
  poster_url   TEXT        NOT NULL,
  vote_average NUMERIC     NOT NULL,
  year         TEXT        NOT NULL,
  saved_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, item_id, type)
);

-- ─── playlists ───────────────────────────────────────────────
-- items is stored as a JSONB array of SbPlaylistItem objects:
-- [{ item_id, type, title, poster_url, vote_average, year, added_at }, ...]
CREATE TABLE playlists (
  id          TEXT        PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  description TEXT,
  items       JSONB       NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Row Level Security (RLS) ─────────────────────────────────
ALTER TABLE favorites     ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist     ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist      ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists     ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_metrics ENABLE ROW LEVEL SECURITY;

-- favorites
CREATE POLICY "Users manage own favorites"
  ON favorites FOR ALL USING (auth.uid() = user_id);

-- watchlist
CREATE POLICY "Users manage own watchlist"
  ON watchlist FOR ALL USING (auth.uid() = user_id);

-- wishlist
CREATE POLICY "Users manage own wishlist"
  ON wishlist FOR ALL USING (auth.uid() = user_id);

-- playlists
CREATE POLICY "Users manage own playlists"
  ON playlists FOR ALL USING (auth.uid() = user_id);

-- search_metrics: anyone can read, authenticated users can write
CREATE POLICY "Anyone can read search_metrics"
  ON search_metrics FOR SELECT USING (true);
CREATE POLICY "Authenticated users can write search_metrics"
  ON search_metrics FOR ALL USING (auth.role() = 'authenticated');
