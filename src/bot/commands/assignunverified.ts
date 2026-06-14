import {
  type ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { UNVERIFIED_ROLE_NAME, VERIFIED_ROLE_NAME } from "../handlers/verification";
import { logger } from "../../lib/logger";

export const data = new SlashCommandBuilder()
  .setName("assignunverified")
  .setDescription("Give the Unverified role to all members who have no CSF roles (skips admins & staff)");

// These role names are considered "already assigned" — skip anyone who has them
const SKIP_ROLE_NAMES = [
  "👑 Owner",
  "🛡️ Admin",
  "⚔️ Moderator",
  "🎮 Member",
  VERIFIED_ROLE_NAME,
  UNVERIFIED_ROLE_NAME,
];

export async function execute(interaction: ChatInputCommandInteraction) {
  // Allow anyone with Administrator OR ManageGuild to run this
  const member = interaction.member;
  const hasPerms =
    interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ||
    interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);

  if (!hasPerms) {
    await interaction.reply({ content: "❌ You need Administrator or Manage Server permission.", ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  if (!guild) {
    await interaction.editReply("❌ Must be run inside a server.");
    return;
  }

  const unverifiedRole = guild.roles.cache.find((r) => r.name === UNVERIFIED_ROLE_NAME);
  if (!unverifiedRole) {
    await interaction.editReply(
      `❌ **${UNVERIFIED_ROLE_NAME}** role not found. Please run \`/setuproles\` first.`
    );
    return;
  }

  // Fetch all members (may take a moment on large servers)
  await guild.members.fetch();

  let assigned = 0;
  let skipped = 0;
  let failed = 0;

  for (const [, guildMember] of guild.members.cache) {
    // Skip bots
    if (guildMember.user.bot) continue;

    // Skip anyone with Administrator permission (owners, admins)
    if (guildMember.permissions.has(PermissionFlagsBits.Administrator)) {
      skipped++;
      continue;
    }

    const memberRoleNames = guildMember.roles.cache.map((r) => r.name);

    // Skip anyone who already has a CSF role assigned
    const hasCSFRole = SKIP_ROLE_NAMES.some((name) => memberRoleNames.includes(name));
    if (hasCSFRole) {
      skipped++;
      continue;
    }

    // Only has @everyone → assign Unverified
    try {
      await guildMember.roles.add(unverifiedRole);
      assigned++;
    } catch {
      failed++;
    }
  }

  await interaction.editReply(
    `✅ **Done!**\n\n` +
    `👤 Assigned **${UNVERIFIED_ROLE_NAME}**: **${assigned}** members\n` +
    `⏭️ Skipped (admins/staff/already have role): **${skipped}**\n` +
    (failed > 0 ? `⚠️ Failed (too high in hierarchy): **${failed}**` : "")
  );

  logger.info({ assigned, skipped, failed }, "Mass unverified role assignment complete");
}
