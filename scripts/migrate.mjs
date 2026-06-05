#!/usr/bin/env node
/**
 * Applies the database schema to Turso (or any libsql endpoint).
 * Run with:  node scripts/migrate.mjs
 * Reads TURSO_DATABASE_URL and TURSO_AUTH_TOKEN from the environment.
 * Safe to run multiple times — all statements use CREATE TABLE IF NOT EXISTS.
 */

import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local if running locally ────────────────────────────────────────
try {
  const envPath = resolve(__dirname, '../.env.local');
  const lines = readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // Running in CI / Vercel — env vars already injected
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error('❌  TURSO_DATABASE_URL is not set.');
  console.error('   Add it to .env.local:  TURSO_DATABASE_URL=libsql://your-db.turso.io');
  process.exit(1);
}

console.log(`🔗  Connecting to ${url.replace(/authToken=.*/, 'authToken=***')} …`);

const client = createClient({ url, authToken });

// ── Schema statements ─────────────────────────────────────────────────────────
const STATEMENTS = [
  // Conversation (referenced by Order and Message)
  `CREATE TABLE IF NOT EXISTS "Conversation" (
    "id"             TEXT PRIMARY KEY NOT NULL,
    "customerName"   TEXT NOT NULL,
    "customerHandle" TEXT NOT NULL,
    "source"         TEXT NOT NULL DEFAULT 'whatsapp',
    "stage"          TEXT NOT NULL DEFAULT 'inquiry',
    "createdAt"      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  // Message
  `CREATE TABLE IF NOT EXISTS "Message" (
    "id"             TEXT PRIMARY KEY NOT NULL,
    "role"           TEXT NOT NULL,
    "content"        TEXT NOT NULL,
    "timestamp"      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conversationId" TEXT NOT NULL,
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE
  )`,

  // Order
  `CREATE TABLE IF NOT EXISTS "Order" (
    "id"                       TEXT PRIMARY KEY NOT NULL,
    "customerName"             TEXT NOT NULL,
    "customerPhone"            TEXT NOT NULL,
    "customerWhatsapp"         TEXT NOT NULL,
    "product"                  TEXT NOT NULL,
    "amount"                   REAL NOT NULL,
    "status"                   TEXT NOT NULL DEFAULT 'pending_payment',
    "paymentMode"              TEXT NOT NULL DEFAULT 'upi',
    "paymentId"                TEXT,
    "source"                   TEXT NOT NULL DEFAULT 'whatsapp',
    "notes"                    TEXT,
    "createdAt"                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt"                   DATETIME,
    "advancePaid"              REAL,
    "balanceDue"               REAL,
    "balanceDueDate"           DATETIME,
    "balancePaid"              INTEGER NOT NULL DEFAULT 0,
    "awb"                      TEXT,
    "courier"                  TEXT,
    "trackingUrl"              TEXT,
    "shipmentTriggeredAt"      DATETIME,
    "shipmentStatus"           TEXT,
    "whatsappConfirmationSent" INTEGER NOT NULL DEFAULT 0,
    "receiptSent"              INTEGER NOT NULL DEFAULT 0,
    "conversationId"           TEXT,
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL
  )`,

  // PaymentLink
  `CREATE TABLE IF NOT EXISTS "PaymentLink" (
    "id"             TEXT PRIMARY KEY NOT NULL,
    "razorpayId"     TEXT NOT NULL UNIQUE,
    "url"            TEXT NOT NULL,
    "amount"         REAL NOT NULL,
    "status"         TEXT NOT NULL DEFAULT 'created',
    "createdAt"      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt"         DATETIME,
    "conversationId" TEXT,
    "orderId"        TEXT,
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL,
    FOREIGN KEY ("orderId")        REFERENCES "Order"("id")        ON DELETE SET NULL
  )`,

  // Workflow
  `CREATE TABLE IF NOT EXISTS "Workflow" (
    "id"        TEXT PRIMARY KEY NOT NULL,
    "name"      TEXT NOT NULL,
    "prompt"    TEXT NOT NULL DEFAULT '',
    "status"    TEXT NOT NULL DEFAULT 'draft',
    "nodes"     TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  // WorkflowRun
  `CREATE TABLE IF NOT EXISTS "WorkflowRun" (
    "id"         TEXT PRIMARY KEY NOT NULL,
    "trigger"    TEXT NOT NULL,
    "status"     TEXT NOT NULL DEFAULT 'running',
    "log"        TEXT NOT NULL DEFAULT '[]',
    "startedAt"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "workflowId" TEXT NOT NULL,
    "orderId"    TEXT,
    FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE,
    FOREIGN KEY ("orderId")    REFERENCES "Order"("id")    ON DELETE SET NULL
  )`,
];

// ── Run ───────────────────────────────────────────────────────────────────────
let ok = 0;
for (const sql of STATEMENTS) {
  const table = sql.match(/"(\w+)"/)?.[1] ?? '?';
  try {
    await client.execute(sql);
    console.log(`  ✅  ${table}`);
    ok++;
  } catch (err) {
    console.error(`  ❌  ${table}:`, err.message);
  }
}

console.log(`\n${ok}/${STATEMENTS.length} tables created / verified.`);

if (ok === STATEMENTS.length) {
  console.log('✨  Schema is up to date. App will now persist data to Turso.');
} else {
  console.log('⚠️   Some tables failed — check the errors above.');
  process.exit(1);
}

client.close?.();
