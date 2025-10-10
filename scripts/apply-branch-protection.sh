#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/apply-branch-protection.sh <owner/repo> [branch]

Apply a recommended branch protection rule set to the given GitHub repository
and branch using the GitHub CLI (`gh`). The authenticated user must have admin
permissions on the repository.

Positional arguments:
  <owner/repo>  The GitHub repository identifier, e.g. winter-guardians/app
  [branch]      The branch to protect (defaults to "main")

Environment variables:
  GITHUB_TOKEN  Personal access token or fine-grained token with admin:repo or
                appropriate repository administration permissions. When set,
                the script will automatically export it so that `gh` can use it.

Branch Naming Convention:
  This script protects main/develop branches. Feature branches are validated
  automatically via GitHub Actions (validate-branch.yml) and must follow:

  Pattern: <username>/<type>-<description>

  Valid types: feature, fix, chore, refactor, docs, test, style

  Examples:
    ✓ lars/feature-dashboard
    ✓ niklas/chore-cleanup
    ✓ daniel/fix-login-bug

  PRs must target 'develop' (not 'main'). Direct pushes to 'main' are blocked.
USAGE
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "Error: invalid arguments" >&2
  usage >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI (gh) is required but not installed." >&2
  exit 1
fi

if [[ -n "${GITHUB_TOKEN:-}" ]]; then
  export GH_TOKEN="${GH_TOKEN:-$GITHUB_TOKEN}"
fi

REPO_SLUG="$1"
BRANCH="${2:-main}"

TMP_FILE=$(mktemp)
trap 'rm -f "$TMP_FILE"' EXIT

cat <<JSON >"$TMP_FILE"
{
  "required_status_checks": null,
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1,
    "require_last_push_approval": false,
    "bypass_pull_request_allowances": {
      "users": [],
      "teams": [],
      "apps": []
    }
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_linear_history": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": true
}
JSON

set +e
OUTPUT=$(gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "repos/$REPO_SLUG/branches/$BRANCH/protection" \
  --input "$TMP_FILE" 2>&1)
STATUS=$?
set -e

if [[ $STATUS -ne 0 ]]; then
  echo "$OUTPUT" >&2
  echo "Failed to apply branch protection. Ensure you have the necessary permissions and that the repository/branch exist." >&2
  exit $STATUS
fi

echo "$OUTPUT"
echo "✅ Branch protection applied to $REPO_SLUG:$BRANCH."
echo ""
echo "ℹ️  Note: Feature branches must follow naming convention:"
echo "   <username>/<type>-<description>"
echo ""
echo "   Validation is automatic via GitHub Actions (.github/workflows/validate-branch.yml)"
echo "   and pre-push hooks (.husky/pre-push)"
