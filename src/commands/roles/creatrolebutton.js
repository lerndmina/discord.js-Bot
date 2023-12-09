const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalSubmitInteraction,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const log = require("fancy-log");
const { json } = require("stream/consumers");
const BasicEmbed = require("../../utils/BasicEmbed");
const { debuglog } = require("util");
const ButtonWrapper = require("../../utils/ButtonWrapper");
const { randomUUID } = require("crypto");
const RoleButtons = require("../../models/RoleButtons");
const { ROLE_BUTTON_PREFIX, waitingEmoji } = require("../../Bot");
const { Database } = require("../../utils/cache/database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("createrolebutton")
    .setDescription("Creates a button that gives a role when clicked")
    .addRoleOption((option) =>
      option
        .setName("role1")
        .setDescription("The role to give when the button is clicked")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("button1").setDescription("The content of the button").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("emoji1").setDescription("The emoji to use for the button").setRequired(false)
    )
    .addRoleOption((option) =>
      option
        .setName("role2")
        .setDescription("The role to give when the button is clicked")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option.setName("button2").setDescription("The content of the button").setRequired(false)
    )
    .addStringOption((option) =>
      option.setName("emoji2").setDescription("The emoji to use for the button").setRequired(false)
    )
    .addRoleOption((option) =>
      option
        .setName("role3")
        .setDescription("The role to give when the button is clicked")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option.setName("button3").setDescription("The content of the button").setRequired(false)
    )
    .addStringOption((option) =>
      option.setName("emoji3").setDescription("The emoji to use for the button").setRequired(false)
    )
    .addRoleOption((option) =>
      option
        .setName("role4")
        .setDescription("The role to give when the button is clicked")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option.setName("button4").setDescription("The content of the button").setRequired(false)
    )
    .addStringOption((option) =>
      option.setName("emoji4").setDescription("The emoji to use for the button").setRequired(false)
    ),
  options: {
    devOnly: true,
    deleted: false,
    guildOnly: true,
    userPermissions: ["Administrator"],
    botPermissions: ["Administrator"],
  },
  run: async ({ interaction, client, handler }) => {
    var roles = [];
    var content = [];
    var emoji = [];
    interaction.options.data.forEach((option) => {
      if (option.name.startsWith("role")) {
        roles.push(option.role);
      } else if (option.name.startsWith("button")) {
        content.push(option.value);
      } else if (option.name.startsWith("emoji")) {
        emoji.push(option.value);
      }
    });

    if (roles.length !== content.length) {
      return interaction.reply({
        embeds: [
          BasicEmbed(client, "‼️ Error", `You need to have the same amount of roles and buttons.`),
        ],
        ephemeral: true,
      });
    }

    log(`Roles: ${roles}`);
    log(`Content: ${content}`);
    log(`Emoji: ${emoji}`);

    const modalId = `modal-${interaction.id}`;
    const inputId = `input-${interaction.id}`;

    const modal = new ModalBuilder()
      .setCustomId(modalId)
      .setTitle("Type in your custom embed content");
    const jsonInput = new TextInputBuilder()
      .setCustomId(inputId)
      .setLabel("Enter shrt.zip link Here")
      .setMinLength(1)
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder(`https://shrt.zip/u/AbCd.txt`);

    const firstActionRow = new ActionRowBuilder().addComponents(jsonInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
    const filter = (interaction) => interaction.customId === modalId;

    interaction
      .awaitModalSubmit({ filter, time: 120_000 })
      .then(async (modalInteraction) => {
        /**
         * @type {ModalSubmitInteraction}
         */
        const i = modalInteraction;

        var raw = i.fields.getTextInputValue(inputId);
        var json = null;
        log(`Url: ${raw}`);
        const urlRegex = /(https?:\/\/[^\s]+)/g;

        if (urlRegex.test(raw)) {
          log(`Looks like a url to me.`);

          // Go to the URL and get the raw text
          var url = raw.match(urlRegex)[0].replace("/u/", "/r/");
          url = url.replace("/code/", "/r/");
          var raw = null;
          if (url.startsWith("https://discohook.org/?data=")) {
            url = Buffer.from(url.split("=")[1], "base64").toString("utf-8").trim();
            raw = url;
          } else {
            const res = await fetch(url);
            raw = (await res.text()).trim();
          }
          log(`Fetched / Base64 Decoded`);

          // We have the json
          try {
            json = JSON.parse(raw);
            log(`Parsed`);
          } catch (error) {
            log.error(error);
            return i.reply({
              embeds: [
                BasicEmbed(client, "‼️ Error", `There was an error parsing the JSON.`, "Red"),
              ],
              ephemeral: true,
            });
          }
        } else {
          return i.reply({
            embeds: [BasicEmbed(client, "‼️ Error", `You didn't give me a url`, "Red")],
            ephemeral: true,
          });
        }

        await i.reply({
          embeds: [],
          content: waitingEmoji,
          ephemeral: true,
        });

        const db = new Database();
        const buttons = [];
        for (let index = 0; index < roles.length; index++) {
          var uuid = randomUUID();
          const button = new ButtonBuilder()
            .setCustomId(ROLE_BUTTON_PREFIX + uuid)
            .setLabel(content[index])
            .setStyle(ButtonStyle.Primary);
          if (emoji[index]) {
            button.setEmoji(emoji[index]);
          }
          buttons.push(button);
          const role = roles[index];
          const data = {
            guildId: interaction.guild.id,
            roleId: role.id,
            buttonId: uuid,
          };
          await db.findOneAndUpdate(RoleButtons, { buttonId: uuid }, data);
        }
        const components = ButtonWrapper(buttons);

        await i.channel.send({
          content: json.content || json.messages[0].data.content || "",
          embeds: json.embeds || json.messages[0].data.embeds,
          components: components,
        });

        await i.editReply("Done!");
      })
      .catch((error) => {
        log.error(error);
        return interaction.followUp({
          embeds: [BasicEmbed(client, "Error", `The interaction timed out or failed.`, "Red")],
          ephemeral: true,
        });
      });
  },
};
