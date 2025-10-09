#!/bin/bash
#
# sync-remotes.sh
#
# Synchronizes branches between two git remotes (NewRealm-Projects ↔ WildDragonKing)
#
# Usage:
#   ./scripts/sync-remotes.sh [branch] [direction]
#
# Examples:
#   ./scripts/sync-remotes.sh develop staging-to-origin  # NewRealm → WildDragonKing
#   ./scripts/sync-remotes.sh main staging-to-origin
#   ./scripts/sync-remotes.sh develop origin-to-staging  # WildDragonKing → NewRealm
#

set -e  # Exit on error

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Configuration
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STAGING_REMOTE="github-desktop-NewRealm-Projects"
ORIGIN_REMOTE="origin"

BRANCH="${1:-develop}"
DIRECTION="${2:-staging-to-origin}"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Colors
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Functions
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Validation
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

log_info "Validating remotes..."

# Check if remotes exist
if ! git remote | grep -q "^${STAGING_REMOTE}$"; then
    log_error "Remote '${STAGING_REMOTE}' not found!"
    exit 1
fi

if ! git remote | grep -q "^${ORIGIN_REMOTE}$"; then
    log_error "Remote '${ORIGIN_REMOTE}' not found!"
    exit 1
fi

log_success "Remotes validated"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Fetch latest changes
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

log_info "Fetching latest changes from both remotes..."

git fetch "$STAGING_REMOTE" "$BRANCH" || {
    log_error "Failed to fetch from $STAGING_REMOTE/$BRANCH"
    exit 1
}

git fetch "$ORIGIN_REMOTE" "$BRANCH" || {
    log_error "Failed to fetch from $ORIGIN_REMOTE/$BRANCH"
    exit 1
}

log_success "Fetch completed"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Show status
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
log_info "Current status:"
echo "  ${STAGING_REMOTE}/${BRANCH}: $(git rev-parse --short ${STAGING_REMOTE}/${BRANCH})"
echo "  ${ORIGIN_REMOTE}/${BRANCH}: $(git rev-parse --short ${ORIGIN_REMOTE}/${BRANCH})"
echo ""

# Check if branches are different
STAGING_SHA=$(git rev-parse "${STAGING_REMOTE}/${BRANCH}")
ORIGIN_SHA=$(git rev-parse "${ORIGIN_REMOTE}/${BRANCH}")

if [ "$STAGING_SHA" == "$ORIGIN_SHA" ]; then
    log_success "Branches are already in sync!"
    exit 0
fi

# Show commit difference
if [ "$DIRECTION" == "staging-to-origin" ]; then
    AHEAD_COUNT=$(git rev-list --count "${ORIGIN_REMOTE}/${BRANCH}..${STAGING_REMOTE}/${BRANCH}")
    BEHIND_COUNT=$(git rev-list --count "${STAGING_REMOTE}/${BRANCH}..${ORIGIN_REMOTE}/${BRANCH}")

    log_info "${STAGING_REMOTE}/${BRANCH} is $AHEAD_COUNT commits ahead and $BEHIND_COUNT commits behind ${ORIGIN_REMOTE}/${BRANCH}"

    if [ "$AHEAD_COUNT" -gt 0 ]; then
        echo ""
        log_info "Commits to sync:"
        git log --oneline "${ORIGIN_REMOTE}/${BRANCH}..${STAGING_REMOTE}/${BRANCH}" | head -n 10
    fi
else
    AHEAD_COUNT=$(git rev-list --count "${STAGING_REMOTE}/${BRANCH}..${ORIGIN_REMOTE}/${BRANCH}")
    BEHIND_COUNT=$(git rev-list --count "${ORIGIN_REMOTE}/${BRANCH}..${STAGING_REMOTE}/${BRANCH}")

    log_info "${ORIGIN_REMOTE}/${BRANCH} is $AHEAD_COUNT commits ahead and $BEHIND_COUNT commits behind ${STAGING_REMOTE}/${BRANCH}"

    if [ "$AHEAD_COUNT" -gt 0 ]; then
        echo ""
        log_info "Commits to sync:"
        git log --oneline "${STAGING_REMOTE}/${BRANCH}..${ORIGIN_REMOTE}/${BRANCH}" | head -n 10
    fi
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Confirm sync
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
if [ "$DIRECTION" == "staging-to-origin" ]; then
    log_warning "About to push ${STAGING_REMOTE}/${BRANCH} → ${ORIGIN_REMOTE}/${BRANCH}"
else
    log_warning "About to push ${ORIGIN_REMOTE}/${BRANCH} → ${STAGING_REMOTE}/${BRANCH}"
fi

read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Sync cancelled"
    exit 0
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Perform sync
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

log_info "Syncing branches..."

if [ "$DIRECTION" == "staging-to-origin" ]; then
    # Push from staging to origin
    git push "$ORIGIN_REMOTE" "${STAGING_REMOTE}/${BRANCH}:${BRANCH}" || {
        log_error "Failed to push to ${ORIGIN_REMOTE}/${BRANCH}"
        exit 1
    }
else
    # Push from origin to staging
    git push "$STAGING_REMOTE" "${ORIGIN_REMOTE}/${BRANCH}:${BRANCH}" || {
        log_error "Failed to push to ${STAGING_REMOTE}/${BRANCH}"
        exit 1
    }
fi

log_success "Sync completed successfully!"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Final status
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
log_info "Final status:"
git fetch "$STAGING_REMOTE" "$BRANCH" -q
git fetch "$ORIGIN_REMOTE" "$BRANCH" -q
echo "  ${STAGING_REMOTE}/${BRANCH}: $(git rev-parse --short ${STAGING_REMOTE}/${BRANCH})"
echo "  ${ORIGIN_REMOTE}/${BRANCH}: $(git rev-parse --short ${ORIGIN_REMOTE}/${BRANCH})"
echo ""
