import pino from "pino";

const logger = pino({
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true
        }
    }
});

logger.info('hi, this is the pino prettifier');

export default logger;