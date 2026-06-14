import {
  type Client,
  type ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  type TextChannel,
  ChannelType,
  PermissionFlagsBits,
} from "discord.js";
import { logger } from "../../lib/logger";

export const VERIFIED_ROLE_NAME = "✅ Verified";
export const UNVERIFIED_ROLE_NAME = "🔒 Unverified";

export async function sendVerificationPanel(client: Client, guildId: string, forceChannelId?: string) {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;

  let verifyChannel: TextChannel | undefined;

  if (forceChannelId) {
    verifyChannel = guild.channels.cache.get(forceChannelId) as TextChannel | undefined;
  }

  if (!verifyChannel) {
    verifyChannel = guild.channels.cache.find(
      (ch) => ch.name.toLowerCase().includes("verify") && ch.type === ChannelType.GuildText
    ) as TextChannel | undefined;
  }

  if (!verifyChannel) {
    verifyChannel = await guild.channels.create({
      name: "✅・verify-here",
      type: ChannelType.GuildText,
      topic: "Click the button below to verify and access the server.",
    }) as TextChannel;
  }

  const logo = new AttachmentBuilder(`${__dirname}/csf-logo.png`, { name: "csf-logo.png" });

  const embed = new EmbedBuilder()
    .setColor(0x00bfff)
    .setAuthor({ name: "Classic Sword Fight", iconURL: "attachment://csf-logo.png" })
    .setTitle("🔐 Server Verification")
    .setThumbnail("attachment://csf-logo.png")
    .setDescription(
      "Welcome to **Classic Sword Fight**!\n\n" +
      "To access all channels and join the community, click the **✅ Verify** button below.\n\n" +
      "By verifying, you confirm that you have read and agree to our server rules."
    )
    .addFields(
      { name: "👁️ Before verifying", value: "You can only see this channel.", inline: true },
      { name: "✅ After verifying", value: "Full access to all channels.", inline: true }
    )
    .setFooter({ text: "CSF • Verification System" })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("verify_user")
      .setLabel("✅ Verify — I am not a bot")
      .setStyle(ButtonStyle.Success)
  );

  await verifyChannel.send({ embeds: [embed], components: [row], files: [logo] });
  logger.info("Verification panel sent");
}

export async function handleVerify(client: Client, interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  if (!guild) return;

  const verifiedRole = guild.roles.cache.find((r) => r.name === VERIFIED_ROLE_NAME);
  if (!verifiedRole) {
    await interaction.editReply("❌ Verified role not found. Please ask an admin to run `/setuproles` first.");
    return;
  }

  const guildMember = await guild.members.fetch(interaction.user.id).catch(() => null);
  if (!guildMember) {
    await interaction.editReply("❌ Could not find your membership. Please try again.");
    return;
  }

  if (guildMember.roles.cache.has(verifiedRole.id)) {
    await interaction.editReply("✅ You are already verified!");
    return;
  }

  try {
    await guildMember.roles.add(verifiedRole);

    // Give Member role
    const memberRole = guild.roles.cache.find((r) => r.name === "🎮 Member");
    if (memberRole) await guildMember.roles.add(memberRole);

    // Remove Unverified role if they have it
    const unverifiedRole = guild.roles.cache.find((r) => r.name === UNVERIFIED_ROLE_NAME);
    if (unverifiedRole && guildMember.roles.cache.has(unverifiedRole.id)) {
      await guildMember.roles.remove(unverifiedRole);
    }

    await interaction.editReply("🎉 **You are now verified!** Welcome to Classic Sword Fight — all channels are now unlocked.");
    logger.info({ user: interaction.user.tag }, "User verified");
  } catch (err) {
    logger.error({ err }, "Failed to add verified role");
    await interaction.editReply("❌ Failed to verify. Please contact a staff member.");
  }
}
