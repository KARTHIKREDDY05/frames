import "dotenv/config";
import { loadServerEnv } from "@frames/config";

export const env = loadServerEnv(process.env);
