import { Errors, createClient } from '@farcaster/quick-auth';

import { fetchUser } from '@/lib/neynar';
import * as jose from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { Address, zeroAddress } from 'viem';
import { supabaseService } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const quickAuthClient = createClient();

export const POST = async (req: NextRequest) => {
  const { token: farcasterToken } = await req.json();
  let fid;
  let isValidSignature;
  let walletAddress: Address = zeroAddress;
  const expirationTime = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days in seconds
  // Verify signature matches custody address and auth address
  try {
    const payload = await quickAuthClient.verifyJwt({
      domain: new URL(process.env.NEXT_PUBLIC_URL!).hostname,
      token: farcasterToken,
    });
    isValidSignature = !!payload;
    fid = Number(payload.sub);
    walletAddress = payload.address as Address;
    console.log('walletAddress', walletAddress);
  } catch (e) {
    if (e instanceof Errors.InvalidTokenError) {
      console.error('Invalid token', e);
      isValidSignature = false;
    }
    console.error('Error verifying token', e);
  }

  if (!isValidSignature || !fid) {
    return NextResponse.json(
      { success: false, error: 'Invalid token' },
      { status: 401 }
    );
  }

  const neynarUser = await fetchUser(fid.toString());

  console.log('neynarUser', neynarUser);
  console.log('verified_addresses', neynarUser.verified_addresses);
  console.log('eth_address', neynarUser.verified_addresses.primary.eth_address);

  const user = await supabaseService.upsertPlayer({
    fid,
    name: neynarUser.display_name,
    username: neynarUser.username,
    pfp: neynarUser.pfp_url,
    wallet_address: neynarUser.verified_addresses.primary.eth_address,
  });

  let streak;
  try {
    streak = await supabaseService.recordDailyLogin(fid);
  } catch (e) {
    console.error('Error recording daily login streak:', e);
    // Provide default streak value to ensure sign-in continues
    streak = { streak: 1, claimed: false };
  }

  // Generate JWT token
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const token = await new jose.SignJWT({
    fid,
    walletAddress,
    timestamp: Date.now(),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(secret);

  // Create the response
  const response = NextResponse.json({ success: true, user, streak });

  // Set the auth cookie with the JWT token
  response.cookies.set({
    name: 'auth_token',
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });

  return response;
};
