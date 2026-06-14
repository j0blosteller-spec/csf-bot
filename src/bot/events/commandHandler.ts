import { type Client, type Interaction } from "discord.js";
import { execute as panelExecute } from "../commands/panel";
import { execute as setupExecute } from "../commands/setup";
import { execute as fixpermsExecute } from "../commands/fixperms";
import { execute as rulesExecute } from "../commands/rules";
import { execute as announceExecute } from "../commands/announce";
import { execute as setuprolesExecute } from "../commands/setuproles";
import { execute as sendverifyExecute } from "../commands/sendverify";
import { execute as assignunverifiedExecute } from "../commands/assignunverified";
import { execute as deleteallchannelsExecute } from "../commands/deleteallchannels";
import { execute as makeallchannelsExecute } from "../commands/makeallchannels";
import { logger } from "../../lib/logger";

export function registerCommandHandler(client: Client) {
  client.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    try {
      if (interaction.commandName === "panel") { await panelExecute(interaction); return; }
      if (interaction.commandName === "setup") { await setupExecute(interaction); return; }
      if (interaction.commandName === "fixperms") { await fixpermsExecute(interaction); return; }
      if (interaction.commandName === "rules") { await rulesExecute(interaction); return; }
      if (interaction.commandName === "announce") { await announceExecute(interaction); return; }
      if (interaction.commandName === "setuproles") { await setuprolesExecute(interaction); return; }
      if (interaction.commandName === "sendverify") { await sendverifyExecute(interaction); return; }
      if (interaction.commandName === "assignunverified") { await assignunverifiedExecute(interaction); return; }
      if (interaction.commandName === "deleteallchannels") { await deleteallchannelsExecute(interaction); return; }
      if (interaction.commandName === "makeallchannelsandcategory") { await makeallchannelsExecute(interaction); return; }
    } catch (err) {
      logger.error({ err, command: interaction.commandName }, "Command error");
    }
  });
}
