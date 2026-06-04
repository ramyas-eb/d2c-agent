import { db } from '@/lib/db';
import { mockConversations } from '@/lib/mock-data';

export async function GET() {
  try {
    const convs = await db.conversation.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { messages: { orderBy: { timestamp: 'asc' } } },
    });
    // If DB is empty (not seeded), return mock data so the demo works
    if (convs.length === 0) return Response.json(mockConversations);
    return Response.json(convs);
  } catch {
    // DB not available — return mock data
    return Response.json(mockConversations);
  }
}
