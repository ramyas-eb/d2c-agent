import { NextRequest } from 'next/server';
import { runAgent } from '@/services/agent';

export async function POST(req: NextRequest) {
  const { messages, convStage, products = [], agentSettings = {} } = await req.json();

  const result = await runAgent({ messages, products, settings: agentSettings, convStage });
  return Response.json(result);
}
