import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: `envs/.env.${process.env.NODE_ENV || "development"}` });

export default defineConfig({
  schema: [
    "./src/shared/infra/schemas/*.ts",
    "./src/modules/**/infra/schemas/*.ts",
  ],
  out: "./src/shared/infra/database/drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
