#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
git remote get-url origin >/dev/null 2>&1 || { echo 'Configure o repositório remoto origin antes de publicar.'; exit 1; }
npm run build
npx --no-install gh-pages -d dist
echo 'Publicado na branch gh-pages. No GitHub Pages, selecione gh-pages / (root).'
