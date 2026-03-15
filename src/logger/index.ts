export const logger = {
  info(message: string) {
    console.log(`\x1b[36mℹ\x1b[0m ${message}`);
  },

  success(message: string) {
    console.log(`\x1b[32m✓\x1b[0m ${message}`);
  },

  error(message: string) {
    console.error(`\x1b[31m✗\x1b[0m ${message}`);
  },

  warn(message: string) {
    console.warn(`\x1b[33m⚠\x1b[0m ${message}`);
  },

  list(items: string[], title?: string) {
    if (title) {
      console.log(`\x1b[1m${title}\x1b[0m`);
    }
    items.forEach((item, index) => {
      console.log(`  \x1b[2m${index + 1}.\x1b[0m ${item}`);
    });
  },

  divider() {
    console.log("\x1b[2m" + "─".repeat(50) + "\x1b[0m");
  },
};
