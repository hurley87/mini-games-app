import { publishCast } from '@/lib/neynar';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Run } from 'openai/resources/beta/threads/runs/runs';

// Constants
const ASSISTANT_ID = process.env.ASSISTANT_ID as string;
const POLLING_INTERVAL = 1000; // ms
const NEYNAR_CAST_CHAR_LIMIT = 320; // Max characters for a Farcaster cast

type MessageContentPartParam = {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
};

interface BackgroundOpenAIRequest {
  threadId: string;
  content: MessageContentPartParam[];
  parent: string;
  verifiedAddress?: string;
  fid?: number;
  image?: string;
}

// Route configuration
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Waits for an OpenAI run to complete by polling its status.
 */
const waitForRunCompletion = async (
  client: OpenAI,
  threadId: string,
  runId: string
): Promise<Run> => {
  let runStatus: Run;
  do {
    await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
    try {
      runStatus = await client.beta.threads.runs.retrieve(threadId, runId);
    } catch (error) {
      console.error(`Error retrieving run status for run ${runId}:`, error);
      throw new Error(`Failed to retrieve run status: ${error}`);
    }
  } while (runStatus.status === 'in_progress' || runStatus.status === 'queued');
  return runStatus;
};

/**
 * Handles a completed OpenAI run by extracting the assistant's response and publishing it.
 */
const handleCompletedRun = async (
  client: OpenAI,
  threadId: string,
  parent: string
): Promise<void> => {
  try {
    const messages = await client.beta.threads.messages.list(threadId, {
      order: 'desc',
      limit: 1,
    });
    const latestMessage = messages.data[0];

    if (
      latestMessage?.role === 'assistant' &&
      latestMessage.content[0]?.type === 'text'
    ) {
      const assistantResponse = latestMessage.content[0].text.value;
      console.log('✅ Assistant response:', assistantResponse);

      if (!assistantResponse || assistantResponse.trim().length === 0) {
        console.warn(
          `⚠️ Assistant generated empty response for thread ${threadId}. Skipping publish.`
        );
        return;
      }

      if (assistantResponse.length > NEYNAR_CAST_CHAR_LIMIT) {
        console.warn(
          `⚠️ Assistant response exceeded character limit (${assistantResponse.length}/${NEYNAR_CAST_CHAR_LIMIT}) for thread ${threadId}.`
        );
        const truncatedResponse = assistantResponse.slice(
          0,
          NEYNAR_CAST_CHAR_LIMIT
        );
        await publishCast(truncatedResponse, parent);
        return;
      }

      await publishCast(assistantResponse, parent);
      console.log(`Published cast reply to ${parent}`);
    } else {
      console.warn(
        `No suitable assistant message found in thread ${threadId} to publish.`
      );
    }
  } catch (error) {
    console.error(
      `Error handling completed run for thread ${threadId}:`,
      error
    );
    throw error;
  }
};

/**
 * Main API route handler
 */
export async function POST(request: Request) {
  const client = new OpenAI();

  try {
    const body: BackgroundOpenAIRequest = await request.json();
    const { threadId, content, parent, verifiedAddress, fid, image } = body;

    console.log('Processing OpenAI interaction for thread:', threadId);

    // Add user message to thread
    await client.beta.threads.messages.create(threadId, {
      role: 'user',
      // @ts-expect-error - OpenAI SDK type mismatch
      content: content,
    });
    console.log(`Added user message to thread ${threadId}`);

    // Run Assistant on Conversation Thread
    const run = await client.beta.threads.runs.create(threadId, {
      assistant_id: ASSISTANT_ID,
    });
    console.log(`Started run ${run.id} for thread ${threadId}`);

    const runStatus = await waitForRunCompletion(client, threadId, run.id);
    console.log(`Run ${run.id} completed with status: ${runStatus.status}`);

    // Handle Run Outcome
    if (runStatus.status === 'completed') {
      await handleCompletedRun(client, threadId, parent);
    } else if (runStatus.status === 'requires_action') {
      const toolCalls =
        runStatus.required_action?.submit_tool_outputs?.tool_calls;
      if (toolCalls && toolCalls.length > 0) {
        // Forward tool calls to the tool handler
        for (const call of toolCalls) {
          try {
            const args = JSON.parse(call.function.arguments);
            const toolRequest = {
              toolCallId: call.id,
              runId: run.id,
              threadId,
              toolName: call.function.name,
              args,
              parent,
              verifiedAddress,
              fid,
              image,
            };

            void fetch(`${process.env.BASE_URL}/api/handle-tool.background`, {
              method: 'POST',
              body: JSON.stringify(toolRequest),
              headers: { 'Content-Type': 'application/json' },
            }).catch((fetchError) => {
              console.error(
                `Error initiating background task for tool ${call.function.name} (call ID: ${call.id}):`,
                fetchError
              );
            });
            console.log(
              `Dispatched background task for tool: ${call.function.name}`
            );
          } catch (parseError) {
            console.error(
              `Error parsing arguments for tool ${call.function.name} (call ID: ${call.id}):`,
              parseError
            );
          }
        }
      } else {
        console.warn(`Run ${run.id} requires action but has no tool calls.`);
      }
    } else {
      console.error(
        `Run ${run.id} ended with unhandled status: ${runStatus.status}`,
        runStatus.last_error
      );
      throw new Error(`Run failed with status ${runStatus.status}.`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in OpenAI background task:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
