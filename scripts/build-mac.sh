#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."
if [[ $(uname -m) != arm64 ]]; then
  echo "Build Doc2EPUB on an Apple Silicon Mac." >&2
  exit 1
fi

stage=$(mktemp -d "${TMPDIR:-/tmp}/doc2epub.XXXXXXXX")
trap 'rm -rf "$stage"' EXIT
version=$(node -p 'require("./package.json").version')
dmg="Doc2EPUB-$version-arm64.dmg"
export CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-$PWD/src-tauri/target}"

# Use this opt-in workaround if Xcode 27 builds proc macros that dyld cannot load.
if [[ ${DOC2EPUB_USE_SDK26:-0} == 1 ]]; then
  export SDKROOT="${SDKROOT:-/Library/Developer/CommandLineTools/SDKs/MacOSX26.5.sdk}"
  [[ -d "$SDKROOT" ]] || { echo "macOS 26 SDK not found at $SDKROOT" >&2; exit 1; }
  cat > "$stage/rust-with-lld" <<'WRAPPER'
#!/bin/sh
compiler="$1"
shift
toolchain=$("$compiler" --print sysroot)
exec "$compiler" "$@" -C "link-arg=--ld-path=$toolchain/lib/rustlib/aarch64-apple-darwin/bin/gcc-ld/ld64.lld"
WRAPPER
  chmod +x "$stage/rust-with-lld"
  export RUSTC_WRAPPER="$stage/rust-with-lld"
fi

npm run tauri -- build --target aarch64-apple-darwin --bundles app
app="$CARGO_TARGET_DIR/aarch64-apple-darwin/release/bundle/macos/Doc2EPUB.app"
contents="$stage/content"
mkdir "$contents"
ditto "$app" "$contents/Doc2EPUB.app"
codesign --force --sign - "$contents/Doc2EPUB.app"
codesign --verify --strict --deep "$contents/Doc2EPUB.app"
{
  printf 'jpeg-js\n\n'
  cat node_modules/jpeg-js/LICENSE
  printf '\nJPEG decoder portions copyright 2011 notmasteryet, under the Apache License 2.0.\n\n'
  cat LICENSE
  printf '\npako\n\n'
  cat node_modules/pako/LICENSE
} > "$contents/THIRD-PARTY-LICENSES.txt"
ln -s /Applications "$contents/Applications"
hdiutil create -quiet -format UDZO -fs HFS+ -volname Doc2EPUB -srcfolder "$contents" "$stage/$dmg"
hdiutil verify "$stage/$dmg"

mkdir -p out
rm -rf out/Doc2EPUB.app
mv "$contents/Doc2EPUB.app" out/
mv -f "$stage/$dmg" "out/$dmg"
(cd out && shasum -a 256 "$dmg" > "$dmg.sha256")
