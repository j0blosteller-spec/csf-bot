import {
  type Client,
  type ButtonInteraction,
  type OverwriteResolvable,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type CategoryChannel,
} from "discord.js";
import { BOT_CONFIG } from "../config";
import { logger } from "../../lib/logger";

const CATEGORY_MAP: Record<
  string,
  { label: string; prefix: string; emoji: string; description: string }
> = {
  ticket_quick_question: {
    label: "Questions",
    prefix: "question",
    emoji: "❓",
    description: "Have a quick question?",
  },
  ticket_discord_support: {
    label: "Discord Support",
    prefix: "discord-support",
    emoji: "🎮",
    description: "Need help with Discord?",
  },
  ticket_game_support: {
    label: "Game Support",
    prefix: "game-support",
    emoji: "🕹️",
    description: "Need help with a game?",
  },
};

export async function handleTicketCreate(
  client: Client,
  interaction: ButtonInteraction
) {
  const categoryData = CATEGORY_MAP[interaction.customId];
  if (!categoryData) return;

  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  if (!guild) return;

  const existing = guild.channels.cache.find(
    (ch) =>
      ch.name === `${categoryData.prefix}-${interaction.user.username}` &&
      ch.type === ChannelType.GuildText
  );

  if (existing) {
    await interaction.editReply({
      content: `❌ You already have an open ticket: <#${existing.id}>`,
    });
    return;
  }

  const ticketName = `${categoryData.prefix}-${interaction.user.username}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");

  const permissionOverwrites: OverwriteResolvable[] = [
    {
      id: guild.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: interaction.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    },
  ];

  for (const roleId of BOT_CONFIG.staffRoleIds) {
    const role = guild.roles.cache.get(roleId);
    if (role) {
      permissionOverwrites.push({
        id: roleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageChannels,
        ],
      });
    }
  }

  if (BOT_CONFIG.moderatorRoleId) {
    const modRole = guild.roles.cache.get(BOT_CONFIG.moderatorRoleId);
    if (modRole) {
      permissionOverwrites.push({
        id: BOT_CONFIG.moderatorRoleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageChannels,
        ],
      });
    }
  }

  const csfCategory = guild.channels.cache.find(
    (ch) =>
      ch.type === ChannelType.GuildCategory &&
      ch.name.toLowerCase().includes("ticket")
  ) as CategoryChannel | undefined;

  const ticketChannel = await guild.channels.create({
    name: ticketName,
    type: ChannelType.GuildText,
    parent: csfCategory?.id,
    permissionOverwrites,
    topic: `Ticket by ${interaction.user.tag} | Type: ${categoryData.label}`,
  });

  const embed = new EmbedBuilder()
    .setColor(0x00bfff)
    .setTitle(`${categoryData.emoji} ${categoryData.label} Ticket`)
    .setDescription(
      `Welcome ${interaction.user}!\n\nThank you for opening a ticket for **${categoryData.description}**\n\nPlease describe your issue in detail and a staff member will assist you shortly.`
    )
    .addFields({
      name: "🔒 Close Ticket",
      value: "Click the button below to close this ticket when resolved.",
    })
    .setFooter({ text: "CSF Ticket System" })
    .setTimestamp();

  const staffMentions = BOT_CONFIG.staffRoleIds.map((id) => `<@&${id}>`).join(" ");

  const closeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_close")
      .setLabel("🔒 Close Ticket")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("ticket_transcript")
      .setLabel("📋 Save Transcript")
      .setStyle(ButtonStyle.Secondary)
  );

  await ticketChannel.send({
    content: `${interaction.user} ${staffMentions}`,
    embeds: [embed],
    components: [closeRow],
  });

  await interaction.editReply({
    content: `✅ Your ticket has been created: <#${ticketChannel.id}>`,
  });

  logger.info(
    { user: interaction.user.tag, type: categoryData.label },
    "Ticket created"
  );
}
