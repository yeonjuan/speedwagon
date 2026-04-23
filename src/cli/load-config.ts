import { readFile } from "fs/promises";
import { join } from "path";
import type { Config } from "../types/index.js";

const CONFIG_FILE = "speedwagon.json";

export async function loadConfig(): Promise<Config> {
  const configPath = join(process.cwd(), CONFIG_FILE);
  try {
    const content = await readFile(configPath, "utf-8");
    return JSON.parse(content) as Config;
  } catch {
    return {};
  }
}
