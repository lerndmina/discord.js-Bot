import type { CommandData, SlashCommandProps, CommandOptions } from "commandkit";
import {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalSubmitInteraction,
} from "discord.js";
import log from "fancy-log";
import { setCommandCooldown, userCooldownKey, waitingEmoji } from "../../Bot";
import { verifyUser } from "../../utils/nameless-api/api";
import BasicEmbed from "../../utils/BasicEmbed";
import FetchEnvs from "../../utils/FetchEnvs";
const env = FetchEnvs();

export const data = new SlashCommandBuilder()
  .setName("verify")
  .setDescription("Verify your account with our website.")
  .setDMPermission(false);

export const options: CommandOptions = {
  devOnly: false,
  deleted: false,
};

export async function run({ interaction, client, handler }: SlashCommandProps) {
  const modalId = `modal-${interaction.id}`;
  const inputId = `input-${interaction.id}`;

  const modal = new ModalBuilder().setCustomId(modalId).setTitle("Enter your verification code");
  const input = new TextInputBuilder()
    .setCustomId(inputId)
    .setPlaceholder("Verification code")
    .setMinLength(1)
    .setMaxLength(32)
    .setStyle(TextInputStyle.Short)
    .setLabel("Verification code:");

  const firstActionRow = new ActionRowBuilder().addComponents(input);
  modal.addComponents(firstActionRow as any);

  await interaction.showModal(modal);
  const filter = (interaction: ModalSubmitInteraction) => interaction.customId === modalId;

  interaction
    .awaitModalSubmit({ filter, time: 600_000 })
    .then(async (modalInteraction) => {
      const i = modalInteraction as ModalSubmitInteraction;
      const code = i.fields.getTextInputValue(inputId);

      console.log(`Verification code: ${code}`);

      await i.reply({ content: waitingEmoji, ephemeral: true });

      const res = await verifyUser(code, i.user.id, i.user.username);

      if (res.error) {
        const e = res.error as string;

        if (e.includes("uncaught_error"))
          return i.editReply({
            content: "",
            embeds: [
              BasicEmbed(
                client,
                "Account Verification Error",
                `An uncaught error occurred while verifying your account. Please notify <@${env.OWNER_IDS[0]}>\n\nError: \`${e}\``
              ),
            ],
          });
        if (e.includes("invalid_code"))
          return i.editReply({
            content: "",
            embeds: [
              BasicEmbed(
                client,
                "Account Verification Error",
                "The verification key you provided is invalid. Please try again with a fresh key from your [Account Connections Page](https://thalwyrn.com/user/connections/)"
              ),
            ],
          });
      }

      setCommandCooldown(userCooldownKey(interaction.user.id, interaction.commandName), 300);
      return i.editReply({
        content: "",
        embeds: [
          BasicEmbed(
            client,
            "Account Verification",
            `Your account has been verified successfully! You have now linked your Discord account with your [Thalwyrn.com](https://thalwyrn.com) account.`
          ),
        ],
      });
    })
    .catch((e) => {
      log.error("Error while awaiting modal submit: ", e);
    });
}
