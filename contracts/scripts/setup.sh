#!/bin/bash

set -e
if [ -d "target" ]; then
    rm -rf "target"
fi

if [ -d "manifests" ]; then
    rm -rf "manifests"
fi

echo "sozo build && sozo inspect && sozo migrate"
sozo build && sozo inspect && sozo migrate

echo -e "\n✅ Setup finish!"

inspect_result=$(sozo inspect)
world_address=$(echo "$inspect_result" | awk '/World/ {getline; getline; print $3}')

echo -e "\n✅ Init Torii!"
torii --world $world_address --http.cors_origins "*"
