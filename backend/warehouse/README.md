# Warehouse (`backend/warehouse/`)

BigQuery-side artifacts for the data platform (`docs/de.phase2.md` D3, D6).
This directory ships **SQL only** — no Python or JS. DE-6 adds the mart and
DQ assertions here; this file covers DE-5's CDC layer.

## Why CDC, not dual-writes

`/api/quiz/score` writes one place: Firestore `quiz_attempts` (in-process,
behind the `QuizAttemptEvent` contract — DE-1). A dual-write from Flask
(Firestore + a BigQuery streaming insert in the same request) raises a
question with no good answer at this scale: what happens when the second
write fails after the first commits? Retrying risks a duplicate; not
retrying silently drops the row from the warehouse only — exactly the kind
of half-committed state an outbox pattern exists to avoid, and building one
here would outweigh the problem. CDC sidesteps it: the official
**Stream Firestore to BigQuery** extension tails Firestore's own write
stream and appends every change to BigQuery asynchronously. Firestore is
still the single source of truth; the warehouse is a derived, replayable
copy that can always be rebuilt from it (see "Recreate from zero" below).

## Dataset layout

| Object | Owner | Written by | Read by |
|---|---|---|---|
| `firestore_export.quiz_attempts_raw_changelog` | extension | one row per Firestore write (CREATE/UPDATE/DELETE/IMPORT), append-only, day-partitioned on `timestamp`, clustered by `document_id` | the two views below |
| `firestore_export.quiz_attempts_raw_latest` | extension | auto-generated, untyped "current state" view; kept because it's free, not otherwise used | ad-hoc debugging only |
| `firestore_export.v_quiz_attempts` | authored, `staging_quiz_attempts.sql` | JSON → typed columns, CDC dedup (latest write per `document_id` wins), deletes filtered out | DE-6's mart |

## Recreate from zero

1. Deploy the extension (config lives in `firebase.json` +
   `extensions/firestore-bigquery-export.env`, not the console):
   ```
   firebase deploy --only extensions --project aitutorproject-197c3
   ```
2. **Before importing anything**, verify partitioning came out right —
   partitioning is the one property that can never change after table
   creation, so this check can't be deferred:
   ```
   bq show --format=prettyjson firestore_export.quiz_attempts_raw_changelog
   ```
   `timePartitioning` must be `DAY` on field `timestamp`. Partitioning
   wrong → delete the dataset and redeploy now, while the table is empty
   — not later. `clustering` should also read `[document_id]` here, but
   re-check it after step 4, not just now — the import in step 3 strips
   it (see step 4 and "Design notes"), so a correct reading at this stage
   doesn't hold once you're done importing.
3. Backfill existing docs (must run AFTER the extension is active, never
   before — writes during an inactive-extension window are lost):
   ```
   npx @firebaseextensions/fs-bq-import-collection
   ```
   The CLI (`@firebaseextensions/fs-bq-import-collection` v0.1.27) asks
   14 prompts, in this order:

   |  # | Prompt | Answer |
   |---|---|---|
   |  1 | Firebase project ID | `aitutorproject-197c3` |
   |  2 | Firestore database instance ID | `(default)` |
   |  3 | BigQuery project ID | `aitutorproject-197c3` |
   |  4 | Source collection path | `quiz_attempts` |
   |  5 | Collection Group query? | `No` — top-level collection; also sets `wildcardIds`, which must match `WILDCARD_IDS=false` |
   |  6 | BigQuery dataset ID | `firestore_export` |
   |  7 | Table prefix | `quiz_attempts` |
   |  8 | Batch size | `300` (default; 152 docs = 1 batch) |
   |  9 | Dataset location | `us` — must match `DATASET_LOCATION` |
   | 10 | Multiple threads? | `No` — no-op unless the query is a collection group |
   | 11 | New optimized snapshot query script? | `No` — must match `USE_NEW_SNAPSHOT_QUERY_SYNTAX=no` |
   | 12 | Transform function URL | *(blank)* |
   | 13 | Local Firestore emulator? | `No` — `Yes` reads from an emulator and imports nothing from prod |
   | 14 | Failed-imports output path | an **absolute** path outside the repo |

   Prompt 14 is a trap: the value is passed straight to `fs.writeFile`
   with no shell involved, so `~` is never expanded — a tilde path throws
   `ENOENT` and aborts the import before the first batch is written. Give
   it a fully expanded path (e.g. `/Users/you/fs-bq-import-failures.json`).
   The file is also deleted and recreated on every run, so it only ever
   means "failures from the most recent run."
