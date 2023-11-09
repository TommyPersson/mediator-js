#!/usr/bin/env bash

set -o nounset
set -o errexit
set -o pipefail
set -x

export CI="true"

echo "NODE_AUTH_TOKEN=$NODE_AUTH_TOKEN"

yarn workspaces foreach \
  --exclude root \
  npm publish \
  --access restricted