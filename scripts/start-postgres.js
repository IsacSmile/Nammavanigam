const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envPath = path.join(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}
loadEnv();

async function startPg() {
  const user = process.env.POSTGRES_USER || "postgres";
  const password = process.env.POSTGRES_PASSWORD || "";
  const database = process.env.POSTGRES_DB || "nammavanigam";
  const port = parseInt(process.env.POSTGRES_PORT || "5432", 10);

  console.log(`Initializing local PostgreSQL server on port ${port}...`);
  const { default: EmbeddedPostgres } = await import("embedded-postgres");

  const databasePath = path.join(__dirname, "../.postgres_data");

  const pg = new EmbeddedPostgres({
    port,
    user,
    password,
    database,
    databasePath,
  });

  try {
    await pg.initialise();
  } catch (e) {
    // Already initialised
  }

  await pg.start();
  console.log(`PostgreSQL server is running on port ${port}`);
  
  // Keep alive
  setInterval(() => {}, 1000 * 60 * 60);
}

startPg().catch((err) => {
  console.error("Failed to start PostgreSQL:", err);
  process.exit(1);
});
