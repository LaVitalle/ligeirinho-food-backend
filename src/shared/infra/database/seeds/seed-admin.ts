import { config } from "dotenv";
import postgres from "postgres";
import bcrypt from "bcryptjs";

config({ path: `envs/.env.${process.env.NODE_ENV || "development"}` });

async function seed() {
  const client = postgres(process.env.DATABASE_URL!);
  const email = process.env.ADMIN_EMAIL || "admin@ligeirinho.local";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const fullName = process.env.ADMIN_NAME || "Admin Global";

  try {
    const [{ exists }] = await client<{ exists: boolean }[]>`
      SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'users') AS exists
    `;
    if (!exists) {
      console.log("Tabela 'users' não encontrada. Execute as migrations antes do seed.");
      process.exit(1);
    }

    const rows = await client<{ count: number }[]>`
      SELECT COUNT(*)::int AS count FROM users WHERE email = ${email}
    `;
    if (rows[0].count > 0) {
      console.log("Usuário admin já existe — nenhum registro criado.");
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await client`
      INSERT INTO users (full_name, email, password_hash, role)
      VALUES (${fullName}, ${email}, ${passwordHash}, 'ADMIN'::user_role)
    `;

    console.log("Usuário 'Admin Global' criado com sucesso.");
  } catch (error) {
    console.error("Erro ao executar seed de admin:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();

