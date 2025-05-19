import { publishCast } from '@/lib/neynar';
import { supabaseService } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Run } from 'openai/resources/beta/threads/runs/runs';

type MessageContentPartParam = {
  type: 'text' | 'image_url';
  text?: string; // Make text optional since it's not needed for image_url
  image_url?: {
    url: string;
  };
};

// Types
interface WebhookRequestData {
  text: string;
  thread_hash: string;
  hash: string;
  author?: {
    fid?: number;
    pfp?: string;
    profile?: {
      bio?: {
        text?: string;
      };
    };
    verified_addresses?: {
      eth_addresses?: string[];
    };
  };
  embeds?: Array<{
    url?: string;
  }>;
}
interface WebhookRequest {
  data: WebhookRequestData;
}

interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

interface BackgroundToolRequest {
  toolCallId: string;
  runId: string;
  threadId: string;
  toolName: string;
  args: Record<string, unknown>;
  parent: string;
  verifiedAddress?: string;
  fid?: number;
  image?: string;
}

// Constants
const ASSISTANT_ID = process.env.ASSISTANT_ID as string;
const POLLING_INTERVAL = 1000; // ms
const NEYNAR_CAST_CHAR_LIMIT = 320; // Max characters for a Farcaster cast

// --- Helper Functions ---

/**
 * Waits for an OpenAI run to complete by polling its status.
 * @param client - The OpenAI client instance.
 * @param threadId - The ID of the thread the run belongs to.
 * @param runId - The ID of the run to monitor.
 * @returns The completed or final status Run object.
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
      // Decide how to handle polling errors, e.g., retry limit or throw
      throw new Error(`Failed to retrieve run status: ${error}`);
    }
  } while (runStatus.status === 'in_progress' || runStatus.status === 'queued');
  return runStatus;
};

/**
 * Handles a completed OpenAI run by extracting the assistant's response and publishing it.
 * @param client - The OpenAI client instance.
 * @param threadId - The ID of the thread.
 * @param parent - The parent cast hash to reply to.
 */
