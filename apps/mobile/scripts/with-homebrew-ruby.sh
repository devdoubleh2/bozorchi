#!/bin/sh

set -eu

pod_bin="/opt/homebrew/bin/pod"
ruby_gem_bin="/opt/homebrew/opt/ruby/bin/gem"
pod_real="$(realpath "$pod_bin")"
pod_prefix="$(cd "$(dirname "$pod_real")/.." && pwd)"
pod_gem_home="$pod_prefix/libexec"
default_gem_path="$(env -u GEM_HOME -u GEM_PATH "$ruby_gem_bin" env gempath)"
filtered_gem_path="$pod_gem_home:$(printf '%s' "$default_gem_path" | tr ':' '\n' | grep -v "^$HOME/.gem/" | paste -sd ':' -)"

exec env \
  GEM_HOME="$pod_gem_home" \
  GEM_PATH="$filtered_gem_path" \
  PATH="/opt/homebrew/bin:$PATH" \
  "$@"
