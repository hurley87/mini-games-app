import { publishCast } from '@/lib/neynar';
import { notifyAllUsers } from '@/lib/notifications';
import { taskHandlers } from '@/lib/task-handlers';
import { NextResponse } from 'next/server';

// Route configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Main API route handler
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { runId, threadId, toolName, args, parent, verifiedAddress, fid } =
      body;

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
          runId,
        });
        console.log('result', result);
        if (result.success && result.data && 'gameId' in result.data) {
          await publishCast(
            `Game created!`,
            parent,
            `https://app.minigames.studio/info/${result.data.gameId}`
          );
          await notifyAllUsers(
            `Game created!`,
            `It's called ${args.name}.`,
            result.data.gameId
          );
        }
        break;

      default:
        throw new Error(`Unsupported tool: ${toolName}`);
    }

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
