import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema/index.ts", // Donde están tus entidades
  out: "./drizzle",                  // Donde se guardará el SQL generado
  dialect: "sqlite",
  driver: "expo",
} satisfies Config;
