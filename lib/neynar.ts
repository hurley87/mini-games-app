import { NeynarAPIClient } from '@neynar/nodejs-sdk';

// Initialize client
const neynarClient = new NeynarAPIClient({
  apiKey: process.env.NEYNAR_API_KEY as string,
});

/**
 * Publishes a cast to Farcaster via Neynar API
 *
 * @param text The text content of the cast
 * @param parent The parent cast hash to reply to
 * @param url Optional URL to embed in the cast
 * @returns The response from the Neynar API
 */
export const publishCast = async (
  text: string,
  parent: string,
  url?: string
) => {
  const signerUuid = process.env.SIGNER_UUID as string;
  const response = await neynarClient.publishCast({
    signerUuid,
    text,
    parent,
    embeds: url ? [{ url }] : undefined,
  });
  return response;
};

export const getConversation = async (threadId: string) => {
  const response = await neynarClient.lookupCastConversation({
    identifier: threadId,
    type: 'hash',
    replyDepth: 5,
  });
  const replies = response.conversation.cast.direct_replies;
  console.log('response.conversation', response.conversation);
  const messages = replies.map((reply) => {
    return {
      text: reply.text,
      author: reply.author.username,
    };
  });
  return messages;
};

/**
 * Fetch a Farcaster user by FID using Neynar API
 */
export const getUserByFid = async (fid: number) => {
  const res = await fetch(
    `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
    {
      headers: {
        accept: 'application/json',
        api_key: process.env.NEYNAR_API_KEY as string,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch user with fid ${fid}`);
  }

  const json = await res.json();
  // v2 endpoint returns { users: [...] }
  return json?.users?.[0];
};
