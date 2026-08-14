-- DE-5: deduplicated, typed staging view over the quiz_attempts CDC
-- changelog. Firestore stays source of truth; this view is derived.
-- Input: firestore_export.quiz_attempts_raw_changelog (extension-owned,
-- append-only, one row per write). See backend/warehouse/README.md.

CREATE OR REPLACE VIEW `aitutorproject-197c3.firestore_export.v_quiz_attempts` AS
WITH ranked AS (
  SELECT
    *,
    -- latest write per doc wins; event_id breaks exact timestamp ties
    ROW_NUMBER() OVER (
      PARTITION BY document_id
      ORDER BY timestamp DESC, event_id DESC
    ) AS rn
  FROM `aitutorproject-197c3.firestore_export.quiz_attempts_raw_changelog`
)
SELECT
  document_id                                             AS attempt_id,
  JSON_VALUE(data, '$.user_id')                           AS user_id,
  JSON_VALUE(data, '$.topic')                             AS topic,
  -- numeric fields SAFE_CAST: a malformed doc becomes NULL, never a
  -- query error — DE-6's DQ assertions are what catch that, not this view
  SAFE_CAST(JSON_VALUE(data, '$.score') AS INT64)         AS score,
  SAFE_CAST(JSON_VALUE(data, '$.total_questions') AS INT64)
                                                           AS total_questions,
  -- mirrored, not recomputed: calculate_percentage() in
  -- progress/services.py stays the single writer of this value
  SAFE_CAST(JSON_VALUE(data, '$.percentage') AS FLOAT64)  AS percentage,
  -- nullable: only the DE-1 /score path stamps this (three writers exist)
  SAFE_CAST(JSON_VALUE(data, '$.schema_version') AS INT64)
                                                           AS schema_version,
  -- event time from the payload, NOT changelog write time (TRAP B) —
  -- covers both Firestore timestamp serializations the extension has
  -- shipped: ISO-8601 string, or {_seconds,_nanoseconds} object
  COALESCE(
    SAFE.PARSE_TIMESTAMP('%Y-%m-%dT%H:%M:%E*SZ',
                          JSON_VALUE(data, '$.timestamp')),
    TIMESTAMP_SECONDS(
      SAFE_CAST(JSON_VALUE(data, '$.timestamp._seconds') AS INT64))
  )                                                        AS attempted_at,
  timestamp                                                AS last_changed_at,
  operation                                                AS last_operation
FROM ranked
WHERE rn = 1
  AND operation != 'DELETE'   -- a deleted doc yields zero rows, not a tombstone
