#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${APP_NAME:-proposal-helper}"
REPO_URL="${REPO_URL:-https://github.com/milaotou-tools/proposal-helper.git}"
BRANCH="${BRANCH:-main}"
DEPLOY_PATH="${DEPLOY_PATH:-/www/wwwroot/proposal-helper}"
PM2_NAME="${PM2_NAME:-proposal-helper}"
APP_PORT="${APP_PORT:-3005}"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"

echo "[deploy] app=${APP_NAME} branch=${BRANCH} path=${DEPLOY_PATH} port=${APP_PORT}"

mkdir -p "$DEPLOY_PATH"
cd "$DEPLOY_PATH"
git config --global --add safe.directory "$DEPLOY_PATH" >/dev/null 2>&1 || true

if [ -n "$GITHUB_TOKEN" ]; then
  git config --global url."https://x-access-token:${GITHUB_TOKEN}@github.com/".insteadOf "https://github.com/"
fi

if [ ! -d ".git" ]; then
  if [ -n "$(ls -A . 2>/dev/null)" ]; then
    echo "[deploy] first deploy path is not empty: $DEPLOY_PATH"
    exit 1
  fi
  echo "[deploy] first deploy: cloning repository"
  git clone -b "$BRANCH" "$REPO_URL" .
else
  echo "[deploy] updating existing checkout"
  git remote set-url origin "$REPO_URL"
  git fetch origin "$BRANCH"
  git reset --hard "origin/$BRANCH"
  git clean -fd -e .user.ini
fi

echo "[deploy] installing dependencies"
NPM_CACHE_DIR="${NPM_CACHE_DIR:-$HOME/.npm-cache}"
mkdir -p "$NPM_CACHE_DIR"
export npm_config_cache="$NPM_CACHE_DIR"

if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "[deploy] building"
npm run build

# Ensure data directories exist
mkdir -p /www/wwwdata/proposal-helper/collection
mkdir -p /www/wwwdata/proposal-helper/feedback

if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  echo "[deploy] restarting pm2 process ${PM2_NAME}"
  pm2 restart "$PM2_NAME" --update-env
else
  echo "[deploy] starting pm2 process ${PM2_NAME}"
  pm2 start npx --name "$PM2_NAME" -- next start -p "$APP_PORT"
fi

pm2 save
echo "[deploy] done"
