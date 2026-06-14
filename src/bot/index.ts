import { Client, GatewayIntentBits, Partials } from "discord.js";
import { registerReadyEvent } from "./events/ready";
import { registerWelcomeEvent } from "./events/guildMemberAdd";
import { registerInteractionEvent } from "./events/interactionCreate";
import { registerCommandHandler } from "./events/commandHandler";
import { registerMessageEvent } from "./events/messageCreate";
import { registerSlashCommands } from "./commands/register";
import { logger } from "../lib/logger";

export function startBot() {
  const token = process.env["DISCORD_BOT_TOKEN"];
  if (!token) {
    logger.error("DISCORD_BOT_TOKEN is not set — bot will not start");
    return;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel, Partials.GuildMember, Partials.Message],
  });

  registerReadyEvent(client);
  registerWelcomeEvent(client);
  registerInteractionEvent(client);
  registerCommandHandler(client);
  registerMessageEvent(client);

  client.once("ready", async () => {
    await registerSlashCommands(client);
  });

  client.on("error", (err) => {
    logger.error({ err }, "Discord client error");
  });

  client.on("shardError", (err) => {
    logger.error({ err }, "Discord shard error");
  });

  process.on("unhandledRejection", (err) => {
    logger.error({ err }, "Unhandled rejection in bot");
  });

  client.login(token).catch((err) => {
    logger.error({ err }, "Failed to login to Discord — server will keep running");
  });

  logger.info("Discord bot starting...");
}
