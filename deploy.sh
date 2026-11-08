#!/usr/bin/env bash
# Publish the site: bump the CSS/JS version so browsers drop cached copies, then commit and push.
set -euo pipefail
cd "$(dirname "$0")"
v=$(date +%Y%m%d%H%M%S)
sed -i '' -E "s/(styles\.css|script\.js)\?v=[A-Za-z0-9]+/\1?v=$v/g" index.html
git add -A
git commit -m "${1:-Update site}"
git push
