#!/usr/bin/env bash

set -o nounset
set -o errexit
set -o pipefail
set -x

export CI="true"

echo "GITHUB_TOKEN=$GITHUB_TOKEN"

yarn workspaces foreach npm publish --access restricted