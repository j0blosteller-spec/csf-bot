import {
  type ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  EmbedBuilder,
  type TextChannel,
} from "discord.js";
import { logger } from "../../lib/logger";

export const data = new SlashCommandBuilder()
  .setName("rules")
  .setDescription("Post the full CSF server and game rules in this channel")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

const SERVER_RULES = [
  {
    title: "1) Be Respectful",
    body: "No harassment, hate speech, slurs, doxxing, witch-hunting, or threats. Disagreements are normal — constant negative interactions or attempts to provoke someone cross the line.",
  },
  {
    title: "2) No NSFW / Illegal Content",
    body: "No porn, gore, piracy, or discussion facilitating crimes. Real media depicting violence or animal harm is strictly prohibited.",
  },
  {
    title: "3) Keep Chats On-Topic",
    body: "Use the correct channels for specific topics.",
  },
  {
    title: "4) No Spam or Self-Promotion",
    body: "No DM advertising, invite links, or promotions without staff approval. Excessive messaging or flooding the chat is not permitted.",
  },
  {
    title: "5) English Only",
    body: "Unless the channel says otherwise — keep support and general chat readable and consistent.",
  },
  {
    title: "6) Protect Privacy",
    body: "Do not share other users' personal info, DMs, keys, or builds. Doxxing threats — even as a joke — are not tolerated.",
  },
  {
    title: "7) Impersonation = Ban",
    body: "Do not impersonate staff, CSF, or partners.",
  },
  {
    title: "8) No Leaks / Reselling",
    body: "Content is personal and non-transferable. Leaks or resales result in termination.",
  },
  {
    title: "9) No Chargebacks",
    body: "All sales are final unless required by law. Chargebacks lead to revocation and a permanent blacklist.",
  },
  {
    title: "10) No Viruses / Malware / Phishing",
    body: "Do not send others viruses or malware, and do not attempt to phish, scam, hack, or DDoS anyone. Doing so results in a permanent ban and a report to Discord.",
  },
  {
    title: "11) Follow Platform Rules",
    body: "Comply with Discord, game, server, and anti-cheat terms of service at all times.",
  },
  {
    title: "12) Ticket Etiquette",
    body: "One ticket per issue. Provide logs/screenshots as requested. Don't ping staff repeatedly.",
  },
  {
    title: "13) Spoofing / Fraud",
    body: "Payment fraud, fake receipts, or identity spoofing results in an instant ban.",
  },
  {
    title: "14) No Glorifying Self-Harm or Extremism",
    body: "Do not share content that promotes suicide, self-harm, or violent extremism of any kind.",
  },
  {
    title: "15) Staff Decisions Are Final",
    body: "Staff discretion applies. Repeated or severe violations may result in immediate removal. By participating in this server, you agree to follow these rules and Discord's Terms of Service.",
  },
];

const GAME_RULES = [
  {
    title: "🚫 No Exploiting",
    body: "Tampering with the game or using exploits to gain an advantage is strictly prohibited and will result in a **permanent ban**. Permanent bans may be appealed after 1 month or if it can be proven the ban was issued incorrectly.",
  },
  {
    title: "🌐 No Lag Switching",
    body: "Purposefully slowing down your internet connection, using lag switches, or temporarily disconnecting to gain an advantage is forbidden and will result in a **permanent ban**.",
  },
  {
    title: "🐛 Do Not Abuse Glitches",
    body: "Purposefully glitching, especially when it provides an advantage, is not allowed. If you discover a glitch, report it to a developer so it can be fixed.",
  },
  {
    title: "🔄 No Alternate Account Ban Evasion",
    body: "Joining the game on another account while banned is ban evasion. This may extend your ban or, in the case of a permanent ban, reduce the likelihood of a successful appeal.",
  },
  {
    title: "💬 No Chat Spam / Flooding",
    body: "Excessive messaging, flooding the chat, or sending bypassed/inappropriate messages is not permitted and may result in moderation action.",
  },
];

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const channel = interaction.channel as TextChannel;

  // Header
  const headerEmbed = new EmbedBuilder()
    .setColor(0x00bfff)
    .setTitle("📜 Classic Sword Fight — Server Rules")
    .setDescription(
      "Read and follow all rules below. Violations may result in warnings, timeouts, or permanent bans.\n\n**By participating in this server you agree to all rules listed below.**"
    )
    .setFooter({ text: "CSF • Last updated" })
    .setTimestamp();

  await channel.send({ embeds: [headerEmbed] });

  // Server rules chunked into embeds of 5 fields each
  for (let i = 0; i < SERVER_RULES.length; i += 5) {
    const chunk = SERVER_RULES.slice(i, i + 5);
    const embed = new EmbedBuilder().setColor(0x2b2d31);
    for (const rule of chunk) {
      embed.addFields({ name: rule.title, value: rule.body, inline: false });
    }
    await channel.send({ embeds: [embed] });
  }

  // Game rules header
  const gameHeaderEmbed = new EmbedBuilder()
    .setColor(0x00bfff)
    .setTitle("🎮 Classic Sword Fight — Game Rules")
    .setDescription(
      "These rules apply **inside the game**. Violations are subject to in-game bans and may affect your server status."
    );

  await channel.send({ embeds: [gameHeaderEmbed] });

  for (let i = 0; i < GAME_RULES.length; i += 5) {
    const chunk = GAME_RULES.slice(i, i + 5);
    const embed = new EmbedBuilder().setColor(0x2b2d31);
    for (const rule of chunk) {
      embed.addFields({ name: rule.title, value: rule.body, inline: false });
    }
    await channel.send({ embeds: [embed] });
  }

  await interaction.editReply("✅ Rules posted!");
  logger.info({ channel: channel.name }, "Rules posted");
}
