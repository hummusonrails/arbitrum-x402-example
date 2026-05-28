import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Single source of truth: the monorepo root .env (three levels up from apps/demo/src).
const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, "../../../.env") });
