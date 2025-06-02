import { supabaseService } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { Build, Creator, BuildWithCreator } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch all builds
    const builds: Build[] = await supabaseService.getBuilds();

    // Fetch creator data for each build
    const buildsWithCreators: BuildWithCreator[] = await Promise.all(
      builds.map(async (build: Build) => {
        try {
          const creatorData = await supabaseService.getCreatorByFID(build.fid);
          return {
            ...build,
            creator: creatorData[0] || null, // getCreatorByFID returns an array
          };
        } catch (err) {
          console.error(`Failed to fetch creator for build ${build.id}:`, err);
          return {
            ...build,
            creator: null,
          };
        }
      })
    );

    return NextResponse.json(buildsWithCreators);
  } catch (error) {
    console.error('Error fetching builds with creators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch builds with creators' },
      { status: 500 }
    );
  }
}
