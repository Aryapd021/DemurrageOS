export interface Logger {
  info(obj: any, msg?: string): void;
  warn(obj: any, msg?: string): void;
  error(obj: any, msg?: string): void;
  debug(obj: any, msg?: string): void;
}

class PinoLikeLogger implements Logger {
  private formatLog(level: string, obj: any, msg?: string): string {
    const timestamp = new Date().toISOString();
    const payload = typeof obj === 'string' ? { message: obj } : { ...obj };
    if (msg) payload.msg = msg;
    return JSON.stringify({
      level,
      time: timestamp,
      ...payload
    });
  }

  info(obj: any, msg?: string): void {
    console.log(this.formatLog('info', obj, msg));
  }

  warn(obj: any, msg?: string): void {
    console.warn(this.formatLog('warn', obj, msg));
  }

  error(obj: any, msg?: string): void {
    console.error(this.formatLog('error', obj, msg));
  }

  debug(obj: any, msg?: string): void {
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(this.formatLog('debug', obj, msg));
    }
  }
}

export const logger = new PinoLikeLogger();
