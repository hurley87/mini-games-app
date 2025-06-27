import { supabaseService } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Coin ID is required' },
        { status: 400 }
      );
    }

    // Fetch coin data by ID
    const coin = await supabaseService.getCoinById(id);

    if (!coin) {
      return NextResponse.json(
        { error: 'Coin not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(coin);
  } catch (error) {
    console.error('Error fetching coin by ID:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coin' },
      { status: 500 }
    );
  }
}