import { NeynarAPIClient } from '@neynar/nodejs-sdk';

export interface NeynarUser {
  fid: string;
  username: string;
  display_name: string;
  pfp_url: string;
  custody_address: string;
  verifications: string[];
  score: number;
  verified_addresses: {
    primary: {
      eth_address: string;
    };
  };
}

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
export const fetchUser = async (fid: string): Promise<NeynarUser> => {
  const response = await fetch(
    `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
    {
      headers: {
        'x-api-key': process.env.NEYNAR_API_KEY!,
      },
    }
  );
  if (!response.ok) {
    console.error(
      'Failed to fetch Farcaster user on Neynar',
      await response.json()
    );
    throw new Error('Failed to fetch Farcaster user on Neynar');
  }
  const data = await response.json();
  console.log('data', data);
  return data.users[0];
};
