#!/bin/bash
# Copy Android ic_launcher.png to iOS AppIcon.appiconset and generate all required sizes
set -e
ANDROID_ICON="../android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png"
IOS_ICONSET="../ios/Underboss/Images.xcassets/AppIcon.appiconset"

if [ ! -f "$ANDROID_ICON" ]; then
  echo "Android icon not found: $ANDROID_ICON"
  exit 1
fi

cd "$(dirname "$0")"

# iOS icon sizes (px) and filenames
sizes=(
  20 2  "Icon-App-20x20@2x.png"
  20 3  "Icon-App-20x20@3x.png"
  29 2  "Icon-App-29x29@2x.png"
  29 3  "Icon-App-29x29@3x.png"
  40 2  "Icon-App-40x40@2x.png"
  40 3  "Icon-App-40x40@3x.png"
  60 2  "Icon-App-60x60@2x.png"
  60 3  "Icon-App-60x60@3x.png"
  76 1  "Icon-App-76x76@1x.png"
  76 2  "Icon-App-76x76@2x.png"
  83.5 2 "Icon-App-83.5x83.5@2x.png"
  1024 1 "Icon-App-1024x1024@1x.png"
)

for ((i=0; i<${#sizes[@]}; i+=3)); do
  size=${sizes[i]}
  scale=${sizes[i+1]}
  name=${sizes[i+2]}
  px=$(echo "$size * $scale" | bc)
  px=${px%.*}
  sips -z $px $px "$ANDROID_ICON" --out "$IOS_ICONSET/$name"
done

echo "iOS icons generated in $IOS_ICONSET."
