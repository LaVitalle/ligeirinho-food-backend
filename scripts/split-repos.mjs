// Faz o split de cada serviço do monorepo para o seu próprio repositório GitHub
// (deploy isolado no EasyPanel). Cada services/<svc> é autossuficiente (shared
// vendorizado), então `git subtree push` empurra a pasta como raiz do repo.
//
// Uso:
//   1) Crie os 4 repos no GitHub (vazios).
//   2) Exporte as URLs (SSH ou HTTPS):
//        REPO_GATEWAY=git@github.com:voce/ligeirinho-gateway.git
//        REPO_IDENTITY=git@github.com:voce/ligeirinho-identity.git
//        REPO_CATALOG=git@github.com:voce/ligeirinho-catalog.git
//        REPO_ORDERS=git@github.com:voce/ligeirinho-orders.git
//   3) Rode: node scripts/split-repos.mjs   (ou: npm run split)
//
// Observação: rode com a árvore de trabalho limpa (commits pendentes resolvidos).
import { execSync } from "node:child_process";

const BRANCH = process.env.SPLIT_BRANCH || "main";

const REPOS = {
  gateway: process.env.REPO_GATEWAY,
  identity: process.env.REPO_IDENTITY,
  catalog: process.env.REPO_CATALOG,
  orders: process.env.REPO_ORDERS,
};

function run(cmd) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

// Garante o shared vendorizado atualizado em cada serviço antes do split.
run("node scripts/shared-sync.mjs");

let pendingChanges = false;
try {
  execSync("git diff --quiet && git diff --cached --quiet");
} catch {
  pendingChanges = true;
}
if (pendingChanges) {
  run('git add -A');
  run('git commit -m "chore: sincroniza shared antes do split de repos"');
}

let did = 0;
for (const [svc, remote] of Object.entries(REPOS)) {
  if (!remote) {
    console.log(`\n[pular] ${svc}: defina a env REPO_${svc.toUpperCase()}`);
    continue;
  }
  console.log(`\n=== ${svc} -> ${remote} (${BRANCH}) ===`);
  run(`git subtree push --prefix=services/${svc} ${remote} ${BRANCH}`);
  did += 1;
}

console.log(`\nConcluído. ${did} serviço(s) publicado(s).`);
if (did === 0) {
  console.log("Nenhuma URL definida. Exporte REPO_GATEWAY/REPO_IDENTITY/REPO_CATALOG/REPO_ORDERS.");
}
