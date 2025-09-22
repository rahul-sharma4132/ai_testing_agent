export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
  }
  
  export class Logger {
    constructor(
      private context: string,
      private level: LogLevel = LogLevel.INFO
    ) {}
  
    error(message: string, error?: any): void {
      if (this.level >= LogLevel.ERROR) {
        console.error(`[${this.context}] ERROR: ${message}`, error || '');
      }
    }
  
    warn(message: string): void {
      if (this.level >= LogLevel.WARN) {
        console.warn(`[${this.context}] WARN: ${message}`);
      }
    }
  
    info(message: string): void {
      if (this.level >= LogLevel.INFO) {
        console.log(`[${this.context}] INFO: ${message}`);
      }
    }
  
    debug(message: string, data?: any): void {
      if (this.level >= LogLevel.DEBUG) {
        console.log(`[${this.context}] DEBUG: ${message}`, data || '');
      }
    }
  }