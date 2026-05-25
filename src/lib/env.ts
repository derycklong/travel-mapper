import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";

const ENV_PATH = join(process.cwd(), "data", ".env.local");

function ensureEnvFile(): void {
  if (existsSync(ENV_PATH)) return;
  mkdirSync(dirname(ENV_PATH), { recursive: true });
  writeFileSync(
    ENV_PATH,
    'ADMIN_PASSWORD=changeme\nGOOGLE_MAPS_API_KEY=\n',
    "utf-8"
  );
}

function loadEnv(): Record<string, string> {
  ensureEnvFile();
  const raw = readFileSync(ENV_PATH, "utf-8");
  const vars: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    vars[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return vars;
}

const _env = loadEnv();

export function getEnv(key: string, fallback = ""): string {
  return _env[key] || fallback;
}
