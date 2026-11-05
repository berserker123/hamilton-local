#!/bin/bash
set -e
cd "$(dirname "$0")"
NM=/tmp/pp/node_modules
rm -rf dist && mkdir -p dist/photos
cp public/photos/*.webp dist/photos/ && cp index.html dist/ && cp public/favicon.svg dist/ && touch dist/.nojekyll
NODE_PATH=$NM $NM/.bin/esbuild src/main.tsx --bundle --minify --format=iife --loader:.css=empty --define:process.env.NODE_ENV='"production"' --outfile=dist/app.js --resolve-extensions=.tsx,.ts,.js,.json --alias:react=$NM/react --alias:react-dom=$NM/react-dom --alias:lucide-react=$NM/lucide-react
$NM/.bin/tailwindcss -c tailwind.config.js -i src/styles.css -o dist/app.css --minify
