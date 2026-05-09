import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOG_DIR = path.join(__dirname, '..', 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
     fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Returns today's log file path as: logs/YYYY-MM-DD.log
 */
const getDailyLogFile = (): string => {
     const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
     return path.join(LOG_DIR, `${date}.log`);
};

/**
 * Appends a formatted log entry to the daily log file.
 * @param level - INFO, ERROR, or WARN
 * @param message - The message to log
 * @param context - Optional context
 */
const writeLog = (level: 'INFO' | 'ERROR' | 'WARN', message: string, context: string = ''): void => {
     const timestamp = new Date().toISOString();
     const contextLabel = context ? ` [${context}]` : '';
     const entry = `[${timestamp}] [${level}]${contextLabel} ${message}\n`;

     // Always print to console too
     if (level === 'ERROR') {
          console.error(entry.trim());
     } else {
          console.log(entry.trim());
     }

     try {
          fs.appendFileSync(getDailyLogFile(), entry, 'utf8');
     } catch (err: any) {
          console.error('Logger failed to write to file:', err.message);
     }
};

/**
 * Log an informational message.
 * @param message - The message to log
 * @param context - Optional context
 */
export const logInfo = (message: string, context?: string): void => {
     writeLog('INFO', message, context);
};

/**
 * Log a warning message.
 * @param message - The message to log
 * @param context - Optional context
 */
export const logWarn = (message: string, context?: string): void => {
     writeLog('WARN', message, context);
};

/**
 * Log an error. Accepts an Error object or a plain string.
 * @param err - Error object or string
 * @param context - Optional context
 */
export const logError = (err: Error | string, context?: string): void => {
     const message = err instanceof Error
          ? `${err.message}\n${err.stack || ''}`
          : String(err);
     writeLog('ERROR', message, context);
};
