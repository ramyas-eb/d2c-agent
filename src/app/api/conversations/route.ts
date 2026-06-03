import { db } from '@/lib/db';

export async function GET() {
  const convs = await db.conversation.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { messages: { orderBy: { timestamp: 'asc' } } },
  });
  return Response.json(convs);
}
