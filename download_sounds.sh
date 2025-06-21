#!/bin/bash

# 音声ファイルをダウンロードするディレクトリ
SOUNDS_DIR="./sounds"

# 必要なディレクトリがなければ作成
mkdir -p "$SOUNDS_DIR"

# 音声ファイルのURLと保存先ファイル名のペア
declare -A SOUNDS=(
    ["card-flip.mp3"]="https://www.soundjay.com/mechanical/sounds/card-flip-01.mp3"
    ["card-match.mp3"]="https://www.soundjay.com/button/sounds/button-09a.mp3"
    ["win.mp3"]="https://www.soundjay.com/human/sounds/applause-8.mp3"
    ["bgm.mp3"]="https://www.bensound.com/bensound-music/bensound-relaxing.mp3"
)

# 各音声ファイルをダウンロード
for file in "${!SOUNDS[@]}"; do
    echo "Downloading $file..."
    curl -L "${SOUNDS[$file]}" -o "$SOUNDS_DIR/$file" --connect-timeout 30 --retry 3 --retry-delay 5
    
    # ダウンロードが成功したか確認
    if [ $? -eq 0 ]; then
        echo "Successfully downloaded $file"
    else
        echo "Failed to download $file"
    fi
done

echo "All sounds have been downloaded to $SOUNDS_DIR/"
