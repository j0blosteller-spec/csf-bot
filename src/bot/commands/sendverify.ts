import {
  type ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { sendVerificationPanel } from "../handlers/verification";
import { logger } from "../../lib/logger";

export const data = new SlashCommandBuilder()
  .setName("sendverify")
  .setDescription("Post the verification panel with the verify button in this channel")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  try {
    await sendVerificationPanel(interaction.client, interaction.guildId!, interaction.channelId);
    await interaction.editReply("✅ Verification panel posted!");
  } catch (err) {
    logger.error({ err }, "Failed to send verification panel via command");
    await interaction.editReply("❌ Failed to post. Make sure the bot has permission to send messages here.");
  }
}