4. Restore clustering — the import silently strips it (upstream bug; see
   "Design notes" below):
   ```
   bq update --clustering_fields=document_id \
     aitutorproject-197c3:firestore_export.quiz_attempts_raw_changelog
   ```
   Re-run the `bq show` from step 2 to confirm `clustering` reads
   `[document_id]` again before continuing.
5. Create the staging view:
   ```
   bq query --use_legacy_sql=false < backend/warehouse/staging_quiz_attempts.sql
   ```

## Reconciliation (row parity)

Staging side (`backend/warehouse/reconcile_quiz_attempts.sql`):
```
bq query --use_legacy_sql=false < backend/warehouse/reconcile_quiz_attempts.sql
```

Firestore side — a server-side aggregation count, never a full-collection
stream (that read pattern is finding F4, the thing this whole effort exists
to move away from). Importing `firebase_admin_config` directly skips the
`load_dotenv()` that only `app.py` calls, so `FIREBASE_STORAGE_BUCKET`
comes up unset — load `.env` explicitly first:
```
cd backend && ./venv/bin/python -c "
from dotenv import load_dotenv; load_dotenv('../.env')
from security.firebase_admin_config import db
print(db.collection('quiz_attempts').count().get()[0][0].value)"
```

The two counts should match, or any diff should be explained (e.g. an
import still catching up) before treating the staging layer as trustworthy.

## Design notes

- **Clustering is `document_id`, not `user_id`.** `docs/de.phase2.md` §D5
  says "clustered by `user_id`" — that's imprecise for this table.
  `data` is a single opaque JSON string column; only top-level changelog
  fields (`document_id`, `document_name`, `timestamp`, `event_id`,
  `operation`, `data`) are clusterable, and `document_id` is what the
  dedup window function partitions on. `user_id` clustering happens where
  `user_id` is a real typed column: the DE-6 mart. (Flagging the wording
  nit here rather than editing de.phase2.md, per the DE-5 ticket.)
- **The import always strips clustering; restore it after, not before.**
  The import CLI's own tracker config omits a clustering field entirely
  (its source carries an upstream TODO noting the gap), and it
  reconciles the existing table against that config on every run,
  patching clustering away in the process. This isn't triggered by any
  prompt answer — it fires on any import against a clustered table,
  every time this runbook is replayed. So the fixed order is: deploy,
  verify partitioning, import, restore clustering, create views.
  Partitioning has to be right before the import because it's immutable;
  clustering can wait until after because it's just a `bq update` away.
- **`schema_version` is nullable, and staging must not filter on it.**
  Three writers reach `quiz_attempts`: `/api/quiz/score` (stamps
  `schema_version=1`, DE-1), the legacy `/api/progress/submit-quiz` route
  (authenticated by DE-2, zero current callers), and the schema seeder
  (`security/init_firestore_schema.py`, sample doc, no version stamp).
  Filtering NULLs would silently drop every pre-DE-1 attempt. The staging
  view keeps them; DE-6's mart decides what to do with unversioned rows.
  The first backfill confirms this wasn't hypothetical: 0 of 152 imported
  rows carry `schema_version`, because the newest attempt (2026-07-25)
  predates DE-1's rollout (2026-08-04) — filtering on it here would have
  dropped the entire warehouse.
- **Dataset location is `us` (multi-region), not `us-central1`.** Firestore
  runs in `nam5`, the US multi-region — colocating the dataset is the
  extension's own recommended default, and the free tier applies
  identically either way. `us-central1` is the Cloud Run region, a
  different concern; copying it here would pin the warehouse away from its
  source, and — like partitioning — location can't change after creation.
- **Percentage is extracted, not recomputed.** `calculate_percentage()`
  (`backend/features/progress/services.py`) stays the single writer of
  that value. The view mirrors it; DE-6's DQ assertions verify it's in
  `[0, 100]`.

## Follow-up (not in this ticket)

`study_sessions` gets the identical CDC treatment as a second extension
instance (`progress/routes.py` already writes that collection) — deferred
to keep DE-5 scoped to the one collection DE-1 made real.

## Cost

Streaming inserts are billed per 200 MB (~$0.01); at tens of quiz
attempts/day this is fractions of a cent/month. BigQuery storage and query
free tiers (10 GB / 1 TB) cover this scale with room to spare. See
`docs/de.phase2.md` §5 for the full account-wide breakdown — this stays at
the documented ≈$0/month.
