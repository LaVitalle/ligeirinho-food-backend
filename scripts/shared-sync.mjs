// Vendoriza o pacote canônico shared/src para dentro de cada microsserviço
// (services/<svc>/src/shared). Mantém cada repo autossuficiente após o split.
// Uso: node scripts/shared-sync.mjs
import { cpSync, existsSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sharedSrc = join(root, "shared", "src");
const servicesDir = join(root, "services");

// O gateway é um proxy puro; não consome o shared de domínio/DB.
const EXCLUDE = new Set(["gateway"]);

const services = readdirSync(servicesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !EXCLUDE.has(d.name))
  .map((d) => d.name);

for (const svc of services) {
  const dest = join(servicesDir, svc, "src", "shared");
  if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
  cpSync(sharedSrc, dest, { recursive: true });
  console.log(`shared/src -> services/${svc}/src/shared`);
}

console.log(`\nSincronizado para ${services.length} serviço(s): ${services.join(", ")}`);
