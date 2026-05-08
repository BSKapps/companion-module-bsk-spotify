#!/bin/bash
set -e
MODULES="$HOME/Library/Application Support/companion/modules"
NAME="bsk-spotify-1.1.0"

npm run build
# Remove all old bsk-spotify versions
rm -rf "$MODULES"/bsk-spotify-*
cp -r pkg "$MODULES/$NAME"
echo "Deployed to Companion. Restart the module connection in Companion."
