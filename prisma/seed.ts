import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { mockOrders, mockConversations } from '../src/lib/mock-data';

// ── Detect local vs Turso ──────────────────────────────────────────────────
const remoteUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const dbPath = path.resolve(process.cwd(), 'dev.db');

if (!remoteUrl) {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
}

// ── Create client AFTER migration ──────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('../src/generated/prisma/client') as typeof import('../src/generated/prisma/client');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaLibSql } = require('@prisma/adapter-libsql') as typeof import('@prisma/adapter-libsql');

const adapter = remoteUrl
  ? new PrismaLibSql({ url: remoteUrl, authToken })
  : new PrismaLibSql({ url: `file:${dbPath}` });
const db = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

// ── Seed ───────────────────────────────────────────────────────────────────
async function main() {
  // Apply schema to Turso if using remote DB (prisma migrate doesn't support libsql:// URLs)
  if (remoteUrl) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@libsql/client') as typeof import('@libsql/client');
    const client = createClient({ url: remoteUrl, authToken });
    const migrationSql = fs.readFileSync(
      path.join(__dirname, '../prisma/migrations/20260603081150_init/migration.sql'),
      'utf-8'
    );
    await client.executeMultiple(migrationSql);
    console.log('Applied schema to Turso');
  }

  console.log('Seeding database...');

  for (const conv of mockConversations) {
    await db.conversation.upsert({
      where: { id: conv.id },
      update: {
        customerName: conv.customerName,
        customerHandle: conv.customerHandle,
        source: conv.source,
        stage: conv.stage,
      },
      create: {
        id: conv.id,
        customerName: conv.customerName,
        customerHandle: conv.customerHandle,
        source: conv.source,
        stage: conv.stage,
      },
    });
    for (const m of conv.messages) {
      const uniqueId = `${conv.id}-${m.id}`;
      await db.message.upsert({
        where: { id: uniqueId },
        update: { content: m.content },
        create: {
          id: uniqueId,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp),
          conversationId: conv.id,
        },
      });
    }
  }

  for (const o of mockOrders) {
    await db.order.upsert({
      where: { id: o.id },
      update: { status: o.status },
      create: {
        id: o.id,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        customerWhatsapp: o.customerWhatsapp,
        product: o.product,
        amount: o.amount,
        status: o.status,
        paymentMode: o.paymentMode,
        paymentId: o.paymentId ?? null,
        source: o.source,
        notes: o.notes ?? null,
        createdAt: new Date(o.createdAt),
        paidAt: o.paidAt ? new Date(o.paidAt) : null,
        advancePaid: o.partial?.advancePaid ?? null,
        balanceDue: o.partial?.balanceDue ?? null,
        balanceDueDate: o.partial?.balanceDueDate ? new Date(o.partial.balanceDueDate) : null,
        balancePaid: o.partial?.balancePaid ?? false,
        awb: o.shipment?.awb ?? null,
        courier: o.shipment?.courier ?? null,
        trackingUrl: o.shipment?.trackingUrl ?? null,
        shipmentTriggeredAt: o.shipment?.triggeredAt ? new Date(o.shipment.triggeredAt) : null,
        shipmentStatus: o.shipment?.status ?? null,
        whatsappConfirmationSent: o.whatsappConfirmationSent,
        receiptSent: o.receiptSent,
      },
    });
  }

  const workflows = [
    { id: 'flow-1', name: 'Post-payment fulfilment', prompt: 'ship via shiprocket and send whatsapp confirmation and receipt', status: 'live', nodes: '[]' },
    { id: 'flow-2', name: 'Balance due reminder', prompt: 'send balance due reminder 2 days before due date', status: 'live', nodes: '[]' },
    { id: 'flow-3', name: 'High-value VIP flow', prompt: 'for orders over 5000 use priority courier and send VIP message', status: 'draft', nodes: '[]' },
    { id: 'flow-4', name: 'Failed payment retry', prompt: 'when payment fails send retry link after 30 minutes', status: 'paused', nodes: '[]' },
  ];
  for (const wf of workflows) {
    await db.workflow.upsert({
      where: { id: wf.id },
      update: { name: wf.name, status: wf.status },
      create: wf,
    });
  }

  console.log('✅ Seed complete');
  console.log(`   ${mockConversations.length} conversations`);
  console.log(`   ${mockOrders.length} orders`);
  console.log(`   ${workflows.length} workflows`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
