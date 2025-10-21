/**
 * Logger утилита для production-ready логирования
 * В production логи не выводятся в консоль
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

class Logger {
  private enabled: boolean;

  constructor() {
    this.enabled = isDevelopment;
  }

  log(...args: any[]) {
    if (this.enabled) {
      console.log('[LOG]', ...args);
    }
  }

  info(...args: any[]) {
    if (this.enabled) {
      console.info('[INFO]', ...args);
    }
  }

  warn(...args: any[]) {
    if (this.enabled) {
      console.warn('[WARN]', ...args);
    }
  }

  error(...args: any[]) {
    // Ошибки логируем всегда, но в production отправляем в Sentry
    console.error('[ERROR]', ...args);
    
    if (isProduction && typeof window !== 'undefined') {
      // TODO: Отправить в Sentry или другой error tracking
      // Sentry.captureException(args[0]);
    }
  }

  debug(...args: any[]) {
    if (this.enabled) {
      console.debug('[DEBUG]', ...args);
    }
  }

  group(label: string) {
    if (this.enabled) {
      console.group(label);
    }
  }

  groupEnd() {
    if (this.enabled) {
      console.groupEnd();
    }
  }

  table(data: any) {
    if (this.enabled) {
      console.table(data);
    }
  }

  time(label: string) {
    if (this.enabled) {
      console.time(label);
    }
  }

  timeEnd(label: string) {
    if (this.enabled) {
      console.timeEnd(label);
    }
  }
}

export const logger = new Logger();

// Для обратной совместимости экспортируем методы
export const { log, info, warn, error, debug, group, groupEnd, table, time, timeEnd } = logger;

