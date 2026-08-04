"""
strip_public_acls.py
One-time remediation for DE-2 (upload_file_to_storage no longer calls
blob.make_public(), but existing objects still carry the public ACL it set).

Iterates users/* blobs and revokes the allUsers READ grant left behind.
Does not touch storage.rules, which already restrict this path correctly —
object ACLs are evaluated independently of Security Rules, so this script
is the only way to actually close the exposure on existing objects.

Dry run by default — prints what WOULD change and writes nothing. Pass
--apply to actually strip ACLs. This runs against ~20 real users' objects
with no undo, so default-safe is the whole point.

Run from the backend/ directory:
    python3 tools/strip_public_acls.py            # dry run
    python3 tools/strip_public_acls.py --apply     # actually strip
"""

import argparse
import os
import sys

# Ensure the backend directory is on sys.path so `security.firebase_admin_config` resolves
_BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

# ── import the already-initialized Storage client — never re-initialize ──────
from security.firebase_admin_config import bucket


def _is_public(blob) -> bool:
    """True if the blob's ACL grants allUsers READ access."""
    blob.acl.reload()
    return any(entry.get("entity") == "allUsers" for entry in blob.acl)


def strip_public_acls(apply: bool) -> int:
    """
    Iterates users/* blobs, revoking any allUsers READ grant.
    Returns the number of objects stripped (or that would be, in dry run).
    """
    # Uniform bucket-level access makes object ACLs inert — check first
    # rather than iterating blobs and silently doing nothing.
    bucket.reload()
    if bucket.iam_configuration.uniform_bucket_level_access_enabled:
        print(
            "Uniform bucket-level access is enabled — object ACLs are inert. "
            "Nothing to strip; access is controlled by IAM/storage.rules instead."
        )
        return 0

    stripped = 0
    for blob in bucket.list_blobs(prefix="users/"):
        if not _is_public(blob):
            print(f"[SKIP]  {blob.name} (no public ACL)")
            continue

        if apply:
            blob.acl.all().revoke_read()
            blob.acl.save()
        print(f"[STRIP] {blob.name}")
        stripped += 1

    return stripped


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--apply", action="store_true",
        help="Actually strip ACLs. Without this flag, only prints what would change.",
    )
    args = parser.parse_args()

    if not args.apply:
        print("DRY RUN — no changes will be written. Pass --apply to strip ACLs.\n")

    count = strip_public_acls(apply=args.apply)

    verb = "Stripped" if args.apply else "Would strip"
    print(f"\n{verb} public ACL from {count} object(s) under users/.")


if __name__ == "__main__":
    main()
