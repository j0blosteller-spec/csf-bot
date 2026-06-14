import {
  type Client,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type TextChannel,
  AttachmentBuilder,
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

  const attachment = new AttachmentBuilder(`${__dirname}/banner.png`, {
    name: "banner.png",
  });

  const embed = new EmbedBuilder()
    .setColor(0x00bfff)
    .setTitle("🎫 Ticket Panel")
    .setDescription(
      "Welcome to **Classic Sword Fight**\nSelect the option that best matches your needs."
    )
    .setImage("attachment://banner.png")
    .addFields(
      {
        name: "❓ Have a quick question?",
        value: "Press **Questions**",
        inline: true,
      },
      {
        name: "🎮 Have a problem with our discord?",
        value: "Press **Discord Support**",
        inline: true,
      },
      {
        name: "🕹️ Have a problem with our game?",
        value: "Press **Game Support**",
        inline: true,
      }
    )
    .setFooter({ text: "CSF • Ticket System" })
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
    files: [attachment],
  });

  logger.info("Ticket panel sent");
}
