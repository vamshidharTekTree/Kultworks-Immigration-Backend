import { createLogger, format, transports } from 'winston';
import { env, logLevel } from '../configs/env.config.js';

const { combine, timestamp, colorize, printf, json, errors } = format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, ...meta }) => {
    const extra = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    return `${ts} [${level}] ${message}${extra}`;
  })
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const logger = createLogger({
  level: logLevel,
  format: env.local ? devFormat : prodFormat,
  transports: [
    new transports.Console(),
    ...(env.production
      ? [new transports.File({ filename: 'logs/error.log', level: 'error' })]
      : []),
  ],
});

export default logger;
