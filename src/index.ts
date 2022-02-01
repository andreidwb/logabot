import { config } from "dotenv";
config({ path: `.env.${process.env.NODE_ENV}` });

import { createHttpTerminator } from "http-terminator";
import { app } from "./app";
import logger from "./util/logger";
import { bot } from "./bot/bot";
import { appConfig } from "./config";

const server = app.listen(appConfig.port || 3000, () => {
  logger.info(`started server on http://localhost:${appConfig.port || 3000} in ${process.env.NODE_ENV} mode`);
});

const httpTerminator = createHttpTerminator({ server });
const shutdownSignals = ["SIGTERM", "SIGINT"];

shutdownSignals.forEach((signal) =>
  process.on(signal, async () => {
    logger.info(`${signal} received, closing gracefully ...`);
    await httpTerminator.terminate();
  })
);

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
