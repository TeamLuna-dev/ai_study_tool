-- DE-5: row-parity check — staging view count vs live Firestore count.
-- Run this, then compare against the Firestore-side count command in
-- backend/warehouse/README.md. Equal (or an explained diff) closes the
-- acceptance criterion. DE-4 later automates a daily version of this.

SELECT COUNT(*) AS staging_rows
FROM `aitutorproject-197c3.firestore_export.v_quiz_attempts`
