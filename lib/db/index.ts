import dns from "node:dns";
import net from "node:net";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

dns.setDefaultResultOrder("ipv4first");
if (typeof net.setDefaultAutoSelectFamily === "function") {
  net.setDefaultAutoSelectFamily(false);
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is not set. Please create a .env.local file."
  );
}

let connectionString = process.env.DATABASE_URL;

try {
  const parsed = new URL(connectionString);
  parsed.searchParams.delete("channel_binding");
  connectionString = parsed.toString();
} catch {
  connectionString = connectionString.replace(/&?channel_binding=[^&]*/g, "");
}

const hasSslMode = connectionString.includes("sslmode=");
const isProduction = process.env.NODE_ENV === "production";

let sslConfig: boolean | "require" | { rejectUnauthorized: boolean } | undefined;

if (hasSslMode) {
  const sslModeMatch = connectionString.match(/sslmode=([^&]+)/);
  const sslMode = sslModeMatch ? sslModeMatch[1] : "prefer";

  if (sslMode === "disable") {
    sslConfig = false;
  } else if (sslMode === "require") {
    sslConfig = { rejectUnauthorized: false };
  } else {
    sslConfig = undefined;
  }
} else if (isProduction) {
  sslConfig = "require";
} else {
  sslConfig = false;
}

const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30,
  ...(sslConfig !== undefined && { ssl: sslConfig }),
});

export const db = drizzle(client, { schema });

export * from "./schema";
export {
  users,
  sessions,
  accounts,
  verifications,
  orgMemberships,
} from "./schema";
