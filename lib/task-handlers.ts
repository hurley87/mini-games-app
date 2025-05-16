import { getWalletClients } from '@/lib/clients';
import { createCoin, tradeCoin } from '@zoralabs/coins-sdk';
import { parseUnits } from 'viem';
import { ipfsService } from '@/lib/pinata';
import { supabaseService } from '@/lib/supabase';
import { z } from 'zod';
import { openai } from '@/lib/openai';

// Constants
const PLATFORM_REFERRER = process.env.PLATFORM_REFERRER as `0x${string}`;

// Types
export type CreateTaskData = {
  name: string;
  instructions: string;
  image: string;
  ticker: string;
  parent: string;
  reply: string;
  verifiedAddress: string;
  fid: number;
  threadId: string;
  runId: string;
};

export type TradeTaskData = {
  direction: 'BUY' | 'SELL';
  coinAddress: string;
  size: string;
  parent: string;
  reply: string;
  verifiedAddress: string;
};

export type TaskResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Schemas
const createGameSchema = z.object({
  name: z.string().min(1),
  instructions: z.string().min(1),
  image: z.string().url(),
  ticker: z.string().min(1),
  parent: z.string().min(1),
  verifiedAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  fid: z.number(),
  threadId: z.string().min(1),
  runId: z.string().min(1),
});

