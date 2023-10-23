#!/bin/bash


# Get the directory of the script
script_dir="$(dirname "$0")"
full_script_dir="$(realpath $script_dir)"
dest="$full_script_dir/../models"
echo "Downloading models to $dest"

base_url="https://github.com/ina-foss/inaSpeechSegmenter/releases/download/models"

# Create destination folder if it does not exist
if [ ! -d "$dest" ]; then
    echo "Creating destination folder $dest"
    mkdir -p "$dest"
fi


# List of HDF5 files to download
files=(
    "keras_speech_music_noise_cnn.hdf5"
    "keras_male_female_cnn.hdf5"
    "keras_speech_music_cnn.hdf5"
)

# MD5 checksums for the files
checksums=(
    "6a5bdcfec60d24a3a504f4187e3b5b40"
    "e6665980061b8703d219b64fe7db621f"
    "c728edf23661bc250140bb0c519ed4e4"
)

# Download and verify each file
for i in "${!files[@]}"; do
    file="${files[$i]}"
    checksum="${checksums[$i]}"
    url="$base_url/$file"
    dest_file="$dest/$file"
    if [ -f "$dest_file" ]; then
        # File exists, check MD5 checksum
        if md5sum "$dest_file" | grep -q "$checksum"; then
            echo "Skipping $file (already downloaded and verified)"
            continue
        else
            echo "File $file exists but MD5 checksum does not match, downloading again"
        fi
    else
        # File does not exist, download it
        echo "Downloading $file from $url..."
    fi
    wget -O "$dest_file" "$url"
    echo "Verifying checksum for $file..."
    if md5sum "$dest_file" | grep -q "$checksum"; then
        echo "Checksum verified for $file"
    else
        echo "Checksum verification failed for $file"
        exit 1
    fi
done

echo "All files downloaded and verified successfully"