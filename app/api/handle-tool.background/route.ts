import { publishCast } from '@/lib/neynar';
import { taskHandlers } from '@/lib/task-handlers';
import { NextResponse } from 'next/server';
import { openaiService } from '@/lib/openai';

// Route configuration
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Main API route handler
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      toolCallId,
      runId,
      threadId,
      toolName,
      args,
      parent,
      verifiedAddress,
      fid,
      image
    } = body;

    let result;

    console.log('toolName', toolName);
    console.log('args', args);
    console.log('parent', parent);
    console.log('verifiedAddress', verifiedAddress);
    console.log('fid', fid);

    switch (toolName) {
      case 'create_game':
        result = await taskHandlers.handleCreateGame({
          ...args,
          parent,
          verifiedAddress,
          fid,
          threadId,
          image,
          runId
        });
        if (result.success && result.data && 'gameId' in result.data) {
          await publishCast(
            `Game created!`,
            parent,
            `https://app.minigames.studio/games/${result.data.gameId}`
          );
        }
        break;

      default:
        throw new Error(`Unsupported tool: ${toolName}`);
    }

    await openaiService.submitToolOutput(threadId, runId, toolCallId, JSON.stringify(result));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing background task:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to process task',
      },
      { status: 500 }
    );
  }
}
