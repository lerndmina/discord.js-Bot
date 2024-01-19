import log from "fancy-log";
import https from "https";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import Whisper from "whisper-nodejs";
import DownloadFile from "./DownloadFile";
import DeleteFile from "./DeleteFile";
import ConvertFile from "./ConvertFile";
import { Client, Message } from "discord.js";
import { Url } from "url";

export default async function (client: Client<true>, message: Message, apiKey: string) {
  const whisper = new Whisper(apiKey);
  // check if ffmpeg is installed
  ffmpeg.getAvailableFormats(function (err, formats) {
    if (err) {
      log.error(`FFMPEG ERR: ${err}`);
      message.reply(
        "Sorry, there was an error while trying to load FFMPEG. Please try again later."
      );
      process.exit(1);
    }
  });

  // get message attachments
  const attachments = message.attachments;
  // get the first attachment
  const attachment = attachments.first();

  if (!attachment) return;

  if (attachment.contentType != "audio/ogg") {
    message.reply("Sorry, I can only transcribe ogg files.");
    return;
  } else if (attachment.size > 8000000) {
    message.reply("Sorry, I can only transcribe files smaller than 8MB.");
    return;
  } else {
    message.channel.sendTyping();
  }

  // Download the attachment and name it the current timestamp
  const fileName = Date.now().toString();
  const url = attachment.url as unknown as Url;
  await DownloadFile(url, fileName, "ogg");

  // convert the file to mp3
  await ConvertFile(fileName, "ogg", "mp3");
  DeleteFile(fileName, "ogg");

  // Transcribe audio
  whisper
    .transcribe(`${fileName}.mp3`, "whisper-1")
    .then((text: string) => {
      message.reply(`✨ Voice Transcription:\n\n\`\`\`${text}\`\`\``);
      log(
        `Transcribed a message from ${message.author.username} in ${
          !message.channel.isDMBased() ? message.channel.name : "Direct Messages"
        }`
      );
      DeleteFile(fileName, "mp3");
    })
    .catch((error: unknown) => {
      console.error(error);
      DeleteFile(fileName, "mp3");
    });

  return true;
}
