#!/usr/bin/env bash

set -o nounset
set -o errexit
set -o pipefail
set -x

export CI="true"

VERSION_STR=${1-v0}
export VERSION=${VERSION_STR#"v"}

rm -rf packages/*/dist
rm -rf packages/*/*.tsbuildinfo

yarn plugin import workspace-tools
yarn plugin import version

yarn install
yarn workspaces foreach install
yarn workspaces foreach version "0.2.0-SNAPSHOT-${VERSION}"
yarn workspaces foreach run build