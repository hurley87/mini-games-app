import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const fidHeader = request.headers.get('x-user-fid');
  if (!fidHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const fid = parseInt(fidHeader);
  if (isNaN(fid)) {
    return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
  }
  try {
    const streak = await supabaseService.getDailyStreak(fid);
    return NextResponse.json(streak || { streak: 1, claimed: false });
  } catch (error) {
    console.error('Error getting daily streak:', error);
    return NextResponse.json(
      { error: 'Failed to get streak' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const fidHeader = request.headers.get('x-user-fid');
  if (!fidHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const fid = parseInt(fidHeader);
  if (isNaN(fid)) {
    return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
  }
  try {
    const streak = await supabaseService.recordDailyLogin(fid);
    return NextResponse.json(streak);
  } catch (error) {
    console.error('Error recording daily login:', error);
    return NextResponse.json(
      { error: 'Failed to record login' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const fidHeader = request.headers.get('x-user-fid');
  if (!fidHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const fid = parseInt(fidHeader);
  if (isNaN(fid)) {
    return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
  }
  try {
    const streak = await supabaseService.claimDailyStreak(fid);
    return NextResponse.json(streak);
  } catch (error) {
    console.error('Error claiming daily streak:', error);
    return NextResponse.json(
      { error: 'Failed to claim streak' },
      { status: 500 }
    );
  }
}
