import {
  type Client,
  type ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  type TextChannel,
} from "discord.js";
import { logger } from "../../lib/logger";

export async function handleTicketClose(
  client: Client,
  interaction: ButtonInteraction
) {
  await interaction.deferReply({ ephemeral: true });

  const channel = interaction.channel as TextChannel;

  const isStaff = interaction.memberPermissions?.has(
    PermissionFlagsBits.ManageChannels
  );
  const isTicketOwnerName = channel.name.includes(
    interaction.user.username.toLowerCase().replace(/[^a-z0-9\-]/g, "")
  );

  if (!isStaff && !isTicketOwnerName) {
    await interaction.editReply({
      content: "❌ Only staff or the ticket owner can close this ticket.",
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0xff4444)
    .setTitle("🔒 Ticket Closing")
    .setDescription(
      `This ticket will be deleted in **5 seconds**.\nClosed by ${interaction.user}.`
    )
    .setTimestamp();

  await interaction.editReply({ content: "✅ Closing this ticket..." });

  await channel.send({ embeds: [embed] });

  setTimeout(async () => {
    try {
      await channel.delete(`Ticket closed by ${interaction.user.tag}`);
    } catch (err) {
      logger.error({ err }, "Failed to delete ticket channel");
    }
  }, 5000);

  logger.info(
    { user: interaction.user.tag, channel: channel.name },
    "Ticket closed"
  );
}

export async function handleTicketTranscript(
  client: Client,
  interaction: ButtonInteraction
) {
  await interaction.deferReply({ ephemeral: true });

  const channel = interaction.channel as TextChannel;

  const messages = await channel.messages.fetch({ limit: 100 });
  const sorted = [...messages.values()].reverse();

  const transcript = sorted
    .map(
      (m) =>
        `[${new Date(m.createdTimestamp).toISOString()}] ${m.author.tag}: ${m.content || "[embed/attachment]"}`
    )
    .join("\n");

  const buffer = Buffer.from(transcript, "utf-8");

  await interaction.editReply({
    content: "📋 Here is the transcript for this ticket:",
    files: [
      {
        attachment: buffer,
        name: `transcript-${channel.name}.txt`,
      },
    ],
  });

  logger.info({ channel: channel.name }, "Transcript saved");
}
