import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export interface OpenAIQueueItem {
  threadId: string;
  content: Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
  parent: string;
  verifiedAddress?: string;
  fid?: number;
  image?: string;
}

const QUEUE_KEY = 'openai-tasks';

export const queueService = {
  async enqueueOpenAI(item: OpenAIQueueItem): Promise<void> {
    try {
      await redis.lpush(QUEUE_KEY, JSON.stringify(item));
      console.log(
        'Successfully enqueued OpenAI task for thread:',
        item.threadId
      );
    } catch (error) {
      console.error('Error enqueuing OpenAI task:', error);
      throw error;
    }
  },

  async processOpenAIQueue(): Promise<void> {
    try {
      const item = await redis.rpop<OpenAIQueueItem>(QUEUE_KEY);
      if (!item) {
        console.log('No items in queue');
        return;
      }

      console.log('Processing queue item for thread:', item.threadId);

      // Call the background handler
      const response = await fetch(
        `${process.env.BASE_URL}/api/handle-openai.background`,
        {
          method: 'POST',
          body: JSON.stringify(item),
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

      console.log(
        'Successfully processed queue item for thread:',
        item.threadId
      );
    } catch (error) {
      console.error('Error processing queue item:', error);
      // Re-queue the item if it failed
      if (error instanceof Error) {
        await redis.lpush(QUEUE_KEY, JSON.stringify(error));
      }
    }
  },
};
