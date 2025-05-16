import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Types
export type ThreadMessage = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: number;
};

// Helper functions
export const openaiService = {
  async getThreadMessages(threadId: string): Promise<ThreadMessage[]> {
    try {
      const messages = await openai.beta.threads.messages.list(threadId);
      return messages.data.map((message) => ({
        id: message.id,
        content: message.content[0]?.type === 'text' ? message.content[0].text.value : '',
        role: message.role,
        created_at: message.created_at,
      }));
    } catch (error) {
      console.error('Error fetching thread messages:', error);
      throw new Error('Failed to fetch thread messages');
    }
  },

  async submitToolOutput(
    threadId: string,
    runId: string,
    toolCallId: string,
    output: string
  ): Promise<void> {
    try {
      await openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
        tool_outputs: [{ tool_call_id: toolCallId, output }],
      });
    } catch (error) {
      console.error('Error submitting tool output:', error);
      throw new Error('Failed to submit tool output');
    }
  },
}; 