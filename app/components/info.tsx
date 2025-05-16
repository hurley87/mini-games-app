'use client';

import { useMiniKit } from '@coinbase/onchainkit/minikit';
import Link from 'next/link';
import { useEffect } from 'react';

interface InfoProps {
  name: string;
  description: string;
  id: string;
}

export function Info({ name, description, id }: InfoProps) {
    const { setFrameReady, isFrameReady, context } = useMiniKit();

    useEffect(() => {
        if (!isFrameReady) {
            setFrameReady();
        }
    }, [setFrameReady, isFrameReady]);


  if (!name) {
    return <div>Please enter a game name</div>;
  }

  if(!description) {
    return <div>Please enter a game description</div>;
  }

  console.log('context', context);

  return (
    <div className='flex flex-col items-center justify-center h-screen w-screen relative z-50'>
      <div className='flex flex-col items-center justify-center h-screen w-screen relative z-50 max-w-lg mx-auto gap-4 p-4'>
        <h1 className='text-2xl font-bold'>{name}</h1>
        <p className='text-sm text-gray-500 text-center'>{description}</p>
        <Link href={`/info/${id}`}>
          <button className='bg-white text-black py-2 text-2xl rounded-full px-10'>Play</button>
        </Link>
      </div>
    </div>
  );
}