const handleCompletedRun = async (
  client: OpenAI,
  threadId: string,
  parent: string
): Promise<void> => {
  try {
    const messages = await client.beta.threads.messages.list(threadId, {
      order: 'desc',
      limit: 1, // Only need the latest message
    });
    const latestMessage = messages.data[0];

    if (
      latestMessage?.role === 'assistant' &&
      latestMessage.content[0]?.type === 'text'
    ) {
      const assistantResponse = latestMessage.content[0].text.value;
      console.log('✅ Assistant response:', assistantResponse);

      // --- Validation before publishing ---
      if (!assistantResponse || assistantResponse.trim().length === 0) {
        console.warn(
          `⚠️ Assistant generated empty response for thread ${threadId}. Skipping publish.`
        );
        return; // Don't publish empty casts
      }

      if (assistantResponse.length > NEYNAR_CAST_CHAR_LIMIT) {
        console.warn(
          `⚠️ Assistant response exceeded character limit (${assistantResponse.length}/${NEYNAR_CAST_CHAR_LIMIT}) for thread ${threadId}. Skipping publish.`
        );
        // Optionally, you could truncate the message here:
        const truncatedResponse = assistantResponse.slice(
          0,
          NEYNAR_CAST_CHAR_LIMIT
        );
        await publishCast(truncatedResponse, parent);
        return; // Don't publish oversized casts (or publish truncated)
      }
      // --- End Validation ---

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
    // Consider re-throwing or specific error handling
  }
};

/**
 * Initiates background processing for required tool calls from an OpenAI run.
 * @param toolCalls - An array of tool calls required by the assistant.
 * @param runId - The ID of the run requiring action.
 * @param threadId - The ID of the thread.
 * @param parent - The parent cast hash.
 * @param verifiedAddress - The verified Ethereum address of the user, if available.
 */
const handleToolCalls = (
  toolCalls: ToolCall[],
  runId: string,
  threadId: string,
  parent: string,
  verifiedAddress?: string,
  fid?: number,
  image?: string
): void => {
  console.log(`Handling ${toolCalls.length} tool call(s) for run ${runId}`);
  for (const call of toolCalls) {
    try {
      const args = JSON.parse(call.function.arguments);
      const backgroundRequest: BackgroundToolRequest = {
        toolCallId: call.id,
        runId,
        threadId,
        toolName: call.function.name,
        args,
        parent,
        verifiedAddress,
        fid,
        image,
      };

      // Use void operator to explicitly ignore the promise
      void fetch(`${process.env.BASE_URL}/api/handle-tool.background`, {
        method: 'POST',
        body: JSON.stringify(backgroundRequest),
        headers: { 'Content-Type': 'application/json' },
      }).catch((fetchError) => {
        // Catch potential errors from the fetch itself (e.g., network issues)
        console.error(
          `Error initiating background task for tool ${call.function.name} (call ID: ${call.id}):`,
          fetchError
        );
      });
      console.log(`Dispatched background task for tool: ${call.function.name}`);
    } catch (parseError) {
      console.error(
        `Error parsing arguments for tool ${call.function.name} (call ID: ${call.id}):`,
        parseError
      );
      // Decide how to handle parsing errors, maybe skip this tool call?
    }
  }
};

/**
 * Processes the interaction with the OpenAI assistant for a given thread.
 * Adds user message, runs assistant, waits, and handles completion or tool calls.
 * @param client - The OpenAI client instance.
 * @param threadId - The OpenAI thread ID for the conversation.
 * @param content - The user message content to add.
 * @param parent - The parent cast hash for potential replies.
 * @param verifiedAddress - The user's verified address for tool calls.
 */
const processOpenAIInteraction = async (
  client: OpenAI,
  threadId: string,
  content: MessageContentPartParam[],
  parent: string,
  verifiedAddress?: string,
  fid?: number,
  image?: string
): Promise<void> => {
  try {
    console.log('content', content);
    await client.beta.threads.messages.create(threadId, {
      role: 'user',
      // @ts-expect-error - OpenAI SDK type mismatch
      content: content,
    });
    console.log(`Added user message to thread ${threadId}`);
    // --- Run Assistant on Conversation Thread ---
    const run = await client.beta.threads.runs.create(threadId, {
      assistant_id: ASSISTANT_ID,
    });
    console.log(`Started run ${run.id} for thread ${threadId}`);

    const runStatus = await waitForRunCompletion(client, threadId, run.id);
    console.log(`Run ${run.id} completed with status: ${runStatus.status}`);

    // --- Handle Run Outcome ---
    if (runStatus.status === 'completed') {
      await handleCompletedRun(client, threadId, parent);
    } else if (runStatus.status === 'requires_action') {
      const toolCalls =
        runStatus.required_action?.submit_tool_outputs?.tool_calls;
      if (toolCalls && toolCalls.length > 0) {
        handleToolCalls(
          toolCalls,
          run.id,
          threadId,
          parent,
          verifiedAddress,
          fid,
          image
        );
      } else {
        console.warn(`Run ${run.id} requires action but has no tool calls.`);
        // Potentially handle this case, maybe log an error or return specific status
      }
    } else {
      // Handle other statuses like 'failed', 'cancelled', 'expired'
      console.error(
        `Run ${run.id} ended with unhandled status: ${runStatus.status}`,
        runStatus.last_error // Log error details if available
      );
      // Potentially throw an error or return a specific status
      throw new Error(`Run failed with status ${runStatus.status}.`);
    }
  } catch (error) {
    console.error(
      `Error during OpenAI interaction for thread ${threadId}:`,
      error
    );
    // Re-throw the error to be caught by the main handler
    throw error;
  }
};

// --- API Route Handler ---

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const client = new OpenAI();

  try {
    // --- Request Parsing and Validation ---
    const req: WebhookRequest = await request.json();
    const { data } = req;
    const { text, thread_hash, hash: parent, author, embeds } = data;
    const fid = author?.fid;
    const image = embeds?.[0]?.url;

    console.log('Request data:', data);

    if (!fid) {
      console.warn('Request received without FID.');
      // Consider returning a more specific error response if FID is mandatory
      return NextResponse.json({
        success: false,
        message: 'User FID is missing.',
      });
    }

    const verifiedAddress = author?.verified_addresses?.eth_addresses?.[0];
    const content: MessageContentPartParam[] = [
      {
        type: 'text',
        text,
      },
      ...(image
        ? [
            {
              type: 'image_url' as const,
              image_url: {
                url: image,
              },
            },
          ]
        : []),
    ];

    // --- Conversation Thread Handling ---
    let conversationThreadId: string | null = null; // Use a specific variable for the conversation thread

    try {
      const conversationResult =
        await supabaseService.getConversationByThreadHash(thread_hash);

      console.log('Raw conversationResult:', conversationResult); // Log the raw result for debugging

      // Check if result is an array and has at least one element with the expected property
      if (
        Array.isArray(conversationResult) &&
        conversationResult.length > 0 &&
        typeof conversationResult[0]?.openai_thread_id === 'string' // Explicitly check type
      ) {
        conversationThreadId = conversationResult[0].openai_thread_id;
        console.log(
          `Found existing conversation thread: ${conversationThreadId} for hash ${thread_hash}`
        );
      } else {
        console.warn(
          `Thread ${thread_hash} not found or result format unexpected. Creating new thread.`
        );
        const newThread = await client.beta.threads.create();
        conversationThreadId = newThread.id;
        await supabaseService.upsertConversation({
          thread_hash,
          openai_thread_id: conversationThreadId,
        });
        console.log(
          `Created and saved new conversation thread: ${conversationThreadId} for hash ${thread_hash}`
        );
      }
    } catch (dbError) {
      console.error(
        `Error fetching or creating conversation thread for hash ${thread_hash}:`,
        dbError
      );
      throw new Error(
        `Failed to manage conversation thread for hash ${thread_hash}.`
      );
    }

    // Ensure we have a valid thread ID before proceeding
    if (!conversationThreadId) {
      console.error(
        `Failed to obtain a valid conversation thread ID for hash ${thread_hash}.`
      );
      return NextResponse.json(
        {
          success: false,
          message: `Failed to obtain a valid conversation thread ID for hash ${thread_hash}.`,
        },
        { status: 500 } // Internal Server Error
      );
    }

    console.log('conversationThreadId', conversationThreadId);

    // --- Process OpenAI Interaction using the conversation thread ---
    await processOpenAIInteraction(
      client,
      conversationThreadId, // Use the specific conversation thread ID
      content,
      parent,
      verifiedAddress,
      fid,
      image
    );

    // --- Respond ---
    // The response indicates the process was initiated. Actual result comes via background task/callback.
    return NextResponse.json({ status: 'PROCESSING_INITIATED' }); // More descriptive status
  } catch (error) {
    console.error('Error in Webhook API route:', error);
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred.';
    // Determine appropriate status code based on error type if possible
    const status =
      error instanceof Error &&
      (error.message.includes('fetch user data') ||
        error.message.includes('conversation data') ||
        error.message.includes('Failed to create OpenAI thread')) // Add thread creation error
        ? 503 // Service Unavailable for critical DB/dependency errors
        : 500; // Internal Server Error for others

    return NextResponse.json(
      {
        success: false,
        message: `Failed to process request: ${message}`,
        error: String(error), // Avoid sending full Error object in response
      },
      { status }
    );
  }
}
