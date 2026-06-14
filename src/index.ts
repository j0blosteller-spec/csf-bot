import app from "./app";
import { logger } from "./lib/logger";
import { startBot } from "./bot/index";

startBot();

// Keep-alive: ping self every 4 minutes so Replit never sleeps the server
function startKeepAlive(port: number) {
  setInterval(() => {
    fetch(`http://localhost:${port}/api/healthz`)
      .catch(() => {}); // silent — just keeping the process warm
  }, 4 * 60 * 1000);
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  startKeepAlive(port);
});