const tradeTaskSchema = z.object({
  direction: z.enum(['BUY', 'SELL']),
  coinAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  size: z.string().min(1),
  parent: z.string().min(1),
  verifiedAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

// Task handlers
export const taskHandlers = {
  async handleCreateGame(
    taskData: CreateTaskData
  ): Promise<TaskResponse<{ gameId: string }>> {
    try {

      console.log('taskData', taskData);
      // Validate input
      const validatedData = createGameSchema.parse(taskData);

      // Pin metadata to IPFS
      const uri = await ipfsService.pinMetadata(
        validatedData.name,
        validatedData.instructions,
        validatedData.image
      );

      // Get wallet clients
      const { walletClient, publicClient } = await getWalletClients();

      const payoutRecipient = validatedData.verifiedAddress as `0x${string}`;

      // Create coin
      const createCoinParams = {
        name: validatedData.name,
        symbol: validatedData.ticker,
        uri,
        payoutRecipient,
        platformReferrer: PLATFORM_REFERRER,
      };

      const coin = await createCoin(
        createCoinParams,
        walletClient,
        publicClient
      );

      try {
        await publicClient.waitForTransactionReceipt({ hash: coin.hash });

        try {
          if (coin) {
            console.log('coin:', coin);

            const runId = taskData.runId;
            if (runId) {
              try {
                await openai.beta.threads.runs.cancel(taskData.threadId, runId)
                console.log('Run cancelled');
              } catch (e) {
                console.warn('Could not cancel active run:', e)
              }
            }
        
            // Here you would typically save the code to your database or storage
            // For now, we'll just log it
            console.log('address:', taskData.verifiedAddress);
            console.log('gameName:', taskData.name);
            console.log('Saving code for thread:', taskData.threadId);
        
            const instructions = `

        Use image in this thread to generate style of the game.

        You are now generating the implementation of a simple, fun browser-based game.
        
        You are a game generator. Create a complete HTML file that contains a canvas-based game using vanilla JS or Three.js. 
        Wrap everything in <html><body><script> and avoid using external packages.
        The code will be sandboxed in an iframe, so it must not rely on imports.
        The game must be interactive and playable with simple mouse input only.
        The canvas element must fill the entire screen at all times.
        
        IMPORTANT CODE QUALITY REQUIREMENTS:
        1. Use descriptive variable names that clearly indicate their purpose
        2. Never use single-letter variable names (like 'r', 'x', 'y') unless they are loop counters in a very short scope
        3. Always declare variables before use with 'let', 'const', or 'var'
        4. Use consistent naming conventions throughout the code
        5. For array iterations, use descriptive parameter names (e.g., 'ripple' instead of 'r')
        6. Ensure all variables used in callbacks and event handlers are properly scoped
        7. Add error handling for any potential undefined states
        8. Use strict equality checks (=== and !==) instead of loose equality
        9. Initialize all variables with default values where appropriate
        
        At the appropriate moment (such as when the game ends or points are earned), you must call:
        
        window.awardPoints(score);
        
        Pass the player's score as a number. Do not define or modify this function — it is already provided by the environment.

        Show the players score in the top left corner of the screen. Only update score but 1 point at a time.

        All games must be playable in the browser.

        All game must last 30 seconds before they reset.

        Use simple colors and shapes. Interactions should be simple - think taps and clicks (no swipes or complex gestures).
        
        Return only the full code — no explanation or extra text.
                `
        
            console.log('instructions:', instructions);
        
            // Generate code in this thread to retain full conversation context
            const run = await openai.beta.threads.runs.create(taskData.threadId, {
              assistant_id: process.env.ASSISTANT_ID!,
              instructions,
            })
        
            console.log('NEW run:', run);
        
            // Poll for run completion
            let runResult = await openai.beta.threads.runs.retrieve(taskData.threadId, run.id);
            while (runResult.status === 'in_progress' || runResult.status === 'queued') {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between polls
              runResult = await openai.beta.threads.runs.retrieve(taskData.threadId, run.id);
            }
        
            console.log('runResult:', runResult);
                
            console.log('coin:', coin);
        
            if (runResult.status === 'completed') {
              // Get the latest message which should contain our code
              const messages = await openai.beta.threads.messages.list(taskData.threadId);
              const latestMessage = messages.data[0];
              
              if (latestMessage) {
                const content = latestMessage.content[0];
                console.log('content:', content);
                if (content.type === 'text') {
                  // Extract code from the message content
                  const code = content.text.value.trim();
                  // Here you would save the code to your database
                  console.log('Generated code:', code);
                  // Save the game code to Supabase
                  const { data, error } = await supabaseService
                    .from('games')
                    .insert([
                      {
                        thread_id: taskData.threadId,
                        user_address: taskData.verifiedAddress,
                        name: taskData.name,
                        category: 'game',
                        description: taskData.instructions,
                        code,
                        coin_address: coin.address as `0x${string}`,
                        image: taskData.image,
                      }
                    ])
                    .select('*');
        
                  if (error) {
                    console.error('Error inserting into Supabase:', error);
                    return {
                      success: false,
                      error: 'Database insert failed'
                    }
                  }
        
                  console.log('data:', data);
        
                  if (data && data[0] && data[0].id) {
                    return {
                      success: true,
                      data: { gameId: data[0].id }
                    }
                  }
                }
              }
            } else {
              console.error('Run failed or was cancelled:', runResult.status);
              return {
                success: false,
                error: 'Failed to generate code'
              }
            }
          }
        } catch (dbError) {
          console.error('Failed to store coin in database:', dbError);
          // Consider whether to throw or handle differently
        }
      } catch (receiptError) {
        console.error('Failed to confirm transaction:', receiptError);
        throw new Error('Transaction confirmation failed');
      }

      if (!coin.address) {
        throw new Error('Coin address not found in response');
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error in CREATE task:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },

  async handleTradeCoin(
    taskData: TradeTaskData
  ): Promise<TaskResponse<{ tradeUrl: string }>> {
    try {
      // Validate input
      const validatedData = tradeTaskSchema.parse(taskData);

      // Get wallet clients
      const { walletClient, publicClient } = await getWalletClients();

      // Create trade parameters
      const params = {
        direction: validatedData.direction.toLowerCase() as 'buy' | 'sell',
        target: validatedData.coinAddress as `0x${string}`,
        platformReferrer: PLATFORM_REFERRER,
        args: {
          recipient: validatedData.verifiedAddress as `0x${string}`,
          orderSize: parseUnits(validatedData.size, 18),
        },
      };

      // Execute the trade
      const tradeResult = await tradeCoin(params, walletClient, publicClient);
      const tradeUrl = `https://basescan.org/tx/${tradeResult.hash}`;

      return {
        success: true,
        data: { tradeUrl },
      };
    } catch (error) {
      console.error('Error in TRADE task:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
}; 