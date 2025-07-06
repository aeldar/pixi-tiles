#!/usr/bin/env sh

# This script prepares the chunks for the document PNG by using imagemagick.
# It downloads resources from the links specified in `resource-links.txt`,
# converts them to PNG format if necessary, and then generates image tiles.
# Then it processes all PNG files,
# scales them down to different zoom levels, and saves the resulting chunks
# The resources and generated PNG files are stored in the `_generated-assets/full-size` directory,
# while the resulting image tiles (chunks) are saved in the `_generated-assets/chunks` directory.
# Both directories are in .gitignore, to not track the generated files in git.
#
# The script can also move the generated assets to the public directory of the Aize app.
# The public directory is located at `apps/aize/public/assets/_2d_generated-assets`.
#
# PREREQUISITES:
#   - curl (to download resources)
#   - imagemagick (to process images)
#   - ghostscript (to convert PDF to PNG)
# USAGE:
#    To generate assets locally, run in a terminal:
#.     `./libs/tm-2d/tiled-document/mocks/scripts/prepare-mock-resources.sh`
#.   To generate assets and move them to the public directory, run:
#      `./libs/tm-2d/tiled-document/mocks/scripts/prepare-mock-resources.sh --move-to-public`

set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Define parameters
EXT="png"
TILE_SIZE="1024"
MAX_ZOOM=5

# Check if the script is run with the --move-to-public flag
IS_MOVE_TO_PUBLIC=false
if [ "${1:-}" = "--move-to-public" ]; then
  IS_MOVE_TO_PUBLIC=true
fi

# Define source and output directories relative to the script
GENERATED_ASSETS_DIR="$SCRIPT_DIR/../_generated-assets"
SRC_DIR="$GENERATED_ASSETS_DIR/full-size"
OUT_DIR="$GENERATED_ASSETS_DIR/chunks"
LINKS_FILE="$SCRIPT_DIR/resource-links.txt"
AIZE_APP_PUBLIC_DIR="$SCRIPT_DIR/../../../../../apps/aize/public/assets"
PUBLIC_SUBDIR="${AIZE_APP_PUBLIC_DIR}/_2d_generated-assets"

