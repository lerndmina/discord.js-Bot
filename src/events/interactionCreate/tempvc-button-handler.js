const {
  BaseInteraction,
  Client,
  InteractionType,
  User,
  Channel,
  ChannelType,
  PermissionFlagsBits,
  ComponentType,
  ButtonStyle,
  ModalBuilder,
  TextInputStyle,
  TextInputBuilder,
  ActionRowBuilder,
  UserSelectMenuBuilder,
  Base,
} = require("discord.js");
const log = require("fancy-log");
const BasicEmbed = require("../../utils/BasicEmbed");
const ms = require("ms");

const banUserMenuId = "tempvc-ban-user-menu";

/**
 *
 * @param {BaseInteraction}
 * @param {Client} client
 */
module.exports = async (interaction, client) => {
  if (interaction.type != InteractionType.MessageComponent) return;
  if (interaction.channel.type != ChannelType.GuildVoice) return;

  // log(`Interaction with custom id ${interaction.customId} received.`);
  if (
    !interaction.channel.permissionsFor(interaction.user).has(PermissionFlagsBits.ManageChannels) &&
    interaction.customId.startsWith("tempvc-")
  ) {
    interaction.reply({
      embeds: [
        BasicEmbed(
          client,
          "Error!",
          `You do not have permission to use this button. You need the \`Manage Channels\` permission.`
        ),
      ],
      ephemeral: true,
    });
    return;
  }

  const channel = interaction.channel;
  const user = interaction.user;

  switch (interaction.customId) {
    case "tempvc-delete":
      DeleteChannelButtons(interaction, channel, user);
      break;
    case "tempvc-delete-yes":
      // Kick all members from the channel, we delete it somewhere else (see leftTempVC.js)
      channel.members.forEach((member) => {
        member.voice.setChannel(null);
      });

      break;

    case "tempvc-delete-no":
      interaction.message.delete();
      break;

    case "tempvc-rename":
      RenameVCModal(interaction, channel, user);
      break;

    case "tempvc-invite":
      SendInvite(interaction, channel, user);
      break;

    case "tempvc-ban":
      PostBanUserDropdown(interaction, channel, user);
      break;

    case banUserMenuId:
      BanUserFromChannel(interaction, channel, user);
      break;
  }
};

/**
 * @param {BaseInteraction} interaction
 * @param {Channel} channel
 * @param {User} user
 */
function DeleteChannelButtons(interaction, channel, user) {
  // Ask for confirmation ephemeral message
  interaction.reply({
    content: `Are you sure you want to delete this channel?`,
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: ButtonStyle.Danger,
            label: "Yes",
            customId: "tempvc-delete-yes",
          },
          {
            type: ComponentType.Button,
            style: ButtonStyle.Secondary,
            label: "No",
            customId: "tempvc-delete-no",
          },
        ],
      },
    ],
  });
  return true; // Stops the event loop.
}

/**
 * @param {BaseInteraction} interaction
 * @param {Channel} channel
 * @param {User} user
 */
async function RenameVCModal(interaction, channel, user) {
  const modalId = "tempvc-rename-modal";

  const modal = new ModalBuilder().setCustomId(modalId).setTitle("Rename your channel");

  const nameInput = new TextInputBuilder()
    .setCustomId("tempvc-name-input")
    .setLabel("Enter the new name")
    .setMinLength(1)
    .setMaxLength(100)
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("My Channel");

  const actionRow = new ActionRowBuilder().addComponents(nameInput);

  modal.addComponents(actionRow);

  await interaction.showModal(modal);

  const interactionFilter = (interaction) => interaction.customId === modalId;

  interaction
    .awaitModalSubmit({ filter: interactionFilter, time: 120000 })
    .then(async (modalInteraction) => {
      const nameValue = modalInteraction.fields.getTextInputValue("tempvc-name-input");

      await channel.setName(nameValue);

      await modalInteraction.reply({
        embeds: [
          BasicEmbed(
            interaction.client,
            `Renamed!`,
            `You renamed this channel to \`${nameValue}\``
          ),
        ],
        ephemeral: true,
      });
    });
  return true; // Stops the event loop.
}

async function SendInvite(interaction, channel, user) {
  const tenMinutes = ms("10m") / 1000;
  const expiresAt = Math.floor(Date.now() / 1000 + tenMinutes);

  let invite = await channel
    .createInvite(
      {
        maxAge: tenMinutes, // discord uses seconds
        maxUses: 10,
      },
      `Requested by ${user.tag}`
    )
    .catch((err) => {
      interaction.reply({
        embeds: [
          BasicEmbed(
            interaction.client,
            "Error!",
            `Error creating invite: \`\`\`${err}\`\`\``,
            "Red"
          ),
        ],
      });
      return true;
    });

  interaction.reply({
    embeds: [
      BasicEmbed(
        interaction.client,
        "Invite Created!",
        `Here is your invite: ${invite.url} \n Share it with your friends!`,
        [
          {
            name: "Invite Expires",
            value: `<t:${expiresAt}:R>`,
            inline: true,
          },
          { name: "Invite Max Uses", value: `\`${invite.maxUses}\``, inline: true },
        ]
      ),
    ],
  });
  interaction.channel.send({ content: `${invite.url}` });

  return true; // Stops the event loop.
}

/**
 *
 * @param {BaseInteraction} interaction
 * @param {Channel} channel
 * @param {User} user
 */
async function PostBanUserDropdown(interaction, channel, user) {
  // get the list of members in the channel
  const members = channel.members;

  const userMenu = new UserSelectMenuBuilder()
    .setCustomId(banUserMenuId)
    .setPlaceholder("Select a user to ban")
    .setMinValues(1)
    .setMaxValues(5);

  const row1 = new ActionRowBuilder().addComponents(userMenu);

  await interaction.reply({
    embeds: [
      BasicEmbed(interaction.client, "Ban a user", `Select a user to ban from this channel.`),
    ],
    components: [row1],
    ephemeral: true,
  });
}

/**
 *
 * @param {BaseInteraction} interaction
 * @param {Channel} channel
 * @param {User} user
 */
function BanUserFromChannel(interaction, channel, user) {
  var count = 0;
  users = interaction.values;
  users.forEach((userId) => {
    // Check if the user is not the interaction user
    if (userId == user.id) return;

    const member = channel.guild.members.cache.get(userId);
    // Check if the user is in the channel
    if (member.voice.channelId == channel.id) member.voice.setChannel(null);

    // Set channel permissions to deny the user from joining
    channel.permissionOverwrites.edit(member, {
      Connect: false,
    });
    count++;
  });

  interaction.reply({
    embeds: [BasicEmbed(interaction.client, "Banned!", `Banned ${count} users from this channel.`)],
    ephemeral: true,
  });
}
