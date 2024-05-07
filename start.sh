#!/bin/bash
FILE="src/Bot.ts"

# Check if bun is installed
if ! [ -x "$(command -v bun)" ]; then
  echo 'Error: bun is not installed, installing now...'
  curl -fsSL https://bun.sh/install | bash
fi

while true; do
  if [ -f $FILE ]; then
    echo "$FILE found, starting Bot..."
    echo "Bot started @ $(date)" >>restart.log
    git pull && bun install -y && npx tsx src/Bot.ts
    echo "Bot detected in a crashed or stopped state, beginning restart process..."
    echo "Bot stoped or crashed @ $(date)" >>restart.log
    echo "Restarting in 3 seconds"
    sleep 1
    echo "Restarting in 2 seconds"
    sleep 1
    echo "Restarting in 1 seconds"
    sleep 1
    echo "Restarting now"
    sleep 1
  else
    echo "$FILE not found, waiting for it..."
    sleep 5
  fi
done