# Clean up the output directory before processing
rm -rf "${OUT_DIR:?}"/*

### Utils ###

# Check if required tools are available
check_tooling_availability() {
  echo "Checking for required tools..."

  if ! command -v magick >/dev/null 2>&1; then
    echo "Error: 'magick' (ImageMagick) is not installed or not in PATH. Please install ImageMagick to proceed."
    exit 1
  fi

  if ! command -v curl >/dev/null 2>&1; then
    echo "Error: 'curl' is not installed or not in PATH. Please install curl to proceed."
    exit 1
  fi

  if ! command -v gs >/dev/null 2>&1; then
    echo "Error: 'gs' (Ghostscript) is not installed or not in PATH. Please install Ghostscript to proceed."
    exit 1
  fi
}

prepare_generated_assets_dir() {
  echo "Preparing generated assets directory: $GENERATED_ASSETS_DIR"

  echo "  Removing existing $GENERATED_ASSETS_DIR"
  rm -rf "$GENERATED_ASSETS_DIR"

  echo "  Create the directory $GENERATED_ASSETS_DIR"
  mkdir -p "$GENERATED_ASSETS_DIR"

  echo "  add .gitignore to $GENERATED_ASSETS_DIR"
  echo "*" >"$GENERATED_ASSETS_DIR/.gitignore"
}

# Download resources (images and pdf) from a list of links in resource-links.txt
download_resources() {
  echo "Downloading resources from $LINKS_FILE"

  if [ ! -f "$LINKS_FILE" ]; then
    echo "  Links file not found: $LINKS_FILE"
    return 1
  fi

  mkdir -p "$SRC_DIR"

  while IFS= read -r url; do
    [ -z "$url" ] && continue
    filename=$(basename "$url")
    # Download the image to SRC_DIR using curl; skip if file already exists
    if [ ! -f "$SRC_DIR/$filename" ]; then
      echo "  Downloading $url..."
      curl -L -o "$SRC_DIR/$filename" "$url"
    else
      echo "  File $filename already exists, skipping."
    fi
  done <"$LINKS_FILE"
}

# Convert all resource files in SRC_DIR to PNG format
convert_resources_to_png() {
  echo Converting resource files to PNG

  for resource_file in "$SRC_DIR"/*; do

    # Ignore .png files
    if [ "${resource_file##*.}" = "$EXT" ]; then
      echo "  Skipping already converted PNG file: $resource_file"
      continue
    fi

    if [ -f "$resource_file" ]; then
      orig_file_name="$(basename "$resource_file")"
      new_file_name="${orig_file_name%.*}.$EXT"

      echo "  Converting $resource_file to PNG..."
      magick -density 300 -quality 100 "$resource_file" "${SRC_DIR}/${new_file_name}"
    fi
  done
}

# Prepare subdirectory for a specific name and zoom_level
prepare_subdir_for_zoom() {
  name="$1"
  zoom_level="$2"

  subdir="$OUT_DIR/$name/$zoom_level"

  mkdir -p "$subdir"

  echo "$subdir"
}

# Calculate scale factor for a given zoom_level
calculate_scale_factor() {
  zoom_level="$1"

  pow=$((MAX_ZOOM - zoom_level))
  divisor=1
  i=0
  while [ "$i" -lt "$pow" ]; do
    divisor=$((divisor * 2))
    i=$((i + 1))
  done
  echo $((100 / divisor))
}

# Prepares image tiles (chunks) for a source image and saves to a subdir
prepare_chunks_for_zoom() {
  source_image="$1"
  subdir="$2"

  magick \
    "$source_image" \
    -crop "${TILE_SIZE}x${TILE_SIZE}" \
    -set filename:tile "%[fx:page.x/${TILE_SIZE}]_%[fx:page.y/${TILE_SIZE}]" \
    +repage \
    +adjoin \
    "$subdir/tile_%[filename:tile].png"
}

# Scales the source image down by a factor of 1/2^(MAX_ZOOM - zoom_level) and saves it to the specified output path.
scale_image_for_zoom() {
  source_image="$1"
  zoom_level="$2"
  output_image="$3"

  # Calculate the scale factor as 1/(2^(MAX_ZOOM - zoom_level))
  # Note: the scale factor is calculated as a percentage, and always rounds down to the nearest integer.
  scale_factor=$(calculate_scale_factor "$zoom_level")
  echo "  Scaling image by factor $scale_factor for zoom level $zoom_level"

  magick "$source_image" -resize "$scale_factor"% "$output_image"
}

move_generated_assets_to_public_directory() {
  echo "Moving assets to public directory..."

  if [ ! -d "$AIZE_APP_PUBLIC_DIR" ]; then
    echo "Error: Aize app public directory not found: $AIZE_APP_PUBLIC_DIR"
    echo "  The files will not be moved to the public directory."
    exit 0
  fi

  [ -d "$PUBLIC_SUBDIR" ] && echo "  Removing existing ${PUBLIC_SUBDIR}..." && rm -rf "$PUBLIC_SUBDIR"

  echo "  Move generated assets to $PUBLIC_SUBDIR"
  mv "$GENERATED_ASSETS_DIR" "$PUBLIC_SUBDIR"

  echo "Assets moved to $PUBLIC_SUBDIR"
}

### RUN ###

check_tooling_availability

prepare_generated_assets_dir

download_resources

convert_resources_to_png

# Process each PNG file in a SRC_DIR
for source_img in "$SRC_DIR"/*."$EXT"; do
  [ -f "$source_img" ] || continue

  name=$(basename "$source_img" ."$EXT")

  echo "Processing source image: $source_img"

  for zoom_level in $(seq "$MAX_ZOOM" -1 0); do
    subdir=$(prepare_subdir_for_zoom "$name" "$zoom_level")
    output_image="$subdir/full.$EXT"

    scale_image_for_zoom "$source_img" "$zoom_level" "$output_image"
    prepare_chunks_for_zoom "$output_image" "$subdir"

    echo "  Prepared chunks for $name.$EXT at zoom level $zoom_level."
  done

done

echo "Chunks prepared in $OUT_DIR"

if [ "$IS_MOVE_TO_PUBLIC" = true ]; then
  move_generated_assets_to_public_directory
else
  echo "Assets are not moved to public directory. Use --move-to-public flag to move them."
fi

exit 0
