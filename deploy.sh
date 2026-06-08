#!/bin/bash
# Deploy spectacles site to Cloudflare Pages
# Usage: ./deploy.sh

set -e

echo "Building..."
npm run build

echo "Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist/ --project-name=spectacles-landing

echo "Done! Site deployed to https://spectacles-landing.pages.dev"
echo "Custom domain: https://show.mathieukuntz.org (configure in Cloudflare dashboard)"