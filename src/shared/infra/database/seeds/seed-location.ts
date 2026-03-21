import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

config({ path: `envs/.env.${process.env.NODE_ENV || "development"}` });

async function seed() {
  const client = postgres(process.env.DATABASE_URL!);

  try {
    const sqlPath = path.resolve(__dirname, "seed-location.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");

    await client.unsafe(sql);
    console.log("Seed de localizacao concluido com sucesso!");
  } catch (error) {
    console.error("Erro ao executar seed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
