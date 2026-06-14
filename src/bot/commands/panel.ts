import {
  type ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  ChannelType,
} from "discord.js";
import { sendTicketPanel } from "../handlers/ticketPanel";
import { logger } from "../../lib/logger";

export const data = new SlashCommandBuilder()
  .setName("panel")
  .setDescription("Send the CSF ticket panel to a channel")
  .addChannelOption((opt) =>
    opt
      .setName("channel")
      .setDescription("Channel to send the panel to (defaults to this channel)")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const target = interaction.options.getChannel("channel") ?? interaction.channel;
  const channelId = target?.id ?? interaction.channelId;

  try {
    await sendTicketPanel(interaction.client, channelId);
    await interaction.editReply(`✅ Ticket panel sent to <#${channelId}>!`);
  } catch (err) {
    logger.error({ err }, "Failed to send ticket panel via command");
    await interaction.editReply("❌ Failed to send ticket panel.");
  }
}
