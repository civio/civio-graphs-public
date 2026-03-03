#!/usr/bin/env bash
#
# sync.sh — Sync published visualizations from civio-graphs (private)
#            into civio-graphs-public. Intended to run nightly via cron.
#
# Usage:  ./sync.sh
#
# Requires: git, rsync, and GITHUB_TOKEN env var with push access to the public repo.

set -euo pipefail

: "${GITHUB_TOKEN:?GITHUB_TOKEN is not set}"

PRIVATE_REPO="https://github.com/civio/civio-graphs.git"
PUBLIC_PUSH_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/civio/civio-graphs-public.git"
PUBLIC_REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
TMPDIR_BASE="${TMPDIR:-/tmp/}"
CLONE_DIR="$(mktemp -d "${TMPDIR_BASE}civio-graphs-sync.XXXXXX")"

cleanup() {
  rm -rf "$CLONE_DIR"
}
trap cleanup EXIT

echo "Cloning private repo into $CLONE_DIR ..."
git clone "$PRIVATE_REPO" "$CLONE_DIR"

# Collect folders that contain a .published marker file (at any depth).
published_dirs=()
while IFS= read -r marker; do
  published_dirs+=("$(dirname "$marker")")
done < <(find "$CLONE_DIR" -name .published -type f)


if [ ${#published_dirs[@]} -eq 0 ]; then
  echo "No folders with .published found. Nothing to sync."
  exit 0
fi

echo "Found ${#published_dirs[@]} published folder(s):"
for dir in "${published_dirs[@]}"; do
  echo "  ${dir#"$CLONE_DIR"/}"
done

# Remove all existing visualization folders from the public repo.
for existing in "$PUBLIC_REPO_DIR"/*/; do
  [ -d "$existing" ] || continue
  name="$(basename "$existing")"
  [[ "$name" == .* ]] && continue
  rm -rf "$existing"
done

# Copy each published folder into the public repo.
for dir in "${published_dirs[@]}"; do
  relative="${dir#"$CLONE_DIR"/}"
  echo "Copying $relative ..."
  mkdir -p "$PUBLIC_REPO_DIR/$relative"
  rsync -a --exclude='.published' "$dir/" "$PUBLIC_REPO_DIR/$relative/"
done

# Commit and push if there are changes.
cd "$PUBLIC_REPO_DIR"
git add -A
if git diff --cached --quiet; then
  echo "No changes to commit."
else
  git commit -m "Sync published visualizations ($(date -u +%Y-%m-%d))"
  git push "$PUBLIC_PUSH_URL" main
  echo "Changes pushed."
fi
