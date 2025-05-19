import { supabaseService } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Add this helper function at the top level
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function retryFetch(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(
        `Retrying fetch to ${url}. Attempts remaining: ${retries - 1}`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return retryFetch(url, options, retries - 1);
    }
    throw error;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // --- Request Parsing and Validation ---
    const req: WebhookRequest = await request.json();
    const { data } = req;
    const { text, thread_hash, hash: parent, author, embeds } = data;
    const fid = author?.fid;
    const image = embeds?.[0]?.url;

    const combinedText = image ? `${text} ${image}` : text;

    console.log('Request data:', data);

    if (!fid) {
      console.warn('Request received without FID.');
      return NextResponse.json({
        success: false,
        message: 'User FID is missing.',
      });
    }

    const verifiedAddress = author?.verified_addresses?.eth_addresses?.[0];
    const content: MessageContentPartParam[] = [
      {
        type: 'text',
        text: combinedText,
      },
    ];

    // --- Conversation Thread Handling ---
    let conversationThreadId: string | null = null;

    try {
      const conversationResult =
        await supabaseService.getConversationByThreadHash(thread_hash);

      console.log('Raw conversationResult:', conversationResult);

      if (
        Array.isArray(conversationResult) &&
        conversationResult.length > 0 &&
        typeof conversationResult[0]?.openai_thread_id === 'string'
      ) {
        conversationThreadId = conversationResult[0].openai_thread_id;
        console.log(
          `Found existing conversation thread: ${conversationThreadId} for hash ${thread_hash}`
        );
      } else {
        console.warn(
          `Thread ${thread_hash} not found or result format unexpected. Creating new thread.`
        );
        const client = new OpenAI();
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
        { status: 500 }
      );
    }

    console.log('conversationThreadId', conversationThreadId);

    // --- Process OpenAI Interaction using the background route ---
    // Fire and forget the background task
    void (async () => {
      try {
        // Wait for thread creation to be fully complete
        await new Promise((resolve) => setTimeout(resolve, 500));

        const response = await retryFetch(
          `${process.env.BASE_URL}/api/handle-openai.background`,
          {
            method: 'POST',
            body: JSON.stringify({
              threadId: conversationThreadId,
              content,
              parent,
              verifiedAddress,
              fid,
              image,
            }),
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Background task failed with status: ${response.status}`
          );
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(
            `Background task failed: ${result.error || 'Unknown error'}`
          );
        }
      } catch (error) {
        console.error('Error in OpenAI background task:', error);
        // Log the error but don't throw since this is a background operation
      }
    })();

    // --- Respond immediately ---
    return NextResponse.json({
      status: 'PROCESSING_INITIATED',
      threadId: conversationThreadId,
    });
  } catch (error) {
    console.error('Error in Webhook API route:', error);
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred.';

    return NextResponse.json({
      success: false,
      message: `Failed to process request: ${message}`,
      error: String(error),
    });
  }
}
