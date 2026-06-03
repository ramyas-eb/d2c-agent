import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { stage } = await req.json();

  const conv = await db.conversation.update({
    where: { id },
    data: { stage },
  });
  return Response.json(conv);
}
