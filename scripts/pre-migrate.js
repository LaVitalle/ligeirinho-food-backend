/**
 * Executa ALTER TYPE ADD VALUE fora de transação.
 * PostgreSQL não permite ADD VALUE dentro de transação,
 * então rodamos isso ANTES do Drizzle migrate.
 */
const postgres = require("postgres");

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("ERROR: DATABASE_URL is required");
    process.exit(1);
  }

  const sql = postgres(databaseUrl, { max: 1 });

  try {
    // Verifica se o enum user_role existe
    const enumExists = await sql`
      SELECT 1 FROM pg_type WHERE typname = 'user_role'
    `;
    if (enumExists.length === 0) {
      console.log("Enum user_role not found yet, skipping pre-migrate.");
      return;
    }

    // Adiciona INSTITUTION_ADMIN se não existir
    const valueExists = await sql`
      SELECT 1 FROM pg_enum
      WHERE enumlabel = 'INSTITUTION_ADMIN'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    `;
    if (valueExists.length === 0) {
      console.log("Adding INSTITUTION_ADMIN to user_role enum...");
      await sql.unsafe(`ALTER TYPE "public"."user_role" ADD VALUE 'INSTITUTION_ADMIN' BEFORE 'SELLER'`);
      console.log("Done.");
    } else {
      console.log("INSTITUTION_ADMIN already exists in user_role enum.");
    }
  } catch (error) {
    console.error("Pre-migrate error:", error.message);
    // Não faz exit(1) — se falhar aqui, o migrate normal pode lidar
  } finally {
    await sql.end();
  }
}

run();
