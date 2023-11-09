#!/usr/bin/env bash

set -o nounset
set -o errexit
set -o pipefail
set -x

export CI="true"

yarn workspaces foreach npm publish --access restricted