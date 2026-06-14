import {
  type ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  ChannelType,
  OverwriteType,
} from "discord.js";
import { VERIFIED_ROLE_NAME, UNVERIFIED_ROLE_NAME } from "../handlers/verification";
import { logger } from "../../lib/logger";

export const data = new SlashCommandBuilder()
  .setName("makeallchannelsandcategory")
  .setDescription("Create all CSF categories and channels from scratch");

const STRUCTURE: {
  category: string;
  channels: { name: string; readOnly?: boolean; staffOnly?: boolean; topic?: string }[];
}[] = [
  {
    category: "📢 Information",
    channels: [
      { name: "welcome",       readOnly: true,  topic: "Welcome to Classic Sword Fight!" },
      { name: "rules",         readOnly: true,  topic: "Server rules — please read before participating." },
      { name: "announcements", readOnly: true,  topic: "Official CSF announcements." },
      { name: "updates",       readOnly: true,  topic: "Game and server updates." },
      { name: "sneak-peeks",   readOnly: true,  topic: "Upcoming content previews." },
    ],
  },
  {
    category: "🎮 Game Hub",
    channels: [
      { name: "tips-and-guides", readOnly: true,  topic: "Tips, guides, and strategies." },
      { name: "clips",                            topic: "Share your best clips!" },
    ],
  },
  {
    category: "💬 Community",
    channels: [
      { name: "general",   topic: "General chat for the CSF community." },
      { name: "off-topic", topic: "Anything goes (keep it civil)." },
      { name: "events",    topic: "Community events and giveaways." },
    ],
  },
  {
    category: "⚔️ Competitive",
    channels: [
      { name: "duel-requests", topic: "Challenge other players to a duel." },
      { name: "teams",         topic: "Team recruitment and coordination." },
    ],
  },
  {
    category: "🎫 Support",
    channels: [
      { name: "bug-reports",        topic: "Report bugs here." },
      { name: "suggestions",        topic: "Submit your suggestions." },
      { name: "tickets",            topic: "Open a support ticket." },
      { name: "staff-applications", topic: "Apply to join the staff team." },
    ],
  },
  {
    category: "🔒 Staff",
    channels: [
      { name: "staff-chat",   staffOnly: true, topic: "Staff-only discussion." },
      { name: "staff-logs",   staffOnly: true, topic: "Bot logs and actions." },
      { name: "staff-commands", staffOnly: true, topic: "Staff commands." },
    ],
  },
];

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({ content: "❌ Administrator permission required.", ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild!;
  await guild.roles.fetch();

  const everyoneRole = guild.roles.everyone;
  const verifiedRole  = guild.roles.cache.find((r) => r.name === VERIFIED_ROLE_NAME);
  const unverifiedRole = guild.roles.cache.find((r) => r.name === UNVERIFIED_ROLE_NAME);

  if (!verifiedRole || !unverifiedRole) {
    await interaction.editReply(
      "❌ **Verified** and **Unverified** roles not found. Run `/setuproles` first, then try again.",
    );
    return;
  }

  let categoriesCreated = 0;
  let channelsCreated = 0;

  for (const section of STRUCTURE) {
    const isStaffCategory = section.category.includes("Staff");
    const isInfoCategory  = section.category.includes("Information");

    // Category-level permission overwrites
    const categoryOverwrites: {
      id: string;
      type: OverwriteType;
      allow?: bigint[];
      deny?: bigint[];
    }[] = [];

    if (isStaffCategory) {
      // Staff category: deny everyone, allow staff roles
      categoryOverwrites.push(
        { id: everyoneRole.id, type: OverwriteType.Role, deny: [PermissionFlagsBits.ViewChannel] },
      );
      // Grant staff roles (by name pattern)
      const staffRoles = guild.roles.cache.filter((r) =>
        ["👑 Owner", "🛡️ Admin", "⚔️ Moderator"].includes(r.name),
      );
      for (const [, sr] of staffRoles) {
        categoryOverwrites.push({ id: sr.id, type: OverwriteType.Role, allow: [PermissionFlagsBits.ViewChannel] });
      }
    } else if (isInfoCategory) {
      // Info: everyone can view (unverified too)
      categoryOverwrites.push(
        { id: everyoneRole.id,    type: OverwriteType.Role, allow: [PermissionFlagsBits.ViewChannel] },
        { id: unverifiedRole.id, type: OverwriteType.Role, allow: [PermissionFlagsBits.ViewChannel] },
      );
    } else {
      // All other categories: deny unverified, allow verified
      categoryOverwrites.push(
        { id: everyoneRole.id,    type: OverwriteType.Role, deny: [PermissionFlagsBits.ViewChannel] },
        { id: unverifiedRole.id, type: OverwriteType.Role, deny: [PermissionFlagsBits.ViewChannel] },
        { id: verifiedRole.id,   type: OverwriteType.Role, allow: [PermissionFlagsBits.ViewChannel] },
      );
    }

    // Create category
    const category = await guild.channels.create({
      name: section.category,
      type: ChannelType.GuildCategory,
      permissionOverwrites: categoryOverwrites,
    });
    categoriesCreated++;

    // Create channels inside the category
    for (const ch of section.channels) {
      const channelOverwrites: {
        id: string;
        type: OverwriteType;
        allow?: bigint[];
        deny?: bigint[];
      }[] = [];

      if (ch.readOnly && isInfoCategory) {
        // Info read-only: everyone can view but not send
        channelOverwrites.push(
          { id: everyoneRole.id,    type: OverwriteType.Role, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] },
          { id: unverifiedRole.id, type: OverwriteType.Role, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] },
        );
        // Staff can send
        const staffRoles = guild.roles.cache.filter((r) =>
          ["👑 Owner", "🛡️ Admin", "⚔️ Moderator"].includes(r.name),
        );
        for (const [, sr] of staffRoles) {
          channelOverwrites.push({ id: sr.id, type: OverwriteType.Role, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
        }
      }

      await guild.channels.create({
        name: ch.name,
        type: ChannelType.GuildText,
        parent: category.id,
        topic: ch.topic,
        permissionOverwrites: channelOverwrites.length ? channelOverwrites : undefined,
      });
      channelsCreated++;
    }
  }

  logger.info({ categoriesCreated, channelsCreated }, "makeallchannels complete");

  await interaction.editReply(
    `✅ **Done!**\n\n` +
    `📁 Categories created: **${categoriesCreated}**\n` +
    `💬 Channels created: **${channelsCreated}**\n\n` +
    `Permissions applied:\n` +
    `• 📢 Information — visible to everyone (read-only)\n` +
    `• Other categories — verified members only\n` +
    `• 🔒 Staff — staff roles only`,
  );
}
