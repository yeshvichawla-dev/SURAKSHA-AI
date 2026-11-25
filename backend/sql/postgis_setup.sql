-- Optional: run AFTER the API has started once against PostgreSQL (it creates the tables).
-- Adds a PostGIS geography column + spatial index. The API does not query it yet;
-- it is ready for future "hazards within X metres of this route" queries.
CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE hazards
  ADD COLUMN IF NOT EXISTS geog geography(Point, 4326)
  GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) STORED;

CREATE INDEX IF NOT EXISTS hazards_geog_gix ON hazards USING GIST (geog);
