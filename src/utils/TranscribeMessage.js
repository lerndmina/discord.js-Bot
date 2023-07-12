var log = require('fancy-log');
const https = require('https');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const Whisper = require('whisper-nodejs');
const DownloadFile = require('./DownloadFile');
const DeleteFile = require('./DeleteFile');
const ConvertFile = require('./ConvertFile');

const TranscribeMessage = async (client, message, apiKey) => {
  const whisper = new Whisper(apiKey);
  // check if ffmpeg is installed
  ffmpeg.getAvailableFormats(function(err, formats) {
    if (err) {
      log.error(`FFMPEG ERR: ${err}`);
      process.exit(1);
    }});

  // get message attachments
  const attachments = message.attachments;
  // get the first attachment
  const attachment = attachments.first();

  if (attachment.contentType != "audio/ogg") {
    message.reply("Sorry, I can only transcribe ogg files.");
    return;
  } else if (attachment.size > 8000000) {
    message.reply("Sorry, I can only transcribe files smaller than 8MB.");
    return;
  } else {
    await message.channel.sendTyping();
  }

  // Download the attachment and name it the current timestamp
  const fileName = Date.now();
  const url = attachment.url;
  await DownloadFile(url, fileName, "ogg");

  // convert the file to mp3
  await ConvertFile(fileName, "ogg", "mp3");
  DeleteFile(fileName, "ogg");

  log(`Transcribing ${fileName}.mp3...`)


  // Transcribe audio
  whisper.transcribe(`${fileName}.mp3`, 'whisper-1')
  .then(text => {
    message.reply(`✨ Transcription: ${text}`);
    DeleteFile(fileName, "mp3");
  })
  .catch(error => {
    console.error(error);
    DeleteFile(fileName, "mp3");
  });
}

module.exports = TranscribeMessage;