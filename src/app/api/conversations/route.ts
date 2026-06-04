import { mockConversations } from '@/lib/mock-data';

export async function GET() {
  try {
    const { db } = await import('@/lib/db');
    const convs = await db.conversation.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { messages: { orderBy: { timestamp: 'asc' } } },
    });
    if (convs.length === 0) return Response.json(mockConversations);
    return Response.json(convs);
  } catch {
    return Response.json(mockConversations);
  }
}
