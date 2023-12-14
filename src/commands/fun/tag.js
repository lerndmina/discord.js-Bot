const {
  SlashCommandBuilder,
  EmbedBuilder,
  userMention,
  BaseInteraction,
  Client,
  CommandInteraction,
  Guild,
} = require("discord.js");
const BasicEmbed = require("../../utils/BasicEmbed");
const { waitingEmoji } = require("../../Bot");
const { Database } = require("../../utils/cache/database");
const log = require("fancy-log");
const {
  returnMessage,
  getTagKey,
  ThingGetter,
  upperCaseFirstLetter,
  parseNewlines,
  getTagName,
  debugMsg,
} = require("../../utils/TinyUtils");
const TagSchema = require("../../models/TagSchema");
const COMMAND_NAME = "tag";
const COMMAND_NAME_TITLE = "Tag";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription("Add or delete a tag")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add a tag")
        .addStringOption((option) =>
          option.setName("name").setDescription("The name of the tag").setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("content").setDescription("The content of the tag").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription("Delete a tag")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("The name of the tag")
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("send")
        .setDescription("Send a tag")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("The name of the tag")
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addUserOption((option) =>
          option.setName("user").setDescription("The user to mention").setRequired(false)
        )
    )
    .addSubcommand((subcommand) => subcommand.setName("list").setDescription("List all tags")),
  options: {
    devOnly: true,
    deleted: false,
    guildOnly: true,
  },
  run: async ({ interaction, client, handler }) => {
    await interaction.reply({ content: waitingEmoji, ephemeral: true });
    const name = interaction.options.getString("name")?.toLowerCase();
    const content = interaction.options.getString("content");
    const user = interaction.options.getUser("user");
    const subcommand = interaction.options.getSubcommand();
    const guild = interaction.guild;
    try {
      if (subcommand == "add") {
        addTag(interaction, client, name, content, guild);
      } else if (subcommand == "delete") {
        deleteTag(interaction, client, name, guild);
      } else if (subcommand == "send") {
        sendTag(interaction, client, name, guild, user);
      } else if (subcommand == "list") {
        listTags(interaction, client, guild);
      }
    } catch (error) {
      return returnMessage(
        interaction,
        client,
        COMMAND_NAME_TITLE,
        `Oh SHIT! We fell back to a emergency try/catch to prevent bot crahses. Whatever happened I didn't expect it.\nPlease report the following error to the bot developer!\n\`\`\`bash\n${
          error.message
        }\`\`\`\n\nThis error happened at ${Date.now()}`,
        { error: true }
      );
    }
  },
};

/**
 *
 * @param {CommandInteraction} interaction
 * @param {Client} client
 * @param {string} name
 * @param {string} content
 * @param {Guild} guild
 * @returns
 */
async function addTag(interaction, client, name, content, guild) {
  debugMsg(`Adding Tag ${name}`);
  const db = new Database();
  const tagKey = getTagKey(guild.id, name);
  const tag = await db.findOne(TagSchema, { key: tagKey });
  if (tag) {
    return returnMessage(
      interaction,
      client,
      COMMAND_NAME_TITLE,
      `This tag already exists in the database. Please choose another name or delete the tag first.`
    );
  }

  db.findOneAndUpdate(
    TagSchema,
    { key: tagKey },
    { key: tagKey, guildId: guild.id, tag: parseNewlines(content) }
  );
  cleanCacheForGuild(guild.id); // Tag was added, without cleaning, the cache would be invalid
  return returnMessage(interaction, client, COMMAND_NAME_TITLE, `Tag \`${name}\` added!`);
}

/**
 *
 * @param {CommandInteraction} interaction
 * @param {Client} client
 * @param {String} name
 * @param {Guild} guild
 * @returns
 */
async function deleteTag(interaction, client, name, guild) {
  debugMsg(`Deleting tag: ${name}`);
  const db = new Database();
  const tagKey = getTagKey(guild.id, name);
  const tag = await db.findOne(TagSchema, { key: tagKey });
  if (!tag) {
    return returnMessage(
      interaction,
      client,
      COMMAND_NAME_TITLE,
      `This tag doesn't exist in the database.`
    );
  }
  db.findOneAndDelete(TagSchema, { key: tagKey });
  cleanCacheForGuild(guild.id); // Tag was deleted, without cleaning, the cache would be invalid
  return returnMessage(interaction, client, COMMAND_NAME_TITLE, `Tag \`${name}\` removed!`);
}

/**
 *
 * @param {CommandInteraction} interaction
 * @param {Client} client
 * @param {String} name
 * @param {Guild} guild
 * @param {User} user
 * @returns
 */
async function sendTag(interaction, client, name, guild, user) {
  debugMsg(`Sending tag: ${name}`);
  const db = new Database();
  const tagKey = getTagKey(guild.id, name);
  const tag = await db.findOne(TagSchema, { key: tagKey });
  if (!tag) {
    return returnMessage(
      interaction,
      client,
      COMMAND_NAME_TITLE,
      `This tag doesn't exist in the database.`
    );
  }
  returnMessage(interaction, client, COMMAND_NAME_TITLE, `Sending tag \`${name}\`...`);
  return interaction.channel.send({
    content: user ? userMention(user.id) : "",
    embeds: [BasicEmbed(client, `${COMMAND_NAME_TITLE}: ${upperCaseFirstLetter(name)}`, tag.tag)],
  });
}

/**
 *
 * @param {CommandInteraction} interaction
 * @param {Client} client
 * @param {Guild} guild
 * @returns
 */
async function listTags(interaction, client, guild) {
  debugMsg(`Listing tags`);
  const getter = new ThingGetter(client);
  const member = await getter.getMember(guild, interaction.user.id);

  if (!member.permissions.has("MANAGE_MESSAGES")) {
    return returnMessage(
      interaction,
      client,
      COMMAND_NAME_TITLE,
      `You don't have the required permissions to list all tags as it's an expensive operation!`
    );
  }

  const db = new Database();
  const tags = await db.find(TagSchema, { guildId: guild.id });
  if (!tags || tags.length == 0) {
    return returnMessage(interaction, client, COMMAND_NAME_TITLE, `No tags found!`);
  }
  const fields = [];
  tags.forEach((tag) => {
    const name = upperCaseFirstLetter(getTagName(tag.key));
    fields.push({ name: name, value: `${tag.tag}`, inline: true });
  });
  const embed = BasicEmbed(client, `Tags for ${guild.name}`, `*`, fields);

  return interaction.editReply({ content: "", embeds: [embed] });
}

/**
 * @param {string} guildId - The guild id to clean the cache for
 * @returns {Promise<Array>} - Array of keys deleted
 */
function cleanCacheForGuild(guildId) {
  const db = new Database();
  const cleaned = db.cleanCache(`TagSchema:guildId:${guildId}`);
  return cleaned;
}
