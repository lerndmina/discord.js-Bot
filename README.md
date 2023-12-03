# A simple bot in Discord.js

## Why?

This bot was created as a personal project with multiple motivations. Primarily, it was an opportunity to learn and explore the capabilities of Discord.js, a powerful library for interacting with Discord's API. It as a practical, hands-on way to delve deeper into the world of Discord bot development and understand the intricacies involved..

Lastly, the bot integrates with OpenAI's GPT-3 API, which was another exciting aspect to explore. GPT-3, being a state-of-the-art language model, offers a wide range of possibilities, and incorporating it into the bot provided a unique opportunity to experiment with this technology.

## Installation
Clone the repository:
```
git clone https://github.com/lerndmina/discord.js-Bot.git
```

Install dependencies:
```
yarn install
```

Copy the `.env.example` file to `.env` and fill in the provided variables.

Start the bot
```
yarn start
```

## Usage
This code isn't supposed to be used by anyone else, but if you want to, you can. Just make sure to replace the environment variables with your own. I won't be providing any support for this but if you find any bugs, feel free to open an issue.

As some basic documentation, the command handler uses the `commands` folder to find commands. Each command is a separate file, and the file name is the command name. The command handler also uses the `events` folder to find events. Each event is a separate file, and the file name is the event name. This functionality is provided by [Commandkit](https://commandkit.js.org/) so read their documentation for more information.