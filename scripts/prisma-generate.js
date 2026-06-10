/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const SCHEMA_PATH = path.join(process.cwd(), "prisma", "schema.prisma");
const PROVIDER = process.env.DB_PROVIDER || "postgresql";
const VALID_PROVIDERS = ["postgresql", "sqlite"];

if (!VALID_PROVIDERS.includes(PROVIDER)) {
  console.error(
    `Invalid DB_PROVIDER: ${PROVIDER}. Must be one of: ${VALID_PROVIDERS.join(", ")}`
  );
  process.exit(1);
}

const original = fs.readFileSync(SCHEMA_PATH, "utf8");

// Replace only the datasource provider (not generator client)
const modified = original.replace(
  /(datasource db \{[\s\S]*?provider\s*=\s*)"[^"]+"/,
  `$1"${PROVIDER}"`
);

fs.writeFileSync(SCHEMA_PATH, modified);

try {
  execSync("npx prisma generate", { stdio: "inherit", cwd: process.cwd() });
} finally {
  // Always restore original schema
  fs.writeFileSync(SCHEMA_PATH, original);
}
