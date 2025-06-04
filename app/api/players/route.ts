import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const userData = await request.json();
    console.log('userData', userData);
    // Validate required fields
    if (
      !userData.fid ||
      !userData.name ||
      !userData.pfp ||
      !userData.username ||
      !userData.wallet_address
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const data = await supabaseService.upsertPlayer(userData);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error upserting user:', error);
    return NextResponse.json(
      { error: 'Failed to upsert user' },
      { status: 500 }
    );
  }
}
