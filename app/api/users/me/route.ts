import { supabaseService } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const fid = request.headers.get('x-user-fid')!;
  console.log('fid', fid);
  const user = await supabaseService.getPlayerByFid(parseInt(fid));
  return NextResponse.json(user);
}
