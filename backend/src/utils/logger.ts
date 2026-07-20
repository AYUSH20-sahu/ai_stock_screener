type LogLevel = 'info' | 'warn' | 'error';

class Logger {
    private write(level: LogLevel, message: string, meta?: unknown) {
        const entry = {
            level,
            message,
            timestamp: new Date().toISOString(),
            ...(meta ? { meta } : {}),
        };

        if (level === 'error') {
            console.error(entry);
            return;
        }

        if (level === 'warn') {
            console.warn(entry);
            return;
        }

        console.info(entry);
    }

    info(message: string, meta?: unknown) {
        this.write('info', message, meta);
    }

    warn(message: string, meta?: unknown) {
        this.write('warn', message, meta);
    }

    error(message: string, meta?: unknown) {
        this.write('error', message, meta);
    }
}

export const logger = new Logger();
