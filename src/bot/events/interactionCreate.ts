import { type Client, type Interaction } from "discord.js";
import { handleTicketCreate } from "../handlers/ticketCreate";
import { handleTicketClose, handleTicketTranscript } from "../handlers/ticketClose";
import { handleVerify } from "../handlers/verification";
import { logger } from "../../lib/logger";

export function registerInteractionEvent(client: Client) {
  client.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.isButton()) return;

    try {
      if (
        interaction.customId === "ticket_quick_question" ||
        interaction.customId === "ticket_discord_support" ||
        interaction.customId === "ticket_game_support"
      ) {
        await handleTicketCreate(client, interaction);
        return;
      }

      if (interaction.customId === "ticket_close") {
        await handleTicketClose(client, interaction);
        return;
      }

      if (interaction.customId === "ticket_transcript") {
        await handleTicketTranscript(client, interaction);
        return;
      }

      if (interaction.customId === "verify_user") {
        await handleVerify(client, interaction);
        return;
      }
    } catch (err) {
      logger.error({ err, customId: interaction.customId }, "Interaction error");
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.editReply({ content: "❌ An error occurred. Please try again." });
        } else {
          await interaction.reply({ content: "❌ An error occurred. Please try again.", ephemeral: true });
        }
      } catch {}
    }
  });
}
