import { REST, Routes, type Client } from "discord.js";
import { data as panelData } from "./panel";
import { data as setupData } from "./setup";
import { data as fixpermsData } from "./fixperms";
import { data as rulesData } from "./rules";
import { data as announceData } from "./announce";
import { data as setuprolesData } from "./setuproles";
import { data as sendverifyData } from "./sendverify";
import { data as assignunverifiedData } from "./assignunverified";
import { data as deleteallchannelsData } from "./deleteallchannels";
import { data as makeallchannelsData } from "./makeallchannels";
import { BOT_CONFIG } from "../config";
import { logger } from "../../lib/logger";

export async function registerSlashCommands(client: Client) {
  const token = process.env["DISCORD_BOT_TOKEN"];
  if (!token) throw new Error("DISCORD_BOT_TOKEN not set");

  const rest = new REST({ version: "10" }).setToken(token);

  const commands = [
    panelData.toJSON(),
    setupData.toJSON(),
    fixpermsData.toJSON(),
    rulesData.toJSON(),
    announceData.toJSON(),
    setuprolesData.toJSON(),
    sendverifyData.toJSON(),
    assignunverifiedData.toJSON(),
    deleteallchannelsData.toJSON(),
    makeallchannelsData.toJSON(),
  ];

  try {
    await rest.put(
      Routes.applicationGuildCommands(client.user!.id, BOT_CONFIG.guildId),
      { body: commands }
    );
    logger.info("Slash commands registered");
  } catch (err) {
    logger.error({ err }, "Failed to register slash commands");
  }
}
