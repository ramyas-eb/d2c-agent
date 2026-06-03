import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { role, content } = await req.json();

  const message = await db.message.create({
    data: { role, content, conversationId: id },
  });

  // Bump conversation updatedAt so it floats to top
  await db.conversation.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  return Response.json(message, { status: 201 });
}
