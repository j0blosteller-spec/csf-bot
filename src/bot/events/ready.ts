import { type Client, ActivityType } from "discord.js";
import { readFileSync } from "node:fs";
import { logger } from "../../lib/logger";

export function registerReadyEvent(client: Client) {
  client.once("ready", async (c) => {
    logger.info(`Discord bot ready as ${c.user.tag}`);

    c.user.setPresence({
      activities: [{ name: "CSF | Tickets", type: ActivityType.Watching }],
      status: "online",
    });

    // Set bot avatar to CSF logo
    try {
      const logoPath = `${__dirname}/csf-logo.png`;
      const logoBuffer = readFileSync(logoPath);
      const base64 = logoBuffer.toString("base64");
      await c.user.setAvatar(`data:image/png;base64,${base64}`);
      logger.info("Bot avatar updated to CSF logo");
    } catch (err) {
      // Avatar can only be changed a few times per day — skip silently if rate limited
      logger.warn({ err }, "Could not update bot avatar (rate limited or unchanged)");
    }

    // Set bot description / bio
    try {
      await (c as unknown as { application: { edit: (o: object) => Promise<void> } }).application.edit({
        description: "Official CSF bot — ticket support, welcome messages, auto-mod, and server management for Classic Sword Fight.",
      });
      logger.info("Bot description updated");
    } catch (err) {
      logger.warn({ err }, "Could not update bot description");
    }
  });
}
