#!/usr/bin/env bash

set -o nounset
set -o errexit
set -o pipefail
set -x

export CI="true"

VERSION_STR=${1-"v0.0.0"}
export VERSION=${VERSION_STR#"v"}

rm -rf packages/*/dist
rm -rf packages/*/*.tsbuildinfo

corepack enable yarn
yarn set version 3.x

yarn plugin import workspace-tools
yarn plugin import version

yarn install --immutable
yarn workspaces foreach install --immutable
yarn workspaces foreach version "${VERSION}"
yarn workspaces foreach run build
