import {
  type ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  ChannelType,
  type TextChannel,
} from "discord.js";
import { logger } from "../../lib/logger";

export const data = new SlashCommandBuilder()
  .setName("fixperms")
  .setDescription("Fix permissions on media/clips channels so members can send files")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

const MEDIA_KEYWORDS = ["media", "clips", "screenshots", "clips-screenshots"];

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  if (!guild) {
    await interaction.editReply("❌ Must be run inside a server.");
    return;
  }

  const fixed: string[] = [];

  for (const [, channel] of guild.channels.cache) {
    if (channel.type !== ChannelType.GuildText) continue;

    const name = channel.name.toLowerCase();
    const isMedia = MEDIA_KEYWORDS.some((kw) => name.includes(kw));
    if (!isMedia) continue;

    const ch = channel as TextChannel;

    await ch.permissionOverwrites.edit(guild.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true,
      EmbedLinks: true,
    });

    fixed.push(`✅ Fixed #${ch.name}`);
    logger.info({ channel: ch.name }, "Fixed media channel permissions");
  }

  if (fixed.length === 0) {
    await interaction.editReply("No media/clips channels found to fix.");
    return;
  }

  await interaction.editReply(
    `**Permissions fixed!**\n\n${fixed.join("\n")}\n\nMembers can now send images and files. Text-only messages will still be auto-deleted by the bot.`
  );
}
