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

export async function sendTicketPanel(client: Client, channelId?: string) {
  const targetId = channelId ?? BOT_CONFIG.ticketPanelChannelId;
  const channel = client.channels.cache.get(targetId) as TextChannel | undefined;

  if (!channel) {
    logger.warn({ targetId }, "Ticket panel channel not found");
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x00bfff)
    .setTitle("Ticket Panel - Classic Sword Fight")
    .setImage("https://via.placeholder.com/1200x300?text=Ticket+Panel+Classic+Sword+Fight")
    .setDescription(
      "❓ **Have a quick question?** - Press Questions below\n" +
      "🎮 **Have a problem with our discord?** - Press Discord Support below\n" +
      "🕹️ **Have a problem with our game?** - Press Game Support below"
    )
    .setFooter({ text: "CSF Ticket System" });

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
