import { env } from '$env/dynamic/private';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

function getMinLevel(): number {
    const configured = (env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;
    return LEVELS[configured] ?? LEVELS.info;
}

function format(level: LogLevel, tag: string, message: string, data?: Record<string, unknown>): string {
    const parts = [`[${level.toUpperCase()}]`, `[${tag}]`, message];
    if (data && Object.keys(data).length > 0) {
        parts.push(JSON.stringify(data));
    }
    return parts.join(' ');
}

export interface Logger {
    debug(message: string, data?: Record<string, unknown>): void;
    info(message: string, data?: Record<string, unknown>): void;
    warn(message: string, data?: Record<string, unknown>): void;
    error(message: string, data?: Record<string, unknown>): void;
}

export function createLogger(tag: string): Logger {
    return {
        debug(message, data) {
            if (getMinLevel() <= LEVELS.debug) {
                console.log(format('debug', tag, message, data));
            }
        },
        info(message, data) {
            if (getMinLevel() <= LEVELS.info) {
                console.log(format('info', tag, message, data));
            }
        },
        warn(message, data) {
            if (getMinLevel() <= LEVELS.warn) {
                console.warn(format('warn', tag, message, data));
            }
        },
        error(message, data) {
            if (getMinLevel() <= LEVELS.error) {
                console.error(format('error', tag, message, data));
            }
        },
    };
}
