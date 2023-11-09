#!/usr/bin/env bash

set -o nounset
set -o errexit
set -o pipefail
set -x

export CI="true"

echo "NODE_AUTH_TOKEN=$NODE_AUTH_TOKEN"

ls -l

cat .yarnrc.yml

ls -l ~

yarn workspaces foreach npm publish \
  --access restricted