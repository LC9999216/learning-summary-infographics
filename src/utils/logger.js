class Logger {
  constructor() {
    this.enableDebug = process.env.DEBUG === 'true';
  }

  info(message, ...args) {
    console.log(`[INFO] ${message}`, ...args);
  }

  error(message, ...args) {
    console.error(`[ERROR] ${message}`, ...args);
  }

  warn(message, ...args) {
    console.warn(`[WARN] ${message}`, ...args);
  }

  debug(message, ...args) {
    if (this.enableDebug) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  success(message, ...args) {
    console.log(`[OK] ${message}`, ...args);
  }
}

export default new Logger();
