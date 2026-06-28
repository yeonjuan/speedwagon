let enabled = false;

export const logger = {
  enable(): void {
    enabled = true;
  },
  debug(...args: unknown[]): void {
    if (enabled) process.stderr.write(`[debug] ${args.join(" ")}\n`);
  },
};
