#!/bin/bash -eu

TARGET_HOST=kddi-xr.churadata.okinawa
TARGET_PATH_BASE='~/public/'

if [ $# -ne 1 ]; then
    echo -e "Usage:\n  ${0} {TARGET}"
    exit 1
fi

echo -e "\n# Cleanup"
rm -rf dist

echo -e "\n# Build"
docker compose run --rm -e VITE_BASE_URL=./ dev-server npm run build

echo -e "\n# Deploy"
rsync -ahv --delete dist/ ${TARGET_HOST}:${TARGET_PATH_BASE}${1}

