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

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // --- Request Parsing and Validation ---
    const req: WebhookRequest = await request.json();
    const { data } = req;
    const { text, thread_hash, hash: parent, author, embeds } = data;
    const fid = author?.fid;
    const image = embeds?.[0]?.url;

    const combinedText = image ? `${text} ${image}` : text;

    if (!fid) {
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

      if (
        Array.isArray(conversationResult) &&
        conversationResult.length > 0 &&
        typeof conversationResult[0]?.openai_thread_id === 'string'
      ) {
        conversationThreadId = conversationResult[0].openai_thread_id;
        if (process.env.NODE_ENV !== 'production') {
          console.log(
            `Found existing conversation thread: ${conversationThreadId} for hash ${thread_hash}`
          );
        }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `Thread ${thread_hash} not found or result format unexpected. Creating new thread.`
          );
        }
        const client = new OpenAI();
        const newThread = await client.beta.threads.create();
        conversationThreadId = newThread.id;
        await supabaseService.upsertConversation({
          thread_hash,
          openai_thread_id: conversationThreadId,
        });
        if (process.env.NODE_ENV !== 'production') {
          console.log(
            `Created and saved new conversation thread: ${conversationThreadId} for hash ${thread_hash}`
          );
        }
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

    if (process.env.NODE_ENV !== 'production') {
      console.log('conversationThreadId', conversationThreadId);
    }

    // --- Process OpenAI Interaction using the background route ---
    void fetch(`${process.env.BASE_URL}/api/handle-openai.background`, {
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
    }).catch((error) => {
      console.error('Error initiating OpenAI background task:', error);
    });

    // --- Respond ---
    return NextResponse.json({ status: 'PROCESSING_INITIATED' });
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
