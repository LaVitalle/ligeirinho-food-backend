// Aplica as migrations do Drizzle (pasta ./drizzle) e encerra a conexão.
// Usa postgres.js diretamente — saída limpa e mensagens de erro claras.
const postgres = require("postgres");
const { drizzle } = require("drizzle-orm/postgres-js");
const { migrate } = require("drizzle-orm/postgres-js/migrator");

(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("ERROR: DATABASE_URL é obrigatória");
    process.exit(1);
  }

  const sql = postgres(url, { max: 1 });
  const db = drizzle(sql);

  try {
    console.log("Aplicando migrations...");
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Migrations aplicadas com sucesso.");
  } catch (error) {
    console.error("Falha ao aplicar migrations:", error);
    await sql.end();
    process.exit(1);
  }

  await sql.end();
  process.exit(0);
})();
