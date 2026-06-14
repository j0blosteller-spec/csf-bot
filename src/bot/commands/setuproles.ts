import {
  type ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  ChannelType,
} from "discord.js";
import { VERIFIED_ROLE_NAME, UNVERIFIED_ROLE_NAME, sendVerificationPanel } from "../handlers/verification";
import { logger } from "../../lib/logger";

export const data = new SlashCommandBuilder()
  .setName("setuproles")
  .setDescription("Remove all roles and create the CSF role hierarchy with proper permissions")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

const ROLES_TO_CREATE = [
  {
    name: "👑 Owner",
    color: 0xffd700 as number,
    permissions: PermissionFlagsBits.Administrator,
    hoist: true,
  },
  {
    name: "🛡️ Admin",
    color: 0xff4444 as number,
    permissions:
      PermissionFlagsBits.Administrator,
    hoist: true,
  },
  {
    name: "⚔️ Moderator",
    color: 0xff8800 as number,
    permissions:
      PermissionFlagsBits.KickMembers |
      PermissionFlagsBits.BanMembers |
      PermissionFlagsBits.ModerateMembers |
      PermissionFlagsBits.ManageMessages |
      PermissionFlagsBits.ViewChannel |
      PermissionFlagsBits.SendMessages |
      PermissionFlagsBits.ReadMessageHistory |
      PermissionFlagsBits.ManageChannels,
    hoist: true,
  },
  {
    name: "🎮 Member",
    color: 0x00bfff as number,
    permissions:
      PermissionFlagsBits.ViewChannel |
      PermissionFlagsBits.SendMessages |
      PermissionFlagsBits.ReadMessageHistory |
      PermissionFlagsBits.AttachFiles |
      PermissionFlagsBits.EmbedLinks |
      PermissionFlagsBits.UseExternalEmojis,
    hoist: false,
  },
  {
    name: VERIFIED_ROLE_NAME,
    color: 0x57f287 as number,
    permissions:
      PermissionFlagsBits.ViewChannel |
      PermissionFlagsBits.SendMessages |
      PermissionFlagsBits.ReadMessageHistory |
      PermissionFlagsBits.AttachFiles |
      PermissionFlagsBits.EmbedLinks,
    hoist: false,
  },
  {
    name: UNVERIFIED_ROLE_NAME,
    color: 0x99aab5 as number,
    permissions: BigInt(0),
    hoist: false,
  },
];

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  if (!guild) {
    await interaction.editReply("❌ Must be run inside a server.");
    return;
  }

  const log: string[] = [];

  // Delete all existing non-managed, non-@everyone roles
  for (const [, role] of guild.roles.cache) {
    if (role.managed || role.name === "@everyone") continue;
    if (role.position >= guild.members.me!.roles.highest.position) continue;
    try {
      await role.delete("CSF setup — clearing old roles");
      log.push(`🗑️ Deleted: ${role.name}`);
    } catch {
      log.push(`⚠️ Skipped (too high): ${role.name}`);
    }
  }

  // Create new roles
  for (const spec of ROLES_TO_CREATE) {
    const existing = guild.roles.cache.find((r) => r.name === spec.name);
    if (existing) {
      log.push(`✅ Already exists: ${spec.name}`);
      continue;
    }
    await guild.roles.create({
      name: spec.name,
      color: spec.color,
      permissions: spec.permissions,
      hoist: spec.hoist,
      reason: "CSF role setup",
    });
    log.push(`✅ Created: ${spec.name}`);
  }

  // Lock all channels: @everyone cannot see anything, Verified can
  const verifiedRole = guild.roles.cache.find((r) => r.name === VERIFIED_ROLE_NAME);
  const unverifiedRole = guild.roles.cache.find((r) => r.name === UNVERIFIED_ROLE_NAME);

  for (const [, channel] of guild.channels.cache) {
    if (channel.type === ChannelType.GuildCategory) continue;
    if (!("permissionOverwrites" in channel)) continue;

    const isVerifyOrRules = ["verify", "rules"].some((kw) =>
      channel.name.toLowerCase().includes(kw)
    );

    try {
      // @everyone: deny view
      await channel.permissionOverwrites.edit(guild.id, {
        ViewChannel: false,
      });

      // Verified: allow view
      if (verifiedRole) {
        await channel.permissionOverwrites.edit(verifiedRole.id, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
        });
      }

      // Unverified can only see verify/rules channels
      if (unverifiedRole) {
        await channel.permissionOverwrites.edit(unverifiedRole.id, {
          ViewChannel: isVerifyOrRules,
          SendMessages: false,
          ReadMessageHistory: isVerifyOrRules,
        });
      }
    } catch {
      // Skip channels bot can't manage
    }
  }

  // Send verification panel
  await sendVerificationPanel(interaction.client, guild.id);

  // Give new members unverified role automatically (handled in guildMemberAdd)
  log.push("✅ Channel permissions updated");
  log.push("✅ Verification panel sent");

  await interaction.editReply(
    `**CSF Role Setup Complete!**\n\n${log.join("\n")}\n\n` +
    `**Role Summary:**\n👑 Owner — Admin\n🛡️ Admin — Admin\n⚔️ Moderator — Kick/Ban/Mute/Manage\n🎮 Member — Chat\n${VERIFIED_ROLE_NAME} — See all channels\n${UNVERIFIED_ROLE_NAME} — Only verify/rules channels`
  );

  logger.info("Server roles setup complete");
}
