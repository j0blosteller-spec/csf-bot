import {
  type Client,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type TextChannel,
} from "discord.js";
import { BOT_CONFIG } from "../config";
import { logger } from "../../lib/logger";

const BANNER_URL =
  "https://via.placeholder.com/1200x400/1a1a2e/00d4ff?text=CLASSIC+SWORD+FIGHT";

export async function sendTicketPanel(client: Client, channelId?: string) {
  const targetId = channelId ?? BOT_CONFIG.ticketPanelChannelId;
  const channel = client.channels.cache.get(targetId) as
    | TextChannel
    | undefined;

  if (!channel) {
    logger.warn({ targetId }, "Ticket panel channel not found");
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x00d4ff)
    .setTitle("🎫 TICKET PANEL — CLASSIC SWORD FIGHT")
    .setDescription(
      "Welcome to our support center! Choose what you need help with below and we'll get you sorted instantly."
    )
    .setImage(BANNER_URL)
    .addFields(
      {
        name: "❓ QUICK QUESTION",
        value: "Got a quick question? We're here to help!",
        inline: true,
      },
      {
        name: "🎮 DISCORD ISSUE",
        value: "Having trouble with our Discord? Let us know!",
        inline: true,
      },
      {
        name: "🕹️ GAME SUPPORT",
        value: "Need help with the game? We'll fix it!",
        inline: true,
      }
    )
    .setFooter({ text: "⚡ CSF Support System | Instant Response" })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_quick_question")
      .setLabel("Questions")
      .setEmoji("❓")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("ticket_discord_support")
      .setLabel("Discord Support")
      .setEmoji("🎮")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("ticket_game_support")
      .setLabel("Game Support")
      .setEmoji("🕹️")
      .setStyle(ButtonStyle.Success)
  );

  await channel.send({
    embeds: [embed],
    components: [row],
  });

  logger.info("Ticket panel sent");
}
