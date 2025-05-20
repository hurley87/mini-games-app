import { NextResponse } from 'next/server';
import { queueService } from '@/lib/queue';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const MAX_ITEMS_PER_RUN = 5; // Process up to 5 items per cron job run

export async function POST(request: Request) {
  console.log('Processing queue');
  console.log(request);
  try {
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    // Process multiple items up to MAX_ITEMS_PER_RUN
    while (processedCount < MAX_ITEMS_PER_RUN) {
      try {
        await queueService.processOpenAIQueue();
        successCount++;
      } catch (error) {
        errorCount++;
        console.error('Error processing queue item:', error);
        // Continue processing other items even if one fails
      }
      processedCount++;
    }

    return NextResponse.json({
      success: true,
      stats: {
        processed: processedCount,
        successful: successCount,
        failed: errorCount,
      },
    });
  } catch (error) {
    console.error('Error in queue processor:', error);
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
