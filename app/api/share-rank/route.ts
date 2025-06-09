import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { fid } = await request.json();

    if (!fid) {
      return NextResponse.json({ error: 'Missing fid' }, { status: 400 });
    }

    const fidNum = parseInt(fid as string, 10);
    if (isNaN(fidNum)) {
      return NextResponse.json({ error: 'Invalid fid' }, { status: 400 });
    }

    await supabaseService.incrementPlayerPoints(fidNum, 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error awarding share points:', error);
    return NextResponse.json(
      { error: 'Failed to award points' },
      { status: 500 }
    );
  }
}
