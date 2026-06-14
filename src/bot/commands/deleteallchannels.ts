import {
  type ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import { logger } from "../../lib/logger";

export const data = new SlashCommandBuilder()
  .setName("deleteallchannels")
  .setDescription("⚠️ Delete ALL channels and categories in the server (irreversible!)");

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({ content: "❌ Administrator permission required.", ephemeral: true });
    return;
  }

  const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("confirm_delete_all")
      .setLabel("⚠️ Yes, delete everything")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("cancel_delete_all")
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Secondary),
  );

  const reply = await interaction.reply({
    content:
      "⚠️ **Are you sure?**\nThis will delete **ALL channels and categories** in the server. This **cannot be undone.**",
    components: [confirmRow],
    ephemeral: true,
  });

  let btn;
  try {
    btn = await reply.awaitMessageComponent({
      componentType: ComponentType.Button,
      time: 30_000,
      filter: (b) => b.user.id === interaction.user.id,
    });
  } catch {
    await interaction.editReply({ content: "⏱️ Timed out — no channels deleted.", components: [] });
    return;
  }

  if (btn.customId === "cancel_delete_all") {
    await btn.update({ content: "✅ Cancelled — nothing was deleted.", components: [] });
    return;
  }

  await btn.update({ content: "🗑️ Deleting all channels...", components: [] });

  const guild = interaction.guild!;
  await guild.channels.fetch();

  let deleted = 0;
  let failed = 0;

  // Delete text/voice channels first, then categories
  const sorted = [...guild.channels.cache.values()].sort((a) =>
    a.type === 4 ? 1 : -1, // categories last
  );

  for (const channel of sorted) {
    try {
      await channel.delete();
      deleted++;
    } catch {
      failed++;
    }
  }

  logger.info({ deleted, failed }, "deleteallchannels complete");

  // Since the reply channel was deleted, we just log — can't reply anymore
}
