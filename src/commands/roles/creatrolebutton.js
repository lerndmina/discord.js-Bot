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
const { ROLE_BUTTON_PREFIX } = require("../../Bot");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("createrolebutton")
    .setDescription("Creates a button that gives a role when clicked")
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription("The role to give when the button is clicked")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("content").setDescription("The content of the button").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("emoji").setDescription("The emoji to use for the button").setRequired(false)
    ),
  options: {
    devOnly: false,
    guildOnly: true,
    userPermissions: ["Administrator"],
    botPermissions: ["Administrator"],
  },
  run: async ({ interaction, client, handler }) => {
    const modalId = `modal-${interaction.id}`;
    const inputId = `input-${interaction.id}`;
    const role = interaction.options.getRole("role");
    const content = interaction.options.getString("content");
    const emoji = interaction.options.getString("emoji");

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

    interaction.awaitModalSubmit({ filter, time: 120000 }).then(async (modalInteraction) => {
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
        const res = await fetch(url);
        var raw = (await res.text()).trim();
        log(`Fetched`);
        // We have the json
        try {
          json = JSON.parse(raw);
          log(`Parsed`);
        } catch (error) {
          log.error(error);
          return i.reply({
            embeds: [BasicEmbed(client, "‼️ Error", `There was an error parsing the JSON.`, "Red")],
            ephemeral: true,
          });
        }
      } else {
        return i.reply({
          embeds: [BasicEmbed(client, "‼️ Error", `You didn't give me a url`, "Red")],
          ephemeral: true,
        });
      }
      i.reply({
        embeds: [
          BasicEmbed(
            client,
            "✅ Success",
            `JSON Accepted. Parsing and creating the message here.`,
            "Green"
          ),
        ],
        ephemeral: true,
      });

      var uuid = randomUUID();
      log(`UUID: ${uuid} Assigned to give role ${role.name} when clicked.`);

      const buttons = [
        new ButtonBuilder()
          .setCustomId(`${ROLE_BUTTON_PREFIX}${uuid}`)
          .setLabel(content)
          .setStyle(ButtonStyle.Primary)
          .setEmoji(emoji || "✔️"),
      ];
      const components = ButtonWrapper(buttons);

      await RoleButtons.findOneAndUpdate(
        { buttonId: uuid },
        {
          buttonId: uuid,
          guildId: interaction.guild.id,
          roleId: role.id,
        },
        {
          upsert: true,
          new: true,
        }
      );

      await i.channel.send({
        content: json.content,
        embeds: json.embeds,
        components: components,
      });
    });
  },
};
